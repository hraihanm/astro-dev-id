/**
 * Image upload utilities for Vercel Blob Storage
 * Handles archive extraction and image upload
 */

import { put } from '@vercel/blob';
import AdmZip from 'adm-zip';
import path from 'path';

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
const MAX_ARCHIVE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB per image

/**
 * Sanitize filename to prevent path traversal and invalid characters
 */
function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '').replace(/\/+/g, '/');
  
  // Remove leading slashes
  sanitized = sanitized.replace(/^\/+/, '');
  
  // Remove invalid characters (keep alphanumeric, dots, hyphens, underscores, slashes)
  sanitized = sanitized.replace(/[^a-zA-Z0-9._\-\/]/g, '_');
  
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
 * Extract images from ZIP archive
 */
export async function extractImagesFromZip(
  archiveBuffer: Buffer,
  quizId: number
): Promise<{ path: string; buffer: Buffer }[]> {
  const zip = new AdmZip(archiveBuffer);
  const entries = zip.getEntries();
  const images: { path: string; buffer: Buffer }[] = [];

  for (const entry of entries) {
    // Skip directories
    if (entry.isDirectory) continue;

    const filename = entry.entryName;
    
    // Validate image file
    if (!isValidImage(filename)) {
      console.warn(`Skipping non-image file: ${filename}`);
      continue;
    }

    // Check file size
    if (entry.header.size > MAX_IMAGE_SIZE) {
      console.warn(`Skipping oversized image: ${filename} (${entry.header.size} bytes)`);
      continue;
    }

    try {
      const buffer = entry.getData();
      const sanitizedPath = sanitizeFilename(filename);
      
      images.push({
        path: sanitizedPath,
        buffer
      });
    } catch (error) {
      console.error(`Error extracting ${filename}:`, error);
    }
  }

  return images;
}

/**
 * Upload images to Vercel Blob Storage
 */
export async function uploadImagesToBlob(
  images: { path: string; buffer: Buffer }[],
  quizId: number
): Promise<Record<string, string>> {
  const pathMapping: Record<string, string> = {};
  const timestamp = Date.now();

  for (const image of images) {
    try {
      // Create blob path: quizzes/{quizId}/{timestamp}/{original-path}
      const blobPath = `quizzes/${quizId}/${timestamp}/${image.path}`;
      
      // Upload to Vercel Blob
      const blob = await put(blobPath, image.buffer, {
        access: 'public',
        contentType: getContentType(image.path)
      });

      // Create mapping: original relative path -> blob URL
      // Handle both ./path and path formats
      const originalPath = image.path.startsWith('./') ? image.path : `./${image.path}`;
      pathMapping[originalPath] = blob.url;
      
      // Also map without ./ prefix
      if (!image.path.startsWith('./')) {
        pathMapping[`./${image.path}`] = blob.url;
      }
    } catch (error) {
      console.error(`Error uploading ${image.path}:`, error);
      throw new Error(`Failed to upload image: ${image.path}`);
    }
  }

  return pathMapping;
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
    '.svg': 'image/svg+xml'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Validate archive file
 */
export function validateArchive(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'application/vnd.rar'];
  const validExtensions = ['.zip', '.rar'];
  
  const fileExtension = path.extname(file.name).toLowerCase();
  const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension);
  
  if (!isValidType) {
    return { valid: false, error: 'Invalid archive type. Only ZIP files are supported.' };
  }

  // Check file size
  if (file.size > MAX_ARCHIVE_SIZE) {
    return { valid: false, error: `Archive too large. Maximum size is ${MAX_ARCHIVE_SIZE / 1024 / 1024}MB.` };
  }

  return { valid: true };
}

