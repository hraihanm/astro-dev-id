# Troubleshooting Guide

Common issues and their solutions for the Learning Portal.

## Setup Issues

### "Internal server error" when signing up

**Cause**: Database hasn't been initialized yet.

**Solution**:
1. Stop the dev server (`Ctrl + C`)
2. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
3. Initialize database:
   ```bash
   npx prisma db push
   ```
4. Restart dev server:
   ```bash
   npm run dev
   ```
5. Try signing up again

### "EPERM: operation not permitted" during Prisma generate

**Cause**: Dev server is running and has locked the Prisma files.

**Solution**:
1. Stop the dev server first (`Ctrl + C`)
2. Run the Prisma commands
3. Restart the dev server

### "Environment variables loaded from .env" but still errors

**Cause**: Database file doesn't exist yet.

**Solution**:
Run the database initialization:
```bash
npx prisma db push
```

## Authentication Issues

### "Authentication required" error

**Cause**: Not signed in or session expired.

**Solution**:
1. Go to `/auth/signin`
2. Sign in with your credentials
3. If still failing, clear browser cookies and try again

### Can't access admin pages

**Cause**: User role is not set to "admin".

**Solution**:
1. Open Prisma Studio:
   ```bash
   npm run db:studio
   ```
2. Navigate to User table
3. Find your user
4. Change `role` field from `student` to `admin`
5. Save changes
6. Sign out and sign in again

### Password doesn't work after setting up admin

**Cause**: Using the wrong password or account.

**Solution**:
- Double-check the email and password
- If forgotten, reset via Prisma Studio:
  1. Delete the user record
  2. Sign up again
  3. Run the admin script

## Database Issues

### "Prisma Client has not been generated"

**Solution**:
```bash
npx prisma generate
```

### Database file is corrupted

**Solution**:
1. Delete the database file:
   ```bash
   Remove-Item prisma/dev.db -Force
   ```
2. Reinitialize:
   ```bash
   npx prisma db push
   ```
3. Recreate admin user:
   ```bash
   npm run create-admin raihan.muhamad@gmail.com raihan98
   ```

### Changes to schema.prisma not reflected

**Solution**:
```bash
npx prisma generate
npx prisma db push
```

## Quiz Issues

### Quiz questions not rendering LaTeX

**Cause**: KaTeX CSS not loaded or syntax error in LaTeX.

**Solution**:
1. Check browser console for errors
2. Verify LaTeX syntax is correct
3. Ensure KaTeX CSS is loaded (check page source)
4. Try wrapping math in `$$` for block or `$` for inline

### Quiz submission fails

**Cause**: Not authenticated or database error.

**Solution**:
1. Ensure you're signed in
2. Check browser console for errors
3. Verify quiz exists in database

### Quiz results not showing

**Cause**: Quiz attempt not saved or wrong quiz ID.

**Solution**:
1. Check that quiz was submitted successfully
2. Verify quiz attempt in Prisma Studio (QuizAttempt table)
3. Check browser console for errors

## Content Issues

### Course not showing up

**Cause**: Course not properly created or not published.

**Solution**:
1. Open Prisma Studio: `npm run db:studio`
2. Check Course table
3. Verify course has required fields:
   - title
   - slug
   - description
4. For students, verify `published` is `true`

### Chapter content not rendering

**Cause**: Content field is empty or contains invalid markdown.

**Solution**:
1. Open Prisma Studio
2. Find the chapter
3. Add valid markdown content
4. Test LaTeX syntax if using math expressions

### LaTeX not rendering in chapters

**Cause**: LaTeX library not properly imported or syntax error.

**Solution**:
1. Check for LaTeX syntax errors
2. Use `$$` for block math: `$$E = mc^2$$`
3. Use `$` for inline math: `$x^2$`
4. Check browser console for KaTeX errors

## Profile Issues

### Profile page shows no data

**Cause**: Profile not created yet (happens on first user creation).

**Solution**:
Profile is created automatically on first visit. If still empty:
1. Try signing out and back in
2. Check Prisma Studio Profile table
3. Manually create profile record if needed

