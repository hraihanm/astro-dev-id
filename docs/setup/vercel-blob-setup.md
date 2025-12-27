# Vercel Blob Storage Setup

## Overview

This application uses Vercel Blob Storage for persistent image storage. Images uploaded via ZIP archives are stored in Vercel Blob and automatically referenced in quiz questions.

## Setup Instructions

### 1. Install Vercel Blob Package

The package is already installed:
```bash
npm install @vercel/blob adm-zip
```

### 2. Configure Vercel Blob Token

#### Option A: Vercel Dashboard (Recommended for Production)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: Your Vercel Blob token (get it from Vercel dashboard → Storage → Blob)

#### Option B: Local Development

1. Get your Blob token from Vercel dashboard
2. Create a `.env` file in the project root:
   ```
   BLOB_READ_WRITE_TOKEN=your_token_here
   ```

### 3. Enable Vercel Blob in Your Project

1. Go to Vercel Dashboard → Your Project → **Storage**
2. Click **Create Database** → Select **Blob**
3. Follow the setup wizard
4. Copy the `BLOB_READ_WRITE_TOKEN` from the storage settings

### 4. Verify Setup

The application will automatically use the token from environment variables. No code changes needed.

## Usage

### Uploading Images

1. Go to Quiz Editor (`/admin/quizzes/[id]/edit`)
2. Scroll to **Upload Images** section
3. Click **+ Upload Images from ZIP Archive**
4. Select a ZIP file containing images
5. Click **Upload Images**

### Image Path Format

Images in your markdown should use relative paths:
```markdown
![](./OSK2012_rf/media/image3.jpg)
```

After upload, paths are automatically updated to blob URLs:
```markdown
![](https://[blob-id].public.blob.vercel-storage.com/quizzes/23/1234567890/OSK2012_rf/media/image3.jpg)
```

### Supported Formats

- **Archive**: ZIP only (`.zip`)
- **Images**: JPG, JPEG, PNG, GIF, WebP, SVG
- **Max Archive Size**: 50MB
- **Max Image Size**: 10MB per image

## Troubleshooting

### Error: "BLOB_READ_WRITE_TOKEN is not set"

**Solution**: Make sure you've set the environment variable in Vercel dashboard or `.env` file.

### Error: "Failed to upload images"

**Possible causes**:
- Invalid blob token
- Network issues
- File size exceeds limits

**Solution**: 
1. Verify token is correct
2. Check file sizes
3. Check Vercel Blob storage quota

### Images Not Updating in Quiz

**Solution**: 
1. Check browser console for errors
2. Verify paths in markdown match archive structure
3. Ensure images are in correct format

## Storage Structure

Images are stored with the following structure:
```
quizzes/{quizId}/{timestamp}/{original-path}
```

Example:
```
quizzes/23/1704067200000/OSK2012_rf/media/image3.jpg
```

## Security

- Only admins can upload images
- File type validation (images only)
- Size limits enforced
- Path sanitization prevents directory traversal
- Public access for uploaded images (CDN-backed)

## Cost

Vercel Blob Storage pricing:
- **Free Tier**: 1GB storage, 100GB bandwidth/month
- **Pro**: $0.15/GB storage, $0.40/GB bandwidth

See [Vercel Pricing](https://vercel.com/pricing) for details.

