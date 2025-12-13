# Deployment Guide

This guide covers how to deploy your Astro Learning Portal application to various platforms.

## ⚠️ Important: Database Migration Required

**Your app currently uses SQLite**, which is file-based and **not suitable for production deployments** (especially serverless platforms). You'll need to migrate to **PostgreSQL** or another production database before deploying.

## Prerequisites

- Node.js 18+ installed locally
- Git repository set up
- Environment variables configured

## Required Environment Variables

Create a `.env` file (or set these in your hosting platform):

```env
DATABASE_URL="your-database-connection-string"
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="https://your-domain.com"
```

**Generate NEXTAUTH_SECRET:**
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## Deployment Options

### Option 1: Railway (Recommended for Beginners) 🚂

**Best for:** Quick deployment with built-in PostgreSQL database

**Steps:**

1. **Sign up at [Railway.app](https://railway.app)**

2. **Create a new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add PostgreSQL database:**
   - Click "+ New" → "Database" → "PostgreSQL"
   - Railway will automatically create a `DATABASE_URL` environment variable

4. **Update Prisma schema for PostgreSQL:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

5. **Set environment variables:**
   - Go to your service → "Variables"
   - Add:
     - `NEXTAUTH_SECRET` (generate using command above)
     - `NEXTAUTH_URL` (your Railway app URL, e.g., `https://your-app.railway.app`)

6. **Configure build settings:**
   - Railway auto-detects Node.js apps
   - Build command: `npm run build`
   - Start command: `node dist/server/entry.mjs`

7. **Deploy:**
   - Railway will automatically deploy on push to your main branch
   - After first deploy, run migrations:
     ```bash
     npx prisma migrate deploy
     ```
   - Or use Railway's CLI: `railway run npx prisma migrate deploy`

**Pros:**
- ✅ Free tier available
- ✅ Built-in PostgreSQL
- ✅ Automatic HTTPS
- ✅ Easy environment variable management
- ✅ Auto-deploy from GitHub

**Cons:**
- ⚠️ Free tier has usage limits

---

### Option 2: Render 🎨

**Best for:** Simple deployments with managed PostgreSQL

**Steps:**

1. **Sign up at [Render.com](https://render.com)**

2. **Create PostgreSQL database:**
   - New → PostgreSQL
   - Copy the "Internal Database URL" (you'll use this for `DATABASE_URL`)

3. **Create Web Service:**
   - New → Web Service
   - Connect your GitHub repository
   - Settings:
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `node dist/server/entry.mjs`
     - **Environment:** Node

4. **Set environment variables:**
   - Go to "Environment" tab
   - Add:
     - `DATABASE_URL` (from step 2)
     - `NEXTAUTH_SECRET` (generate using command above)
     - `NEXTAUTH_URL` (your Render URL, e.g., `https://your-app.onrender.com`)

5. **Update Prisma schema** (same as Railway - change to `postgresql`)

6. **Deploy:**
   - Render will build and deploy automatically
   - After deployment, run migrations via Render Shell or locally:
     ```bash
     npx prisma migrate deploy
     ```

**Pros:**
- ✅ Free tier available
- ✅ Managed PostgreSQL
- ✅ Automatic HTTPS
- ✅ Auto-deploy from Git

**Cons:**
- ⚠️ Free tier spins down after inactivity
- ⚠️ Slower cold starts on free tier

---

### Option 3: Vercel (Requires External Database) ⚡

**Best for:** Fast global CDN, but requires external database

**Steps:**

1. **Set up external database:**
   - Use Railway, Render, or [Supabase](https://supabase.com) for PostgreSQL
   - Get your database connection string

2. **Sign up at [Vercel.com](https://vercel.com)**

3. **Import your project:**
   - Click "Add New" → "Project"
   - Import from GitHub
   - Vercel will auto-detect Astro

4. **Configure build:**
   - Framework Preset: Astro
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Set environment variables:**
   - Go to Project Settings → Environment Variables
   - Add:
     - `DATABASE_URL` (from your external database)
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL` (your Vercel URL)

6. **Update Prisma schema** (change to `postgresql`)

7. **Deploy:**
   - Vercel will deploy automatically
   - Run migrations after first deploy (via Vercel CLI or external terminal)

**Pros:**
- ✅ Excellent performance with global CDN
- ✅ Free tier is generous
- ✅ Automatic HTTPS
- ✅ Great developer experience

**Cons:**
- ⚠️ Requires external database (additional service)
- ⚠️ Serverless functions have execution time limits

---

### Option 4: Self-Hosted VPS (DigitalOcean, Linode, etc.) 🖥️

**Best for:** Full control, cost-effective for high traffic

**Steps:**

1. **Provision a VPS:**
   - Recommended: 2GB RAM minimum (Ubuntu 22.04)
   - Providers: DigitalOcean, Linode, Vultr, Hetzner

2. **Set up server:**
   ```bash
   # SSH into your server
   ssh root@your-server-ip
   
   # Update system
   apt update && apt upgrade -y
   
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
   apt install -y nodejs
   
   # Install PostgreSQL
   apt install -y postgresql postgresql-contrib
   
   # Create database
   sudo -u postgres psql
   CREATE DATABASE learning_portal;
   CREATE USER app_user WITH PASSWORD 'your-secure-password';
   GRANT ALL PRIVILEGES ON DATABASE learning_portal TO app_user;
   \q
   ```

3. **Clone and set up app:**
   ```bash
   # Install PM2 for process management
   npm install -g pm2
   
   # Clone your repo
   git clone https://github.com/your-username/your-repo.git
   cd your-repo
   
   # Install dependencies
   npm install
   
   # Create .env file
   nano .env
   # Add your environment variables
   
   # Update Prisma schema to postgresql
   # Run migrations
   npx prisma migrate deploy
   
   # Build the app
   npm run build
   
   # Start with PM2
   pm2 start dist/server/entry.mjs --name learning-portal
   pm2 save
   pm2 startup
   ```

4. **Set up Nginx reverse proxy:**
   ```bash
   apt install -y nginx
   
   # Create Nginx config
   nano /etc/nginx/sites-available/learning-portal
   ```
   
   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
   
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   ```bash
   # Enable site
   ln -s /etc/nginx/sites-available/learning-portal /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   ```

5. **Set up SSL with Let's Encrypt:**
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d your-domain.com
   ```

**Pros:**
- ✅ Full control
- ✅ Cost-effective for high traffic
- ✅ No vendor lock-in

**Cons:**
- ⚠️ Requires server management knowledge
- ⚠️ You're responsible for security updates
- ⚠️ Need to set up monitoring/backups

---

### Option 5: Docker Deployment 🐳

**Best for:** Consistent deployments across environments

**Steps:**

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build
   
   FROM node:18-alpine
   WORKDIR /app
   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/node_modules ./node_modules
   COPY --from=builder /app/package*.json ./
   COPY --from=builder /app/prisma ./prisma
   RUN npx prisma generate
   
   EXPOSE 3000
   CMD ["node", "dist/server/entry.mjs"]
   ```

2. **Create docker-compose.yml:**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=postgresql://user:password@db:5432/learning_portal
         - NEXTAUTH_SECRET=your-secret
         - NEXTAUTH_URL=http://localhost:3000
       depends_on:
         - db
     
     db:
       image: postgres:15-alpine
       environment:
         - POSTGRES_USER=user
         - POSTGRES_PASSWORD=password
         - POSTGRES_DB=learning_portal
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

3. **Deploy:**
   ```bash
   docker-compose up -d
   docker-compose exec app npx prisma migrate deploy
   ```

**Pros:**
- ✅ Consistent across environments
- ✅ Easy to scale
- ✅ Works on any platform that supports Docker

**Cons:**
- ⚠️ Requires Docker knowledge
- ⚠️ Need to manage Docker images

---

## Migration Steps: SQLite → PostgreSQL

Before deploying, you need to migrate from SQLite to PostgreSQL:

1. **Update `prisma/schema.prisma`:**
   ```prisma
   datasource db {
     provider = "postgresql"  // Changed from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. **Update `DATABASE_URL` in your `.env`:**
   ```env
   # PostgreSQL connection string format:
   DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
   ```

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Create and run migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **For production:**
   ```bash
   npx prisma migrate deploy
   ```

---

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Environment variables set correctly
- [ ] `NEXTAUTH_URL` matches your production domain
- [ ] `NEXTAUTH_SECRET` is a strong random string
- [ ] HTTPS is enabled (automatic on most platforms)
- [ ] Create your first admin account
- [ ] Test authentication flow
- [ ] Test quiz functionality
- [ ] Set up database backups (if self-hosting)
- [ ] Monitor application logs

---

## Recommended: Railway or Render

For most users, **Railway** or **Render** are the best choices because:
- ✅ Easy setup with built-in PostgreSQL
- ✅ Free tier to get started
- ✅ Automatic HTTPS
- ✅ No server management required
- ✅ Auto-deploy from GitHub

Start with Railway if you want the simplest experience, or Render if you prefer their interface.

---

## Need Help?

- Check the [Troubleshooting Guide](./logs/TROUBLESHOOTING.md)
- Review [Getting Started Guide](./logs/GETTING_STARTED.md)
- Check platform-specific documentation

