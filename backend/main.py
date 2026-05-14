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

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY environment variable is not set. "
        "Generate one with: python3 -c \"import secrets; print(secrets.token_hex(32))\" "
        "and set it as a Replit Secret or environment variable."
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days
REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30  # 30 days

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
    published = Column(Boolean, default=False)
    company_id = Column(String, nullable=True)
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
    company_id = Column(String, ForeignKey("companies.id"), nullable=True)
    value = Column(Float, default=0)
    status = Column(String, default="pending")
    stage = Column(String, default="Discovery")
    counter_offer_value = Column(Float, nullable=True)
    negotiation_log = Column(JSON, default=list)
    offer_letter_url = Column(String, default="")
    offer_letter_body = Column(Text, default="")
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


# ─── New Models ───────────────────────────────────────────────────────────────

class OrganizationModel(Base):
    """Multi-tenancy: every user/job/lead belongs to an org."""
    __tablename__ = "organizations"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False, index=True)
    plan = Column(String, default="free")          # free | pro | enterprise
    ai_calls_used = Column(Integer, default=0)     # rolling monthly counter
    ai_calls_limit = Column(Integer, default=50)   # free=50, pro=1000, enterprise=unlimited(-1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class InterviewSlotModel(Base):
    """Interview scheduling."""
    __tablename__ = "interview_slots"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    lead_id = Column(String, ForeignKey("leads.id"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=True)
    interviewer_name = Column(String, default="")
    interviewer_email = Column(String, default="")
    scheduled_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=45)
    status = Column(String, default="scheduled")  # scheduled | confirmed | cancelled | completed
    notes = Column(Text, default="")
    meeting_link = Column(String, default="")
    ai_suggested = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class EmailLogModel(Base):
    """Audit log for every sent email."""
    __tablename__ = "email_logs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    to_email = Column(String, nullable=False)
    to_name = Column(String, default="")
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    template_id = Column(String, nullable=True)
    lead_id = Column(String, nullable=True)
    sent_by_id = Column(String, nullable=True)
    status = Column(String, default="sent")       # sent | failed | bounced
    error_message = Column(Text, default="")
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AiUsageLogModel(Base):
    """Per-user AI call log for rate-limiting and billing."""
    __tablename__ = "ai_usage_logs"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    endpoint = Column(String, nullable=False)
    tokens_used = Column(Integer, default=0)
    cost_usd = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ─── Phase 3: Company CRM ──────────────────────────────────────────────────────

class CompanyModel(Base):
    """Client companies approached via LinkedIn / cold outreach."""
    __tablename__ = "companies"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_name = Column(String, nullable=False)
    contact_person = Column(String, default="")
    email = Column(String, default="")
    phone = Column(String, default="")
    linkedin_url = Column(String, default="")
    website = Column(String, default="")
    industry = Column(String, default="")
    company_size = Column(String, default="")
    location = Column(String, default="")
    pipeline_stage = Column(String, default="prospecting")  # prospecting | contacted | permission_granted | active_partner | inactive
    status = Column(String, default="active")               # active | inactive | blacklisted
    notes = Column(Text, default="")
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ─── Phase 2: Follow-Up Sequences ──────────────────────────────────────────────

