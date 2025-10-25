import type { APIRoute } from 'astro';
import { createCourse, createChapter } from '../../../lib/courses';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  try {
    // Check if user is authenticated (simplified - in production use proper auth)
    const userId = cookies.get('user_id')?.value;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const formData = await request.formData();
    const title = formData.get('title')?.toString();
    const description = formData.get('description')?.toString();
    const slug = formData.get('slug')?.toString();
    const chapters = formData.getAll('chapters[]');

    if (!title || !slug) {
      return new Response(JSON.stringify({ error: 'Title and slug are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create course
    const course = await createCourse({
      title,
      description,
      slug,
      createdBy: parseInt(userId)
    });

    // Create chapters if provided
    if (chapters && chapters.length > 0) {
      for (let i = 0; i < chapters.length; i++) {
        const chapterTitle = chapters[i].toString();
        if (chapterTitle) {
          await createChapter({
            courseId: course.id,
            title: chapterTitle,
            order: i + 1
          });
        }
      }
    }

    return redirect('/admin/courses');
  } catch (error) {
    console.error('Course creation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

