# Quick Start Test Guide

Use this guide to quickly test if everything is working after the fixes.

## ✅ What Was Fixed

**Problem**: Content-Type error when signing up
- Error: `Content-Type was not one of "multipart/form-data" or "application/x-www-form-urlencoded"`

**Solution**: 
1. Added explicit `enctype="application/x-www-form-urlencoded"` to both forms
2. Made API endpoints handle both JSON and form data for flexibility
3. Improved error handling in API routes

## 🚀 Test Your Setup

### Step 1: Ensure Database is Ready

If you haven't already, run:

```bash
npx prisma generate
npx prisma db push
```

### Step 2: Start Dev Server

```bash
npm run dev
```

The server should start at `http://localhost:3000`

### Step 3: Test Signup

1. **Navigate to**: `http://localhost:3000/auth/signup`

2. **Fill in the form**:
   - Email: `raihan.muhamad@gmail.com`
   - Password: `raihan98`

3. **Click "Create Account"**

4. **Expected result**: 
   - ✅ You should be redirected to the sign-in page
   - ✅ No errors in the browser console
   - ✅ No errors in the terminal

### Step 4: Verify User Created

Open Prisma Studio to verify:

```bash
npm run db:studio
```

- Click on "User" table
- You should see your user with email `raihan.muhamad@gmail.com`
- Role should be `student` by default

### Step 5: Upgrade to Admin

In a **new terminal** (keep dev server running), run:

```bash
npm run create-admin raihan.muhamad@gmail.com raihan98
```

**Expected output**:
```
User raihan.muhamad@gmail.com already exists. Updating role to admin...
✅ User role updated to admin!

You can now sign in with:
Email: raihan.muhamad@gmail.com
Password: raihan98

Visit: http://localhost:3000/auth/signin
```

### Step 6: Sign In

1. **Navigate to**: `http://localhost:3000/auth/signin`

2. **Fill in the form**:
   - Email: `raihan.muhamad@gmail.com`
   - Password: `raihan98`

3. **Click "Sign In"**

4. **Expected result**: 
   - ✅ Redirected to homepage
   - ✅ Signed in successfully

### Step 7: Test Admin Access

Visit these URLs to verify admin access:

1. **Admin Dashboard**: `http://localhost:3000/admin`
   - Should show admin dashboard with statistics

2. **Course Management**: `http://localhost:3000/admin/courses`
   - Should show course management interface

3. **Create Course**: `http://localhost:3000/admin/courses/new`
   - Should show course creation form

4. **User Management**: `http://localhost:3000/admin/users`
   - Should show user management interface

## 🐛 Troubleshooting

### Still Getting Content-Type Error?

1. **Clear browser cache**:
   - Press `Ctrl + Shift + Delete`
   - Clear cached files
   - Or use incognito mode

2. **Restart dev server**:
   ```bash
   # Stop with Ctrl + C
   npm run dev
   ```

3. **Check browser console**:
   - Press `F12`
   - Look for any JavaScript errors

### Database Errors?

Run the setup again:

```bash
npx prisma generate
npx prisma db push
```

### Can't Access Admin Pages?

Verify your role in Prisma Studio:

```bash
npm run db:studio
```

Make sure `role` = `admin` (not `student`)

## ✅ Success Checklist

After following all steps, you should have:

- [x] User account created
- [x] User upgraded to admin
- [x] Successfully signed in
- [x] Access to admin dashboard
- [x] Access to course management
- [x] Access to user management

## 📝 Next Steps

Now that authentication is working:

1. **Create your first course**:
   - Go to `/admin/courses/new`
   - Fill in course details
   - Add chapters

2. **Add content via Prisma Studio**:
   - Open `npm run db:studio`
   - Add chapter content with LaTeX and Markdown

3. **Create quizzes**:
   - Add quizzes via Prisma Studio
   - Link them to courses

4. **Test as a student**:
   - Sign out
   - Create a new student account
   - Browse courses
   - Take quizzes

## 🎉 You're All Set!

Your learning portal is now fully functional. Check the other documentation files for more details:

- **README.md** - Complete project overview
- **GETTING_STARTED.md** - Detailed setup guide
- **ADMIN_SETUP.md** - Admin management
- **TROUBLESHOOTING.md** - Common issues and solutions
- **QUIZ_AND_PROFILE_FEATURES.md** - Quiz and profile documentation

---

**Need Help?** Check the TROUBLESHOOTING.md file or review the server logs in your terminal.

