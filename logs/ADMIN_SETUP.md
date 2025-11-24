# Admin Setup Guide

This guide will help you set up your first admin user for the learning portal.

## Method 1: Automated Script (Recommended)

We've created a convenient script to create or upgrade a user to admin status.

### For Your Account (raihan.muhamad@gmail.com)

1. **First, sign up through the web interface**:
   ```
   Visit: http://localhost:3000/auth/signup
   Email: raihan.muhamad@gmail.com
   Password: raihan98
   ```

2. **Then run the admin creation script**:
   ```bash
   npm run create-admin raihan.muhamad@gmail.com raihan98
   ```

   Or if you've already signed up, just run:
   ```bash
   npm run create-admin raihan.muhamad@gmail.com
   ```

3. **Sign in again** to activate admin privileges:
   ```
   Visit: http://localhost:3000/auth/signin
   ```

### Create a Different Admin User

You can create any admin user with:

```bash
npm run create-admin <email> <password>
```

Example:
```bash
npm run create-admin admin@school.edu SecurePassword123
```

## Method 2: Manual Setup via Prisma Studio

If you prefer to do it manually:

### Step 1: Sign Up

1. Visit `http://localhost:3000/auth/signup`
2. Create your account:
   - Email: `raihan.muhamad@gmail.com`
   - Password: `raihan98`
3. Complete the signup

### Step 2: Update Role in Database

1. **Open Prisma Studio**:
   ```bash
   npm run db:studio
   ```
   This will open in your browser at `http://localhost:5555`

2. **Click on the "User" model** in the left sidebar

3. **Find your user** (raihan.muhamad@gmail.com)

4. **Click on the record** to edit it

5. **Change the `role` field**:
   - Current value: `student`
   - New value: `admin`

6. **Click "Save 1 change"** button

### Step 3: Sign In

1. Visit `http://localhost:3000/auth/signin`
2. Sign in with:
   - Email: `raihan.muhamad@gmail.com`
   - Password: `raihan98`

## Verify Admin Access

After setting up admin access, verify by visiting these pages:

- ✅ **Admin Dashboard**: `http://localhost:3000/admin`
  - You should see statistics and recent activity

- ✅ **Course Management**: `http://localhost:3000/admin/courses`
  - You should be able to create new courses

- ✅ **User Management**: `http://localhost:3000/admin/users`
  - You should see all registered users

- ✅ **Create Course**: `http://localhost:3000/admin/courses/new`
  - You should have access to the course creation form

## Troubleshooting

### "Authentication required" Error

This usually means:
1. You're not signed in - go to `/auth/signin`
2. Your session expired - sign in again
3. Cookies are disabled - enable cookies in your browser

### Can't Access Admin Pages

1. **Check your role in the database**:
   ```bash
   npm run db:studio
   ```
   Make sure your `role` field is set to `admin` (not `student`)

2. **Sign out and sign in again**:
   - Clear your browser cookies
   - Sign in again at `/auth/signin`

3. **Verify you're using the correct account**:
   - Make sure you're signed in with the admin account

### Script Doesn't Work

If the `npm run create-admin` script fails:

1. **Make sure you're in the project directory**
2. **Check that the database exists**:
   ```bash
   npm run db:push
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Try the manual method** using Prisma Studio

## Multiple Admins

You can have multiple admin users. Just repeat the process for each user:

```bash
npm run create-admin teacher1@school.edu password1
npm run create-admin teacher2@school.edu password2
npm run create-admin principal@school.edu password3
```

## Security Notes

⚠️ **Important Security Reminders**:

1. **Change default passwords** in production
2. **Use strong passwords** (mix of letters, numbers, symbols)
3. **Don't share admin credentials**
4. **Regularly audit admin users** via `/admin/users`
5. **In production**, use environment variables for sensitive data

## Quick Reference

### Your Admin Credentials
- **Email**: `raihan.muhamad@gmail.com`
- **Password**: `raihan98`
- **Sign In**: `http://localhost:3000/auth/signin`

### Key URLs
- Sign In: `/auth/signin`
- Sign Up: `/auth/signup`
- Admin Dashboard: `/admin`
- Course Management: `/admin/courses`
- User Management: `/admin/users`
- Your Profile: `/profile`

### Quick Commands
```bash
# Start dev server
npm run dev

# Open database manager
npm run db:studio

# Create admin user
npm run create-admin <email> <password>

# Update database schema
npm run db:push
```

## Next Steps After Admin Setup

Once you're signed in as admin:

1. **Create your first course** at `/admin/courses/new`
2. **Add chapter content** via Prisma Studio
3. **Create quizzes** for your courses
4. **Manage users** at `/admin/users`
5. **Monitor activity** on the admin dashboard

---

Need help? Check the main [README.md](./README.md) or [GETTING_STARTED.md](./GETTING_STARTED.md) for more information.


