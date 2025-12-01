import type { APIRoute } from 'astro';
import { prisma } from '../../../../../lib/db';

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const userId = cookies.get('user_id')?.value;
  
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const attemptId = parseInt(params.id || '');
  
  if (isNaN(attemptId)) {
    return new Response(JSON.stringify({ error: 'Invalid attempt ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Verify the attempt belongs to the user
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId }
    });

    if (!attempt) {
      return new Response(JSON.stringify({ error: 'Attempt not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (attempt.userId !== parseInt(userId)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete the attempt
    await prisma.quizAttempt.delete({
      where: { id: attemptId }
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting attempt:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete attempt' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

