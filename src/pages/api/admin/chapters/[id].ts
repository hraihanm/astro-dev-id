import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/db';
import { syncBlocksFromContent, parseBlocks, serializeBlocks } from '../../../../lib/blocks';
import { requireAdminAuth } from '../../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ params, cookies, request }) => {
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

    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(id) },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true
          }
        },
        quizzes: {
          select: {
            id: true,
            title: true,
            quizType: true
          }
        }
      }
    });

    if (!chapter) {
      return new Response(JSON.stringify({ error: 'Chapter not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      chapter
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Chapter fetch error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ params, request, cookies }) => {
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
      console.log('No chapter ID provided');
      return new Response(JSON.stringify({ error: 'Chapter ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Chapter ID:', id);

    const body = await request.json();
    console.log('Request body:', body);
    
    const { title, order, content } = body;

    if (!title) {
      console.log('No title provided');
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Chapter data:', { title, order, content: content ? `${content.length} chars` : 'null' });

    // Get current chapter to check if order changed and get existing blocks
    const currentChapter = await prisma.chapter.findUnique({
      where: { id: parseInt(id) }
    });

    if (!currentChapter) {
      return new Response(JSON.stringify({ error: 'Chapter not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If order changed, reorder other chapters
    if (order && order !== currentChapter.order) {
      const courseId = currentChapter.courseId;
      const oldOrder = currentChapter.order;
      const newOrder = parseInt(order);

      // Get all chapters for this course
      const allChapters = await prisma.chapter.findMany({
        where: { courseId },
        orderBy: { order: 'asc' }
      });

      // Reorder logic
      if (newOrder > oldOrder) {
        // Moving down: shift chapters between oldOrder+1 and newOrder up
        for (const chapter of allChapters) {
          if (chapter.id !== parseInt(id) && chapter.order > oldOrder && chapter.order <= newOrder) {
            await prisma.chapter.update({
              where: { id: chapter.id },
              data: { order: chapter.order - 1 }
            });
          }
        }
      } else {
        // Moving up: shift chapters between newOrder and oldOrder-1 down
        for (const chapter of allChapters) {
          if (chapter.id !== parseInt(id) && chapter.order >= newOrder && chapter.order < oldOrder) {
            await prisma.chapter.update({
              where: { id: chapter.id },
              data: { order: chapter.order + 1 }
            });
          }
        }
      }
    }

    // Sync blocks from content markers
    const existingBlocks = parseBlocks(currentChapter.blocks);
    const syncedBlocks = content ? syncBlocksFromContent(content, existingBlocks) : [];
    const blocksJson = serializeBlocks(syncedBlocks);
    
    console.log('Synced blocks:', blocksJson);

    // Update the chapter
    const updatedChapter = await prisma.chapter.update({
      where: { id: parseInt(id) },
      data: {
        title,
        order: order ? parseInt(order) : currentChapter.order,
        content: content || null,
        blocks: blocksJson || null
      }
    });

    return new Response(JSON.stringify({
      message: 'Chapter updated successfully',
      chapter: updatedChapter
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Chapter update error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ params, cookies, request }) => {
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

    // Get chapter to reorder others
    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(id) }
    });

    if (!chapter) {
      return new Response(JSON.stringify({ error: 'Chapter not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete the chapter
    await prisma.chapter.delete({
      where: { id: parseInt(id) }
    });

    // Reorder remaining chapters
    const remainingChapters = await prisma.chapter.findMany({
      where: { 
        courseId: chapter.courseId,
        order: { gt: chapter.order }
      },
      orderBy: { order: 'asc' }
    });

    for (const ch of remainingChapters) {
      await prisma.chapter.update({
        where: { id: ch.id },
        data: { order: ch.order - 1 }
      });
    }

    return new Response(JSON.stringify({
      message: 'Chapter deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Chapter deletion error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

