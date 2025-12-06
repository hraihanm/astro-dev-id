import type { APIRoute } from 'astro';
import { prisma } from '../../../../../../lib/db';
import { syncBlocksFromContent, serializeBlocks } from '../../../../../../lib/blocks';
import { requireAdminAuth } from '../../../../../../lib/auth';

export const prerender = false;

/**
 * AI Content Generation Endpoint
 * 
 * Generates a new chapter for a course based on AI-provided content.
 * This endpoint is designed for AI agents to create educational content.
 * 
 * Request body:
 * {
 *   title: string (required) - Chapter title
 *   order?: number - Chapter order (auto-calculated if not provided)
 *   content: string (required) - Markdown/LaTeX content
 *   prompt?: string - The prompt used to generate this content (for reference)
 *   metadata?: object - Additional metadata about the generation
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
      return new Response(JSON.stringify({ error: 'Course ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { title, order, content, prompt, metadata } = body;

    if (!title || !content) {
      return new Response(JSON.stringify({ 
        error: 'Title and content are required',
        received: { title: !!title, content: !!content }
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) }
    });

    if (!course) {
      return new Response(JSON.stringify({ error: 'Course not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Determine order if not provided
    let chapterOrder = order;
    if (!chapterOrder) {
      const maxOrder = await prisma.chapter.findFirst({
        where: { courseId: parseInt(id) },
        orderBy: { order: 'desc' },
        select: { order: true }
      });
      chapterOrder = maxOrder ? maxOrder.order + 1 : 1;
    } else {
      // If order is specified and conflicts, shift other chapters
      const existingChapters = await prisma.chapter.findMany({
        where: { 
          courseId: parseInt(id),
          order: { gte: parseInt(chapterOrder) }
        },
        orderBy: { order: 'desc' }
      });

      // Shift existing chapters down
      for (const chapter of existingChapters) {
        await prisma.chapter.update({
          where: { id: chapter.id },
          data: { order: chapter.order + 1 }
        });
      }
    }

    // Sync blocks from content markers
    const syncedBlocks = syncBlocksFromContent(content, []);
    const blocksJson = serializeBlocks(syncedBlocks);

    // Create the chapter
    const newChapter = await prisma.chapter.create({
      data: {
        courseId: parseInt(id),
        title,
        order: parseInt(chapterOrder),
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
      message: 'Chapter generated successfully',
      chapter: newChapter,
      metadata: {
        generatedAt: new Date().toISOString(),
        prompt: prompt || null,
        ...metadata
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Chapter generation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
