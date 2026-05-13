# RecruitAI - AI-Powered Recruitment SaaS

## Overview
A full-stack AI recruitment platform built with React 19 + Vite + TypeScript (frontend) and FastAPI + SQLite (backend). Features real Gemini-powered AI for resume parsing, job description generation, candidate scoring, semantic job matching, a natural language AI assistant, complete interview scheduling with AI slot suggestions, multi-tenancy with RBAC, subscription/quota management, email automation, and a full recruitment pipeline board with audit trail.

## Architecture

### Frontend
- **Framework**: React 19 + Vite 7 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: React Context (AuthContext for JWT auth)
- **HTTP Client**: Axios (`src/services/api.ts`) — proxied to backend via Vite proxy
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Toasts**: Sonner

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: SQLite with SQLAlchemy ORM
- **Auth**: JWT tokens via python-jose + sha256_crypt password hashing (passlib)
- **Port**: 8000 (proxied from Vite at /api → localhost:8000)
- **Entry point**: `backend/main.py`
- **AI client**: `backend/gemini_client.py` — shared Gemini singleton

## Project Structure

```
src/
  App.tsx              - Main app with section routing (26 sections)
  main.tsx             - Entry point
  index.css            - Global styles + Tailwind
  components/          - Header, Sidebar, LoginModal, ui/ (shadcn)
  context/             - AuthContext for JWT state management
  sections/
    AIAssistant.tsx     - Gemini chat UI for natural language candidate queries
    CandidatePipeline.tsx - Kanban board, search/filter bar, activity log, AI brief in drawer
    ResumeScreener.tsx  - AI resume parser + job matching
    CandidateMatching.tsx - AI candidate ranking per job
    ... (22 more sections)
  services/            - API client + service layer
  types/               - TypeScript type definitions

backend/
  main.py             - Complete FastAPI app (single file)
    - Auth: POST /api/auth/login, /api/auth/register, GET /api/auth/me
    - Jobs: GET/POST/PATCH/DELETE /api/jobs
    - Leads: GET/POST/PATCH/DELETE /api/leads + POST /api/leads/{id}/score
    - Pipeline: PATCH /api/leads/{id}/pipeline (move stage + write activity)
    - Activity: GET /api/pipeline/activity?lead_id=&limit= (audit log)
    - Recruiters: GET/POST/PATCH/DELETE /api/recruiters
    - Deals: GET/POST/PATCH/DELETE /api/deals + POST /api/deals/{id}/close
    - Payments: GET/POST /api/payments + POST /api/payments/{id}/record
    - Templates: GET/POST /api/templates
    - AI: POST /api/resumes/parse (Gemini skill extraction + candidate summary)
    - AI: POST /api/resumes/match (Gemini semantic scoring + reasoning)
    - AI: POST /api/jobs/{id}/match-candidates (rank all + Gemini insights for top 3)
    - AI: POST /api/ai/chat (NL query over candidate database)
    - AI: POST /api/ai/candidate-brief/{id} (3-sentence recruiter brief)
    - Stats: GET /api/stats (real dashboard stats from DB)
  gemini_client.py    - Shared Gemini AI client (singleton, auto-fallback)
recruiteai.db          - SQLite database (auto-created and seeded on startup)
```

## Key Configuration

- **Frontend port**: 5000 (Vite dev server)
- **Backend port**: 8000 (FastAPI/uvicorn)
- **Vite proxy**: `/api` → `http://localhost:8000` (configured in vite.config.ts)
- **API Base URL**: Empty string (uses relative URLs via Vite proxy)
- **Deployment**: Static frontend (build outputs to `dist/`)

## Authentication

JWT-based auth. Tokens stored in localStorage. Backend validates tokens on every protected endpoint.

**Demo Credentials:**
- Email: `admin@recruiteai.com`
- Password: `admin123`
- Role: `admin`

The database is seeded automatically on first startup with:
- 10 candidate leads (with skills + scores)
- 8 job listings
- 5 recruiters
- 5 deals (3 closed)
- 4 payments (3 paid)
- 2 email templates

## Gemini AI Integration

Uses **Replit AI Integrations** — no personal API key required. Charges billed to Replit credits.

- **Package**: `google-genai` (installed via pip)
- **Client**: `backend/gemini_client.py` — shared singleton, never cached (tokens expire)
- **Model**: `gemini-2.5-flash` (fast, cost-effective, capable)
- **Env vars** (auto-set by Replit, never touch manually):
  - `AI_INTEGRATIONS_GEMINI_API_KEY`
  - `AI_INTEGRATIONS_GEMINI_BASE_URL`
- **Fallback**: All AI endpoints fall back to keyword/regex logic if Gemini is unavailable — nothing breaks

### Gemini-Powered Endpoints

