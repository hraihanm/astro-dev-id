import type { APIRoute } from 'astro';
import { prisma } from '../../../../../lib/db';

export const prerender = false;

export const PUT: APIRoute = async ({ params, cookies, request }) => {
  try {
    // Check authentication
    const userId = cookies.get('user_id')?.value;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    const body = await request.json();
    const { title, description, timeLimit, quizType, attemptLimit, scoreReleaseMode, questions } = body;

    if (!title || !questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: 'Title and questions are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update quiz
    const quiz = await prisma.quiz.update({
      where: { id: parseInt(id!) },
      data: {
        title,
        questions: JSON.stringify(questions),
        quizType: quizType || 'latihan',
        attemptLimit: attemptLimit || null,
        scoreReleaseMode: scoreReleaseMode || 'immediate',
        settings: JSON.stringify({
          description,
          timeLimit: timeLimit ? timeLimit * 60 : undefined
        })
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

