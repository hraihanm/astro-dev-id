import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/db';
import { getSessionUser } from '../../../lib/auth-guard';

export const GET: APIRoute = async ({ url, cookies }) => {
  try {
    const user = await getSessionUser(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const attemptId = url.searchParams.get('attemptId');
    if (!attemptId) {
      return new Response(JSON.stringify({ error: 'Attempt ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        id: parseInt(attemptId),
        userId: user.id
      },
      select: {
        id: true,
        scoreReleasedAt: true,
        percentage: true,
        quizId: true
      }
    });

    if (!attempt) {
      return new Response(JSON.stringify({ error: 'Attempt not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      attemptId: attempt.id,
      quizId: attempt.quizId,
      isReleased: !!attempt.scoreReleasedAt,
      scoreReleasedAt: attempt.scoreReleasedAt,
      percentage: attempt.percentage
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Check attempt status error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
