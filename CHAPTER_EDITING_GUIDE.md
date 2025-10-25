# Chapter Editing Guide

## Full Chapter Management Now Available! 🎉

You can now create, edit, and delete chapters directly through the admin interface - no more Prisma Studio required!

## Features

### ✅ What You Can Do

1. **Create New Chapters** - Add chapters through a user-friendly form
2. **Edit Existing Chapters** - Modify title, content, and order
3. **Delete Chapters** - Remove chapters with automatic reordering
4. **Reorder Chapters** - Change chapter sequence easily
5. **Preview Content** - See how markdown/LaTeX renders
6. **Quick Reference** - Built-in markdown and LaTeX help

## How to Use

### Access Chapter Editing

**From Course Edit Page:**
1. Go to `/admin/courses`
2. Click "Edit" on any course
3. You'll see a list of all chapters
4. Click "Edit" next to any chapter

**Direct URL:**
```
http://localhost:3000/admin/courses/1/chapters/1/edit
```
- Replace `1` (first) with your course ID
- Replace `1` (second) with your chapter ID

### Create a New Chapter

1. **Navigate to course edit page**:
   ```
   http://localhost:3000/admin/courses/[courseId]/edit
   ```

2. **Click "Add Chapter" button**

3. **Fill in the form**:
   - **Title**: Chapter name (e.g., "Chapter 1: Introduction")
   - **Order**: Position in course (auto-suggested)
   - **Content**: Your markdown + LaTeX content

4. **Click "Create Chapter"**

### Edit an Existing Chapter

1. **From course edit page**, click "Edit" next to any chapter

2. **Modify any fields**:
   - Change the title
   - Update the order (chapters will auto-reorder)
   - Edit the content (supports markdown + LaTeX)

3. **Use the preview** (click "Refresh Preview" to see rendered content)

4. **Click "Save Changes"**

### Delete a Chapter

1. Open the chapter edit page
2. Click the red **"Delete Chapter"** button
3. Confirm the deletion
4. Remaining chapters will automatically renumber

### Reorder Chapters

**Option 1: Through Edit Page**
1. Edit a chapter
2. Change the "Order" field
3. Save changes
4. Other chapters automatically adjust

**Option 2: Delete and Recreate**
1. Delete chapters you want to move
2. Create them again with new order numbers

## Content Formatting

### Markdown Support

```markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text**
*Italic text*

- Bullet point
- Another point

1. Numbered list
2. Another item

[Link text](https://example.com)
![Image alt text](image-url.jpg)
```

### LaTeX Math

**Inline Math** (within text):
```
The formula $E = mc^2$ is Einstein's mass-energy equivalence.
```

**Display Math** (centered, separate line):
```
$$
\int_0^1 x^2 dx = \frac{1}{3}
$$
```

**Common LaTeX Commands**:
- Fractions: `$\frac{a}{b}$`
- Square root: `$\sqrt{x}$`
- Subscript: `$x_1$`
- Superscript: `$x^2$`
- Greek letters: `$\alpha, \beta, \gamma$`
- Sum: `$\sum_{i=1}^{n} x_i$`
- Integral: `$\int_a^b f(x) dx$`

### Example Chapter Content

```markdown
# Introduction to Calculus

Welcome to Chapter 1! In this chapter, we'll explore the fundamental concepts of calculus.

## What is a Derivative?

The derivative of a function $f(x)$ represents the rate of change. It's defined as:

$$
f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}
$$

### Example

For the function $f(x) = x^2$, the derivative is:

$$
f'(x) = 2x
$$

## Key Points

- Derivatives measure **instantaneous rate of change**
- They're fundamental to optimization problems
- Used extensively in physics, engineering, and economics

## Practice Problems

1. Find the derivative of $f(x) = 3x^2 + 2x + 1$
2. Calculate $\frac{d}{dx}(\sin x)$
3. Determine where $f(x) = x^3 - 3x$ has critical points
```

## Preview Feature

The chapter editor includes a preview button:

1. Write your content with markdown and LaTeX
2. Click **"Refresh Preview"**
3. See how it will look to students
4. Make adjustments as needed