class FollowUpSequenceModel(Base):
    """Named follow-up sequence (e.g., Recruiter-7-day, Candidate-3-touch)."""
    __tablename__ = "followup_sequences"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    sequence_type = Column(String, default="recruiter")  # recruiter | candidate | payment | deal
    enabled = Column(Boolean, default=True)
    description = Column(Text, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class FollowUpStepModel(Base):
    """One step inside a follow-up sequence."""
    __tablename__ = "followup_steps"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sequence_id = Column(String, ForeignKey("followup_sequences.id", ondelete="CASCADE"), nullable=False)
    day = Column(Integer, default=0)                     # Day offset from trigger
    channel = Column(String, default="email")            # email | whatsapp
    subject = Column(String, default="")
    message = Column(Text, default="")
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ─── Phase 2: Proposals ────────────────────────────────────────────────────────

class ProposalModel(Base):
    """Partnership proposals sent to companies / recruiters."""
    __tablename__ = "proposals"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, default="Partnership Proposal")
    company_id = Column(String, ForeignKey("companies.id"), nullable=True)
    recruiter_id = Column(String, ForeignKey("recruiters.id"), nullable=True)
    status = Column(String, default="draft")    # draft | sent | viewed | accepted | rejected
    amount = Column(Float, default=0)
    currency = Column(String, default="INR")
    notes = Column(Text, default="")
    sent_at = Column(DateTime, nullable=True)
    viewed_at = Column(DateTime, nullable=True)
    accepted_at = Column(DateTime, nullable=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ─── Phase 5: AI Personas & Email Campaigns ────────────────────────────────────

class AiPersonaModel(Base):
    """AI sender personas for email outreach."""
    __tablename__ = "ai_personas"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    role = Column(String, default="Recruitment Consultant")
    tone = Column(String, default="professional")        # professional | friendly | urgent
    signature = Column(Text, default="")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class EmailCampaignModel(Base):
    """Bulk email campaign targeting candidates by score/stage."""
    __tablename__ = "email_campaigns"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    persona_id = Column(String, ForeignKey("ai_personas.id"), nullable=True)
    filter_stage = Column(String, nullable=True)         # Pipeline stage filter
    filter_score_min = Column(Integer, default=0)
    filter_score_max = Column(Integer, default=100)
    status = Column(String, default="draft")             # draft | scheduled | running | completed
    total_recipients = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    scheduled_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class CampaignLeadModel(Base):
    """Per-lead status inside a campaign."""
    __tablename__ = "campaign_leads"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    campaign_id = Column(String, ForeignKey("email_campaigns.id", ondelete="CASCADE"), nullable=False)
    lead_id = Column(String, ForeignKey("leads.id"), nullable=False)
    status = Column(String, default="pending")           # pending | sent | failed | opened | clicked
    sent_at = Column(DateTime, nullable=True)
    error_msg = Column(Text, default="")


# ─── Phase 6: Team Chat ────────────────────────────────────────────────────────

class ChatMessageModel(Base):
    """Internal team chat messages."""
    __tablename__ = "chat_messages"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    sender_name = Column(String, default="")
    sender_email = Column(String, default="")
    message = Column(Text, nullable=False)
    channel = Column(String, default="general")          # general | announcements | deals | etc
    reply_to = Column(String, nullable=True)             # parent message id
    read_by = Column(JSON, default=list)                 # list of user IDs
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ─── Phase 7: Deals Extended (offer letter, negotiation) ───────────────────────

class ScheduledTaskModel(Base):
    """APScheduler-style persisted follow-up tasks."""
    __tablename__ = "scheduled_tasks"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    task_type = Column(String, nullable=False)           # follow_up_email | deal_reminder | etc
    entity_type = Column(String, default="")             # deal | company | lead
    entity_id = Column(String, default="")
    payload = Column(JSON, default=dict)
    run_at = Column(DateTime, nullable=False)
    status = Column(String, default="pending")           # pending | running | done | failed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ran_at = Column(DateTime, nullable=True)
    error = Column(Text, default="")


# ─── Phase 8: Social Media ─────────────────────────────────────────────────────

class SocialPostModel(Base):
    """AI-generated social media posts (generate only, no external posting)."""
    __tablename__ = "social_posts"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    platform = Column(String, nullable=False)            # linkedin | twitter | facebook | instagram
    content = Column(Text, nullable=False)
    hashtags = Column(JSON, default=list)
    tone = Column(String, default="professional")
    related_job_id = Column(String, nullable=True)
    status = Column(String, default="draft")             # draft | scheduled | published
    scheduled_at = Column(DateTime, nullable=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


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

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5000")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
_replit_domain = os.getenv("REPLIT_DEV_DOMAIN", "")
if _replit_domain:
    _allowed_origins.append(f"https://{_replit_domain}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
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


@app.post("/api/auth/refresh")
def refresh_token(
    current_user: UserModel = Depends(get_current_user),
):
    """Issue a fresh access token for an authenticated user."""
    new_token = create_token(current_user.id, current_user.email, current_user.role)
    return {
        "token": new_token,
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
        },
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


def _run_migrations():
    """Add columns to existing tables that SQLAlchemy create_all won't add."""
    import sqlite3
    conn = sqlite3.connect("./recruiteai.db")
    cur = conn.cursor()
    migrations = [
        ("jobs",  "published",            "INTEGER DEFAULT 0"),
        ("jobs",  "company_id",           "TEXT"),
        ("deals", "company_id",           "TEXT"),
        ("deals", "counter_offer_value",  "REAL"),
        ("deals", "negotiation_log",      "TEXT DEFAULT '[]'"),
        ("deals", "offer_letter_url",     "TEXT DEFAULT ''"),
        ("deals", "offer_letter_body",    "TEXT DEFAULT ''"),
    ]
    cur.execute("PRAGMA table_info(jobs)")
    existing_jobs = {row[1] for row in cur.fetchall()}
    cur.execute("PRAGMA table_info(deals)")
    existing_deals = {row[1] for row in cur.fetchall()}
    existing = {"jobs": existing_jobs, "deals": existing_deals}
    for table, col, col_def in migrations:
        if col not in existing.get(table, set()):
            try:
                cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}")
                logging.info(f"Migration: added {table}.{col}")
            except Exception as e:
                logging.warning(f"Migration skip {table}.{col}: {e}")
    conn.commit()
    conn.close()


@app.on_event("startup")
def startup_event():
    _run_migrations()
    seed_database()
    _seed_org()
    _seed_phase2_data()


def _seed_org():
    """Ensure a default org exists for the demo account."""
    db = SessionLocal()
    try:
        if db.query(OrganizationModel).count() == 0:
            org = OrganizationModel(
                id=str(uuid.uuid4()),
                name="RecruitAI Demo",
                slug="recruiteai-demo",
                plan="pro",
                ai_calls_limit=1000,
            )
            db.add(org)
            db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


@app.get("/health")
def health():
    """Health check."""
    return {"status": "ok", "service": "RecruitAI API", "version": "2.0.0"}


# ════════════════════════════════════════════════════════════════════════════════
# T001 — Job Description Generator
# ════════════════════════════════════════════════════════════════════════════════

class JobDescGeneratorRequest(BaseModel):
    description: str                   # plain-English role description
    company: str = "Our Company"
    location: str = "Remote"
    save_as_job: bool = False          # if True, persist to jobs table


class JobDescGeneratorResponse(BaseModel):
    title: str
    summary: str
    responsibilities: List[str]
    required_skills: List[str]
    preferred_skills: List[str]
    experience_min: int
    education: str
    salary_range: str
    full_description: str
    ai_powered: bool
    job_id: Optional[str] = None


@app.post("/api/ai/job-description-generator", response_model=JobDescGeneratorResponse)
def generate_job_description(
    req: JobDescGeneratorRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Generate a polished job posting from a plain-English description.
    Uses Gemini when available, falls back to a structured template.
    """
    if not req.description.strip():
        raise HTTPException(status_code=400, detail="Description is required")

    # ── Gemini path ───────────────────────────────────────────────────────────
    if gemini.is_available():
        try:
            prompt = f"""You are an expert HR writer. Generate a complete, professional job posting from the recruiter's description below.

Recruiter's input: "{req.description}"
Company: {req.company}
Location: {req.location}

Return ONLY valid JSON with exactly these keys:
{{
  "title": "Job Title",
  "summary": "2-sentence company/role overview",
  "responsibilities": ["responsibility 1", "responsibility 2", ...],
  "required_skills": ["Skill1", "Skill2", ...],
  "preferred_skills": ["Skill1", ...],
  "experience_min": <integer years>,
  "education": "Bachelor's degree in Computer Science or equivalent",
  "salary_range": "e.g. ₹15L–₹25L / $80k–$120k",
  "full_description": "Complete multi-paragraph job description text (400-600 words)"
}}

Rules:
- responsibilities: 5-7 bullet points
- required_skills: 5-8 real technical/professional skills
- preferred_skills: 3-5 bonus skills
- full_description: formal tone, structured with Overview / Responsibilities / Requirements / What We Offer sections
- salary_range: infer from role seniority and location if not mentioned"""

            parsed = gemini.generate_json(prompt)
            result = JobDescGeneratorResponse(
                title=parsed.get("title", "Software Engineer"),
                summary=parsed.get("summary", ""),
                responsibilities=parsed.get("responsibilities", []),
                required_skills=parsed.get("required_skills", []),
                preferred_skills=parsed.get("preferred_skills", []),
                experience_min=int(parsed.get("experience_min", 2)),
                education=parsed.get("education", "Bachelor's degree or equivalent"),
                salary_range=parsed.get("salary_range", "Negotiable"),
                full_description=parsed.get("full_description", ""),
                ai_powered=True,
            )
        except Exception as e:
            logging.warning(f"Gemini job-desc-gen failed: {e}")
            result = _fallback_job_desc(req)
    else:
        result = _fallback_job_desc(req)

    # ── Optionally save to jobs table ────────────────────────────────────────
    if req.save_as_job:
        job = JobModel(
            id=str(uuid.uuid4()),
            title=result.title,
            company=req.company,
            location=req.location,
            description=result.full_description,
            skills=result.required_skills,
            experience_min=result.experience_min,
            status="active",
            source="ai-generated",
        )
        db.add(job)
        db.commit()
        result.job_id = job.id

    return result


def _fallback_job_desc(req: JobDescGeneratorRequest) -> JobDescGeneratorResponse:
    """Keyword-based fallback when Gemini is unavailable."""
    desc_lower = req.description.lower()
    skills = extract_skills(req.description)
    exp = extract_experience(req.description)

    # Guess title
    title = "Software Engineer"
    for kw, t in [
        ("react", "Frontend Engineer"), ("python", "Python Developer"),
        ("data science", "Data Scientist"), ("ml", "ML Engineer"),
        ("devops", "DevOps Engineer"), ("fullstack", "Full Stack Developer"),
        ("backend", "Backend Developer"), ("frontend", "Frontend Developer"),
        ("manager", "Engineering Manager"), ("product", "Product Manager"),
    ]:
        if kw in desc_lower:
            title = t
            break

    return JobDescGeneratorResponse(
        title=title,
        summary=f"We are looking for a talented {title} to join our team at {req.company}.",
        responsibilities=[
            f"Build and maintain {title.lower()} solutions",
            "Collaborate with cross-functional teams",
            "Participate in code reviews and technical planning",
            "Write clean, testable, and well-documented code",
            "Contribute to system design and architecture decisions",
        ],
        required_skills=skills[:8] if skills else ["Communication", "Problem Solving"],
        preferred_skills=skills[8:12] if len(skills) > 8 else [],
        experience_min=max(exp, 1),
        education="Bachelor's degree in Computer Science or equivalent",
        salary_range="Negotiable",
        full_description=(
            f"## {title}\n\n"
            f"**Company:** {req.company} | **Location:** {req.location}\n\n"
            f"### Overview\n{req.description}\n\n"
            f"### Responsibilities\n" +
            "\n".join(f"- {r}" for r in [
                "Design, develop, and maintain high-quality software",
                "Collaborate with product and design teams",
                "Participate in Agile ceremonies (standups, sprints, retrospectives)",
                "Write unit and integration tests",
                "Contribute to technical documentation",
            ]) +
            f"\n\n### Requirements\n- {exp}+ years of relevant experience\n" +
            "\n".join(f"- {s}" for s in (skills[:6] if skills else ["Strong communication skills"])) +
            "\n\n### What We Offer\n- Competitive salary and equity\n- Remote-friendly work environment\n- Growth opportunities"
        ),
        ai_powered=False,
    )


# ════════════════════════════════════════════════════════════════════════════════
# T003 — Organizations & RBAC
# ════════════════════════════════════════════════════════════════════════════════

ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "admin":           ["*"],
    "recruiter":       ["leads:read", "leads:write", "jobs:read", "pipeline:write", "interviews:write"],
    "hiring_manager":  ["leads:read", "jobs:read", "pipeline:read", "interviews:read"],
    "candidate":       [],
}


def require_role(*roles: str):
    """Dependency that checks the current user has one of the given roles."""
    def _check(current_user: UserModel = Depends(get_current_user)):
        if current_user.role not in roles and current_user.role != "admin":
            raise HTTPException(
                status_code=403,
                detail=f"Role '{current_user.role}' is not permitted. Required: {list(roles)}"
            )
        return current_user
    return _check


class OrgUpdateRequest(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None


@app.get("/api/org")
def get_org(
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user),
):
    """Return the default org (single-org mode for now)."""
    org = db.query(OrganizationModel).first()
    if not org:
        raise HTTPException(status_code=404, detail="No organisation found")
    return {
        "id": org.id,
        "name": org.name,
        "slug": org.slug,
        "plan": org.plan,
        "ai_calls_used": org.ai_calls_used,
        "ai_calls_limit": org.ai_calls_limit,
        "ai_calls_remaining": max(0, org.ai_calls_limit - org.ai_calls_used) if org.ai_calls_limit >= 0 else -1,
        "created_at": org.created_at.isoformat() if org.created_at else None,
    }


@app.patch("/api/org")
def update_org(
    data: OrgUpdateRequest,
    db: Session = Depends(get_db),
    _: UserModel = Depends(require_role("admin")),
):
    """Update org name or plan (admin only)."""
    org = db.query(OrganizationModel).first()
    if not org:
        raise HTTPException(status_code=404, detail="No organisation found")
    if data.name:
        org.name = data.name
    if data.plan:
        limits = {"free": 50, "pro": 1000, "enterprise": -1}
        org.plan = data.plan
        org.ai_calls_limit = limits.get(data.plan, 50)
    db.commit()
    db.refresh(org)
    return {"id": org.id, "name": org.name, "plan": org.plan, "ai_calls_limit": org.ai_calls_limit}


@app.get("/api/org/users")
def list_org_users(
    db: Session = Depends(get_db),
    _: UserModel = Depends(require_role("admin")),
):
    """List all users (admin only)."""
    users = db.query(UserModel).all()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role,
             "created_at": u.created_at.isoformat() if u.created_at else None} for u in users]


class RoleUpdateRequest(BaseModel):
    role: str


@app.patch("/api/org/users/{user_id}/role")
def update_user_role(
    user_id: str,
    data: RoleUpdateRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_role("admin")),
):
    """Change a user's role (admin only)."""
    if data.role not in ROLE_PERMISSIONS:
        raise HTTPException(status_code=400, detail=f"Invalid role. Valid: {list(ROLE_PERMISSIONS.keys())}")
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    user.role = data.role
    db.commit()
    return {"id": user.id, "email": user.email, "role": user.role}


# ════════════════════════════════════════════════════════════════════════════════
# T004 — Subscription / AI Usage Limits
# ════════════════════════════════════════════════════════════════════════════════

def _log_ai_usage(db: Session, user_id: str, endpoint: str, tokens: int = 0):
    """Record one AI call and increment org counter."""
    db.add(AiUsageLogModel(
        user_id=user_id,
        endpoint=endpoint,
        tokens_used=tokens,
    ))
    org = db.query(OrganizationModel).first()
    if org:
        org.ai_calls_used = (org.ai_calls_used or 0) + 1
    db.commit()


def _check_ai_quota(db: Session):
    """Raise 429 if the org has exhausted its AI quota."""
    org = db.query(OrganizationModel).first()
    if org and org.ai_calls_limit >= 0 and org.ai_calls_used >= org.ai_calls_limit:
        raise HTTPException(
            status_code=429,
            detail=f"AI quota exhausted ({org.ai_calls_used}/{org.ai_calls_limit}). Upgrade plan to continue."
        )


@app.get("/api/subscription")
def get_subscription(
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user),
):
    """Return current plan and AI usage stats."""
    org = db.query(OrganizationModel).first()
    usage_logs = db.query(AiUsageLogModel).order_by(AiUsageLogModel.created_at.desc()).limit(20).all()
    return {
        "plan": org.plan if org else "free",
        "ai_calls_used": org.ai_calls_used if org else 0,
        "ai_calls_limit": org.ai_calls_limit if org else 50,
        "ai_calls_remaining": (
            max(0, org.ai_calls_limit - org.ai_calls_used)
            if org and org.ai_calls_limit >= 0 else -1
        ),
        "recent_usage": [
            {"endpoint": u.endpoint, "tokens": u.tokens_used,
             "at": u.created_at.isoformat() if u.created_at else None}
            for u in usage_logs
        ],
    }


@app.post("/api/subscription/upgrade")
def upgrade_plan(
    db: Session = Depends(get_db),
    _: UserModel = Depends(require_role("admin")),
):
    """Demo endpoint — upgrades plan to 'pro' instantly (no payment in demo)."""
    org = db.query(OrganizationModel).first()
    if not org:
        raise HTTPException(status_code=404, detail="No org found")
    org.plan = "pro"
    org.ai_calls_limit = 1000
    db.commit()
    return {"plan": org.plan, "ai_calls_limit": org.ai_calls_limit, "message": "Upgraded to Pro"}


# ════════════════════════════════════════════════════════════════════════════════
# T005 — Email Automation (structured send + log)
# ════════════════════════════════════════════════════════════════════════════════

class SendEmailRequest(BaseModel):
    to_email: str
    to_name: str = ""
    subject: str
    body: str
    template_id: Optional[str] = None
    lead_id: Optional[str] = None
    variables: Dict[str, str] = {}


def _render_template_vars(body: str, variables: Dict[str, str]) -> str:
    """Replace {{variable}} placeholders with a flat dict."""
    for k, v in variables.items():
        body = body.replace(f"{{{{{k}}}}}", v)
    return body


def _smtp_send(to_email: str, to_name: str, subject: str, body: str) -> dict:
    """
    Send a real email via Hostinger SMTP (noreply@overseasjob.in).
    Returns {"ok": True} or {"ok": False, "error": "..."}.
    """
    import smtplib
    import ssl
    from email.mime.multipart import MIMEMultipart
    from email.mime.text import MIMEText

    smtp_host = os.getenv("SMTP_HOST", "smtp.hostinger.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USERNAME", "noreply@overseasjob.in")
    smtp_pass = os.getenv("SMTP_PASSWORD", "")
    from_name = os.getenv("SMTP_FROM_NAME", "OverseasJob.in")

    if not smtp_pass:
        return {"ok": False, "error": "SMTP_PASSWORD not configured"}

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"{from_name} <{smtp_user}>"
    msg["To"]      = f"{to_name} <{to_email}>" if to_name else to_email
    msg["Reply-To"] = smtp_user

    # Plain-text fallback + HTML version
    plain = body
    html  = f"""<html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:auto">
<p>{body.replace(chr(10), '<br>')}</p>
<hr style="margin-top:30px;border:none;border-top:1px solid #eee"/>
<p style="font-size:12px;color:#999">OverseasJob.in · noreply@overseasjob.in</p>
</body></html>"""
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        ctx = ssl.create_default_context()
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as srv:
            srv.ehlo()
            srv.starttls(context=ctx)
            srv.login(smtp_user, smtp_pass)
            srv.sendmail(smtp_user, [to_email], msg.as_string())
        logging.info(f"[EMAIL-SMTP] Sent → {to_email} | {subject}")
        return {"ok": True}
    except Exception as e:
        logging.error(f"[EMAIL-SMTP] Failed → {to_email}: {e}")
        return {"ok": False, "error": str(e)}


@app.post("/api/email/send")
def send_email(
    req: SendEmailRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Send a real email via Hostinger SMTP and log it to DB."""
    subject = _render_template_vars(req.subject, req.variables)
    body    = _render_template_vars(req.body, req.variables)

    result = _smtp_send(req.to_email, req.to_name or "", subject, body)
    email_status = "sent" if result["ok"] else "failed"

    log = EmailLogModel(
        to_email=req.to_email,
        to_name=req.to_name,
        subject=subject,
        body=body,
        template_id=req.template_id,
        lead_id=req.lead_id,
        sent_by_id=current_user.id,
        status=email_status,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return {
        "id": log.id,
        "status": email_status,
        "to": req.to_email,
        "subject": subject,
        "sent_at": log.sent_at.isoformat() if log.sent_at else None,
        "smtp_ok": result["ok"],
        "error": result.get("error"),
    }


@app.post("/api/email/send-template/{template_id}")
def send_template_email(
    template_id: str,
    req: SendEmailRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Send a stored template filled with variables."""
    tpl = db.query(TemplateModel).filter(TemplateModel.id == template_id).first()
    if not tpl:
        raise HTTPException(status_code=404, detail="Template not found")
    req.subject = req.subject or tpl.subject
    req.body = tpl.body
    req.template_id = template_id
    return send_email(req, db, current_user)


@app.get("/api/email/logs")
def get_email_logs(
    lead_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user),
):
    """Return email send history, optionally filtered by candidate."""
    q = db.query(EmailLogModel).order_by(EmailLogModel.sent_at.desc())
    if lead_id:
        q = q.filter(EmailLogModel.lead_id == lead_id)
    logs = q.limit(limit).all()
    return [
        {
            "id": l.id, "to_email": l.to_email, "to_name": l.to_name,
            "subject": l.subject, "status": l.status,
            "lead_id": l.lead_id, "template_id": l.template_id,
            "sent_at": l.sent_at.isoformat() if l.sent_at else None,
        }
        for l in logs
    ]


@app.get("/api/email/stats")
def get_email_stats(
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user),
):
    """Aggregate email send stats."""
    total = db.query(EmailLogModel).count()
    sent = db.query(EmailLogModel).filter(EmailLogModel.status == "sent").count()
    failed = db.query(EmailLogModel).filter(EmailLogModel.status == "failed").count()
    return {"total": total, "sent": sent, "failed": failed}


# ════════════════════════════════════════════════════════════════════════════════
# T006 — Interview Scheduler
# ════════════════════════════════════════════════════════════════════════════════

def _interview_to_dict(s: InterviewSlotModel) -> Dict:
    return {
        "id": s.id,
        "lead_id": s.lead_id,
        "job_id": s.job_id,
        "interviewer_name": s.interviewer_name,
        "interviewer_email": s.interviewer_email,
        "scheduled_at": s.scheduled_at.isoformat() if s.scheduled_at else None,
        "duration_minutes": s.duration_minutes,
        "status": s.status,
        "notes": s.notes,
        "meeting_link": s.meeting_link,
        "ai_suggested": s.ai_suggested,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }


class CreateInterviewRequest(BaseModel):
    lead_id: str
    job_id: Optional[str] = None
    interviewer_name: str = ""
    interviewer_email: str = ""
    scheduled_at: Optional[str] = None    # ISO datetime string
    duration_minutes: int = 45
    notes: str = ""
    meeting_link: str = ""


class UpdateInterviewRequest(BaseModel):
    status: Optional[str] = None
    scheduled_at: Optional[str] = None
    interviewer_name: Optional[str] = None
    interviewer_email: Optional[str] = None
    notes: Optional[str] = None
    meeting_link: Optional[str] = None
    duration_minutes: Optional[int] = None


@app.get("/api/interviews")
def list_interviews(
    lead_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user),
):
    """List all interviews, optionally filtered by candidate or status."""
    q = db.query(InterviewSlotModel).order_by(InterviewSlotModel.scheduled_at.asc())
    if lead_id:
        q = q.filter(InterviewSlotModel.lead_id == lead_id)
    if status:
        q = q.filter(InterviewSlotModel.status == status)
    return [_interview_to_dict(s) for s in q.limit(limit).all()]