| Endpoint | What Gemini does |
|---|---|
| `POST /api/resumes/parse` | Extracts name, email, phone, skills, experience, education + writes a 2-3 sentence candidate summary |
| `POST /api/resumes/match` | Semantic skill+experience scoring (0-100) + reasoning paragraph explaining the match |
| `POST /api/jobs/{id}/match-candidates` | Keyword bulk-ranks all candidates, then Gemini adds a 1-sentence insight for the top 3 |
| `POST /api/ai/chat` | Natural language Q&A over the full live candidate database |
| `POST /api/ai/candidate-brief/{id}` | 3-sentence recruiter-ready brief for any candidate |

### Frontend AI Sections

**AI Assistant** (`src/sections/AIAssistant.tsx`)
- Chat UI: user/bot message bubbles with timestamps, copy button per message
- 6 curated starter questions shown on first load
- Sends to `/api/ai/chat` — Gemini reads the full candidate DB and answers in natural language
- Footer: credit note (billed to Replit AI credits)
- Sidebar label: "AI Assistant" with AI badge

**AI Brief in Pipeline Drawer** (`src/sections/CandidatePipeline.tsx` → `CandidateDrawer`)
- "Generate AI Brief" button inside every candidate's slide-in drawer
- One click → Gemini writes a 3-sentence professional recruiter brief
- Copy button to clipboard, Regenerate button to refresh
- Loading state with animated spinner

**Resume Screener** (`src/sections/ResumeScreener.tsx`)
- Upload any resume file → Gemini parses it (name, email, skills, experience, education, summary)
- Falls back to keyword extraction if Gemini unavailable
- Response includes `ai_powered: true/false` flag

**Candidate Matching** (`src/sections/CandidateMatching.tsx`)
- Select a job → ranks all candidates
- Top 3 get Gemini-written `ai_insight` sentences
- Score, quality, matched/missing skills shown per candidate

## Pipeline Board Features

- **Kanban view**: 5 stages — Screened → Contacted → Interviewing → Offer → Hired
- **Drag & drop**: Move candidates between columns; persisted to DB instantly
- **Candidate drawer**: Slide-in detail panel with full profile, AI score breakdown, pipeline journey, move buttons, **AI Brief generator**, resume text
- **Search & filter bar**: Filter by name/email, score range (High/Medium/Low), skill dropdown, stage dropdown — with active chip row and count
- **Activity log**: Full immutable audit trail — who moved whom, from/to stage, timestamp with relative display

## Database Tables

| Table | Purpose |
|---|---|
| `users` | Auth accounts |
| `jobs` | Job listings |
| `leads` | Candidates (`pipeline_stage` column added via ALTER TABLE) |
| `recruiters` | Recruiter CRM |
| `deals` | Placement deals |
| `payments` | Revenue tracking |
| `templates` | Email templates |
| `tier_templates` | Score-tier outreach templates |
| `outreach_drafts` | AI-generated personalized emails |
| `pipeline_activity` | Immutable audit log for stage moves |

## API: Key Response Shapes

### GET /api/leads
```json
{ "data": [...], "total": 10, "page": 1, "pageSize": 50 }
```

### POST /api/ai/chat
```json
{ "answer": "The top 3 candidates by score are...", "ai_powered": true }
```

### POST /api/ai/candidate-brief/{id}
```json
{ "brief": "Jane is a senior Python developer...", "lead_id": "uuid", "ai_powered": true }
```

### POST /api/resumes/match
```json
{
  "score": 98, "quality": "High", "skill_match_pct": 100,
  "matched_skills": ["Python", "FastAPI"], "missing_skills": [],
  "recommendation": "Strong match — recommend for interview",
  "reasoning": "Candidate exceeds all requirements...",
  "ai_powered": true
}
```

### GET /api/pipeline/activity
```json
{
  "id": "uuid", "lead_id": "uuid", "lead_name": "Jane Doe",
  "from_stage": "screened", "to_stage": "contacted",
  "moved_by_name": "Admin User", "moved_by_email": "admin@recruiteai.com",
  "moved_at": "2026-05-10T12:34:56.000000"
}
```

## Workflows

- **Start application**: `npm run dev` → port 5000 (frontend)
- **Start backend**: `python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000`

## Running

```bash
# Frontend
npm run dev

# Backend (in separate terminal)
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000

# Build
npm run build
```

## Known Notes

- `process.env` → `import.meta.env` (Vite-compatible) — fixed
- Password hashing: sha256_crypt (bcrypt 4.x incompatible with passlib in this env)
- SQLite DB auto-creates at `./recruiteai.db` on first run
- Backend seeds demo data only if `users` table is empty
- `pipeline_stage` column on `leads` was added via `ALTER TABLE` (not auto-created by SQLAlchemy `create_all`)
- `pipeline_activity` table IS auto-created by `create_all` (new table, no migration needed)
- Login response key is `token` (not `access_token`)
- Gemini client: `import backend.gemini_client as gemini` — module path because uvicorn runs from project root
- All Gemini calls have try/except fallback — never crashes if AI unavailable
