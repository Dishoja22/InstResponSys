# ResponSys — Digital Complaint Resolution System

**Resolve. Track. Trust.**

ResponSys is an AI-powered institutional complaint resolution system that intelligently triages user submissions using Claude Sonnet 3.5, offers realtime visually stunning tracking pipelines, and provides administrators with a comprehensive data-rich cockpit.

## Features Let Down
1. **AI Triage** – Automatically predicts priority, detects sentiment, and routes complaints dynamically across departments based purely on user context. Features input hashing optimization to prevent redundant token use.
2. **Real-time Status Timelines** – Step-by-step courier-like timelines driven by `framer-motion` and Supabase Realtime subscriptions.
3. **Admin Cockpit** – High fidelity insights rendered with Recharts (BarCharts, Donut, Multi-series area lines) providing instant clarity into operational bottlenecks.
4. **Polished Dark Aesthetic** – Glassmorphic design variables driven natively through TailwindCSS variables.

## Tech Stack
- Frontend: Vite + React 18 + TypeScript
- Styling: TailwindCSS v3
- Animations: Framer Motion
- Flow/State: Zustand + React Router v6
- Charting: Recharts
- Backend / DB: Supabase (Auth + Postgres RLS + Realtime)
- AI Model: Anthropic Claude Sonnet via direct proxy/backend invocation.

## Setup Instructions

1. Clone repo, install dependencies:
```bash
npm install
```

2. Add your environment variables in `.env.local`
```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_ANTHROPIC_API_KEY=...
```

3. Run Supabase SQL schema from `database.sql` into your Supabase Postgres Database via SQL Editor. Ensure Realtime is enabled for `complaints`, `activity_log`, and `notifications` tables.

4. Start Dev Server
```bash
npm run dev
```

## AI Api Optimization Rules implemented:
- Caches by input hash to prevent duplicative API queries on the same contextual draft.
- Debounced by 1000ms strictly to save on token requests during mid-thought typing.
- Validates constraints before calling (description minimum >20 characters).