### Achievements not updating

**Cause**: Achievement calculation logic or database sync issue.

**Solution**:
1. Complete a new quiz to trigger recalculation
2. Check browser console for errors
3. Verify quiz attempts in database

### Can't update profile

**Cause**: Authentication issue or validation error.

**Solution**:
1. Ensure you're signed in
2. Check all required fields are filled
3. Check browser console for validation errors

## Development Issues

### Port 3000 already in use

**Solution**:
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- --port 3001
```

### Hot reload not working

**Solution**:
1. Restart dev server
2. Clear browser cache
3. Try hard refresh: `Ctrl + Shift + R`

### Changes not showing up

**Solution**:
1. Check file is saved
2. Restart dev server
3. Clear `.astro` cache:
   ```bash
   Remove-Item -Recurse -Force .astro
   npm run dev
   ```

## Windows-Specific Issues

### PowerShell execution policy error

**Solution**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Line ending issues (CRLF vs LF)

**Solution**:
```bash
git config core.autocrlf true
```

### Node/npm not found

**Solution**:
1. Restart terminal/VSCode
2. Verify Node.js is installed: `node --version`
3. Add Node.js to PATH if needed

## Performance Issues

### Page loads slowly

**Causes & Solutions**:
1. **Large database**: 
   - Limit queries with pagination
   - Add indexes to frequently queried fields

2. **Too many LaTeX expressions**:
   - Use static rendering where possible
   - Cache rendered content

3. **Dev mode overhead**:
   - Build for production: `npm run build`
   - Preview: `npm run preview`

## Getting More Help

### Check Logs

**Browser Console**:
- Press `F12` in browser
- Check Console tab for errors

**Server Logs**:
- Check terminal where `npm run dev` is running
- Look for error messages

### Database Inspection

```bash
npm run db:studio
```

Opens Prisma Studio to inspect/modify database directly.

### Reset Everything

If all else fails, start fresh:

```bash
# Stop dev server (Ctrl + C)

# Delete database
Remove-Item prisma/dev.db -Force

# Delete node modules and lock files
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Reinstall
npm install
npx prisma generate
npx prisma db push

# Start again
npm run dev
```

### Quick Setup Script

Run the automated setup:

```powershell
.\setup.ps1
```

## Still Having Issues?

1. **Check the documentation**:
   - [README.md](./README.md)
   - [GETTING_STARTED.md](./GETTING_STARTED.md)
   - [ADMIN_SETUP.md](./ADMIN_SETUP.md)

2. **Verify your environment**:
   ```bash
   node --version  # Should be 18.0.0 or higher
   npm --version   # Should be 9.0.0 or higher
   ```

3. **Check file permissions**:
   - Ensure you have write permissions in the project directory
   - Run terminal as administrator if needed

4. **Review recent changes**:
   - Check git history: `git log`
   - Revert if needed: `git checkout <file>`

## Common Error Messages

### "Cannot find module '@prisma/client'"
```bash
npx prisma generate
```

### "Invalid `prisma.user.create()` invocation"
- Check database schema matches model
- Run: `npx prisma db push`

### "Unique constraint failed"
- User with that email already exists
- Use a different email or delete existing user

### "SQLITE_CANTOPEN: unable to open database file"
- Database file doesn't exist
- Run: `npx prisma db push`

### "Network error" or "fetch failed"
- Check dev server is running
- Verify URL is correct (http://localhost:3000)
- Check firewall/antivirus isn't blocking

---

## Prevention Tips

✅ **Always run these after schema changes**:
```bash
npx prisma generate
npx prisma db push
```

✅ **Stop dev server before Prisma commands**

✅ **Use Prisma Studio for database inspection**:
```bash
npm run db:studio
```

✅ **Keep backups of your database**:
```bash
Copy-Item prisma/dev.db prisma/dev.db.backup
```

✅ **Check browser console regularly**

✅ **Test in incognito mode** to rule out cache issues

