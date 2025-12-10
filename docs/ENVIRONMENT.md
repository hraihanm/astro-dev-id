## Environment & Deployment Workflow

This project now runs on Postgres (Neon) and deploys to Vercel. Use Postgres everywhere (no SQLite) and keep dev/prod isolated.

### Branching model
- `main`: production code + production Neon database.
- `dev`/feature branches: development code + dev Neon branch (or local Postgres).
- Merge to `main` only after migrations are committed and tested on a dev DB.

### Env files
- Local dev: `.env.development` (or `.env.local`) with **dev** DB credentials.
- CI/Preview/Prod: set vars in Vercel project settings (Production & Preview).
- Do not reuse prod credentials locally.

### Required environment variables
- `DATABASE_URL` — Postgres connection string.
- `NEXTAUTH_SECRET` — strong random string.
- `AUTH_SECRET` — use the same value as `NEXTAUTH_SECRET` (Auth.js code expects it).
- `NEXTAUTH_URL` — must match the current host (include protocol, no trailing slash).
  - Local: `http://localhost:3000`
  - Vercel: `https://<your-project>.vercel.app` or custom domain
- If using Google login: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Optional: `ADMIN_API_KEY` for admin API access.

### Generating secrets (PowerShell)
```powershell
# 64-byte random, Base64
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```
Use the same value for `NEXTAUTH_SECRET` and `AUTH_SECRET`.

### Prisma workflow
1) Edit models → `npx prisma migrate dev -n <change>` (uses dev DB).
2) Verify locally (and with seed data).
3) Commit `schema.prisma` + `prisma/migrations/*`.
4) After merge/deploy to `main`, run:  
   `npx prisma migrate deploy --schema prisma/schema.prisma` (with prod env vars).

### Seeding/content
- Prefer seed scripts (idempotent upserts) over manual DB edits.
- Point `DATABASE_URL` to target DB, then run the seed script.

### Keeping dev in sync with prod data (read-only)
```bash
pg_dump <prod-connection-string> -Fc -f prod.dump
pg_restore -c -d <dev-connection-string> prod.dump
```
This clones prod data into a dev DB without touching prod.

### Vercel env setup (Production/Preview)
Set the vars above in Project → Settings → Environment Variables, then redeploy.

### Local env setup quickstart
1) Copy `.env.example` to `.env.development` (or `.env.local`).
2) Fill in a **dev** `DATABASE_URL` (Neon dev branch or local Postgres).
3) Generate secrets and set `NEXTAUTH_URL=http://localhost:3000`.
4) `npm install && npm run dev` (or `npm run build && npm run preview`).

### Checklist before merging to main
- [ ] Migrations run on dev DB (`prisma migrate dev`) and committed.
- [ ] Seeds tested on dev DB.
- [ ] `NEXTAUTH_URL`/secrets correct per environment.
- [ ] `prisma migrate deploy` planned/executed for prod after deploy.

