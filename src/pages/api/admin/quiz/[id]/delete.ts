import type { APIRoute } from 'astro';
import { prisma } from '../../../../../lib/db';

export const prerender = false;

export const DELETE: APIRoute = async ({ params, cookies }) => {
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
    if (!id) {
      return new Response(JSON.stringify({ error: 'Quiz ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: parseInt(id) }
    });

    if (!quiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete quiz attempts first (cascade)
    await prisma.quizAttempt.deleteMany({
      where: { quizId: parseInt(id) }
    });

    // Delete quiz
    await prisma.quiz.delete({
      where: { id: parseInt(id) }
    });

    return new Response(JSON.stringify({
      message: 'Quiz deleted successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Quiz delete error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

