import re
import os
import json
import uuid
import math
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import backend.gemini_client as gemini
from pydantic import BaseModel, EmailStr
from sqlalchemy import (
    create_engine, Column, String, Integer, Float, Boolean,
    Text, DateTime, JSON, ForeignKey, func
)
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker, relationship
from passlib.context import CryptContext
from jose import jwt, JWTError
import hashlib
import hmac

# ─── Config ───────────────────────────────────────────────────────────────────

SECRET_KEY = os.getenv("SECRET_KEY", "recruiteai-super-secret-key-2024-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

DATABASE_URL = "sqlite:///./recruiteai.db"

# ─── Database Setup ────────────────────────────────────────────────────────────

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Models ───────────────────────────────────────────────────────────────────

class UserModel(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="admin")  # admin | recruiter | candidate
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class JobModel(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, default="Remote")
    salary = Column(String, default="Negotiable")
    skills = Column(JSON, default=list)
    category = Column(String, default="IT & Software")
    source = Column(String, default="manual")
    experience_min = Column(Integer, default=0)
    status = Column(String, default="active")
    description = Column(Text, default="")
    posted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class LeadModel(Base):
    __tablename__ = "leads"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    phone = Column(String, default="")
    skills = Column(JSON, default=list)
    experience = Column(Integer, default=0)
    score = Column(Integer, default=0)
    quality = Column(String, default="Low")
    priority = Column(String, default="Low Priority")
    status = Column(String, default="new")
    resume_text = Column(Text, default="")
    pipeline_stage = Column(String, default="screened")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class RecruiterModel(Base):
    __tablename__ = "recruiters"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_name = Column(String, nullable=False)
    recruiter_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, default="")
    whatsapp = Column(String, default="")
    location = Column(String, default="")
    company_size = Column(String, default="")
    hiring_active = Column(Boolean, default=True)
    source = Column(String, default="manual")
    status = Column(String, default="new")
    outreach_count = Column(Integer, default=0)
    reply_received = Column(Boolean, default=False)
    leads_sent = Column(Integer, default=0)
    deals_closed = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class DealModel(Base):
    __tablename__ = "deals"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    recruiter_id = Column(String, ForeignKey("recruiters.id"), nullable=True)
    lead_id = Column(String, ForeignKey("leads.id"), nullable=True)
    value = Column(Float, default=0)
    status = Column(String, default="pending")
    stage = Column(String, default="Discovery")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    closed_at = Column(DateTime, nullable=True)


class PaymentModel(Base):
    __tablename__ = "payments"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    deal_id = Column(String, ForeignKey("deals.id"), nullable=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR")
    status = Column(String, default="pending")
    method = Column(String, default="bank_transfer")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    paid_at = Column(DateTime, nullable=True)


class TemplateModel(Base):
    __tablename__ = "templates"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    subject = Column(String, default="")
    body = Column(Text, nullable=False)
    template_type = Column(String, default="email")
    variables = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class TierTemplateModel(Base):
    """Customizable email templates per candidate score tier (high/medium/low)."""
    __tablename__ = "tier_templates"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tier = Column(String, unique=True, nullable=False)   # "high" | "medium" | "low"
    label = Column(String, nullable=False)               # "High Match (75+)"
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    tone = Column(String, default="professional")        # urgent | professional | exploratory
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))


class OutreachDraftModel(Base):
    """Auto-generated personalized email drafts for candidates."""
    __tablename__ = "outreach_drafts"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String, ForeignKey("leads.id"), nullable=False)
    recruiter_id = Column(String, ForeignKey("recruiters.id"), nullable=True)
    tier = Column(String, nullable=False)                # high | medium | low
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String, default="draft")             # draft | sent | archived
    lead_name = Column(String, default="")               # denormalised for quick display
    lead_email = Column(String, default="")
    lead_score = Column(Integer, default=0)
    lead_skills_snapshot = Column(JSON, default=list)
    recruiter_name = Column(String, default="")
    recruiter_company = Column(String, default="")
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class PipelineActivityModel(Base):
    """Immutable audit log — one row per pipeline stage move."""
    __tablename__ = "pipeline_activity"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String, nullable=False, index=True)
    lead_name = Column(String, nullable=False, default="")
    from_stage = Column(String, nullable=False, default="")
    to_stage = Column(String, nullable=False)
    moved_by_id = Column(String, nullable=False)
    moved_by_name = Column(String, nullable=False, default="")
    moved_by_email = Column(String, nullable=False, default="")
    moved_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


# ─── Create Tables ─────────────────────────────────────────────────────────────

Base.metadata.create_all(bind=engine)

# ─── Auth Utilities ────────────────────────────────────────────────────────────

pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(user_id: str, email: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "email": email, "role": role, "exp": expire},
        SECRET_KEY, algorithm=ALGORITHM
    )


