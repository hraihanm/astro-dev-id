import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/db';
import { requireAdminAuth } from '../../../../lib/auth';

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

    const id = params.id ? parseInt(params.id, 10) : NaN;
    if (Number.isNaN(id)) {
      return new Response(JSON.stringify({ error: 'Invalid user id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await prisma.user.delete({ where: { id } });
    return new Response(JSON.stringify({ message: 'User deleted' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('User delete error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
