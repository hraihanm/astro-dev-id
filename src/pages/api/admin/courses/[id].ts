import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/db';
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
      return new Response(JSON.stringify({ error: 'Course ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true,
            content: true,
            blocks: true,
            createdAt: true
          }
        },
        quizzes: {
          orderBy: { id: 'desc' },
          select: {
            id: true,
            title: true,
            quizType: true,
            createdAt: true
          }
        },
        creator: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (!course) {
      return new Response(JSON.stringify({ error: 'Course not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      course
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Course fetch error:', error);
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
      return new Response(JSON.stringify({ error: 'Course ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { title, slug, description } = body;

    if (!title || !slug) {
      return new Response(JSON.stringify({ error: 'Title and slug are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if slug is already used by another course
    const existingCourse = await prisma.course.findUnique({
      where: { slug }
    });

    if (existingCourse && existingCourse.id !== parseInt(id)) {
      return new Response(JSON.stringify({ error: 'Slug already in use' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(id) },
      data: {
        title,
        slug,
        description
      }
    });

    return new Response(JSON.stringify({
      message: 'Course updated successfully',
      course: updatedCourse
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Course update error:', error);
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
      return new Response(JSON.stringify({ error: 'Course ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete all related data first
    await prisma.chapter.deleteMany({
      where: { courseId: parseInt(id) }
    });

    await prisma.quiz.deleteMany({
      where: { courseId: parseInt(id) }
    });

    // Delete the course
    await prisma.course.delete({
      where: { id: parseInt(id) }
    });

    return new Response(JSON.stringify({
      message: 'Course deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Course deletion error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

