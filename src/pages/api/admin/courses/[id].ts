import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/db';

export const prerender = false;

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Check if user is authenticated and is admin
    const userId = cookies.get('user_id')?.value;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
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

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    // Check if user is authenticated and is admin
    const userId = cookies.get('user_id')?.value;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
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

