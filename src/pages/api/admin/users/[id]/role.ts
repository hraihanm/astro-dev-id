import type { APIRoute } from 'astro';
import { prisma } from '../../../../../lib/db';
import { requireAdminAuth } from '../../../../../lib/auth';

export const prerender = false;

const ALLOWED_ROLES = ['admin', 'user'];

export const PUT: APIRoute = async ({ params, request, cookies }) => {
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

    const body = await request.json().catch(() => null);
    const role = body?.role;
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: 'Role tidak valid' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role }
    });

    return new Response(JSON.stringify({ message: 'Role diperbarui', user: { id: updated.id, role: updated.role } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('User role update error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