@app.post("/api/interviews")
def create_interview(
    req: CreateInterviewRequest,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user),
):
    """Schedule a new interview slot."""
    lead = db.query(LeadModel).filter(LeadModel.id == req.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Candidate not found")

    scheduled_dt = None
    if req.scheduled_at:
        try:
            scheduled_dt = datetime.fromisoformat(req.scheduled_at.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid scheduled_at format. Use ISO 8601.")

    slot = InterviewSlotModel(
        lead_id=req.lead_id,
        job_id=req.job_id,
        interviewer_name=req.interviewer_name,
        interviewer_email=req.interviewer_email,
        scheduled_at=scheduled_dt,
        duration_minutes=req.duration_minutes,
        notes=req.notes,
        meeting_link=req.meeting_link,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return _interview_to_dict(slot)


@app.patch("/api/interviews/{interview_id}")
def update_interview(
    interview_id: str,
    req: UpdateInterviewRequest,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user),
):
    slot = db.query(InterviewSlotModel).filter(InterviewSlotModel.id == interview_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Interview not found")
    if req.status:
        valid_statuses = ["scheduled", "confirmed", "cancelled", "completed"]
        if req.status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Valid: {valid_statuses}")
        slot.status = req.status
    if req.scheduled_at is not None:
        try:
            slot.scheduled_at = datetime.fromisoformat(req.scheduled_at.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid scheduled_at format")
    for field in ["interviewer_name", "interviewer_email", "notes", "meeting_link", "duration_minutes"]:
        val = getattr(req, field)
        if val is not None:
            setattr(slot, field, val)
    db.commit()
    db.refresh(slot)
    return _interview_to_dict(slot)


@app.delete("/api/interviews/{interview_id}")
def delete_interview(
    interview_id: str,
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user),
):
    slot = db.query(InterviewSlotModel).filter(InterviewSlotModel.id == interview_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Interview not found")
    db.delete(slot)
    db.commit()
    return {"deleted": True}


@app.post("/api/interviews/ai-suggest")
def ai_suggest_slots(
    lead_id: str,
    job_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Use Gemini to suggest 3 interview time slots (+ tips) for a candidate.
    Falls back to generic slots if Gemini is unavailable.
    """
    lead = db.query(LeadModel).filter(LeadModel.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Candidate not found")

    job = db.query(JobModel).filter(JobModel.id == job_id).first() if job_id else None

    if gemini.is_available():
        try:
            _check_ai_quota(db)
            now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
            prompt = f"""You are an expert interview scheduler. Suggest 3 interview slots for a candidate.

Candidate: {lead.name} | Skills: {', '.join(lead.skills or [])} | Experience: {lead.experience}y | Score: {lead.score}/100
Role: {job.title if job else 'General Interview'}
Current time: {now_iso}

Return ONLY valid JSON:
{{
  "slots": [
    {{
      "label": "e.g. Tuesday Morning",
      "scheduled_at": "ISO 8601 datetime, within next 7 business days",
      "duration_minutes": 45,
      "interviewer_tip": "1 sentence tip for the interviewer"
    }}
  ],
  "overall_tip": "1 sentence general advice for this candidate",
  "suggested_format": "Technical | Behavioral | Culture Fit | Panel"
}}"""
            parsed = gemini.generate_json(prompt)
            _log_ai_usage(db, current_user.id, "interviews/ai-suggest")
            return {"lead_id": lead_id, "ai_powered": True, **parsed}
        except HTTPException:
            raise
        except Exception as e:
            logging.warning(f"Gemini interview suggest failed: {e}")

    # Fallback
    base = datetime.now(timezone.utc)
    return {
        "lead_id": lead_id,
        "ai_powered": False,
        "slots": [
            {"label": "Monday Morning", "scheduled_at": (base + timedelta(days=1, hours=10)).isoformat(),
             "duration_minutes": 45, "interviewer_tip": "Start with a technical screen."},
            {"label": "Wednesday Afternoon", "scheduled_at": (base + timedelta(days=3, hours=14)).isoformat(),
             "duration_minutes": 60, "interviewer_tip": "Deep dive into past projects."},
            {"label": "Friday Morning", "scheduled_at": (base + timedelta(days=5, hours=11)).isoformat(),
             "duration_minutes": 30, "interviewer_tip": "Culture fit and team intro."},
        ],
        "overall_tip": "Review candidate's resume before the interview.",
        "suggested_format": "Technical",
    }


@app.get("/api/interviews/stats")
def interview_stats(
    db: Session = Depends(get_db),
    _: UserModel = Depends(get_current_user),
):
    total = db.query(InterviewSlotModel).count()
    scheduled = db.query(InterviewSlotModel).filter(InterviewSlotModel.status == "scheduled").count()
    confirmed = db.query(InterviewSlotModel).filter(InterviewSlotModel.status == "confirmed").count()
    completed = db.query(InterviewSlotModel).filter(InterviewSlotModel.status == "completed").count()
    cancelled = db.query(InterviewSlotModel).filter(InterviewSlotModel.status == "cancelled").count()
    return {
        "total": total, "scheduled": scheduled, "confirmed": confirmed,
        "completed": completed, "cancelled": cancelled,
    }


# ════════════════════════════════════════════════════════════════════════════════
# T002 — Security: CORS tightening already done above; add input validation helpers
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/admin/roles")
def list_roles(_: UserModel = Depends(require_role("admin"))):
    """Return available roles and their permissions."""
    return {"roles": ROLE_PERMISSIONS}


def _seed_phase2_data():
    """Seed Phase 2-8 demo data: companies, personas, follow-up sequences, proposals, social posts."""
    db = SessionLocal()
    try:
        # ── Companies ──────────────────────────────────────────────────────────
        if db.query(CompanyModel).count() == 0:
            companies = [
                CompanyModel(id=str(uuid.uuid4()), company_name="TechSphere India", contact_person="Rajiv Mehta",
                    email="rajiv@techsphere.in", phone="+91-9876543210", industry="IT Services",
                    company_size="200-500", location="Bangalore", pipeline_stage="active_partner", tags=["tech","premium"]),
                CompanyModel(id=str(uuid.uuid4()), company_name="GlobalHire Ltd", contact_person="Sarah Connor",
                    email="sarah@globalhire.com", phone="+44-7700900123", industry="Staffing & Recruitment",
                    company_size="50-200", location="London", pipeline_stage="permission_granted", tags=["uk","staffing"]),
                CompanyModel(id=str(uuid.uuid4()), company_name="NovaTech Solutions", contact_person="Arjun Sharma",
                    email="arjun@novatech.io", phone="+91-9988776655", industry="SaaS",
                    company_size="20-50", location="Hyderabad", pipeline_stage="contacted", tags=["saas","startup"]),
                CompanyModel(id=str(uuid.uuid4()), company_name="MedCare Staffing", contact_person="Priya Nair",
                    email="priya@medcare.in", phone="+91-9111222333", industry="Healthcare",
                    company_size="500+", location="Mumbai", pipeline_stage="prospecting", tags=["healthcare"]),
                CompanyModel(id=str(uuid.uuid4()), company_name="BuildRight Corp", contact_person="David Lee",
                    email="david@buildright.ae", phone="+971-501234567", industry="Construction",
                    company_size="100-200", location="Dubai", pipeline_stage="active_partner", tags=["dubai","construction"]),
            ]
            db.add_all(companies)
            db.flush()

        # ── AI Personas ────────────────────────────────────────────────────────
        if db.query(AiPersonaModel).count() == 0:
            personas = [
                AiPersonaModel(id=str(uuid.uuid4()), name="Alex Recruitment", email="alex@recruiteai.com",
                    role="Senior Talent Partner", tone="professional",
                    signature="Best regards,\nAlex\nSenior Talent Partner | RecruitAI\n+91-98765-00001"),
                AiPersonaModel(id=str(uuid.uuid4()), name="Priya Talent", email="priya@recruiteai.com",
                    role="Recruitment Consultant", tone="friendly",
                    signature="Warm regards,\nPriya\nRecruitment Consultant | RecruitAI"),
                AiPersonaModel(id=str(uuid.uuid4()), name="Raj Sourcing", email="raj@recruiteai.com",
                    role="Executive Search Specialist", tone="urgent",
                    signature="Best,\nRaj\nExecutive Search | RecruitAI\nDirect: +91-98765-00003"),
            ]
            db.add_all(personas)
            db.flush()

        # ── Follow-up Sequences ────────────────────────────────────────────────
        if db.query(FollowUpSequenceModel).count() == 0:
            seqs = [
                FollowUpSequenceModel(id="seq-recruiter-7day", name="Recruiter 7-Day Warm-Up",
                    sequence_type="recruiter", enabled=True,
                    description="7-day drip sequence to onboard new recruiters"),
                FollowUpSequenceModel(id="seq-candidate-3touch", name="Candidate 3-Touch",
                    sequence_type="candidate", enabled=True,
                    description="3-email sequence to engage placed candidates post-interview"),
                FollowUpSequenceModel(id="seq-deal-reminder", name="Deal Closure Reminder",
                    sequence_type="deal", enabled=True,
                    description="Follow up on open deals until closed or dropped"),
            ]
            db.add_all(seqs)
            db.flush()
            steps = [
                FollowUpStepModel(id=str(uuid.uuid4()), sequence_id="seq-recruiter-7day", day=0, channel="email",
                    subject="Welcome to RecruitAI Network", message="Hi {{name}}, welcome aboard! ...", order_index=0),
                FollowUpStepModel(id=str(uuid.uuid4()), sequence_id="seq-recruiter-7day", day=3, channel="email",
                    subject="Quick check-in — any candidates for us?", message="Hi {{name}}, just following up ...", order_index=1),
                FollowUpStepModel(id=str(uuid.uuid4()), sequence_id="seq-recruiter-7day", day=7, channel="email",
                    subject="Special offer for active partners", message="Hi {{name}}, as a valued partner ...", order_index=2),
                FollowUpStepModel(id=str(uuid.uuid4()), sequence_id="seq-candidate-3touch", day=1, channel="email",
                    subject="Your application update", message="Hi {{name}}, great news ...", order_index=0),
                FollowUpStepModel(id=str(uuid.uuid4()), sequence_id="seq-candidate-3touch", day=4, channel="email",
                    subject="Interview prep resources", message="Hi {{name}}, we wanted to share ...", order_index=1),
            ]
            db.add_all(steps)
            db.flush()

        # ── Demo Proposals ─────────────────────────────────────────────────────
        if db.query(ProposalModel).count() == 0:
            uid = db.query(UserModel).first()
            proposals = [
                ProposalModel(id=str(uuid.uuid4()), title="Premium Talent Partnership — TechSphere India",
                    status="accepted", amount=150000, currency="INR",
                    notes="3-month exclusive talent supply agreement", created_by=uid.id if uid else None),
                ProposalModel(id=str(uuid.uuid4()), title="Executive Search Retainer — GlobalHire Ltd",
                    status="sent", amount=500000, currency="INR",
                    notes="Executive search for 5 C-suite positions", sent_at=datetime.now(timezone.utc)),
                ProposalModel(id=str(uuid.uuid4()), title="Bulk Staffing Proposal — MedCare Staffing",
                    status="draft", amount=300000, currency="INR",
                    notes="50 nursing staff for Q3 expansion"),
            ]
            db.add_all(proposals)
            db.flush()

        # ── Demo Social Posts ─────────────────────────────────────────────────
        if db.query(SocialPostModel).count() == 0:
            uid = db.query(UserModel).first()
            posts = [
                SocialPostModel(id=str(uuid.uuid4()), platform="linkedin", tone="professional",
                    content="🚀 We're hiring! Exciting senior developer roles are open at our partner companies across India and the Middle East. DM us your resume!",
                    hashtags=["#hiring","#techtalent","#recruiteai"], status="published", created_by=uid.id if uid else None),
                SocialPostModel(id=str(uuid.uuid4()), platform="twitter", tone="friendly",
                    content="📢 100+ positions filled this month! Our AI-powered talent matching is changing how companies hire. #RecruitAI",
                    hashtags=["#RecruitAI","#hiring","#AI"], status="scheduled", created_by=uid.id if uid else None),
            ]
            db.add_all(posts)
            db.flush()

        # ── Demo Chat Messages ────────────────────────────────────────────────
        if db.query(ChatMessageModel).count() == 0:
            uid = db.query(UserModel).first()
            msgs = [
                ChatMessageModel(id=str(uuid.uuid4()), sender_id=uid.id if uid else "system",
                    sender_name="Admin User", sender_email="admin@recruiteai.com",
                    message="Welcome to the RecruitAI team chat! 👋 Use this space for real-time coordination.",
                    channel="general", read_by=[]),
                ChatMessageModel(id=str(uuid.uuid4()), sender_id=uid.id if uid else "system",
                    sender_name="Admin User", sender_email="admin@recruiteai.com",
                    message="🎉 Big news: TechSphere partnership is now confirmed! 5 open roles to fill this week.",
                    channel="deals", read_by=[]),
            ]
            db.add_all(msgs)
            db.flush()

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Phase2 seed error: {e}")
    finally:
        db.close()


# ════════════════════════════════════════════════════════════════════════════════
# PHASE 2 — Analytics Endpoints
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/analytics/conversion")
def get_conversion_analytics(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Funnel analytics: leads → contacted → interviewing → offer → hired."""
    stages = ["screened", "contacted", "interviewing", "offer", "hired"]
    funnel = []
    for stage in stages:
        count = db.query(LeadModel).filter(LeadModel.pipeline_stage == stage).count()
        funnel.append({"stage": stage.capitalize(), "count": count})

    total_leads = db.query(LeadModel).count()
    hired = db.query(LeadModel).filter(LeadModel.pipeline_stage == "hired").count()
    conversion_rate = round((hired / total_leads * 100), 1) if total_leads > 0 else 0

    # Weekly trend (last 4 weeks)
    from datetime import timedelta
    now = datetime.now(timezone.utc)
    weekly_trend = []
    for i in range(4, 0, -1):
        week_start = now - timedelta(weeks=i)
        week_end = now - timedelta(weeks=i-1)
        leads_created = db.query(LeadModel).filter(
            LeadModel.created_at >= week_start,
            LeadModel.created_at < week_end
        ).count()
        weekly_trend.append({
            "week": f"W{5-i}",
            "leads": leads_created,
            "conversions": max(0, leads_created - (leads_created // 3)),
        })

    return {
        "funnel": funnel,
        "conversion_rate": conversion_rate,
        "total_leads": total_leads,
        "total_hired": hired,
        "weekly_trend": weekly_trend,
        "ai_powered": False,
    }


@app.get("/api/analytics/revenue")
def get_revenue_analytics(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Revenue analytics from payments table."""
    from datetime import timedelta
    payments = db.query(PaymentModel).all()
    total_revenue = sum(p.amount for p in payments if p.status == "paid")
    pending_revenue = sum(p.amount for p in payments if p.status == "pending")

    # Last 6 months
    now = datetime.now(timezone.utc)
    monthly = []
    for i in range(5, -1, -1):
        month_start = (now.replace(day=1) - timedelta(days=i*30)).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1)
        month_payments = [p for p in payments if p.status == "paid"
                         and p.paid_at and month_start <= p.paid_at.replace(tzinfo=timezone.utc) < month_end]
        label = month_start.strftime("%b")
        monthly.append({"month": label, "revenue": sum(p.amount for p in month_payments), "deals": len(month_payments)})

    return {
        "total_revenue": total_revenue,
        "pending_revenue": pending_revenue,
        "total_payments": len(payments),
        "paid_count": len([p for p in payments if p.status == "paid"]),
        "monthly_trend": monthly,
    }


# ════════════════════════════════════════════════════════════════════════════════
# PHASE 2 — Follow-Up Sequences
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/followup/sequences")
def list_sequences(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    seqs = db.query(FollowUpSequenceModel).order_by(FollowUpSequenceModel.created_at.desc()).all()
    result = []
    for s in seqs:
        steps = db.query(FollowUpStepModel).filter(FollowUpStepModel.sequence_id == s.id).order_by(FollowUpStepModel.order_index).all()
        result.append({
            "id": s.id, "name": s.name, "sequence_type": s.sequence_type,
            "enabled": s.enabled, "description": s.description,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "steps": [{"id": st.id, "day": st.day, "channel": st.channel,
                        "subject": st.subject, "message": st.message, "order_index": st.order_index} for st in steps],
        })
    return {"data": result, "total": len(result)}


class SequenceCreateRequest(BaseModel):
    name: str
    sequence_type: str = "recruiter"
    enabled: bool = True
    description: str = ""


@app.post("/api/followup/sequences", status_code=201)
def create_sequence(
    req: SequenceCreateRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    seq = FollowUpSequenceModel(id=str(uuid.uuid4()), **req.dict())
    db.add(seq)
    db.commit()
    db.refresh(seq)
    return {"id": seq.id, "name": seq.name, "sequence_type": seq.sequence_type,
            "enabled": seq.enabled, "steps": [], "created_at": seq.created_at.isoformat()}


@app.patch("/api/followup/sequences/{seq_id}")
def update_sequence(
    seq_id: str,
    req: SequenceCreateRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    seq = db.query(FollowUpSequenceModel).filter(FollowUpSequenceModel.id == seq_id).first()
    if not seq:
        raise HTTPException(status_code=404, detail="Sequence not found")
    for k, v in req.dict(exclude_unset=True).items():
        setattr(seq, k, v)
    db.commit()
    return {"success": True, "id": seq_id}


@app.delete("/api/followup/sequences/{seq_id}")
def delete_sequence(
    seq_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_role("admin")),
):
    seq = db.query(FollowUpSequenceModel).filter(FollowUpSequenceModel.id == seq_id).first()
    if not seq:
        raise HTTPException(status_code=404, detail="Sequence not found")
    db.query(FollowUpStepModel).filter(FollowUpStepModel.sequence_id == seq_id).delete()
    db.delete(seq)
    db.commit()
    return {"success": True}


class StepCreateRequest(BaseModel):
    day: int = 0
    channel: str = "email"
    subject: str = ""
    message: str = ""
    order_index: int = 0


@app.post("/api/followup/sequences/{seq_id}/steps", status_code=201)
def add_step(
    seq_id: str,
    req: StepCreateRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    step = FollowUpStepModel(id=str(uuid.uuid4()), sequence_id=seq_id, **req.dict())
    db.add(step)
    db.commit()
    db.refresh(step)
    return {"id": step.id, "day": step.day, "channel": step.channel, "subject": step.subject,
            "message": step.message, "order_index": step.order_index}


@app.delete("/api/followup/sequences/{seq_id}/steps/{step_id}")
def delete_step(
    seq_id: str, step_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    step = db.query(FollowUpStepModel).filter(FollowUpStepModel.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")
    db.delete(step)
    db.commit()
    return {"success": True}


# ════════════════════════════════════════════════════════════════════════════════
# PHASE 2 — Proposals
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/proposals")
def list_proposals(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    proposals = db.query(ProposalModel).order_by(ProposalModel.created_at.desc()).all()
    result = []
    for p in proposals:
        company_name = None
        if p.company_id:
            co = db.query(CompanyModel).filter(CompanyModel.id == p.company_id).first()
            company_name = co.company_name if co else None
        result.append({
            "id": p.id, "title": p.title, "status": p.status,
            "amount": p.amount, "currency": p.currency, "notes": p.notes,
            "company_id": p.company_id, "company_name": company_name,
            "recruiter_id": p.recruiter_id,
            "sent_at": p.sent_at.isoformat() if p.sent_at else None,
            "accepted_at": p.accepted_at.isoformat() if p.accepted_at else None,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        })
    return {"data": result, "total": len(result)}


class ProposalCreateRequest(BaseModel):
    title: str = "New Proposal"
    company_id: Optional[str] = None
    recruiter_id: Optional[str] = None
    status: str = "draft"
    amount: float = 0
    currency: str = "INR"
    notes: str = ""


@app.post("/api/proposals", status_code=201)
def create_proposal(
    req: ProposalCreateRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    proposal = ProposalModel(id=str(uuid.uuid4()), created_by=current_user.id, **req.dict())
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    return {"id": proposal.id, "title": proposal.title, "status": proposal.status, "amount": proposal.amount}


@app.patch("/api/proposals/{proposal_id}")
def update_proposal(
    proposal_id: str,
    req: ProposalCreateRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    p = db.query(ProposalModel).filter(ProposalModel.id == proposal_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Proposal not found")
    for k, v in req.dict(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    return {"success": True}


@app.post("/api/proposals/{proposal_id}/send")
def send_proposal(
    proposal_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    p = db.query(ProposalModel).filter(ProposalModel.id == proposal_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Proposal not found")
    p.status = "sent"
    p.sent_at = datetime.now(timezone.utc)
    db.commit()
    return {"success": True, "status": "sent"}


@app.delete("/api/proposals/{proposal_id}")
def delete_proposal(
    proposal_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    p = db.query(ProposalModel).filter(ProposalModel.id == proposal_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Proposal not found")
    db.delete(p)
    db.commit()
    return {"success": True}


# ════════════════════════════════════════════════════════════════════════════════
# PHASE 3 — Company CRM
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/companies")
def list_companies(
    q: Optional[str] = None,
    stage: Optional[str] = None,
    industry: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    query = db.query(CompanyModel)
    if q:
        query = query.filter(
            (CompanyModel.company_name.ilike(f"%{q}%")) |
            (CompanyModel.contact_person.ilike(f"%{q}%")) |
            (CompanyModel.email.ilike(f"%{q}%"))
        )
    if stage:
        query = query.filter(CompanyModel.pipeline_stage == stage)
    if industry:
        query = query.filter(CompanyModel.industry == industry)
    total = query.count()
    companies = query.order_by(CompanyModel.created_at.desc()).offset((page-1)*page_size).limit(page_size).all()
    return {
        "data": [
            {"id": c.id, "company_name": c.company_name, "contact_person": c.contact_person,
             "email": c.email, "phone": c.phone, "linkedin_url": c.linkedin_url, "website": c.website,
             "industry": c.industry, "company_size": c.company_size, "location": c.location,
             "pipeline_stage": c.pipeline_stage, "status": c.status, "notes": c.notes,
             "tags": c.tags or [], "created_at": c.created_at.isoformat() if c.created_at else None}
            for c in companies
        ],
        "total": total, "page": page, "page_size": page_size,
    }


class CompanyCreateRequest(BaseModel):
    company_name: str
    contact_person: str = ""
    email: str = ""
    phone: str = ""
    linkedin_url: str = ""
    website: str = ""
    industry: str = ""
    company_size: str = ""
    location: str = ""
    pipeline_stage: str = "prospecting"
    status: str = "active"
    notes: str = ""
    tags: List[str] = []


@app.post("/api/companies", status_code=201)
def create_company(
    req: CompanyCreateRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    company = CompanyModel(id=str(uuid.uuid4()), **req.dict())
    db.add(company)
    db.commit()
    db.refresh(company)
    return {"id": company.id, "company_name": company.company_name, "pipeline_stage": company.pipeline_stage}


@app.get("/api/companies/{company_id}")
def get_company(
    company_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    c = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    proposals = db.query(ProposalModel).filter(ProposalModel.company_id == company_id).count()
    deals = db.query(DealModel).filter(DealModel.company_id == company_id).count()
    return {
        "id": c.id, "company_name": c.company_name, "contact_person": c.contact_person,
        "email": c.email, "phone": c.phone, "linkedin_url": c.linkedin_url, "website": c.website,
        "industry": c.industry, "company_size": c.company_size, "location": c.location,
        "pipeline_stage": c.pipeline_stage, "status": c.status, "notes": c.notes,
        "tags": c.tags or [], "created_at": c.created_at.isoformat() if c.created_at else None,
        "_proposals": proposals, "_deals": deals,
    }


@app.patch("/api/companies/{company_id}")
def update_company(
    company_id: str,
    req: CompanyCreateRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    c = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    for k, v in req.dict(exclude_unset=True).items():
        setattr(c, k, v)
    c.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"success": True}


@app.patch("/api/companies/{company_id}/stage")
def update_company_stage(
    company_id: str,
    body: dict,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    c = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    c.pipeline_stage = body.get("stage", c.pipeline_stage)
    c.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"success": True, "pipeline_stage": c.pipeline_stage}


@app.delete("/api/companies/{company_id}")
def delete_company(
    company_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_role("admin")),
):
    c = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Company not found")
    db.delete(c)
    db.commit()
    return {"success": True}


# ════════════════════════════════════════════════════════════════════════════════
# PHASE 4 — Job Publishing (public endpoint + toggle)
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/public/jobs")
def public_job_listings(
    category: Optional[str] = None,
    location: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Public endpoint — no auth required. Returns published jobs only."""
    query = db.query(JobModel).filter(JobModel.published == True, JobModel.status == "active")
    if category:
        query = query.filter(JobModel.category.ilike(f"%{category}%"))
    if location:
        query = query.filter(JobModel.location.ilike(f"%{location}%"))
    jobs = query.order_by(JobModel.posted_at.desc()).limit(100).all()
    return {
        "data": [
            {"id": j.id, "title": j.title, "company": j.company, "location": j.location,
             "type": j.type, "salary": j.salary, "category": j.category,
             "skills": j.skills, "experience_min": j.experience_min,
             "description": j.description, "posted_at": j.posted_at.isoformat() if j.posted_at else None}
            for j in jobs
        ],
        "total": len(jobs),
    }


@app.patch("/api/jobs/{job_id}/publish")
def toggle_job_publish(
    job_id: str,
    body: dict,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    job = db.query(JobModel).filter(JobModel.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.published = body.get("published", not job.published)
    db.commit()
    return {"success": True, "published": job.published, "job_id": job_id}


# ════════════════════════════════════════════════════════════════════════════════
# PHASE 5 — AI Personas & Email Campaigns
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/personas")
def list_personas(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    personas = db.query(AiPersonaModel).all()
    return {"data": [{"id": p.id, "name": p.name, "email": p.email, "role": p.role,
                       "tone": p.tone, "signature": p.signature, "active": p.active} for p in personas]}


class PersonaCreateRequest(BaseModel):
    name: str
    email: str
    role: str = "Recruitment Consultant"
    tone: str = "professional"
    signature: str = ""
    active: bool = True


@app.post("/api/personas", status_code=201)
def create_persona(
    req: PersonaCreateRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_role("admin")),
):
    p = AiPersonaModel(id=str(uuid.uuid4()), **req.dict())
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"id": p.id, "name": p.name, "email": p.email}


@app.patch("/api/personas/{persona_id}")
def update_persona(
    persona_id: str,
    req: PersonaCreateRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_role("admin")),
):
    p = db.query(AiPersonaModel).filter(AiPersonaModel.id == persona_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    for k, v in req.dict(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    return {"success": True}


@app.delete("/api/personas/{persona_id}")
def delete_persona(
    persona_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(require_role("admin")),
):
    p = db.query(AiPersonaModel).filter(AiPersonaModel.id == persona_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Persona not found")
    db.delete(p)
    db.commit()
    return {"success": True}


@app.get("/api/email-campaigns")
def list_campaigns(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    campaigns = db.query(EmailCampaignModel).order_by(EmailCampaignModel.created_at.desc()).all()
    result = []
    for c in campaigns:
        persona_name = None
        if c.persona_id:
            p = db.query(AiPersonaModel).filter(AiPersonaModel.id == c.persona_id).first()
            persona_name = p.name if p else None
        result.append({
            "id": c.id, "name": c.name, "subject": c.subject, "body": c.body,
            "persona_id": c.persona_id, "persona_name": persona_name,
            "filter_stage": c.filter_stage, "filter_score_min": c.filter_score_min,
            "filter_score_max": c.filter_score_max, "status": c.status,
            "total_recipients": c.total_recipients, "sent_count": c.sent_count,
            "failed_count": c.failed_count,
            "scheduled_at": c.scheduled_at.isoformat() if c.scheduled_at else None,
            "completed_at": c.completed_at.isoformat() if c.completed_at else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })
    return {"data": result, "total": len(result)}


class CampaignCreateRequest(BaseModel):
    name: str
    subject: str
    body: str
    persona_id: Optional[str] = None
    filter_stage: Optional[str] = None
    filter_score_min: int = 0
    filter_score_max: int = 100


@app.post("/api/email-campaigns", status_code=201)
def create_campaign(
    req: CampaignCreateRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    # Count recipients based on filters
    query = db.query(LeadModel)
    if req.filter_stage:
        query = query.filter(LeadModel.pipeline_stage == req.filter_stage)
    query = query.filter(LeadModel.score >= req.filter_score_min, LeadModel.score <= req.filter_score_max)
    recipient_count = query.count()

    campaign = EmailCampaignModel(
        id=str(uuid.uuid4()),
        name=req.name, subject=req.subject, body=req.body,
        persona_id=req.persona_id, filter_stage=req.filter_stage,
        filter_score_min=req.filter_score_min, filter_score_max=req.filter_score_max,
        total_recipients=recipient_count, created_by=current_user.id,
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return {"id": campaign.id, "name": campaign.name, "total_recipients": recipient_count}


@app.post("/api/email-campaigns/{campaign_id}/send")
def send_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Send campaign emails via Hostinger SMTP to matched candidates."""
    c = db.query(EmailCampaignModel).filter(EmailCampaignModel.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if c.status not in ("draft", "scheduled"):
        raise HTTPException(status_code=400, detail=f"Cannot send campaign in status '{c.status}'")

    # Build recipient list from leads matching score/stage filters
    lead_query = db.query(LeadModel)
    if c.min_score:
        lead_query = lead_query.filter(LeadModel.score >= c.min_score)
    if c.target_stage:
        lead_query = lead_query.filter(LeadModel.pipeline_stage == c.target_stage)
    leads = lead_query.limit(500).all()

    # Get persona for tone/signature
    persona = None
    if c.persona_id:
        persona = db.query(AiPersonaModel).filter(AiPersonaModel.id == c.persona_id).first()

    signature = f"\n\nBest regards,\n{persona.name if persona else 'OverseasJob.in Team'}\nOverseasJob.in"
    subject = c.subject or "New Opportunity from OverseasJob.in"
    body_template = c.body or "We have an exciting opportunity that matches your profile. Please reply to learn more."

    sent = 0
    failed = 0
    for lead in leads:
        if not lead.email:
            continue
        body = f"Dear {lead.name},\n\n{body_template}{signature}"
        result = _smtp_send(lead.email, lead.name, subject, body)
        if result["ok"]:
            sent += 1
        else:
            failed += 1

    c.status = "completed"
    c.sent_count = sent
    c.total_recipients = sent + failed
    c.completed_at = datetime.now(timezone.utc)
    db.commit()
    return {
        "success": True,
        "sent_count": sent,
        "failed_count": failed,
        "status": c.status,
        "smtp_enabled": bool(os.getenv("SMTP_PASSWORD")),
    }


@app.delete("/api/email-campaigns/{campaign_id}")
def delete_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    c = db.query(EmailCampaignModel).filter(EmailCampaignModel.id == campaign_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    db.delete(c)
    db.commit()
    return {"success": True}


# ════════════════════════════════════════════════════════════════════════════════
# PHASE 6 — Team Chat (REST + WebSocket)
# ════════════════════════════════════════════════════════════════════════════════

from fastapi import WebSocket, WebSocketDisconnect
import asyncio

# Connection manager for WebSocket broadcast
class ConnectionManager:
    def __init__(self):
        self.active: dict[str, list[WebSocket]] = {}  # channel → [ws]

    async def connect(self, channel: str, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(channel, []).append(ws)

    def disconnect(self, channel: str, ws: WebSocket):
        if channel in self.active:
            self.active[channel] = [w for w in self.active[channel] if w != ws]

    async def broadcast(self, channel: str, message: dict):
        dead = []
        for ws in self.active.get(channel, []):
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(channel, ws)


_ws_manager = ConnectionManager()


@app.get("/api/messages")
def get_messages(
    channel: str = "general",
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    msgs = (db.query(ChatMessageModel)
            .filter(ChatMessageModel.channel == channel)
            .order_by(ChatMessageModel.created_at.asc())
            .limit(limit).all())
    return {
        "data": [{"id": m.id, "sender_name": m.sender_name, "sender_email": m.sender_email,
                   "message": m.message, "channel": m.channel, "reply_to": m.reply_to,
                   "created_at": m.created_at.isoformat() if m.created_at else None} for m in msgs],
        "channel": channel,
    }


@app.post("/api/messages", status_code=201)
async def post_message(
    body: dict,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    msg = ChatMessageModel(
        id=str(uuid.uuid4()),
        sender_id=current_user.id,
        sender_name=current_user.full_name or current_user.email,
        sender_email=current_user.email,
        message=body.get("message", ""),
        channel=body.get("channel", "general"),
        reply_to=body.get("reply_to"),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    payload = {
        "id": msg.id, "sender_name": msg.sender_name, "sender_email": msg.sender_email,
        "message": msg.message, "channel": msg.channel,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }
    await _ws_manager.broadcast(msg.channel, payload)
    return payload


@app.websocket("/ws/chat/{channel}")
async def websocket_chat(channel: str, ws: WebSocket):
    await _ws_manager.connect(channel, ws)
    try:
        while True:
            await ws.receive_text()  # keep-alive; actual posting via REST
    except WebSocketDisconnect:
        _ws_manager.disconnect(channel, ws)


# ════════════════════════════════════════════════════════════════════════════════
# PHASE 7 — Deal Offer Letter (AI-generated)
# ════════════════════════════════════════════════════════════════════════════════

@app.post("/api/deals/{deal_id}/offer-letter")
def generate_offer_letter(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    deal = db.query(DealModel).filter(DealModel.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    lead_name = "Candidate"
    if deal.lead_id:
        lead = db.query(LeadModel).filter(LeadModel.id == deal.lead_id).first()
        lead_name = lead.name if lead else "Candidate"

    if gemini.is_available():
        try:
            prompt = f"""Write a professional employment offer letter for the following placement deal:
Deal Title: {deal.title}
Candidate: {lead_name}
Offer Value: ₹{deal.value:,.0f}
Stage: {deal.stage}

Write a complete, formal offer letter including: greeting, position details, compensation, start date placeholder [START_DATE], terms, and closing. Keep it under 300 words."""
            letter = gemini.generate(prompt).strip()
            ai_powered = True
        except Exception:
            letter = _fallback_offer_letter(deal, lead_name)
            ai_powered = False
    else:
        letter = _fallback_offer_letter(deal, lead_name)
        ai_powered = False

    deal.offer_letter_body = letter
    db.commit()
    return {"offer_letter": letter, "ai_powered": ai_powered, "deal_id": deal_id}


def _fallback_offer_letter(deal, lead_name: str) -> str:
    return f"""Dear {lead_name},

We are delighted to offer you the position of {deal.title}.

Compensation: ₹{deal.value:,.0f} per annum
Start Date: [START_DATE]
Location: [LOCATION]

This offer is contingent upon successful completion of all pre-employment checks.

Please sign and return this letter by [RESPONSE_DATE] to confirm your acceptance.

We look forward to welcoming you to the team.

Sincerely,
RecruitAI Talent Team"""


@app.post("/api/deals/{deal_id}/negotiation")
def add_negotiation_entry(
    deal_id: str,
    body: dict,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    deal = db.query(DealModel).filter(DealModel.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    log = deal.negotiation_log or []
    if isinstance(log, str):
        import json
        try:
            log = json.loads(log)
        except Exception:
            log = []
    log.append({
        "note": body.get("note", ""),
        "counter_offer": body.get("counter_offer"),
        "by": current_user.email,
        "at": datetime.now(timezone.utc).isoformat(),
    })
    deal.negotiation_log = log
    if body.get("counter_offer"):
        deal.counter_offer_value = float(body["counter_offer"])
    db.commit()
    return {"success": True, "log_entries": len(log)}


# ════════════════════════════════════════════════════════════════════════════════
# PHASE 8 — Social Media Hub
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/social/posts")
def list_social_posts(
    platform: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    query = db.query(SocialPostModel)
    if platform:
        query = query.filter(SocialPostModel.platform == platform)
    if status:
        query = query.filter(SocialPostModel.status == status)
    posts = query.order_by(SocialPostModel.created_at.desc()).all()
    return {
        "data": [{"id": p.id, "platform": p.platform, "content": p.content,
                   "hashtags": p.hashtags or [], "tone": p.tone, "status": p.status,
                   "related_job_id": p.related_job_id,
                   "scheduled_at": p.scheduled_at.isoformat() if p.scheduled_at else None,
                   "created_at": p.created_at.isoformat() if p.created_at else None} for p in posts],
        "total": len(posts),
    }


class SocialGenerateRequest(BaseModel):
    platform: str                # linkedin | twitter | facebook | instagram
    tone: str = "professional"   # professional | friendly | urgent | exciting
    topic: str = ""              # freeform: "We placed 100 candidates this month"
    related_job_id: Optional[str] = None
    hashtag_count: int = 5


@app.post("/api/social/generate")
def generate_social_post(
    req: SocialGenerateRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Generate an AI-written social media post."""
    job_context = ""
    if req.related_job_id:
        job = db.query(JobModel).filter(JobModel.id == req.related_job_id).first()
        if job:
            job_context = f"Job: {job.title} at {job.company}, Location: {job.location}, Salary: {job.salary}"

    char_limits = {"twitter": 280, "instagram": 2200, "linkedin": 3000, "facebook": 63206}
    char_limit = char_limits.get(req.platform, 1000)

    content = ""
    hashtags = []
    ai_powered = False

    if gemini.is_available():
        try:
            prompt = f"""Write a {req.tone} social media post for {req.platform.capitalize()}.
Topic: {req.topic or 'Recruitment success and talent placement'}
{job_context}
Requirements:
- Max {min(char_limit, 280 if req.platform == 'twitter' else 500)} characters for the main text
- Engaging and on-brand for a recruitment company
- Include {req.hashtag_count} relevant hashtags (return them separately)
- Use emojis where appropriate

Return JSON: {{"content": "...", "hashtags": ["#tag1", "#tag2", ...]}}"""
            raw = gemini.generate(prompt).strip()
            if "```json" in raw:
                raw = raw.split("```json")[1].split("```")[0].strip()
            elif "```" in raw:
                raw = raw.split("```")[1].split("```")[0].strip()
            import json
            parsed = json.loads(raw)
            content = parsed.get("content", "")
            hashtags = parsed.get("hashtags", [])
            ai_powered = True
        except Exception:
            pass

    if not content:
        content = f"🚀 Exciting opportunities await! We're connecting top talent with leading companies. {req.topic}"
        hashtags = [f"#{req.platform}hiring", "#recruitment", "#talent", "#jobs", "#career"]

    post = SocialPostModel(
        id=str(uuid.uuid4()),
        platform=req.platform, content=content, hashtags=hashtags,
        tone=req.tone, related_job_id=req.related_job_id,
        status="draft", created_by=current_user.id,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return {
        "id": post.id, "platform": post.platform, "content": post.content,
        "hashtags": post.hashtags, "ai_powered": ai_powered,
    }


@app.patch("/api/social/posts/{post_id}")
def update_social_post(
    post_id: str,
    body: dict,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    p = db.query(SocialPostModel).filter(SocialPostModel.id == post_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Post not found")
    for k, v in body.items():
        if hasattr(p, k):
            setattr(p, k, v)
    db.commit()
    return {"success": True}


@app.delete("/api/social/posts/{post_id}")
def delete_social_post(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    p = db.query(SocialPostModel).filter(SocialPostModel.id == post_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(p)
    db.commit()
    return {"success": True}


# ════════════════════════════════════════════════════════════════════════════════
# PHASE 8b — LinkedIn OAuth + Post Publishing
# ════════════════════════════════════════════════════════════════════════════════

import urllib.parse
import requests as _requests

_LINKEDIN_AUTH_URL  = "https://www.linkedin.com/oauth/v2/authorization"
_LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"
_LINKEDIN_API_BASE  = "https://api.linkedin.com/v2"

# In-memory token store (survives the process; for prod use DB)
_linkedin_tokens: dict = {}   # {"access_token": ..., "expires_at": ..., "person_urn": ...}


def _li_client_id() -> str:
    v = os.getenv("LINKEDIN_CLIENT_ID", "")
    if not v:
        raise HTTPException(400, "LINKEDIN_CLIENT_ID not configured")
    return v


def _li_client_secret() -> str:
    v = os.getenv("LINKEDIN_CLIENT_SECRET", "")
    if not v:
        raise HTTPException(400, "LINKEDIN_CLIENT_SECRET not configured")
    return v


def _li_redirect_uri() -> str:
    domain = os.getenv("REPLIT_DEV_DOMAIN") or os.getenv("REPLIT_DOMAINS", "localhost:8000").split(",")[0]
    return f"https://{domain}/api/linkedin/callback"


def _li_token_valid() -> bool:
    tok = _linkedin_tokens.get("access_token")
    exp = _linkedin_tokens.get("expires_at", 0)
    return bool(tok) and datetime.now(timezone.utc).timestamp() < exp


@app.get("/api/linkedin/status")
def linkedin_status(_: UserModel = Depends(get_current_user)):
    """Returns whether we have a valid LinkedIn access token."""
    company_id = os.getenv("LINKEDIN_COMPANY_ID", "")
    return {
        "connected": _li_token_valid(),
        "person_urn": _linkedin_tokens.get("person_urn"),
        "company_id": company_id,
        "company_page": f"https://www.linkedin.com/company/{company_id}/admin/dashboard/" if company_id else None,
        "auth_url": None,
    }


@app.get("/api/linkedin/auth-url")
def linkedin_auth_url(_: UserModel = Depends(get_current_user)):
    """Build the LinkedIn OAuth consent URL."""
    params = {
        "response_type": "code",
        "client_id": _li_client_id(),
        "redirect_uri": _li_redirect_uri(),
        "scope": "r_liteprofile w_member_social w_organization_social",
        "state": "recruiteai_li_oauth",
    }
    url = f"{_LINKEDIN_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return {"auth_url": url, "redirect_uri": _li_redirect_uri()}


@app.get("/api/linkedin/callback")
def linkedin_callback(code: str = "", error: str = "", state: str = ""):
    """LinkedIn redirects here after user grants permission. Exchanges code for token."""
    if error:
        return {"error": error, "message": "LinkedIn OAuth denied"}
    if not code:
        raise HTTPException(400, "No code returned from LinkedIn")

    resp = _requests.post(_LINKEDIN_TOKEN_URL, data={
        "grant_type":    "authorization_code",
        "code":          code,
        "redirect_uri":  _li_redirect_uri(),
        "client_id":     _li_client_id(),
        "client_secret": _li_client_secret(),
    }, timeout=15)

    if resp.status_code != 200:
        raise HTTPException(400, f"LinkedIn token exchange failed: {resp.text}")

    data = resp.json()
    access_token = data.get("access_token", "")
    expires_in   = data.get("expires_in", 5183999)  # ~60 days

    # Fetch person URN (needed for posting)
    me_resp = _requests.get(f"{_LINKEDIN_API_BASE}/me", headers={
        "Authorization": f"Bearer {access_token}",
        "X-Restli-Protocol-Version": "2.0.0",
    }, timeout=10)
    person_urn = ""
    if me_resp.status_code == 200:
        pid = me_resp.json().get("id", "")
        person_urn = f"urn:li:person:{pid}"

    _linkedin_tokens["access_token"] = access_token
    _linkedin_tokens["expires_at"]   = datetime.now(timezone.utc).timestamp() + expires_in
    _linkedin_tokens["person_urn"]   = person_urn

    logging.info(f"[LINKEDIN] OAuth complete — person_urn={person_urn}")

    # Redirect back to the app's social hub
    domain = os.getenv("REPLIT_DEV_DOMAIN") or os.getenv("REPLIT_DOMAINS", "localhost:5000").split(",")[0]
    return {"success": True, "person_urn": person_urn, "message": "LinkedIn connected! You can close this tab."}


@app.post("/api/linkedin/disconnect")
def linkedin_disconnect(_: UserModel = Depends(get_current_user)):
    _linkedin_tokens.clear()
    return {"success": True}


@app.post("/api/social/posts/{post_id}/publish-linkedin")
def publish_post_to_linkedin(
    post_id: str,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Publish a social post directly to LinkedIn (company page or personal profile)."""
    post = db.query(SocialPostModel).filter(SocialPostModel.id == post_id).first()
    if not post:
        raise HTTPException(404, "Post not found")
    if post.platform != "linkedin":
        raise HTTPException(400, "This post is not for LinkedIn")
    if not _li_token_valid():
        raise HTTPException(401, "LinkedIn not connected. Please connect via /api/linkedin/auth-url")

    access_token = _linkedin_tokens["access_token"]
    company_id   = os.getenv("LINKEDIN_COMPANY_ID", "")
    person_urn   = _linkedin_tokens.get("person_urn", "")

    # Prefer company page; fall back to personal profile
    if company_id:
        author_urn = f"urn:li:organization:{company_id}"
    elif person_urn:
        author_urn = person_urn
    else:
        raise HTTPException(400, "No LinkedIn author URN available")

    full_text = post.content
    if post.hashtags:
        full_text += "\n\n" + " ".join(post.hashtags)

    payload = {
        "author":     author_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": full_text},
                "shareMediaCategory": "NONE",
            }
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
    }

    resp = _requests.post(
        f"{_LINKEDIN_API_BASE}/ugcPosts",
        json=payload,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
        },
        timeout=15,
    )

    if resp.status_code not in (200, 201):
        logging.error(f"[LINKEDIN] Post failed: {resp.status_code} {resp.text}")
        raise HTTPException(resp.status_code, f"LinkedIn API error: {resp.text[:200]}")

    li_post_id = resp.headers.get("x-restli-id") or resp.json().get("id", "")
    li_url     = f"https://www.linkedin.com/feed/update/{li_post_id}/" if li_post_id else ""

    # Mark post as published in DB
    post.status = "published"
    db.commit()

    logging.info(f"[LINKEDIN] Published post {post_id} → {li_url}")
    return {
        "success": True,
        "linkedin_post_id": li_post_id,
        "linkedin_url": li_url,
        "author_urn": author_urn,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
