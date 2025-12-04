# Quick Deployment Guide

## 🚀 Fastest Way to Deploy (Railway - 5 minutes)

### Step 1: Prepare Your Repository
```bash
# Make sure your code is pushed to GitHub
git add .
git commit -m "Prepare for deployment"
git push
```

### Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Railway will auto-detect your Node.js app

### Step 3: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway automatically creates `DATABASE_URL` environment variable

### Step 4: Update Prisma Schema

**IMPORTANT:** You need to change your database provider before deploying.

Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

Commit and push:
```bash
git add prisma/schema.prisma
git commit -m "Switch to PostgreSQL for production"
git push
```

### Step 5: Set Environment Variables

In Railway project → Your service → **"Variables"** tab, add:

1. **NEXTAUTH_SECRET** (generate one):
   ```bash
   # Windows PowerShell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
   
   # Linux/Mac
   openssl rand -base64 32
   ```

2. **NEXTAUTH_URL**: Your Railway app URL (e.g., `https://your-app.railway.app`)
   - Railway will show this after first deploy

### Step 6: Configure Build Settings

Railway usually auto-detects, but verify:
- **Build Command:** `npm install && npm run build`
- **Start Command:** `node dist/server/entry.mjs`

### Step 7: Deploy & Migrate

1. Railway will automatically deploy when you push
2. After first deployment, open Railway's **CLI** or **Shell**
3. Run database migrations:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

### Step 8: Create Admin Account

1. Visit your deployed app
2. Go to `/auth/signup` and create an account
3. Use Railway's database shell or connect locally to make yourself admin:
   ```bash
   # In Railway Shell
   npx prisma studio
   # Or use SQL:
   # UPDATE "User" SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

---

## 🎯 Alternative: Render (Similar Process)

1. Sign up at [render.com](https://render.com)
2. Create **PostgreSQL** database first
3. Create **Web Service** from GitHub
4. Set environment variables:
   - `DATABASE_URL` (from PostgreSQL service)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
5. Update Prisma schema (same as above)
6. Deploy and run migrations

---

## ✅ Post-Deployment Checklist

- [ ] Database provider changed to `postgresql` in schema
- [ ] Environment variables set
- [ ] Migrations run successfully
- [ ] App is accessible via HTTPS
- [ ] Can sign up and sign in
- [ ] Admin account created
- [ ] Can access admin dashboard

---

## 🆘 Common Issues

**"Prisma Client not generated"**
```bash
npx prisma generate
```

**"Migration failed"**
- Make sure `DATABASE_URL` is correct
- Check database is accessible
- Try: `npx prisma migrate reset` (⚠️ deletes data)

**"Can't connect to database"**
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:5432/db`
- Check database is running (Railway/Render show status)

**"NEXTAUTH_URL mismatch"**
- Must match your actual domain exactly
- Include `https://` protocol
- No trailing slash

---

## 📝 Environment Variables Reference

```env
# Required
DATABASE_URL="postgresql://user:password@host:5432/database"
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="https://your-domain.com"
```

---

**Need more details?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive guide.
