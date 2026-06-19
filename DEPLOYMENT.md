# Washly — Deployment & Backups

This repo is a monorepo with two deployables:

- `frontend/` — React + Vite SPA → **Vercel**
- `backend/`  — Express REST API → **Vercel** (serverless) or any Node host

---

## 1. Database backups (GitHub Actions)

The workflow [`.github/workflows/backup.yml`](.github/workflows/backup.yml) dumps the
Supabase Postgres database daily (02:00 UTC) and on demand, uploading a gzipped
`pg_dump` as a downloadable artifact.

### One-time setup

1. **GitHub → repo → Settings → Secrets and variables → Actions → New repository secret**
   - Name: `SUPABASE_DB_URL`
   - Value: the **Session Pooler** connection string from
     **Supabase → Project → Connect → Session pooler**:
     ```
     postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
     ```
   > Use the **Session Pooler** URL, not `db.<ref>.supabase.co`. GitHub runners are
   > IPv4-only and the direct host is IPv6-only — the direct URL will fail with
   > "network unreachable".

2. *(Optional)* **Settings → Variables → Actions** → add `BACKUP_RETENTION_DAYS`
   (defaults to 30).

### Run it manually
**Actions → Database Backup → Run workflow.** Download the artifact from the run page.

### Restore a backup
```bash
gunzip -c washly-YYYYMMDD-HHMMSS.sql.gz | psql "$SUPABASE_DB_URL"
```

---

## 2. Frontend on Vercel

Create a Vercel project from this repo with **Root Directory = `frontend`**
(config in [`frontend/vercel.json`](frontend/vercel.json) handles SPA routing).

Environment variables (Vercel → Project → Settings → Environment Variables):

| Variable | Value |
| --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (`pk_live_…` / `pk_test_…`) |
| `VITE_API_URL` | URL of the deployed backend, e.g. `https://washly-api.vercel.app` |
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `VITE_ADMIN_EMAILS` | Comma-separated admin emails |

---

## 3. Backend on Vercel

Create a **second** Vercel project from the same repo with
**Root Directory = `backend`** (config in [`backend/vercel.json`](backend/vercel.json)).
`app.js` exports the Express app and only calls `listen()` when run directly, so it
works both locally and as a Vercel serverless function.

Environment variables:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase **service role** key (server only) |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `GROQ_API_KEY` | Groq API key |
| `SENDGRID_API_KEY` | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Verified sender address |
| `FRONTEND_URL` | Deployed frontend URL (for CORS), e.g. `https://washly.vercel.app` |
| `NODE_ENV` | `production` |
| `DEMO_CYCLE_SECONDS` | *(optional)* simulated cycle length, default `120` |

CORS already allows `localhost`, any `*.vercel.app` domain, and whatever you set in
`FRONTEND_URL` (comma-separated for multiple).

### ⚠️ Live IoT simulation & serverless
The "Start Machine" demo drives the cycle with an in-memory `setInterval`. Serverless
functions are short-lived, so that timer **won't keep running on Vercel** — the API,
bookings, AI, and dashboards all work, but the live progress updates will not advance.

For the **live IoT demo**, run the backend on a persistent Node host
(`npm start` locally, or Render/Railway/Fly), which keeps the timer alive. Point the
frontend's `VITE_API_URL` at that host for the demo.

---

## 4. Database migrations
Run once in the Supabase SQL editor, in order:
1. `backend/db/migrations/001_soft_delete_machines.sql`
2. `backend/db/migrations/002_unique_machine_name.sql`
