import type { APIRoute } from 'astro';
import { createQuiz } from '../../../../lib/quizzes';
import { requireAdminAuth } from '../../../../lib/auth';

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
    const { title, description, timeLimit, maxAttempts, questions, quizType, scoreReleaseMode, attemptLimit } = body;

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

    const quiz = await createQuiz({
      courseId: null, // Standalone quiz
      title,
      quizType: quizType || 'latihan',
      questions,
      settings: {
        description,
        timeLimit: timeLimit ? timeLimit * 60 : undefined, // seconds
        maxAttempts: maxAttempts ?? attemptLimit,
        createdAt: new Date(),
        scoreReleaseMode: scoreReleaseMode || 'immediate'
      },
      attemptLimit: attemptLimit ?? maxAttempts ?? null,
      scoreReleaseMode: scoreReleaseMode || 'immediate'
    });

    return new Response(JSON.stringify({
      message: 'Standalone quiz created successfully',
      quiz
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Standalone quiz creation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