**Note**: Preview is basic - actual rendering in the course view will use KaTeX for proper math display.

## Smart Reordering

When you change a chapter's order or delete a chapter, the system automatically:

1. **Moves other chapters** to maintain sequence
2. **Prevents gaps** in numbering
3. **Updates links** in the course view
4. **Maintains consistency** across the site

### Example

**Current order**: Chapter 1, 2, 3, 4, 5

**If you delete Chapter 3**:
- Chapter 4 becomes Chapter 3
- Chapter 5 becomes Chapter 4
- Automatic renumbering!

**If you change Chapter 5 to Chapter 2**:
- Old Chapter 2 becomes Chapter 3
- Old Chapter 3 becomes Chapter 4
- Old Chapter 4 becomes Chapter 5
- Old Chapter 5 becomes Chapter 2
- Smart reordering!

## API Endpoints

### Chapter Management APIs

- `POST /api/admin/chapters` - Create new chapter
- `PUT /api/admin/chapters/[id]` - Update chapter
- `DELETE /api/admin/chapters/[id]` - Delete chapter

All endpoints require admin authentication.

## Tips & Best Practices

### Content Organization

1. **Start with outline** - Plan chapter structure first
2. **Use headers** - Break content into sections
3. **Add examples** - Include practice problems
4. **Progressive difficulty** - Start simple, increase complexity
5. **Visual aids** - Use LaTeX for diagrams and equations

### Chapter Naming

Good examples:
- ✅ "Chapter 1: Introduction to Algebra"
- ✅ "Week 1: Variables and Expressions"
- ✅ "Lesson 3: Solving Linear Equations"

Avoid:
- ❌ "Chapter 1"
- ❌ "Stuff"
- ❌ "Content Goes Here"

### Order Management

- Start at 1
- Use consecutive numbers
- Let the system handle reordering
- Don't worry about gaps

### LaTeX Tips

1. **Test equations** - Use preview before saving
2. **Escape special characters** - Use `\{`, `\}` for braces
3. **Use proper delimiters** - `$...$` inline, `$$...$$` display
4. **Keep it readable** - Add spaces for clarity
5. **Reference resources** - Check LaTeX documentation

## Troubleshooting

### "Chapter not found" Error

- Verify the chapter ID exists
- Check that it belongs to the correct course
- Refresh the course edit page

### Preview Not Working

- Check markdown syntax
- Ensure LaTeX is properly delimited
- Look for unclosed brackets/parentheses
- Try smaller sections first

### Changes Not Saving

- Ensure title is filled out
- Check that order is a valid number
- Verify you're logged in as admin
- Check browser console for errors

### Reordering Issues

- Orders must be positive integers
- Can't have duplicate orders in same course
- System automatically resolves conflicts

## Keyboard Shortcuts

When editing content:

- `Tab` - Indent (in textarea)
- `Shift + Tab` - Outdent
- `Ctrl/Cmd + S` - Save (if browser allows)
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo

## Quick Reference Card

### URLs
- Edit Chapter: `/admin/courses/[courseId]/chapters/[chapterId]/edit`
- New Chapter: `/admin/courses/[courseId]/chapters/new`
- View Chapter (Student): `/courses/[slug]/chapter/[order]`

### Actions
- **Create**: Click "Add Chapter" from course edit page
- **Edit**: Click "Edit" next to chapter
- **Delete**: Click red "Delete Chapter" button
- **Reorder**: Change order number and save
- **Preview**: Click "Refresh Preview"

### Formatting
- **Bold**: `**text**`
- **Italic**: `*text*`
- **Math**: `$equation$` or `$$equation$$`
- **Link**: `[text](url)`
- **Image**: `![alt](url)`

---

## Next Steps

Now that you have full chapter editing:

1. ✅ Create courses
2. ✅ Add chapters with content
3. ✅ Edit and reorder as needed
4. ✅ Delete outdated content
5. ✅ View as students see it

**No more Prisma Studio required for basic content management!** 🎉

---

**Status**: ✅ Fully Functional
**Version**: 1.0
**Last Updated**: October 24, 2025

