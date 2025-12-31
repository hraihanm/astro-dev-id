/**
 * Essay file management utilities
 * Handles cleanup of essay files from Vercel Blob Storage
 */

import { del } from '@vercel/blob';

/**
 * Delete essay files from Vercel Blob Storage
 * @param fileUrls Array of blob URLs to delete
 */
export async function deleteEssayFiles(fileUrls: string[]): Promise<void> {
  if (!fileUrls || fileUrls.length === 0) {
    return;
  }

  const deletePromises = fileUrls.map(async (url) => {
    try {
      await del(url);
    } catch (error) {
      // Log error but don't throw - continue deleting other files
      console.error(`Failed to delete file ${url}:`, error);
    }
  });

  await Promise.allSettled(deletePromises);
}

/**
 * Extract file URLs from essayFiles JSON string
 * @param essayFiles JSON string or array of file URLs
 * @returns Array of file URLs
 */
export function extractEssayFileUrls(essayFiles: string | string[] | null | undefined): string[] {
  if (!essayFiles) {
    return [];
  }

  if (Array.isArray(essayFiles)) {
    return essayFiles;
  }

  if (typeof essayFiles === 'string') {
    try {
      const parsed = JSON.parse(essayFiles);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      // If parsing fails, treat as single URL
      return [essayFiles];
    }
  }

  return [];
}

/**
 * Cleanup essay files for a quiz attempt
 * @param attempt Essay files data from attempt (string or array)
 */
export async function cleanupAttemptFiles(attempt: { essayFiles?: string | string[] | null }): Promise<void> {
  const fileUrls = extractEssayFileUrls(attempt.essayFiles);
  if (fileUrls.length > 0) {
    await deleteEssayFiles(fileUrls);
  }
}

