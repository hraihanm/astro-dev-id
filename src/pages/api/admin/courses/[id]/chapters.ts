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
    const rawChapterIds = body.chapterIds;

    if (!Array.isArray(rawChapterIds) || rawChapterIds.length === 0) {
      return new Response(JSON.stringify({ error: 'chapterIds array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const chapterIds = rawChapterIds
      .map((cid: string | number) => parseInt(cid as string, 10))
      .filter((cid) => Number.isFinite(cid));

    if (chapterIds.length !== rawChapterIds.length) {
      return new Response(JSON.stringify({ error: 'chapterIds must be numeric' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const courseId = parseInt(id);
    const existingChapters = await prisma.chapter.findMany({
      where: { courseId },
      select: { id: true }
    });

    const existingIds = existingChapters.map((ch) => ch.id);
    const hasAllChapters = chapterIds.length === existingIds.length &&
      chapterIds.every((cid) => existingIds.includes(cid));

    if (!hasAllChapters) {
      return new Response(JSON.stringify({ error: 'chapterIds must include all course chapters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Ensure no duplicates
    if (new Set(chapterIds).size !== chapterIds.length) {
      return new Response(JSON.stringify({ error: 'chapterIds must be unique' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await prisma.$transaction(
      chapterIds.map((chapterId, index) =>
        prisma.chapter.update({
          where: { id: chapterId },
          data: { order: index + 1 }
        })
      )
    );

    return new Response(JSON.stringify({
      message: 'Chapter order updated successfully',
      order: chapterIds
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Chapter reorder error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};