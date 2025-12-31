import type { APIRoute } from 'astro';
import { put } from '@vercel/blob';
import path from 'path';
import { getSessionUser } from '../../../../lib/auth-guard';

export const prerender = false;

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
const ALLOWED_PDF_EXTENSIONS = ['.pdf'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB per image
const MAX_PDF_SIZE = 20 * 1024 * 1024; // 20MB per PDF
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB total per submission

/**
 * Sanitize filename to prevent path traversal and invalid characters
 */
function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '').replace(/\/+/g, '/');
  
  // Remove leading slashes
  sanitized = sanitized.replace(/^\/+/, '');
  
  // Remove invalid characters (keep alphanumeric, dots, hyphens, underscores)
  sanitized = sanitized.replace(/[^a-zA-Z0-9._\-]/g, '_');
  
  return sanitized;
}

/**
 * Check if file is a valid image
 */
function isValidImage(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_IMAGE_EXTENSIONS.includes(ext);
}

/**
 * Check if file is a valid PDF
 */
function isValidPDF(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_PDF_EXTENSIONS.includes(ext);
}

/**
 * Get content type from file extension
 */
function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Authenticate user
  const user = await getSessionUser(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get form data
    const formData = await request.formData();
    const quizId = formData.get('quizId');
    const questionIndex = formData.get('questionIndex');
    const attemptId = formData.get('attemptId'); // Optional, for existing attempts
    const sessionId = formData.get('sessionId'); // For temporary uploads before attempt creation

    if (!quizId || questionIndex === null) {
      return new Response(JSON.stringify({ error: 'quizId and questionIndex are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const quizIdNum = parseInt(quizId as string);
    const questionIndexNum = parseInt(questionIndex as string);

    if (isNaN(quizIdNum) || isNaN(questionIndexNum)) {
      return new Response(JSON.stringify({ error: 'Invalid quizId or questionIndex' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get all files from form data
    const files: File[] = [];
    let totalSize = 0;
    
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && key.startsWith('file')) {
        files.push(value);
        totalSize += value.size;
      }
    }

    if (files.length === 0) {
      return new Response(JSON.stringify({ error: 'No files provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check total size
    if (totalSize > MAX_TOTAL_SIZE) {
      return new Response(JSON.stringify({ 
        error: `Total file size exceeds ${MAX_TOTAL_SIZE / 1024 / 1024}MB limit` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate and upload files
    const uploadedFiles: Array<{ url: string; filename: string; size: number; type: string }> = [];
    const timestamp = Date.now();
    
    // Determine upload path prefix
    // If attemptId exists, use it; otherwise use sessionId or userId+timestamp
    let pathPrefix: string;
    if (attemptId) {
      pathPrefix = `essays/${quizIdNum}/${attemptId}/${questionIndexNum}`;
    } else if (sessionId) {
      pathPrefix = `essays/${quizIdNum}/temp/${sessionId}/${questionIndexNum}`;
    } else {
      // Fallback to userId + timestamp for temporary uploads
      pathPrefix = `essays/${quizIdNum}/temp/${user.id}-${timestamp}/${questionIndexNum}`;
    }

    for (const file of files) {
      // Validate file type
      const filename = file.name;
      const isImage = isValidImage(filename);
      const isPDF = isValidPDF(filename);

      if (!isImage && !isPDF) {
        return new Response(JSON.stringify({ 
          error: `Invalid file type: ${filename}. Only images (JPG, PNG, GIF, WebP, SVG) and PDF files are allowed.` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Validate file size
      const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_PDF_SIZE;
      if (file.size > maxSize) {
        return new Response(JSON.stringify({ 
          error: `File ${filename} exceeds size limit (${maxSize / 1024 / 1024}MB)` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Sanitize filename
      const sanitizedFilename = sanitizeFilename(filename);
      const blobPath = `${pathPrefix}/${timestamp}-${sanitizedFilename}`;

      try {
        // Read file as buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Upload to Vercel Blob
        const blob = await put(blobPath, buffer, {
          access: 'public',
          contentType: getContentType(filename)
        });

        uploadedFiles.push({
          url: blob.url,
          filename: filename,
          size: file.size,
          type: isImage ? 'image' : 'pdf'
        });
      } catch (error: any) {
        console.error(`Error uploading ${filename}:`, error);
        return new Response(JSON.stringify({ 
          error: `Failed to upload file: ${filename}`,
          details: error.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles,
      totalSize: totalSize
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Essay file upload error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
