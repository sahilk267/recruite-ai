# RecruitAI - AI-Powered Recruitment SaaS

## Overview
A full-stack AI recruitment platform built with React 19 + Vite + TypeScript (frontend) and FastAPI + SQLite (backend). Features real AI-powered resume parsing, candidate scoring, job-candidate matching, plus a complete recruitment management dashboard.

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

## Project Structure

```
src/
  App.tsx              - Main app with section routing (25 sections)
  main.tsx             - Entry point
  index.css            - Global styles + Tailwind
  components/          - Header, Sidebar, LoginModal, ui/ (shadcn)
  context/             - AuthContext for JWT state management
  sections/            - All 25 page sections (Dashboard, Jobs, Leads, etc.)
    ResumeScreener.tsx  - NEW: AI resume parser + job matching
    CandidateMatching.tsx - NEW: AI candidate ranking per job
  services/            - API client + service layer
  types/               - TypeScript type definitions

backend/
  main.py             - Complete FastAPI app (single file)
    - Auth: POST /api/auth/login, /api/auth/register, GET /api/auth/me
    - Jobs: GET/POST/PATCH/DELETE /api/jobs
    - Leads: GET/POST/PATCH/DELETE /api/leads + POST /api/leads/{id}/score
    - Recruiters: GET/POST/PATCH/DELETE /api/recruiters
    - Deals: GET/POST/PATCH/DELETE /api/deals + POST /api/deals/{id}/close
    - Payments: GET/POST /api/payments + POST /api/payments/{id}/record
    - Templates: GET/POST /api/templates
    - AI: POST /api/resumes/parse (skill extraction from uploaded file)
    - AI: POST /api/resumes/match (candidate vs job scoring)
    - AI: POST /api/jobs/{id}/match-candidates (rank all candidates for a job)
    - Stats: GET /api/stats (real dashboard stats from DB)
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

## AI Features

All AI runs locally — no external APIs:

1. **Skill Extraction**: Keyword matching against 200+ tech skills database (Python, React, AWS, etc.)
2. **Experience Detection**: Regex patterns on resume text ("5 years experience", "3+ yrs", etc.)
3. **Lead Scoring**: Weighted algorithm — skill count (55 pts) + experience (35 pts) + base (10 pts)
4. **Job-Candidate Matching**: Skill intersection (65%) + experience fit (30%) + base (5%)
5. **Education Detection**: PhD/Masters/Bachelors/Diploma detection from resume text

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
