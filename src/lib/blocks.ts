/**
 * Block system for interactive content in chapters
 * Supports hybrid approach: markdown for static content, blocks for interactive elements
 */

export type BlockType = 'quiz' | 'simulation' | 'code-editor' | 'interactive-diagram';

export interface BaseBlock {
  id: string; // Unique identifier (e.g., "block-0", "block-1")
  type: BlockType;
  position: number; // Character position in markdown content where block should be inserted
}

export interface QuizBlock extends BaseBlock {
  type: 'quiz';
  quizId: number;
  inline?: boolean; // If true, render as inline quiz (Khan Academy style)
}

export interface SimulationBlock extends BaseBlock {
  type: 'simulation';
  simId?: number; // If using a simulation database
  sourceUrl?: string; // External URL for iframe
  embedCode?: string; // Custom embed code
  config?: Record<string, any>; // Configuration parameters
}

export interface CodeEditorBlock extends BaseBlock {
  type: 'code-editor';
  language: string;
  initialCode?: string;
  solution?: string;
}

export interface InteractiveDiagramBlock extends BaseBlock {
  type: 'interactive-diagram';
  diagramId?: number;
  config?: Record<string, any>;
}

export type InteractiveBlock = QuizBlock | SimulationBlock | CodeEditorBlock | InteractiveDiagramBlock;

/**
 * Parse blocks JSON string to array
 */
export function parseBlocks(blocksJson: string | null): InteractiveBlock[] {
  if (!blocksJson) return [];
  try {
    return JSON.parse(blocksJson) as InteractiveBlock[];
  } catch (error) {
    console.error('Error parsing blocks JSON:', error);
    return [];
  }
}

/**
 * Serialize blocks array to JSON string
 */
export function serializeBlocks(blocks: InteractiveBlock[]): string {
  return JSON.stringify(blocks);
}

/**
 * Insert block markers into markdown content
 * This allows blocks to be positioned within the markdown
 */
export function insertBlockMarkers(content: string, blocks: InteractiveBlock[]): string {
  if (!blocks || blocks.length === 0) return content;
  
  // Sort blocks by position (descending) to insert from end to start
  const sortedBlocks = [...blocks].sort((a, b) => b.position - a.position);
  
  let result = content;
  for (const block of sortedBlocks) {
    const marker = `<!-- BLOCK:${block.type}:${block.id} -->`;
    // Insert marker at position
    result = result.slice(0, block.position) + marker + result.slice(block.position);
  }
  
  return result;
}

/**
 * Extract block markers from markdown content
 * Returns array of { marker, blockId, type, position }
 */
export function extractBlockMarkers(content: string): Array<{
  marker: string;
  blockId: string;
  type: BlockType;
  position: number;
}> {
  const markers: Array<{ marker: string; blockId: string; type: BlockType; position: number }> = [];
  const regex = /<!-- BLOCK:(\w+):([\w-]+) -->/g;
  
  let match;
  while ((match = regex.exec(content)) !== null) {
    markers.push({
      marker: match[0],
      type: match[1] as BlockType,
      blockId: match[2],
      position: match.index
    });
  }
  
  return markers;
}

/**
 * Remove block markers from content (for editing)
 */
export function removeBlockMarkers(content: string): string {
  return content.replace(/<!-- BLOCK:\w+:[\w-]+ -->/g, '');
}

/**
 * Find block by ID
 */
export function findBlockById(blocks: InteractiveBlock[], blockId: string): InteractiveBlock | undefined {
  return blocks.find(b => b.id === blockId);
}

/**
 * Generate unique block ID
 */
export function generateBlockId(blocks: InteractiveBlock[]): string {
  let index = 0;
  while (blocks.some(b => b.id === `block-${index}`)) {
    index++;
  }
  return `block-${index}`;
}

/**
 * Split rendered HTML content at block marker positions
 * Returns an array of content segments and block IDs in order
 */
export function splitContentAtMarkers(
  renderedHtml: string,
  blocks: InteractiveBlock[]
): Array<{ type: 'content'; html: string } | { type: 'block'; block: InteractiveBlock }> {
  if (!blocks || blocks.length === 0) {
    return renderedHtml ? [{ type: 'content', html: renderedHtml }] : [];
  }

  const result: Array<{ type: 'content'; html: string } | { type: 'block'; block: InteractiveBlock }> = [];
  const markerRegex = /<!-- BLOCK:(\w+):([\w-]+) -->/g;
  
  let lastIndex = 0;
  let match;

  while ((match = markerRegex.exec(renderedHtml)) !== null) {
    // Add content before this marker
    if (match.index > lastIndex) {
      const contentBefore = renderedHtml.slice(lastIndex, match.index);
      if (contentBefore.trim()) {
        result.push({ type: 'content', html: contentBefore });
      }
    }

    // Find the block for this marker
    const blockId = match[2];
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      result.push({ type: 'block', block });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining content after last marker
  if (lastIndex < renderedHtml.length) {
    const remainingContent = renderedHtml.slice(lastIndex);
    if (remainingContent.trim()) {
      result.push({ type: 'content', html: remainingContent });
    }
  }

  // If no markers were found, return the full content followed by all blocks
  if (result.length === 0 && renderedHtml) {
    result.push({ type: 'content', html: renderedHtml });
    // Append blocks at the end if no markers in content
    for (const block of blocks) {
      result.push({ type: 'block', block });
    }
  } else if (result.length > 0) {
    // Check if there are blocks without markers in content - append them at end
    const blockIdsInContent = new Set<string>();
    let m;
    const checkRegex = /<!-- BLOCK:(\w+):([\w-]+) -->/g;
    while ((m = checkRegex.exec(renderedHtml)) !== null) {
      blockIdsInContent.add(m[2]);
    }
    for (const block of blocks) {
      if (!blockIdsInContent.has(block.id)) {
        result.push({ type: 'block', block });
      }
    }
  }

  return result;
}

