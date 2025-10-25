# Course Editing Guide

## How to Edit Courses

You can now fully edit courses through the admin interface!

### Accessing Course Editor

1. **Sign in as admin** at `/auth/signin`

2. **Go to Course Management** at `/admin/courses`

3. **Click "Edit"** on any course

4. **Or directly visit**:
   ```
   http://localhost:3000/admin/courses/[COURSE_ID]/edit
   ```
   Example: `http://localhost:3000/admin/courses/1/edit`

### What You Can Edit

#### Basic Information
- **Course Title** - The main title of your course
- **Course Slug** - URL-friendly identifier (e.g., `intro-astronomy`)
- **Description** - Brief description of the course

#### Course Structure
- **View All Chapters** - See all chapters in order
- **Edit Chapters** - Click "Edit" next to any chapter (feature coming soon)
- **Add New Chapters** - Click "Add Chapter" button (feature coming soon)

#### Course Management
- **Save Changes** - Updates the course information
- **Delete Course** - Permanently removes the course (with confirmation)
- **Cancel** - Returns to course list without saving

### Course Actions

#### Update Course Information

1. Edit the fields you want to change
2. Click **"Save Changes"**
3. You'll be redirected back to the course list

#### Delete a Course

1. Click the **"Delete Course"** button (red button at bottom left)
2. Confirm the deletion in the popup
3. The course and all its chapters/quizzes will be permanently deleted

⚠️ **Warning**: Deletion cannot be undone!

### Current Features

✅ **Available Now**:
- Edit course title, slug, and description
- View list of chapters
- Delete entire course
- Real-time form validation
- Error handling

🚧 **Coming Soon**:
- Chapter editing through UI
- Chapter creation through UI
- Reorder chapters
- Quiz editing through UI
- Bulk operations

### For Now: Chapter Management

To manage chapters, use **Prisma Studio**:

```bash
npm run db:studio
```

Then:
1. Go to the **Chapter** table
2. Add, edit, or delete chapters
3. Set the `courseId` to link to your course
4. Set the `order` field to control chapter sequence
5. Add markdown/LaTeX content to the `content` field

### API Endpoints

The following API endpoints power the course editing:

- `PUT /api/admin/courses/[id]` - Update course
- `DELETE /api/admin/courses/[id]` - Delete course

### Example Workflow

1. **Create a course** at `/admin/courses/new`
2. **Edit the course** at `/admin/courses/1/edit`
3. **Add chapters** via Prisma Studio
4. **Go back and verify** the chapters appear in the edit page
5. **Students can now view** at `/courses/[slug]`

### Troubleshooting

#### "404 Not Found" Error

**Before the fix**: The edit page didn't exist.
**After the fix**: The page now exists at `/admin/courses/[id]/edit`

If you still see 404:
1. Make sure you're using a valid course ID
2. Restart the dev server: `npm run dev`
3. Check that the course exists in the database

#### "Course not found" Redirect

This means the course ID doesn't exist in the database. Check:
1. The course ID is correct
2. The course hasn't been deleted
3. Visit `/admin/courses` to see all available courses

#### Changes Not Saving

1. Check the browser console for errors
2. Ensure you're signed in as admin
3. Verify the course slug isn't already used by another course
4. Check that title and slug fields aren't empty

### Security Notes

- ✅ Requires admin authentication
- ✅ Validates slug uniqueness
- ✅ Confirmation before deletion
- ✅ Cascading deletion of chapters/quizzes
- ✅ Input validation on both client and server

### Navigation

From the course edit page, you can:

- **Back to Courses** - Returns to course list
- **Cancel** - Returns to course list without saving
- **View Course** - See how students see the course
- **Save Changes** - Update and return to list
- **Delete Course** - Remove course entirely

---

## Quick Reference

### URLs
- Course List: `/admin/courses`
- Create Course: `/admin/courses/new`
- Edit Course: `/admin/courses/[id]/edit`
- View Course (Student): `/courses/[slug]`

### Commands
```bash
# Start dev server
npm run dev

# Open database manager
npm run db:studio

# View course ID in database
# Open Prisma Studio → Course table
```

### Files Created
- `src/pages/admin/courses/[id]/edit.astro` - Edit page
- `src/pages/api/admin/courses/[id].ts` - Update/Delete API

---

**Status**: ✅ Fully Functional
**Version**: 1.0
**Last Updated**: October 24, 2025

