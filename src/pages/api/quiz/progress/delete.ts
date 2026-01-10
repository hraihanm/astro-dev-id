import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/db';

export const prerender = false;

export const DELETE: APIRoute = async ({ cookies, request }) => {
  try {
    const userId = cookies.get('user_id')?.value;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const quizId = parseInt(url.searchParams.get('quizId') || '0');

    if (!quizId) {
      return new Response(JSON.stringify({ error: 'Quiz ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete progress record when quiz is completed
    await prisma.quizProgress.delete({
      where: {
        userId_quizId: {
          userId: parseInt(userId),
          quizId: quizId
        }
      }
    });

    return new Response(JSON.stringify({
      message: 'Progress cleared successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Progress clear error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
