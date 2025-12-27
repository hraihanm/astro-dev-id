/**
 * Path replacement utilities for markdown content
 * Replaces relative image paths with blob URLs
 */

/**
 * Extract all image paths from markdown content
 */
export function extractImagePaths(markdown: string): string[] {
  const imagePaths: string[] = [];
  
  // Match markdown image syntax: ![](path) or ![alt](path)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = imageRegex.exec(markdown)) !== null) {
    const imagePath = match[2].trim();
    
    // Only process relative paths (not absolute URLs or data URIs)
    if (!imagePath.startsWith('http') && 
        !imagePath.startsWith('//') && 
        !imagePath.startsWith('data:') &&
        !imagePath.startsWith('/uploads/')) {
      imagePaths.push(imagePath);
    }
  }
  
  return [...new Set(imagePaths)]; // Remove duplicates
}

/**
 * Replace image paths in markdown content
 */
export function replaceImagePaths(
  markdown: string,
  pathMapping: Record<string, string>
): string {
  let result = markdown;
  
  // Replace each path in the mapping
  for (const [oldPath, newUrl] of Object.entries(pathMapping)) {
    // Escape special regex characters in oldPath
    const escapedPath = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Replace in markdown image syntax
    // Match: ![](oldPath) or ![alt](oldPath)
    const regex = new RegExp(`(!\\[[^\\]]*\\]\\()${escapedPath}(\\))`, 'g');
    result = result.replace(regex, `$1${newUrl}$2`);
  }
  
  return result;
}

/**
 * Create path mapping from extracted paths and blob URLs
 * Handles various path formats (./path, path, etc.)
 */
export function createPathMapping(
  extractedPaths: string[],
  pathMapping: Record<string, string>
): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  for (const extractedPath of extractedPaths) {
    // Try to find matching blob URL
    // Check exact match first
    if (pathMapping[extractedPath]) {
      mapping[extractedPath] = pathMapping[extractedPath];
      continue;
    }
    
    // Try with ./ prefix
    const withPrefix = extractedPath.startsWith('./') ? extractedPath : `./${extractedPath}`;
    if (pathMapping[withPrefix]) {
      mapping[extractedPath] = pathMapping[withPrefix];
      continue;
    }
    
    // Try without ./ prefix
    const withoutPrefix = extractedPath.startsWith('./') ? extractedPath.slice(2) : extractedPath;
    if (pathMapping[withoutPrefix]) {
      mapping[extractedPath] = pathMapping[withoutPrefix];
      continue;
    }
    
    // Try normalized path (handle different separators)
    const normalized = extractedPath.replace(/\\/g, '/');
    if (pathMapping[normalized]) {
      mapping[extractedPath] = pathMapping[normalized];
      continue;
    }
    
    // If no match found, log warning
    console.warn(`No blob URL found for path: ${extractedPath}`);
  }
  
  return mapping;
}

