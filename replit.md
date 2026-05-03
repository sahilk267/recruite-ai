# RecruitAI - AI Recruitment SaaS

## Overview
A React + Vite + TypeScript frontend for an AI-powered recruitment SaaS platform called "RECRUITE AI". The app features a full recruitment management dashboard with sections for job intelligence, lead capture/scoring, recruiter management, deal automation, CRM, payments, and more.

## Architecture

- **Framework**: React 19 + Vite 7 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: React Context (AuthContext for authentication)
- **HTTP Client**: Axios (configured in `src/services/api.ts`)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Toasts**: Sonner
- **Forms**: React Hook Form + Zod

## Project Structure

```
src/
  App.tsx              - Main app with section routing
  main.tsx             - Entry point
  index.css            - Global styles + Tailwind
  components/          - Shared components (Header, Sidebar, LoginModal, ui/)
  context/             - AuthContext for auth state management
  sections/            - Main page sections (Dashboard, Jobs, Leads, CRM, etc.)
  services/            - API service layer (api.ts, authService.ts, index.ts)
  types/               - TypeScript type definitions
  lib/                 - Utility functions (cn)
```

## Key Configuration

- **Port**: 5000 (Vite dev server)
- **Host**: 0.0.0.0 (to work with Replit proxy)
- **API Base URL**: Configured via `VITE_API_URL` env var (defaults to `http://localhost:3001`)
- **Deployment**: Static site (build outputs to `dist/`)

## Authentication

The app uses a custom auth context that stores JWT tokens in localStorage. It requires a backend API running at `localhost:3001` for actual login/register. Demo credentials are shown on the login page:
- Email: demo@recruite.ai
- Password: Demo123456

## Known Setup Notes

- `process.env` was replaced with `import.meta.env` (Vite-compatible)
- Type-only imports fixed for axios and authService types
- CSS `@import` moved before `@tailwind` directives

## Running

```bash
npm run dev    # Development server on port 5000
npm run build  # Production build
npm run preview # Preview production build
```
