import type { APIRoute } from 'astro';
import { prisma } from '../../../../../lib/db';
import { requireAdminAuth } from '../../../../../lib/auth';

export const prerender = false;

function validateQuestions(questions: any[]) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return { ok: false, errors: ['questions must be a non-empty array'] };
  }

  const errors: string[] = [];

  questions.forEach((q, idx) => {
    if (!q || typeof q !== 'object') {
      errors.push(`questions[${idx}] must be an object`);
      return;
    }
    if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
      errors.push(`questions[${idx}].question is required`);
    }
    const type = q.type || 'multiple-choice';
    if (type === 'multiple-choice') {
      if (!Array.isArray(q.options) || q.options.length < 2) {
        errors.push(`questions[${idx}].options must be an array with at least 2 options`);
      }
      if (q.correctAnswer === undefined || q.correctAnswer === null || !Number.isInteger(q.correctAnswer)) {
        errors.push(`questions[${idx}].correctAnswer is required and must be an integer index`);
      } else if (Array.isArray(q.options)) {
        const len = q.options.length;
        const zeroBasedValid = q.correctAnswer >= 0 && q.correctAnswer < len;
        const oneBasedValid = q.correctAnswer >= 1 && q.correctAnswer <= len;
        if (!zeroBasedValid && !oneBasedValid) {
          errors.push(`questions[${idx}].correctAnswer must be a valid index into options`);
        }
      }
    }
  });

  return { ok: errors.length === 0, errors };
}

export const PUT: APIRoute = async ({ params, cookies, request }) => {
  try {
    const auth = await requireAdminAuth(request, cookies);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    const body = await request.json();
    const {
      title,
      description,
      timeLimit,
      quizType,
      attemptLimit,
      scoreReleaseMode,
      questions,
      visibility,
      courseId: rawCourseId,
      chapterId: rawChapterId,
      availableFrom,
      availableUntil,
      openDurationSeconds
    } = body;

    if (!title || !questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: 'Title and questions are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validation = validateQuestions(questions);
    if (!validation.ok) {
      return new Response(JSON.stringify({ error: 'Invalid questions', details: validation.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const vis = visibility?.toString().toUpperCase();
    const mappedVisibility = vis === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';

    const parsedCourseId = rawCourseId !== undefined && rawCourseId !== null ? parseInt(rawCourseId) : null;
    const parsedChapterId = rawChapterId !== undefined && rawChapterId !== null ? parseInt(rawChapterId) : null;

    let courseId: number | null = Number.isFinite(parsedCourseId as any) ? (parsedCourseId as number) : null;
    let chapterId: number | null = Number.isFinite(parsedChapterId as any) ? (parsedChapterId as number) : null;

    if (chapterId !== null) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { id: true, courseId: true }
      });

      if (!chapter) {
        return new Response(JSON.stringify({ error: 'Invalid chapterId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (courseId === null) {
        courseId = chapter.courseId;
      } else if (courseId !== chapter.courseId) {
        return new Response(JSON.stringify({ error: 'chapterId does not belong to courseId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (courseId !== null) {
      const courseExists = await prisma.course.findUnique({ where: { id: courseId } });
      if (!courseExists) {
        return new Response(JSON.stringify({ error: 'Invalid courseId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const quiz = await prisma.quiz.update({
      where: { id: parseInt(id!) },
      data: {
        title,
        courseId,
        chapterId,
        questions: JSON.stringify(questions),
        quizType: quizType || 'exercise',
        attemptLimit: attemptLimit ?? null,
        scoreReleaseMode: scoreReleaseMode || 'immediate',
        settings: JSON.stringify({
          description,
          notes: body.notes || '',
          timeLimit: timeLimit ? timeLimit * 60 : undefined
        }),
        visibility: mappedVisibility,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        availableUntil: availableUntil ? new Date(availableUntil) : null,
        openDurationSeconds: openDurationSeconds ?? null
      }
    });

    return new Response(JSON.stringify({
      message: 'Quiz updated successfully',
      quiz
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Quiz update error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

