import type { APIRoute} from 'astro';
import { createQuiz } from '../../../../lib/quizzes';
import { requireAdminAuth } from '../../../../lib/auth';
import { prisma } from '../../../../lib/db';

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
      } else if (Array.isArray(q.options) && (q.correctAnswer < 0 || q.correctAnswer >= q.options.length)) {
        errors.push(`questions[${idx}].correctAnswer must be a valid index into options`);
      }
    }
  });

  return { ok: errors.length === 0, errors };
}

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
    const {
      courseId: rawCourseId,
      chapterId: rawChapterId,
      title,
      description,
      timeLimit,
      maxAttempts,
      questions,
      quizType,
      scoreReleaseMode,
      attemptLimit,
      visibility
    } = body;

    if (!title) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Allow empty questions array - questions can be added later in the editor
    if (!Array.isArray(questions)) {
      return new Response(JSON.stringify({ error: 'questions must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Only validate questions if there are any
    if (questions.length > 0) {
      const validation = validateQuestions(questions);
      if (!validation.ok) {
        return new Response(JSON.stringify({ error: 'Invalid questions', details: validation.errors }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

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

      // If courseId is not provided, derive from chapter
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

    const quiz = await createQuiz({
      courseId,
      chapterId,
      title,
      quizType: quizType || 'latihan',
      questions,
      settings: {
        description,
        timeLimit: timeLimit ? timeLimit * 60 : undefined, // seconds
        maxAttempts: maxAttempts ?? attemptLimit, // legacy compatibility
        createdAt: new Date(),
        scoreReleaseMode: scoreReleaseMode || 'immediate'
      },
      attemptLimit: attemptLimit ?? maxAttempts ?? null,
      scoreReleaseMode: scoreReleaseMode || 'immediate',
      visibility: visibility?.toString().toUpperCase() === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC'
    });

    return new Response(JSON.stringify({
      message: 'Quiz created successfully',
      id: quiz.id,
      quiz
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Quiz creation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

