# Image Upload & Path Replacement Solution

## Problem Statement

Users need to:
1. Upload images as zip/rar archives
2. Extract images to a persistent location
3. Update markdown image paths from relative (`![](./OSK2012_rf/media/image3.jpg)`) to absolute URLs

## Current Constraints

- No file storage system implemented
- Using Vercel (serverless, ephemeral filesystem)
- Chapter editor has image path rewriting logic but no upload endpoint
- Need to support both development and production

## Recommended Solution: Phased Approach

### Phase 1: Local Filesystem (Development) ✅

**Storage Location:**
```
public/uploads/quizzes/{quizId}/{timestamp}/
  └── {extracted-structure}/
      └── media/
          └── *.jpg, *.png, etc.
```

**URL Structure:**
```
/uploads/quizzes/{quizId}/{timestamp}/OSK2012_rf/media/image3.jpg
```

**Pros:**
- ✅ Simple implementation
- ✅ Works for development
- ✅ No external dependencies
- ✅ Fast to implement

**Cons:**
- ❌ Files lost on Vercel redeploy (ephemeral filesystem)
- ❌ Not suitable for production on Vercel

### Phase 2: Vercel Blob Storage (Production) 🔄

**Migration Path:**
- Keep same API interface
- Swap storage backend
- No client changes needed

**Pros:**
- ✅ Persistent across deployments
- ✅ Built-in for Vercel
- ✅ Free tier available
- ✅ CDN-backed

## Implementation Plan

### 1. API Endpoint: `/api/admin/quiz/[id]/upload-images`

**Request:**
```typescript
POST /api/admin/quiz/[id]/upload-images
Content-Type: multipart/form-data

{
  archive: File (zip/rar),
  quizId: number
}
```

**Response:**
```typescript
{
  success: true,
  uploadedCount: 5,
  pathMapping: {
    "./OSK2012_rf/media/image1.jpg": "/uploads/quizzes/23/1234567890/OSK2012_rf/media/image1.jpg",
    "./OSK2012_rf/media/image2.jpg": "/uploads/quizzes/23/1234567890/OSK2012_rf/media/image2.jpg",
    // ...
  },
  basePath: "/uploads/quizzes/23/1234567890/"
}
```

### 2. Path Replacement Utility

**Function:**
```typescript
function replaceImagePaths(
  markdown: string,
  pathMapping: Record<string, string>
): string {
  // Find all image references: ![](./path/to/image.jpg)
  // Replace with new paths from mapping
}
```

### 3. UI Integration

**In Quiz Editor (`/admin/quizzes/[id]/edit`):**
- Add "Upload Images" button
- File input for zip/rar
- Progress indicator
- Auto-update markdown after upload

## Technical Details

### Dependencies Needed

```json
{
  "adm-zip": "^0.5.10",  // ZIP extraction
  "node-unrar-js": "^0.3.0"  // RAR extraction (optional)
}
```

### File Structure

```
src/
  └── lib/
      └── image-upload.ts  // Upload & extraction logic
      └── path-replacer.ts  // Markdown path replacement
  └── pages/
      └── api/
          └── admin/
              └── quiz/
                  └── [id]/
                      └── upload-images.ts
```

### Security Measures

1. **File Type Validation:**
   - Only allow: `.zip`, `.rar`
   - Validate archive contents (images only)

2. **Size Limits:**
   - Archive: 50MB max
   - Individual image: 10MB max

3. **Path Sanitization:**
   - Prevent path traversal (`../`)
   - Sanitize filenames
   - Validate allowed extensions (`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`)

4. **Access Control:**
   - Admin-only endpoint
   - Verify quiz ownership

## Workflow

```
1. User clicks "Upload Images" in quiz editor
   ↓
2. Select zip/rar file
   ↓
3. Upload to /api/admin/quiz/[id]/upload-images
   ↓
4. Server validates & extracts archive
   ↓
5. Server stores images in public/uploads/quizzes/{quizId}/{timestamp}/
   ↓
6. Server scans markdown for image references
   ↓
7. Server returns path mapping
   ↓
8. Client replaces paths in markdown
   ↓
9. Updated markdown saved to quiz
```

## Example Usage

**Before:**
```markdown
Soal 1: Perhatikan gambar berikut!

![](./OSK2012_rf/media/image3.jpg)

Jawablah pertanyaan berdasarkan gambar di atas.
```

**After Upload:**
```markdown
Soal 1: Perhatikan gambar berikut!

![](/uploads/quizzes/23/1704067200000/OSK2012_rf/media/image3.jpg)

Jawablah pertanyaan berdasarkan gambar di atas.
```

## Migration to Vercel Blob (Future)

When ready for production:

1. Install `@vercel/blob`
2. Update `image-upload.ts` to use Vercel Blob API
3. Keep same API interface
4. Update path structure to use blob URLs

**Vercel Blob URLs:**
```
https://{blob-id}.public.blob.vercel-storage.com/quizzes/23/image3.jpg
```

## Alternatives Considered

### Option A: Database BLOB Storage
- ❌ Not suitable for large files
- ❌ Database bloat
- ❌ Performance issues

### Option B: External CDN (Cloudflare R2, S3)
- ✅ Most scalable
- ❌ More complex setup
- ❌ Additional service to manage
- ✅ Good for future scaling

## Next Steps

1. ✅ Create implementation plan (this document)
2. ⏳ Implement Phase 1 (local filesystem)
3. ⏳ Add UI integration
4. ⏳ Test with real archives
5. ⏳ Plan Phase 2 (Vercel Blob) migration

