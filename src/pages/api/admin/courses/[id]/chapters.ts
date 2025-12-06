import type { APIRoute } from 'astro';
import { prisma } from '../../../../../lib/db';
import { requireAdminAuth } from '../../../../../lib/auth';

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
      return new Response(JSON.stringify({ error: 'Course ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, title: true }
    });

    if (!course) {
      return new Response(JSON.stringify({ error: 'Course not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const chapters = await prisma.chapter.findMany({
      where: { courseId: parseInt(id) },
      orderBy: { order: 'asc' },
      include: {
        quizzes: {
          select: {
            id: true,
            title: true,
            quizType: true
          }
        }
      }
    });

    return new Response(JSON.stringify({
      course: {
        id: course.id,
        title: course.title
      },
      chapters,
      count: chapters.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Chapters fetch error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
