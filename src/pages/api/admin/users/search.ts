import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/db';
import { requireAdminAuth } from '../../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    const auth = await requireAdminAuth(request, cookies);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const q = url.searchParams.get('q')?.toLowerCase() ?? '';
    const take = Math.min(parseInt(url.searchParams.get('take') || '20', 10), 50);

    const where = q
      ? {
          OR: [
            { email: { contains: q } },
            { profile: { is: { firstName: { contains: q } } } },
            { profile: { is: { lastName: { contains: q } } } }
          ]
        }
      : undefined;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: { firstName: true, lastName: true, nickname: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take
    });

    return new Response(JSON.stringify({ users }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('User search error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
