import type { APIRoute } from 'astro';
import { createCourse, createChapter } from '../../../lib/courses';
import { prisma } from '../../../lib/db';
import { requireAdminAuth } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, url, request }) => {
  try {
    const auth = await requireAdminAuth(request, cookies);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Optional query parameters
    const includeChapters = url.searchParams.get('includeChapters') === 'true';
    const includeQuizzes = url.searchParams.get('includeQuizzes') === 'true';

    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        chapters: includeChapters ? {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true
          }
        } : false,
        quizzes: includeQuizzes ? {
          select: {
            id: true,
            title: true,
            quizType: true
          }
        } : false,
        creator: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    return new Response(JSON.stringify({
      courses,
      count: courses.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Courses fetch error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  try {
    const auth = await requireAdminAuth(request, cookies);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const contentType = request.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    // Support both JSON (for API/AI) and form-data (existing UI)
    let title: string | undefined;
    let description: string | undefined;
    let slug: string | undefined;
    let chapters: string[] = [];

    if (isJson) {
      const body = await request.json();
      title = body.title?.toString();
      description = body.description?.toString();
      slug = body.slug?.toString();
      if (Array.isArray(body.chapters)) {
        chapters = body.chapters.map((c: any) => c?.toString()).filter(Boolean);
      }
    } else {
      const formData = await request.formData();
      title = formData.get('title')?.toString();
      description = formData.get('description')?.toString();
      slug = formData.get('slug')?.toString();
      chapters = formData.getAll('chapters[]').map((c) => c.toString());
    }

    if (!title || !slug) {
      return new Response(JSON.stringify({ error: 'Title and slug are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Enforce slug uniqueness
    const existing = await prisma.course.findUnique({ where: { slug } });
    if (existing) {
      return new Response(JSON.stringify({ error: 'Slug already in use', slug }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create course
    const course = await createCourse({
      title,
      description,
      slug,
      createdBy: parseInt(auth.userId || 0)
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

    if (isJson) {
      return new Response(JSON.stringify({
        message: 'Course created successfully',
        course
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fallback: existing behavior for form submissions
    return redirect('/admin/courses');
  } catch (error) {
    console.error('Course creation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

