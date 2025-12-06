## Google OAuth + Password Reset

### What was added
- Auth.js (Google provider, Prisma adapter, JWT sessions) at `src/pages/api/oauth/[...auth].ts`.
- Prisma schema now supports OAuth tables (Account, Session, VerificationToken), optional password, professional profile fields, and `PasswordResetToken`.
- Password reset flow:
  - Request token: `POST /api/auth/password/request` (silent success, emails link).
  - Complete reset: `POST /api/auth/password/reset` (validates token, updates password, marks token used).
  - Pages: `src/pages/auth/reset.astro` (request), `src/pages/auth/reset/[token].astro` (set new password).
- Mailer helper using Nodemailer with SMTP fallback to console in dev: `src/lib/mailer.ts`.
- Sign-in page includes “Continue with Google” button and “Forgot password?” links to the reset flow.

### Env vars (set in Vercel/locally)
- `AUTH_SECRET` (long random string)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
- `DATABASE_URL` (existing)

### How to run locally
1) `npm install`
2) `npm run db:push` (apply Prisma changes)
3) Set env vars above (Google optional for password reset; SMTP optional—logs to console if absent)
4) `npm run dev`

### How to test reset flow
1) Visit `/auth/reset`, submit your email.
2) Check console for the email preview if SMTP is not configured; use the tokenized URL from the log.
3) Open the link `/auth/reset/<token>`, set a new password, then sign in with it.

### Deploying on Vercel
- Add env vars in the project settings.
- Ensure Redirect URI for Google OAuth: `https://<your-domain>/api/oauth/callback/google`.
- Redeploy; no code changes needed for Vercel.

### Next steps
- Add rate limiting to password reset endpoints.
- Optionally hash tokens before storing (currently stored as opaque random strings).
- Add branded email templates for better UX.
