import type { APIRoute } from 'astro';
import { prisma } from '../../../../../lib/db';
import { syncBlocksFromContent, parseBlocks, serializeBlocks } from '../../../../../lib/blocks';
import { requireAdminAuth } from '../../../../../lib/auth';

export const prerender = false;

/**
 * AI Content Regeneration Endpoint
 * 
 * Regenerates or updates chapter content using AI-generated content.
 * This endpoint allows AI agents to update existing chapters with new content.
 * 
 * Request body:
 * {
 *   content: string (required) - New markdown/LaTeX content
 *   title?: string - New title (optional, keeps existing if not provided)
 *   prompt?: string - The prompt used to generate this content
 *   metadata?: object - Additional metadata about the generation
 *   preserveBlocks?: boolean - If true, preserves existing blocks (default: true)
 * }
 */
export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    const auth = await requireAdminAuth(request, cookies);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: 'Chapter ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { content, title, prompt, metadata, preserveBlocks = true } = body;

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get current chapter
    const currentChapter = await prisma.chapter.findUnique({
      where: { id: parseInt(id) },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });

    if (!currentChapter) {
      return new Response(JSON.stringify({ error: 'Chapter not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Sync blocks from content markers
    const existingBlocks = preserveBlocks ? parseBlocks(currentChapter.blocks) : [];
    const syncedBlocks = syncBlocksFromContent(content, existingBlocks);
    const blocksJson = serializeBlocks(syncedBlocks);

    // Update the chapter
    const updatedChapter = await prisma.chapter.update({
      where: { id: parseInt(id) },
      data: {
        title: title || currentChapter.title,
        content,
        blocks: blocksJson
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        }
      }
    });

    return new Response(JSON.stringify({
      message: 'Chapter content regenerated successfully',
      chapter: updatedChapter,
      metadata: {
        generatedAt: new Date().toISOString(),
        prompt: prompt || null,
        preserveBlocks,
        ...metadata
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Chapter regeneration error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
