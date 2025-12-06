import type { APIRoute } from 'astro';
import { prisma } from '../../../../../../lib/db';
import { requireAdminAuth } from '../../../../../../lib/auth';

export const prerender = false;

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
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
      return new Response(JSON.stringify({ error: 'Attempt ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const attemptId = parseInt(id, 10);
    if (Number.isNaN(attemptId)) {
      return new Response(JSON.stringify({ error: 'Invalid attempt ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const existing = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Attempt not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await prisma.quizAttempt.delete({ where: { id: attemptId } });

    return new Response(JSON.stringify({ message: 'Attempt deleted' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Delete attempt error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