def decode_token(token: str) -> Dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> UserModel:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    user = db.query(UserModel).filter(UserModel.id == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ─── AI Service ────────────────────────────────────────────────────────────────

SKILLS_DB = [
    # Programming Languages
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust",
    "PHP", "Ruby", "Swift", "Kotlin", "Scala", "R", "MATLAB", "Perl", "Lua",
    "Dart", "Elixir", "Haskell", "Clojure", "F#", "Julia", "Groovy", "VBA",
    # Frontend
    "React", "Vue", "Angular", "Next.js", "Nuxt.js", "Svelte", "Redux",
    "Zustand", "Tailwind CSS", "Bootstrap", "Material UI", "Sass", "LESS",
    "Webpack", "Vite", "Babel", "HTML", "CSS", "jQuery", "Ember.js",
    # Backend
    "Node.js", "Express", "FastAPI", "Django", "Flask", "Spring Boot",
    "Laravel", "Rails", "ASP.NET", "NestJS", "Fastify", "Koa", "Hapi",
    "GraphQL", "REST", "gRPC", "WebSocket", "Microservices",
    # Database
    "PostgreSQL", "MySQL", "MongoDB", "SQLite", "Redis", "Cassandra",
    "DynamoDB", "Elasticsearch", "Neo4j", "Oracle", "SQL Server", "MariaDB",
    "InfluxDB", "CouchDB", "Firestore", "Supabase",
    # Cloud & DevOps
    "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform", "Ansible",
    "Jenkins", "GitHub Actions", "GitLab CI", "CircleCI", "Prometheus",
    "Grafana", "Nginx", "Apache", "Linux", "Bash", "PowerShell",
    # AI/ML
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Keras",
    "scikit-learn", "NLP", "Computer Vision", "Data Science", "Pandas",
    "NumPy", "Matplotlib", "Seaborn", "XGBoost", "LightGBM", "Hugging Face",
    "OpenAI", "LangChain", "MLOps", "Data Engineering",
    # Mobile
    "React Native", "Flutter", "iOS", "Android", "Xcode", "Expo",
    # Tools
    "Git", "GitHub", "GitLab", "Bitbucket", "Jira", "Confluence",
    "Slack", "Figma", "Postman", "VS Code", "IntelliJ",
    # Soft Skills / Other
    "Agile", "Scrum", "Kanban", "CI/CD", "TDD", "BDD",
    "System Design", "Microservices", "API Design", "Security",
    "Performance Optimization", "Code Review", "Mentoring",
]

SKILL_ALIASES = {
    "js": "JavaScript", "ts": "TypeScript", "py": "Python",
    "ml": "Machine Learning", "dl": "Deep Learning", "ai": "Machine Learning",
    "k8s": "Kubernetes", "tf": "TensorFlow", "rn": "React Native",
    "node": "Node.js", "pg": "PostgreSQL", "mongo": "MongoDB",
}

EXPERIENCE_PATTERNS = [
    r'(\d+)\+?\s*(?:–|-|to)\s*\d+\s*years?\s*(?:of\s+)?(?:experience|exp)',
    r'(\d+)\+?\s*years?\s*(?:of\s+)?(?:experience|exp)',
    r'(?:experience|exp)[:\s]+(\d+)\+?\s*years?',
    r'(\d+)\+?\s*yrs?\s*(?:of\s+)?(?:experience|exp)',
    r'(\d+)\+\s*years?',
    r'(\d+)\s*years?\s*exp',
]


def extract_skills(text: str) -> List[str]:
    text_lower = text.lower()
    found = set()

    for skill in SKILLS_DB:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found.add(skill)

    for alias, canonical in SKILL_ALIASES.items():
        pattern = r'\b' + re.escape(alias) + r'\b'
        if re.search(pattern, text_lower):
            found.add(canonical)

    return sorted(found)


def extract_experience(text: str) -> int:
    text_lower = text.lower()
    years_found = []

    for pattern in EXPERIENCE_PATTERNS:
        matches = re.findall(pattern, text_lower)
        for m in matches:
            try:
                years_found.append(int(m))
            except (ValueError, TypeError):
                pass

    if years_found:
        return max(years_found)

    if "fresher" in text_lower or "entry level" in text_lower or "0 years" in text_lower:
        return 0
    if "senior" in text_lower or "lead" in text_lower or "principal" in text_lower:
        return 5

    return 0


def extract_education(text: str) -> str:
    text_lower = text.lower()
    if any(x in text_lower for x in ["phd", "doctorate", "ph.d"]):
        return "PhD"
    if any(x in text_lower for x in ["master", "mtech", "mba", "m.tech", "m.s.", "ms in"]):
        return "Masters"
    if any(x in text_lower for x in ["bachelor", "btech", "b.tech", "b.e.", "bca", "bsc", "degree"]):
        return "Bachelors"
    if any(x in text_lower for x in ["diploma", "polytechnic"]):
        return "Diploma"
    return "Not specified"


def score_lead_general(skills: List[str], experience: int) -> int:
    """Score a lead without a specific job reference."""
    if not skills:
        base = 20
    else:
        base = min(len(skills) * 7, 55)

    if experience >= 8:
        exp_pts = 35
    elif experience >= 5:
        exp_pts = 30
    elif experience >= 3:
        exp_pts = 22
    elif experience >= 1:
        exp_pts = 12
    else:
        exp_pts = 5

    total = base + exp_pts + 10
    return min(100, max(10, total))


def match_candidate_to_job(
    candidate_skills: List[str],
    candidate_exp: int,
    job_skills: List[str],
    job_exp_min: int
) -> Dict[str, Any]:
    """Score a candidate against a specific job and return detailed breakdown."""
    candidate_set = set(s.lower() for s in candidate_skills)
    job_set = set(s.lower() for s in job_skills)

    if job_set:
        matched_skills = candidate_set & job_set
        skill_match_pct = len(matched_skills) / len(job_set)
        matched_skill_names = [s for s in candidate_skills if s.lower() in matched_skills]
        missing_skills = [s for s in job_skills if s.lower() not in candidate_set]
    else:
        skill_match_pct = 0.5
        matched_skill_names = candidate_skills[:3]
        missing_skills = []

    if job_exp_min > 0:
        if candidate_exp >= job_exp_min * 1.5:
            exp_score = 1.0
        elif candidate_exp >= job_exp_min:
            exp_score = 0.9
        elif candidate_exp >= job_exp_min * 0.7:
            exp_score = 0.6
        elif candidate_exp >= job_exp_min * 0.5:
            exp_score = 0.3
        else:
            exp_score = 0.1
    else:
        exp_score = 0.7

    total_score = int((skill_match_pct * 0.65 + exp_score * 0.30 + 0.05) * 100)
    total_score = min(100, max(5, total_score))

    quality = "High" if total_score >= 75 else "Medium" if total_score >= 50 else "Low"

    return {
        "score": total_score,
        "quality": quality,
        "skill_match_pct": round(skill_match_pct * 100, 1),
        "exp_score_pct": round(exp_score * 100, 1),
        "matched_skills": matched_skill_names,
        "missing_skills": missing_skills[:5],
    }


def compute_quality_priority(score: int):
    if score >= 75:
        return "High", "Send Immediately"
    elif score >= 50:
        return "Medium", "Queue"
    else:
        return "Low", "Low Priority"


# ─── Pydantic Schemas ─────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "admin"


class JobCreate(BaseModel):
    title: str
    company: str
    location: str = "Remote"
    salary: str = "Negotiable"
    skills: List[str] = []
    category: str = "IT & Software"
    source: str = "manual"
    experience_min: int = 0
    status: str = "active"
    description: str = ""


class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    skills: Optional[List[str]] = None
    category: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    experience_min: Optional[int] = None


class LeadCreate(BaseModel):
    name: str
    email: str
    phone: str = ""
    skills: List[str] = []
    experience: int = 0
    status: str = "new"
    resume_text: str = ""


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: Optional[List[str]] = None
    experience: Optional[int] = None
    status: Optional[str] = None
    score: Optional[int] = None


class RecruiterCreate(BaseModel):
    company_name: str
    recruiter_name: str
    email: str
    phone: str = ""
    whatsapp: str = ""
    location: str = ""
    company_size: str = ""
    hiring_active: bool = True
    source: str = "manual"
    status: str = "new"


class RecruiterUpdate(BaseModel):
    company_name: Optional[str] = None
    recruiter_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    hiring_active: Optional[bool] = None
    outreach_count: Optional[int] = None
    reply_received: Optional[bool] = None


class DealCreate(BaseModel):
    title: str
    recruiter_id: Optional[str] = None
    lead_id: Optional[str] = None
    value: float = 0
    status: str = "pending"
    stage: str = "Discovery"


class DealUpdate(BaseModel):
    title: Optional[str] = None
    value: Optional[float] = None
    status: Optional[str] = None
    stage: Optional[str] = None


class PaymentCreate(BaseModel):
    deal_id: Optional[str] = None
    amount: float
    currency: str = "INR"
    status: str = "pending"
    method: str = "bank_transfer"
    notes: str = ""


class TemplateCreate(BaseModel):
    name: str
    subject: str = ""
    body: str
    template_type: str = "email"
    variables: List[str] = []


class ResumeMatchRequest(BaseModel):
    resume_text: str
    job_description: str
    job_skills: List[str] = []
    job_experience_min: int = 0


class AutoDraftRequest(BaseModel):
    lead_ids: List[str]
    recruiter_id: Optional[str] = None


class DraftUpdate(BaseModel):
    subject: Optional[str] = None
    body: Optional[str] = None


class TierTemplateUpdate(BaseModel):
    subject: Optional[str] = None
    body: Optional[str] = None
    tone: Optional[str] = None


# ─── FastAPI App ──────────────────────────────────────────────────────────────

app = FastAPI(title="RecruitAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def serialize_datetime(dt):
    if dt is None:
        return None
    if hasattr(dt, 'isoformat'):
        return dt.isoformat()
    return str(dt)


def job_to_dict(j: JobModel) -> Dict:
    return {
        "id": j.id,
        "title": j.title,
        "company": j.company,
        "location": j.location,
        "salary": j.salary,
        "skills": j.skills or [],
        "category": j.category,
        "source": j.source,
        "experience_min": j.experience_min,
        "status": j.status,
        "description": j.description,
        "postedAt": serialize_datetime(j.posted_at),
        "createdAt": serialize_datetime(j.created_at),
    }


def lead_to_dict(l: LeadModel) -> Dict:
    return {
        "id": l.id,
        "name": l.name,
        "email": l.email,
        "phone": l.phone,
        "skills": l.skills or [],
        "experience": l.experience,
        "score": l.score,
        "quality": l.quality,
        "priority": l.priority,
        "status": l.status,
        "resume_text": l.resume_text,
        "pipeline_stage": l.pipeline_stage or "screened",
        "createdAt": serialize_datetime(l.created_at),
        "updatedAt": serialize_datetime(l.updated_at),
    }


def recruiter_to_dict(r: RecruiterModel) -> Dict:
    return {
        "id": r.id,
        "company_name": r.company_name,
        "recruiter_name": r.recruiter_name,
        "email": r.email,
        "phone": r.phone,
        "whatsapp": r.whatsapp,
        "location": r.location,
        "company_size": r.company_size,
        "hiring_active": r.hiring_active,
        "source": r.source,
        "status": r.status,
        "outreach_count": r.outreach_count,
        "reply_received": r.reply_received,
        "leadsSent": r.leads_sent,
        "dealsClosed": r.deals_closed,
        "createdAt": serialize_datetime(r.created_at),
        "updatedAt": serialize_datetime(r.updated_at),
    }


def deal_to_dict(d: DealModel) -> Dict:
    return {
        "id": d.id,
        "title": d.title,
        "recruiter_id": d.recruiter_id,
        "lead_id": d.lead_id,
        "value": d.value,
        "status": d.status,
        "stage": d.stage,
        "createdAt": serialize_datetime(d.created_at),
        "closedAt": serialize_datetime(d.closed_at),
    }


def payment_to_dict(p: PaymentModel) -> Dict:
    return {
        "id": p.id,
        "deal_id": p.deal_id,
        "amount": p.amount,
        "currency": p.currency,
        "status": p.status,
        "method": p.method,
        "notes": p.notes,
        "createdAt": serialize_datetime(p.created_at),
        "paidAt": serialize_datetime(p.paid_at),
    }


def template_to_dict(t: TemplateModel) -> Dict:
    return {
        "id": t.id,
        "name": t.name,
        "subject": t.subject,
        "body": t.body,
        "template_type": t.template_type,
        "variables": t.variables or [],
        "createdAt": serialize_datetime(t.created_at),
    }


# ─── Auth Routes ──────────────────────────────────────────────────────────────

@app.post("/api/auth/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(UserModel).filter(UserModel.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = UserModel(
        id=str(uuid.uuid4()),
        name=req.name,
        email=req.email,
        password_hash=hash_password(req.password),
        role=req.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id, user.email, user.role)
    return {
        "token": token,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
    }


@app.post("/api/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user.id, user.email, user.role)
    return {
        "token": token,
        "user": {"id": user.id, "name": user.name, "email": user.email, "role": user.role},
    }


@app.get("/api/auth/me")
def get_me(current_user: UserModel = Depends(get_current_user)):
    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
        }
    }


@app.patch("/api/auth/profile")
def update_profile(
    data: Dict,
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if "name" in data:
        current_user.name = data["name"]
    db.commit()
    db.refresh(current_user)
    return {"user": {"id": current_user.id, "name": current_user.name, "email": current_user.email}}


# ─── Stats Route ──────────────────────────────────────────────────────────────

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    total_leads = db.query(func.count(LeadModel.id)).scalar() or 0
    total_recruiters = db.query(func.count(RecruiterModel.id)).scalar() or 0
    total_jobs = db.query(func.count(JobModel.id)).scalar() or 0
    total_deals = db.query(func.count(DealModel.id)).scalar() or 0

    closed_deals = db.query(DealModel).filter(DealModel.status == "closed").all()
    total_revenue = sum(d.value for d in closed_deals)

    avg_score_row = db.query(func.avg(LeadModel.score)).scalar()
    avg_score = round(avg_score_row or 0, 1)

    high_quality = db.query(func.count(LeadModel.id)).filter(LeadModel.quality == "High").scalar() or 0
    active_jobs = db.query(func.count(JobModel.id)).filter(JobModel.status == "active").scalar() or 0

    return {
        "total_leads": total_leads,
        "total_recruiters": total_recruiters,
        "total_jobs": total_jobs,
        "total_deals": total_deals,
        "total_revenue": total_revenue,
        "avg_score": avg_score,
        "high_quality_leads": high_quality,
        "active_jobs": active_jobs,
    }


# ─── Jobs Routes ──────────────────────────────────────────────────────────────

@app.get("/api/jobs")
def get_jobs(
    page: int = 1,
    pageSize: int = 10,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user),
):
    query = db.query(JobModel)
    if status:
        query = query.filter(JobModel.status == status)
    total = query.count()
    jobs = query.order_by(JobModel.created_at.desc()).offset((page - 1) * pageSize).limit(pageSize).all()
    return {"data": [job_to_dict(j) for j in jobs], "total": total, "page": page, "pageSize": pageSize}


@app.get("/api/jobs/{job_id}")
def get_job(job_id: str, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job_to_dict(job)


@app.post("/api/jobs", status_code=201)
def create_job(data: JobCreate, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    job = JobModel(**data.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    return job_to_dict(job)


@app.patch("/api/jobs/{job_id}")
def update_job(job_id: str, data: JobUpdate, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(job, k, v)
    db.commit()
    db.refresh(job)
    return job_to_dict(job)


@app.delete("/api/jobs/{job_id}")
def delete_job(job_id: str, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"message": "Job deleted"}


# ─── Leads Routes ─────────────────────────────────────────────────────────────

@app.get("/api/leads")
def get_leads(
    page: int = 1,
    pageSize: int = 10,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user),
):
    query = db.query(LeadModel)
    if status:
        query = query.filter(LeadModel.status == status)
    total = query.count()
    leads = query.order_by(LeadModel.created_at.desc()).offset((page - 1) * pageSize).limit(pageSize).all()
    return {"data": [lead_to_dict(l) for l in leads], "total": total, "page": page, "pageSize": pageSize}


@app.get("/api/leads/{lead_id}")
def get_lead(lead_id: str, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    lead = db.query(LeadModel).filter(LeadModel.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead_to_dict(lead)


@app.post("/api/leads", status_code=201)
def create_lead(data: LeadCreate, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    skills = data.skills
    experience = data.experience

    if data.resume_text and not skills:
        skills = extract_skills(data.resume_text)
    if data.resume_text and experience == 0:
        experience = extract_experience(data.resume_text)

    score = score_lead_general(skills, experience)
    quality, priority = compute_quality_priority(score)

    lead = LeadModel(
        name=data.name,
        email=data.email,
        phone=data.phone,
        skills=skills,
        experience=experience,
        score=score,
        quality=quality,
        priority=priority,
        status=data.status,
        resume_text=data.resume_text,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead_to_dict(lead)


@app.patch("/api/leads/{lead_id}")
def update_lead(lead_id: str, data: LeadUpdate, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    lead = db.query(LeadModel).filter(LeadModel.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(lead, k, v)
    # Re-score if skills or experience changed
    if data.skills is not None or data.experience is not None:
        lead.score = score_lead_general(lead.skills or [], lead.experience or 0)
        lead.quality, lead.priority = compute_quality_priority(lead.score)
    db.commit()
    db.refresh(lead)
    return lead_to_dict(lead)


@app.post("/api/leads/{lead_id}/score")
def score_lead_endpoint(lead_id: str, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    lead = db.query(LeadModel).filter(LeadModel.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    skills = lead.skills or []
    experience = lead.experience or 0

    if lead.resume_text:
        extracted = extract_skills(lead.resume_text)
        if extracted:
            skills = list(set(skills + extracted))
        exp_from_resume = extract_experience(lead.resume_text)
        if exp_from_resume > experience:
            experience = exp_from_resume

    score = score_lead_general(skills, experience)
    quality, priority = compute_quality_priority(score)

    lead.skills = skills
    lead.experience = experience
    lead.score = score
    lead.quality = quality
    lead.priority = priority
    db.commit()
    db.refresh(lead)

    return {
        "score": score,
        "quality": quality,
        "priority": priority,
        "skills": skills,
        "experience": experience,
        "breakdown": {
            "skill_count": len(skills),
            "experience_years": experience,
            "skill_score": min(len(skills) * 7, 55),
        }
    }


@app.delete("/api/leads/{lead_id}")
def delete_lead(lead_id: str, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    lead = db.query(LeadModel).filter(LeadModel.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted"}


class PipelineStageUpdate(BaseModel):
    stage: str


@app.patch("/api/leads/{lead_id}/pipeline")
def update_pipeline_stage(
    lead_id: str,
    req: PipelineStageUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    valid_stages = {"screened", "contacted", "interviewing", "offer", "hired"}
    if req.stage not in valid_stages:
        raise HTTPException(status_code=400, detail=f"Invalid stage. Must be one of: {', '.join(valid_stages)}")
    lead = db.query(LeadModel).filter(LeadModel.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    from_stage = lead.pipeline_stage or "screened"
    lead.pipeline_stage = req.stage
    activity = PipelineActivityModel(
        lead_id=lead.id,
        lead_name=lead.name,
        from_stage=from_stage,
        to_stage=req.stage,
        moved_by_id=current_user.id,
        moved_by_name=current_user.name,
        moved_by_email=current_user.email,
    )
    db.add(activity)
    db.commit()
    db.refresh(lead)
    return lead_to_dict(lead)


@app.get("/api/pipeline/activity")
def get_pipeline_activity(
    lead_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user),
):
    query = db.query(PipelineActivityModel)
    if lead_id:
        query = query.filter(PipelineActivityModel.lead_id == lead_id)
    entries = query.order_by(PipelineActivityModel.moved_at.desc()).limit(limit).all()
    return [
        {
            "id": e.id,
            "lead_id": e.lead_id,
            "lead_name": e.lead_name,
            "from_stage": e.from_stage,
            "to_stage": e.to_stage,
            "moved_by_id": e.moved_by_id,
            "moved_by_name": e.moved_by_name,
            "moved_by_email": e.moved_by_email,
            "moved_at": e.moved_at.isoformat() if e.moved_at else None,
        }
        for e in entries
    ]


# ─── Recruiters Routes ────────────────────────────────────────────────────────

@app.get("/api/recruiters")
def get_recruiters(
    page: int = 1,
    pageSize: int = 10,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user),
):
    query = db.query(RecruiterModel)
    if status:
        query = query.filter(RecruiterModel.status == status)
    total = query.count()
    recruiters = query.order_by(RecruiterModel.created_at.desc()).offset((page - 1) * pageSize).limit(pageSize).all()
    return {"data": [recruiter_to_dict(r) for r in recruiters], "total": total}


@app.get("/api/recruiters/{recruiter_id}")
def get_recruiter(recruiter_id: str, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    r = db.query(RecruiterModel).filter(RecruiterModel.id == recruiter_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    return recruiter_to_dict(r)


@app.post("/api/recruiters", status_code=201)
def create_recruiter(data: RecruiterCreate, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    r = RecruiterModel(**data.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return recruiter_to_dict(r)


@app.patch("/api/recruiters/{recruiter_id}")
def update_recruiter(recruiter_id: str, data: RecruiterUpdate, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    r = db.query(RecruiterModel).filter(RecruiterModel.id == recruiter_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(r, k, v)
    db.commit()
    db.refresh(r)
    return recruiter_to_dict(r)


@app.delete("/api/recruiters/{recruiter_id}")
def delete_recruiter(recruiter_id: str, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    r = db.query(RecruiterModel).filter(RecruiterModel.id == recruiter_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recruiter not found")
    db.delete(r)
    db.commit()
    return {"message": "Recruiter deleted"}


@app.post("/api/recruiters/bulk-import")
def bulk_import_recruiters(
    payload: Dict,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user),
):
    recruiters_data = payload.get("recruiters", [])
    created = []
    for rd in recruiters_data:
        r = RecruiterModel(
            company_name=rd.get("company_name", "Unknown"),
            recruiter_name=rd.get("recruiter_name", "Unknown"),
            email=rd.get("email", ""),
            phone=rd.get("phone", ""),
            location=rd.get("location", ""),
            status=rd.get("status", "new"),
        )
        db.add(r)
        created.append(r)
    db.commit()
    return {"imported": len(created), "message": f"Successfully imported {len(created)} recruiters"}


# ─── Deals Routes ─────────────────────────────────────────────────────────────

@app.get("/api/deals")
def get_deals(page: int = 1, pageSize: int = 10, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    total = db.query(func.count(DealModel.id)).scalar()
    deals = db.query(DealModel).order_by(DealModel.created_at.desc()).offset((page - 1) * pageSize).limit(pageSize).all()
    return {"data": [deal_to_dict(d) for d in deals], "total": total}


@app.post("/api/deals", status_code=201)
def create_deal(data: DealCreate, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    deal = DealModel(**data.model_dump())
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return deal_to_dict(deal)


@app.patch("/api/deals/{deal_id}")
def update_deal(deal_id: str, data: DealUpdate, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    deal = db.query(DealModel).filter(DealModel.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(deal, k, v)
    db.commit()
    db.refresh(deal)
    return deal_to_dict(deal)


@app.post("/api/deals/{deal_id}/close")
def close_deal(deal_id: str, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    deal = db.query(DealModel).filter(DealModel.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    deal.status = "closed"
    deal.closed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(deal)
    return deal_to_dict(deal)


@app.delete("/api/deals/{deal_id}")
def delete_deal(deal_id: str, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    deal = db.query(DealModel).filter(DealModel.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.delete(deal)
    db.commit()
    return {"message": "Deal deleted"}


# ─── Payments Routes ──────────────────────────────────────────────────────────

@app.get("/api/payments")
def get_payments(page: int = 1, pageSize: int = 10, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    total = db.query(func.count(PaymentModel.id)).scalar()
    payments = db.query(PaymentModel).order_by(PaymentModel.created_at.desc()).offset((page - 1) * pageSize).limit(pageSize).all()
    return {"data": [payment_to_dict(p) for p in payments], "total": total}


@app.post("/api/payments", status_code=201)
def create_payment(data: PaymentCreate, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    payment = PaymentModel(**data.model_dump())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment_to_dict(payment)


@app.post("/api/payments/{payment_id}/record")
def record_payment(payment_id: str, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    payment = db.query(PaymentModel).filter(PaymentModel.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    payment.status = "paid"
    payment.paid_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(payment)
    return payment_to_dict(payment)


@app.delete("/api/payments/{payment_id}")
def delete_payment(payment_id: str, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    payment = db.query(PaymentModel).filter(PaymentModel.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    db.delete(payment)
    db.commit()
    return {"message": "Payment deleted"}


# ─── Templates Routes ─────────────────────────────────────────────────────────

@app.get("/api/templates")
def get_templates(db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    templates = db.query(TemplateModel).order_by(TemplateModel.created_at.desc()).all()
    return {"data": [template_to_dict(t) for t in templates], "total": len(templates)}


@app.post("/api/templates", status_code=201)
def create_template(data: TemplateCreate, db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    t = TemplateModel(**data.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return template_to_dict(t)


# ─── Resume / AI Routes ───────────────────────────────────────────────────────

@app.post("/api/resumes/parse")
async def parse_resume(
    file: UploadFile = File(...),
    _: UserModel = Depends(get_current_user),
):
    content_bytes = await file.read()
    try:
        text = content_bytes.decode("utf-8", errors="ignore")
    except Exception:
        text = content_bytes.decode("latin-1", errors="ignore")

    # ── Fallback (keyword-based) ──────────────────────────────────────────────
    fallback_skills    = extract_skills(text)
    fallback_exp       = extract_experience(text)
    fallback_education = extract_education(text)

    lines = [l.strip() for l in text.splitlines() if l.strip()]
    fallback_name = lines[0] if lines else "Unknown"
    if len(fallback_name) > 40 or "@" in fallback_name or fallback_name.startswith("http"):
        fallback_name = "Unknown"
    email_match   = re.search(r'[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}', text)
    fallback_email = email_match.group(0) if email_match else ""
    phone_match   = re.search(r'[\+]?[\d\s\-\(\)]{10,15}', text)
    fallback_phone = phone_match.group(0).strip() if phone_match else ""

    # ── Gemini-powered extraction ─────────────────────────────────────────────
    ai_summary = ""
    if gemini.is_available() and text.strip():
        try:
            prompt = f"""You are an expert resume parser. Extract structured data from the resume text below.
Return ONLY valid JSON with these exact keys:
{{
  "name": "Full Name or Unknown",
  "email": "email@example.com or empty string",
  "phone": "phone number or empty string",
  "experience_years": <integer, 0 if fresher>,
  "education": "PhD | Masters | Bachelors | Diploma | Not specified",
  "skills": ["skill1", "skill2", ...],
  "summary": "2-3 sentence professional summary of this candidate highlighting strengths"
}}

Rules:
- skills: list only real technical/professional skills mentioned (programming languages, frameworks, tools, cloud, methodologies)
- experience_years: extract the highest mentioned years of experience (number only)
- summary: be specific, mention actual skills and role level

Resume text (first 3000 chars):
{text[:3000]}"""

            parsed = gemini.generate_json(prompt)
            ai_summary = parsed.get("summary", "")
            return {
                "skills": parsed.get("skills", fallback_skills) or fallback_skills,
                "experience": parsed.get("experience_years", fallback_exp),
                "education": parsed.get("education", fallback_education),
                "name": parsed.get("name", fallback_name) or fallback_name,
                "email": parsed.get("email", fallback_email) or fallback_email,
                "phone": parsed.get("phone", fallback_phone) or fallback_phone,
                "summary": ai_summary,
                "text_preview": text[:500],
                "full_text": text,
                "ai_powered": True,
            }
        except Exception as e:
            logging.warning(f"Gemini resume parse failed, using fallback: {e}")

    return {
        "skills": fallback_skills,
        "experience": fallback_exp,
        "education": fallback_education,
        "name": fallback_name,
        "email": fallback_email,
        "phone": fallback_phone,
        "summary": "",
        "text_preview": text[:500],
        "full_text": text,
        "ai_powered": False,
    }


@app.post("/api/resumes/match")
def match_resume_to_job(data: ResumeMatchRequest, _: UserModel = Depends(get_current_user)):
    candidate_skills = extract_skills(data.resume_text)
    candidate_exp    = extract_experience(data.resume_text)
    candidate_education = extract_education(data.resume_text)
    job_skills   = data.job_skills if data.job_skills else extract_skills(data.job_description)
    job_exp_min  = data.job_experience_min if data.job_experience_min else extract_experience(data.job_description)
    fallback     = match_candidate_to_job(candidate_skills, candidate_exp, job_skills, job_exp_min)

    if gemini.is_available() and data.resume_text.strip():
        try:
            prompt = f"""You are an expert technical recruiter. Score how well this candidate matches the job.

JOB REQUIREMENTS:
- Required skills: {', '.join(job_skills) if job_skills else data.job_description[:500]}
- Minimum experience: {job_exp_min} years
- Job description: {data.job_description[:800]}

CANDIDATE RESUME (excerpt):
{data.resume_text[:2000]}

Return ONLY valid JSON:
{{
  "score": <integer 0-100, overall match score>,
  "skill_match_pct": <integer 0-100>,
  "exp_score_pct": <integer 0-100>,
  "matched_skills": ["skill1", ...],
  "missing_skills": ["skill1", ...],
  "recommendation": "Strong match — recommend for interview | Partial match — review manually | Weak match — consider other candidates",
  "reasoning": "2-3 sentence explanation of the score, mentioning specific strengths and gaps"
}}

Scoring guide: 75-100 = strong match, 50-74 = partial, below 50 = weak."""

            ai = gemini.generate_json(prompt)
            return {
                "score": ai.get("score", fallback["score"]),
                "quality": "High" if ai.get("score", 0) >= 75 else "Medium" if ai.get("score", 0) >= 50 else "Low",
                "skill_match_pct": ai.get("skill_match_pct", fallback["skill_match_pct"]),
                "exp_score_pct": ai.get("exp_score_pct", fallback["exp_score_pct"]),
                "matched_skills": ai.get("matched_skills", fallback["matched_skills"]),
                "missing_skills": ai.get("missing_skills", fallback["missing_skills"]),
                "recommendation": ai.get("recommendation", ""),
                "reasoning": ai.get("reasoning", ""),
                "candidate_skills": candidate_skills,
                "candidate_experience": candidate_exp,
                "candidate_education": candidate_education,
                "job_skills_required": job_skills,
                "job_experience_min": job_exp_min,
                "ai_powered": True,
            }
        except Exception as e:
            logging.warning(f"Gemini match failed, using fallback: {e}")

    return {
        **fallback,
        "candidate_skills": candidate_skills,
        "candidate_experience": candidate_exp,
        "candidate_education": candidate_education,
        "job_skills_required": job_skills,
        "job_experience_min": job_exp_min,
        "recommendation": (
            "Strong match — recommend for interview" if fallback["score"] >= 75
            else "Partial match — review manually" if fallback["score"] >= 50
            else "Weak match — consider other candidates"
        ),
        "reasoning": "",
        "ai_powered": False,
    }


@app.post("/api/jobs/{job_id}/match-candidates")
def match_candidates_to_job(
    job_id: str,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user),
):
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    leads   = db.query(LeadModel).all()
    results = []

    for lead in leads:
        match = match_candidate_to_job(
            lead.skills or [],
            lead.experience or 0,
            job.skills or [],
            job.experience_min or 0,
        )
        results.append({
            **lead_to_dict(lead),
            "match_score": match["score"],
            "match_quality": match["quality"],
            "skill_match_pct": match["skill_match_pct"],
            "matched_skills": match["matched_skills"],
            "missing_skills": match["missing_skills"],
        })

    results.sort(key=lambda x: x["match_score"], reverse=True)

    # Use Gemini to write a brief insight for the top 3 candidates only
    ai_insights: Dict[str, str] = {}
    if gemini.is_available() and results:
        top3 = results[:3]
        for cand in top3:
            try:
                prompt = f"""In one sentence, explain why {cand['name']} (score {cand['match_score']}/100) is a {cand['match_quality'].lower()} match for the {job.title} role. Mention 1-2 specific skills."""
                ai_insights[cand["id"]] = gemini.generate(prompt).strip().strip('"')
            except Exception:
                pass

    for r in results:
        r["ai_insight"] = ai_insights.get(r["id"], "")

    return {"job": job_to_dict(job), "candidates": results, "total": len(results)}


# ─── AI Chat & Candidate Brief ────────────────────────────────────────────────

class AIChatRequest(BaseModel):
    question: str


@app.post("/api/ai/chat")
def ai_chat(
    req: AIChatRequest,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user),
):
    """Natural language query over the candidate database."""
    if not gemini.is_available():
        raise HTTPException(status_code=503, detail="AI not configured")
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question is required")

    leads = db.query(LeadModel).all()
    candidate_list = "\n".join(
        f"- {l.name} | email: {l.email} | score: {l.score} | skills: {', '.join(l.skills or [])} | "
        f"experience: {l.experience}y | stage: {l.pipeline_stage or 'screened'} | quality: {l.quality}"
        for l in leads
    )

    prompt = f"""You are an AI recruitment assistant for RecruitAI. Answer the recruiter's question using the candidate data below.
Be concise, factual, and helpful. If listing candidates, include their name and score.

CANDIDATE DATABASE ({len(leads)} candidates):
{candidate_list}

RECRUITER QUESTION: {req.question}

Answer:"""

    try:
        answer = gemini.generate(prompt).strip()
        return {"answer": answer, "ai_powered": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


@app.post("/api/ai/candidate-brief/{lead_id}")
def ai_candidate_brief(
    lead_id: str,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user),
):
    """Generate a 3-line AI recruiter brief for a single candidate."""
    if not gemini.is_available():
        raise HTTPException(status_code=503, detail="AI not configured")

    lead = db.query(LeadModel).filter(LeadModel.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Candidate not found")

    prompt = f"""Write a concise 3-line recruiter brief for this candidate. Be specific and professional.

Candidate profile:
- Name: {lead.name}
- Skills: {', '.join(lead.skills or [])}
- Experience: {lead.experience} years
- AI Score: {lead.score}/100 ({lead.quality} quality)
- Pipeline stage: {lead.pipeline_stage or 'screened'}
- Resume excerpt: {(lead.resume_text or '')[:600]}

Write exactly 3 sentences:
1. Who they are and their strongest technical skills
2. Their experience level and standout qualities
3. Recommendation (suitable for what type of role/company)"""

    try:
        brief = gemini.generate(prompt).strip()
        return {"brief": brief, "lead_id": lead_id, "ai_powered": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI error: {str(e)}")


# ─── Outreach Stubs ───────────────────────────────────────────────────────────

@app.post("/api/outreach/email")
def send_email_outreach(payload: Dict, _: UserModel = Depends(get_current_user)):
    return {"status": "queued", "message": "Email queued for delivery", "id": str(uuid.uuid4())}


@app.post("/api/outreach/whatsapp")
def send_whatsapp_outreach(payload: Dict, _: UserModel = Depends(get_current_user)):
    return {"status": "queued", "message": "WhatsApp message queued", "id": str(uuid.uuid4())}


@app.get("/api/outreach/history/{recruiter_id}")
def get_outreach_history(recruiter_id: str, _: UserModel = Depends(get_current_user)):
    return {"data": [], "total": 0}


# ─── Automated Outreach System ────────────────────────────────────────────────

def _score_tier(score: int) -> str:
    if score >= 75:
        return "high"
    if score >= 50:
        return "medium"
    return "low"


def _render_template(template_body: str, template_subject: str, lead: LeadModel,
                     recruiter: Optional[RecruiterModel] = None) -> tuple[str, str]:
    """Replace all {{variables}} in the template with lead/recruiter data."""
    skills_str = ", ".join((lead.skills or [])[:5]) if lead.skills else "various technical skills"
    exp_str = f"{lead.experience} year{'s' if lead.experience != 1 else ''}" if lead.experience > 0 else "entry-level"
    recruiter_name = recruiter.recruiter_name if recruiter else "Hiring Manager"
    company = recruiter.company_name if recruiter else "your company"

    replacements = {
        "{{candidate_name}}": lead.name,
        "{{skills}}":         skills_str,
        "{{experience}}":     exp_str,
        "{{score}}":          str(lead.score),
        "{{quality}}":        lead.quality or "qualified",
        "{{recruiter_name}}": recruiter_name,
        "{{company}}":        company,
    }

    body = template_body
    subject = template_subject
    for key, val in replacements.items():
        body = body.replace(key, val)
        subject = subject.replace(key, val)
    return subject, body


@app.get("/api/outreach/tier-templates")
def get_tier_templates(db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    templates = db.query(TierTemplateModel).all()
    return {
        "data": [
            {
                "id": t.id, "tier": t.tier, "label": t.label,
                "subject": t.subject, "body": t.body, "tone": t.tone,
            }
            for t in templates
        ]
    }


@app.patch("/api/outreach/tier-templates/{tier}")
def update_tier_template(tier: str, payload: TierTemplateUpdate,
                         db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    tpl = db.query(TierTemplateModel).filter(TierTemplateModel.tier == tier).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Tier template not found")
    if payload.subject is not None:
        tpl.subject = payload.subject
    if payload.body is not None:
        tpl.body = payload.body
    if payload.tone is not None:
        tpl.tone = payload.tone
    tpl.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(tpl)
    return {"data": {"id": tpl.id, "tier": tpl.tier, "label": tpl.label,
                     "subject": tpl.subject, "body": tpl.body, "tone": tpl.tone}}


@app.post("/api/outreach/auto-draft")
def auto_draft_emails(payload: AutoDraftRequest,
                      db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    if not payload.lead_ids:
        raise HTTPException(status_code=400, detail="No lead IDs provided")

    recruiter = None
    if payload.recruiter_id:
        recruiter = db.query(RecruiterModel).filter(RecruiterModel.id == payload.recruiter_id).first()

    # Load all tier templates into a dict keyed by tier
    tier_templates: dict[str, TierTemplateModel] = {
        t.tier: t for t in db.query(TierTemplateModel).all()
    }

    generated = 0
    skipped = 0
    for lead_id in payload.lead_ids:
        lead = db.query(LeadModel).filter(LeadModel.id == lead_id).first()
        if not lead:
            skipped += 1
            continue

        tier = _score_tier(lead.score)
        tpl = tier_templates.get(tier)
        if not tpl:
            skipped += 1
            continue

        subject, body = _render_template(tpl.body, tpl.subject, lead, recruiter)

        draft = OutreachDraftModel(
            lead_id=lead.id,
            recruiter_id=recruiter.id if recruiter else None,
            tier=tier,
            subject=subject,
            body=body,
            status="draft",
            lead_name=lead.name,
            lead_email=lead.email or "",
            lead_score=lead.score,
            lead_skills_snapshot=lead.skills or [],
            recruiter_name=recruiter.recruiter_name if recruiter else "",
            recruiter_company=recruiter.company_name if recruiter else "",
        )
        db.add(draft)
        generated += 1

    db.commit()
    return {"generated": generated, "skipped": skipped}


@app.get("/api/outreach/drafts")
def get_outreach_drafts(status: Optional[str] = None,
                        db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    q = db.query(OutreachDraftModel)
    if status:
        q = q.filter(OutreachDraftModel.status == status)
    drafts = q.order_by(OutreachDraftModel.created_at.desc()).all()
    return {
        "data": [
            {
                "id": d.id, "lead_id": d.lead_id, "recruiter_id": d.recruiter_id,
                "tier": d.tier, "subject": d.subject, "body": d.body, "status": d.status,
                "lead_name": d.lead_name, "lead_email": d.lead_email, "lead_score": d.lead_score,
                "lead_skills_snapshot": d.lead_skills_snapshot or [],
                "recruiter_name": d.recruiter_name, "recruiter_company": d.recruiter_company,
                "sent_at": serialize_datetime(d.sent_at),
                "created_at": serialize_datetime(d.created_at),
            }
            for d in drafts
        ],
        "total": len(drafts),
    }


@app.patch("/api/outreach/drafts/{draft_id}")
def update_outreach_draft(draft_id: str, payload: DraftUpdate,
                          db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    draft = db.query(OutreachDraftModel).filter(OutreachDraftModel.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    if payload.subject is not None:
        draft.subject = payload.subject
    if payload.body is not None:
        draft.body = payload.body
    db.commit()
    return {"message": "Draft updated"}


@app.post("/api/outreach/drafts/{draft_id}/send")
def send_outreach_draft(draft_id: str,
                        db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    draft = db.query(OutreachDraftModel).filter(OutreachDraftModel.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    draft.status = "sent"
    draft.sent_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Draft marked as sent", "sent_at": serialize_datetime(draft.sent_at)}


@app.post("/api/outreach/drafts/send-all")
def send_all_outreach_drafts(db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    drafts = db.query(OutreachDraftModel).filter(OutreachDraftModel.status == "draft").all()
    now = datetime.now(timezone.utc)
    for draft in drafts:
        draft.status = "sent"
        draft.sent_at = now
    db.commit()
    return {"message": "All pending drafts marked as sent", "sent_count": len(drafts), "sent_at": serialize_datetime(now)}


@app.delete("/api/outreach/drafts/{draft_id}")
def delete_outreach_draft(draft_id: str,
                          db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    draft = db.query(OutreachDraftModel).filter(OutreachDraftModel.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    db.delete(draft)
    db.commit()
    return {"message": "Draft deleted"}


@app.get("/api/outreach/analytics")
def get_outreach_analytics(db: Session = Depends(get_db), _: UserModel = Depends(get_current_user)):
    all_drafts = db.query(OutreachDraftModel).all()
    total = len(all_drafts)
    sent_drafts = [d for d in all_drafts if d.status == "sent"]
    pending_drafts = [d for d in all_drafts if d.status == "draft"]
    sent = len(sent_drafts)
    draft = len(pending_drafts)
    send_rate = round((sent / total * 100), 1) if total > 0 else 0.0
    avg_score_sent = round(sum(d.lead_score for d in sent_drafts) / sent, 1) if sent > 0 else 0.0

    # Per-tier breakdown
    tier_stats: dict = {}
    for tier in ["high", "medium", "low"]:
        tier_all = [d for d in all_drafts if d.tier == tier]
        tier_sent = [d for d in tier_all if d.status == "sent"]
        tier_draft = [d for d in tier_all if d.status == "draft"]
        tier_stats[tier] = {
            "total": len(tier_all),
            "sent": len(tier_sent),
            "draft": len(tier_draft),
        }

    # Timeline: sent emails per day (last 14 days)
    from collections import defaultdict
    day_counts: dict = defaultdict(int)
    for d in sent_drafts:
        if d.sent_at:
            day = d.sent_at.strftime("%Y-%m-%d") if hasattr(d.sent_at, "strftime") else str(d.sent_at)[:10]
            day_counts[day] += 1
    # Build last 14 days
    from datetime import timedelta, date
    timeline = []
    today = date.today()
    for i in range(13, -1, -1):
        day = (today - timedelta(days=i)).isoformat()
        timeline.append({"date": day, "sent": day_counts.get(day, 0)})

    # Recent sent (last 10)
    recent_sent = sorted(sent_drafts, key=lambda d: d.sent_at or datetime.min, reverse=True)[:10]
    recent = [
        {
            "id": d.id,
            "lead_name": d.lead_name,
            "lead_email": d.lead_email,
            "lead_score": d.lead_score,
            "tier": d.tier,
            "subject": d.subject,
            "recruiter_company": d.recruiter_company,
            "sent_at": serialize_datetime(d.sent_at),
        }
        for d in recent_sent
    ]

    return {
        "summary": {
            "total": total,
            "sent": sent,
            "draft": draft,
            "send_rate": send_rate,
            "avg_score_sent": avg_score_sent,
        },
        "by_tier": tier_stats,
        "timeline": timeline,
        "recent_sent": recent,
    }


# ─── Seed Data ────────────────────────────────────────────────────────────────

def seed_database():
    db = SessionLocal()
    try:
        if db.query(UserModel).count() > 0:
            return

        admin = UserModel(
            id=str(uuid.uuid4()),
            name="Admin User",
            email="admin@recruiteai.com",
            password_hash=hash_password("admin123"),
            role="admin",
        )
        db.add(admin)

        jobs_data = [
            {"title": "Senior React Developer", "company": "TechCorp India", "location": "Bangalore", "salary": "₹18-25 LPA", "skills": ["React", "TypeScript", "Node.js", "Redux", "GraphQL"], "experience_min": 4, "category": "IT & Software"},
            {"title": "Python ML Engineer", "company": "AI Startup", "location": "Remote", "salary": "₹15-22 LPA", "skills": ["Python", "Machine Learning", "TensorFlow", "PyTorch", "scikit-learn"], "experience_min": 3, "category": "Data Science"},
            {"title": "Full Stack Developer", "company": "Fintech Solutions", "location": "Mumbai", "salary": "₹12-18 LPA", "skills": ["React", "Node.js", "PostgreSQL", "Docker", "AWS"], "experience_min": 3, "category": "IT & Software"},
            {"title": "DevOps Engineer", "company": "Cloud Systems Ltd", "location": "Hyderabad", "salary": "₹14-20 LPA", "skills": ["Docker", "Kubernetes", "AWS", "Terraform", "Jenkins"], "experience_min": 3, "category": "DevOps"},
            {"title": "Java Spring Boot Developer", "company": "Enterprise Corp", "location": "Pune", "salary": "₹10-16 LPA", "skills": ["Java", "Spring Boot", "Microservices", "MySQL", "REST"], "experience_min": 2, "category": "IT & Software"},
            {"title": "Data Scientist", "company": "Analytics Firm", "location": "Chennai", "salary": "₹12-20 LPA", "skills": ["Python", "Data Science", "Pandas", "NumPy", "Machine Learning", "SQL"], "experience_min": 2, "category": "Data Science"},
            {"title": "Frontend Engineer", "company": "Ecommerce Giant", "location": "Delhi", "salary": "₹8-14 LPA", "skills": ["React", "JavaScript", "TypeScript", "Tailwind CSS", "Next.js"], "experience_min": 2, "category": "IT & Software"},
            {"title": "Backend Developer (Node.js)", "company": "SaaS Platform", "location": "Remote", "salary": "₹10-18 LPA", "skills": ["Node.js", "Express", "MongoDB", "Redis", "GraphQL"], "experience_min": 2, "category": "IT & Software"},
        ]

        job_models = []
        for jd in jobs_data:
            j = JobModel(**jd, source="seed")
            db.add(j)
            job_models.append(j)

        leads_data = [
            {"name": "Priya Sharma", "email": "priya.sharma@gmail.com", "phone": "+91 9876543210", "skills": ["React", "TypeScript", "Node.js", "GraphQL", "AWS"], "experience": 5, "resume_text": "Senior React developer with 5 years of experience in React TypeScript Node.js GraphQL AWS"},
            {"name": "Rahul Kumar", "email": "rahul.kumar@outlook.com", "phone": "+91 8765432109", "skills": ["Python", "Machine Learning", "TensorFlow", "scikit-learn", "Pandas"], "experience": 4, "resume_text": "ML engineer 4 years experience Python TensorFlow scikit-learn Pandas Data Science"},
            {"name": "Ananya Patel", "email": "ananya.patel@gmail.com", "phone": "+91 7654321098", "skills": ["Java", "Spring Boot", "Microservices", "MySQL", "Docker"], "experience": 3, "resume_text": "Java developer 3 years Spring Boot microservices MySQL Docker REST APIs"},
            {"name": "Vikram Singh", "email": "vikram.singh@yahoo.com", "phone": "+91 6543210987", "skills": ["React", "Vue", "JavaScript", "CSS", "Figma"], "experience": 2, "resume_text": "Frontend developer 2 years React Vue JavaScript CSS Figma design"},
            {"name": "Kavya Reddy", "email": "kavya.reddy@gmail.com", "phone": "+91 9988776655", "skills": ["Docker", "Kubernetes", "AWS", "Terraform", "Jenkins", "Linux"], "experience": 6, "resume_text": "DevOps engineer 6 years Docker Kubernetes AWS Terraform Jenkins Linux CI/CD"},
            {"name": "Arjun Mehta", "email": "arjun.mehta@gmail.com", "phone": "+91 8877665544", "skills": ["Python", "Django", "PostgreSQL", "Redis", "AWS"], "experience": 3, "resume_text": "Backend developer 3 years Python Django PostgreSQL Redis AWS microservices"},
            {"name": "Sneha Joshi", "email": "sneha.joshi@gmail.com", "phone": "+91 7766554433", "skills": ["Data Science", "Python", "Pandas", "NumPy", "Machine Learning", "Matplotlib"], "experience": 2, "resume_text": "Data scientist 2 years Python Pandas NumPy Machine Learning Matplotlib Seaborn"},
            {"name": "Karthik Nair", "email": "karthik.nair@gmail.com", "phone": "+91 9900112233", "skills": ["Node.js", "Express", "MongoDB", "React", "TypeScript"], "experience": 4, "resume_text": "Full stack developer 4 years Node.js Express MongoDB React TypeScript"},
            {"name": "Deepika Verma", "email": "deepika.verma@outlook.com", "phone": "+91 8811223344", "skills": ["Flutter", "Dart", "Firebase", "iOS", "Android"], "experience": 3, "resume_text": "Mobile developer 3 years Flutter Dart Firebase iOS Android React Native"},
            {"name": "Siddharth Rao", "email": "siddharth.rao@gmail.com", "phone": "+91 9922334455", "skills": ["React", "Next.js", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL"], "experience": 5, "resume_text": "Senior full stack developer 5 years React Next.js TypeScript Tailwind Node.js PostgreSQL"},
        ]

        for ld in leads_data:
            score = score_lead_general(ld["skills"], ld["experience"])
            quality, priority = compute_quality_priority(score)
            lead = LeadModel(
                name=ld["name"],
                email=ld["email"],
                phone=ld["phone"],
                skills=ld["skills"],
                experience=ld["experience"],
                score=score,
                quality=quality,
                priority=priority,
                status="new",
                resume_text=ld["resume_text"],
            )
            db.add(lead)

        recruiters_data = [
            {"company_name": "TechHunt Recruiters", "recruiter_name": "Ravi Gupta", "email": "ravi@techhunt.com", "phone": "+91 9811223344", "location": "Mumbai", "company_size": "50-200", "status": "interested", "outreach_count": 3, "reply_received": True, "leads_sent": 8, "deals_closed": 2},
            {"company_name": "Talent Bridge", "recruiter_name": "Meera Shah", "email": "meera@talentbridge.in", "phone": "+91 9722334455", "location": "Delhi", "company_size": "10-50", "status": "contacted", "outreach_count": 1, "reply_received": False, "leads_sent": 3, "deals_closed": 0},
            {"company_name": "HirePro Solutions", "recruiter_name": "Suresh Kumar", "email": "suresh@hirepro.com", "phone": "+91 9633445566", "location": "Bangalore", "company_size": "200-500", "status": "deal_closed", "outreach_count": 5, "reply_received": True, "leads_sent": 15, "deals_closed": 5},
            {"company_name": "Staffing World", "recruiter_name": "Pooja Agarwal", "email": "pooja@staffingworld.com", "phone": "+91 9544556677", "location": "Hyderabad", "company_size": "50-200", "status": "active", "outreach_count": 4, "reply_received": True, "leads_sent": 12, "deals_closed": 3},
            {"company_name": "CareerLink India", "recruiter_name": "Amit Tiwari", "email": "amit@careerlink.in", "phone": "+91 9455667788", "location": "Pune", "company_size": "10-50", "status": "new", "outreach_count": 0, "reply_received": False, "leads_sent": 0, "deals_closed": 0},
        ]

        deal_models = []
        recruiter_models = []
        for rd in recruiters_data:
            r = RecruiterModel(
                company_name=rd["company_name"],
                recruiter_name=rd["recruiter_name"],
                email=rd["email"],
                phone=rd["phone"],
                location=rd["location"],
                company_size=rd["company_size"],
                status=rd["status"],
                outreach_count=rd["outreach_count"],
                reply_received=rd["reply_received"],
                leads_sent=rd["leads_sent"],
                deals_closed=rd["deals_closed"],
                source="seed",
                hiring_active=True,
            )
            db.add(r)
            recruiter_models.append(r)

        db.flush()

        deals_data = [
            {"title": "React Developer Placement - TechHunt", "value": 85000, "status": "closed", "stage": "Closed Won"},
            {"title": "ML Engineer Placement - HirePro", "value": 120000, "status": "closed", "stage": "Closed Won"},
            {"title": "Full Stack Dev - Staffing World", "value": 95000, "status": "negotiation", "stage": "Negotiation"},
            {"title": "DevOps Engineer - TechHunt", "value": 110000, "status": "pending", "stage": "Proposal"},
            {"title": "Data Scientist - HirePro", "value": 75000, "status": "closed", "stage": "Closed Won"},
        ]

        for i, dd in enumerate(deals_data):
            deal = DealModel(
                title=dd["title"],
                value=dd["value"],
                status=dd["status"],
                stage=dd["stage"],
                recruiter_id=recruiter_models[i % len(recruiter_models)].id,
                closed_at=datetime.now(timezone.utc) if dd["status"] == "closed" else None,
            )
            db.add(deal)
            deal_models.append(deal)

        db.flush()

        payments_data = [
            {"amount": 85000, "status": "paid", "method": "bank_transfer"},
            {"amount": 120000, "status": "paid", "method": "upi"},
            {"amount": 95000, "status": "pending", "method": "bank_transfer"},
            {"amount": 75000, "status": "paid", "method": "cheque"},
        ]

        for i, pd_item in enumerate(payments_data):
            if i < len(deal_models):
                p = PaymentModel(
                    deal_id=deal_models[i].id,
                    amount=pd_item["amount"],
                    status=pd_item["status"],
                    method=pd_item["method"],
                    paid_at=datetime.now(timezone.utc) if pd_item["status"] == "paid" else None,
                )
                db.add(p)

        templates_data = [
            {
                "name": "Initial Outreach",
                "subject": "Partnership Opportunity - Quality Tech Candidates",
                "body": "Dear {{recruiter_name}},\n\nI hope this email finds you well. I'm reaching out from RecruitAI with an exciting partnership opportunity.\n\nWe specialize in sourcing pre-screened, AI-scored tech candidates across React, Python, Java, and DevOps profiles.\n\nWould you be interested in exploring a collaboration?\n\nBest regards,\nRecruitAI Team",
                "template_type": "email",
                "variables": ["recruiter_name", "company_name"],
            },
            {
                "name": "Follow-up #1",
                "subject": "Following up - Tech Talent Partnership",
                "body": "Hi {{recruiter_name}},\n\nJust following up on my previous email regarding our tech talent partnership.\n\nWe currently have {{candidate_count}} pre-screened candidates available, with skills in {{skills_list}}.\n\nWould a quick 15-minute call work for you this week?\n\nBest,\nRecruitAI",
                "template_type": "email",
                "variables": ["recruiter_name", "candidate_count", "skills_list"],
            },
        ]

        for td in templates_data:
            t = TemplateModel(**td)
            db.add(t)

        # ── Tier Templates ────────────────────────────────────────────────────
        tier_templates_data = [
            {
                "tier": "high",
                "label": "High Match (75+ pts)",
                "tone": "urgent",
                "subject": "🔥 Exceptional Candidate Available — {{candidate_name}} (Score {{score}})",
                "body": (
                    "Hi {{recruiter_name}},\n\n"
                    "I wanted to reach out immediately about {{candidate_name}}, one of our top-ranked candidates "
                    "with an AI match score of {{score}}/100 — placing them in our elite High Match tier.\n\n"
                    "Here's what makes them stand out:\n"
                    "• Skills: {{skills}}\n"
                    "• Experience: {{experience}} of hands-on industry experience\n"
                    "• AI Assessment: {{quality}}-quality profile\n\n"
                    "Candidates at this score level are in high demand and typically receive multiple offers within "
                    "1–2 weeks of being listed. I'd strongly recommend connecting as soon as possible.\n\n"
                    "Would a quick 15-minute call work for you today or tomorrow? I can share their full profile "
                    "and answer any questions you have.\n\n"
                    "Best regards,\n"
                    "RecruitAI Talent Team"
                ),
            },
            {
                "tier": "medium",
                "label": "Medium Match (50–74 pts)",
                "tone": "professional",
                "subject": "Qualified Candidate Profile — {{candidate_name}} | AI Score {{score}}",
                "body": (
                    "Hi {{recruiter_name}},\n\n"
                    "I hope you're doing well. I'm reaching out to share a solid candidate profile that may be "
                    "a strong fit for {{company}}.\n\n"
                    "Candidate: {{candidate_name}}\n"
                    "AI Match Score: {{score}}/100 (Medium Match)\n"
                    "Key Skills: {{skills}}\n"
                    "Experience: {{experience}}\n\n"
                    "{{candidate_name}} brings a well-rounded background and has been thoroughly pre-screened by "
                    "our AI system. While there may be some areas for further assessment, their core profile aligns "
                    "well with typical requirements we see in your sector.\n\n"
                    "I'd be happy to share their complete resume and scoring breakdown if you'd like to review. "
                    "Please let me know if this profile is of interest or if you'd prefer a different skill set.\n\n"
                    "Best regards,\n"
                    "RecruitAI Talent Team"
                ),
            },
            {
                "tier": "low",
                "label": "Low Match (<50 pts)",
                "tone": "exploratory",
                "subject": "Available Candidate — {{candidate_name}} | For Your Review",
                "body": (
                    "Hi {{recruiter_name}},\n\n"
                    "Quick note to share a candidate who may be worth a look depending on your current openings.\n\n"
                    "{{candidate_name}} has a background in {{skills}} with {{experience}} of experience. "
                    "Their AI match score is {{score}}/100, which suggests they may be at an earlier career stage "
                    "or exploring a new direction.\n\n"
                    "This profile could be a good fit for junior roles, apprenticeships, or positions where "
                    "potential and growth are valued over immediate expertise.\n\n"
                    "Let me know if you'd like their full profile or if I can help match you with higher-scoring "
                    "candidates.\n\n"
                    "Best,\n"
                    "RecruitAI Talent Team"
                ),
            },
        ]

        for tt in tier_templates_data:
            db.add(TierTemplateModel(**tt))

        db.commit()
        print("✅ Database seeded with demo data")
        print("📧 Login: admin@recruiteai.com | Password: admin123")

    except Exception as e:
        db.rollback()
        print(f"Seed error: {e}")
    finally:
        db.close()


@app.on_event("startup")
def startup_event():
    seed_database()


@app.get("/health")
def health():
    return {"status": "ok", "service": "RecruitAI API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
