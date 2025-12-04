import type { APIRoute } from 'astro';
import { prisma } from '../../../../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ params, cookies }) => {
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
      return new Response(JSON.stringify({ error: 'Attempt ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Update attempt to release score
    const attempt = await prisma.quizAttempt.update({
      where: { id: parseInt(id) },
      data: {
        scoreReleasedAt: new Date()
      }
    });

    return new Response(JSON.stringify({
      message: 'Score released successfully',
      attempt
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Release score error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
