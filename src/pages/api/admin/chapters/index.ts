import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/db';
import { requireAdminAuth } from '../../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const auth = await requireAdminAuth(request, cookies);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { courseId, title, order, content } = body;

    if (!courseId || !title) {
      return new Response(JSON.stringify({ error: 'Course ID and title are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) }
    });

    if (!course) {
      return new Response(JSON.stringify({ error: 'Course not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // If order is specified and conflicts, shift other chapters
    if (order) {
      const existingChapters = await prisma.chapter.findMany({
        where: { 
          courseId: parseInt(courseId),
          order: { gte: parseInt(order) }
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

    // Create the chapter
    const newChapter = await prisma.chapter.create({
      data: {
        courseId: parseInt(courseId),
        title,
        order: order ? parseInt(order) : 1,
        content: content || null
      }
    });

    return new Response(JSON.stringify({
      message: 'Chapter created successfully',
      chapter: newChapter
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Chapter creation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

