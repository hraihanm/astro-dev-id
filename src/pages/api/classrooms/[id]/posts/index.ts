import type { APIRoute } from 'astro';
import { prisma } from '../../../../../lib/db';

export const prerender = false;

async function getUserId(cookies: APIRoute['cookies']) {
  const id = cookies.get('user_id')?.value;
  return id ? parseInt(id, 10) : null;
}

async function requireActiveMember(classroomId: number, userId: number) {
  return prisma.classroomMembership.findFirst({
    where: { classroomId, userId, status: 'ACTIVE' },
    select: { role: true }
  });
}

export const GET: APIRoute = async ({ params, cookies, url }) => {
  try {
    const classroomId = parseInt(params.id || '', 10);
    const userId = await getUserId(cookies);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const membership = await requireActiveMember(classroomId, userId);
    if (!membership) {
      return new Response(JSON.stringify({ error: 'Membership required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(url.searchParams.get('pageSize') || '20', 10), 50);
    const skip = (page - 1) * pageSize;

    const [posts, total] = await Promise.all([
      prisma.classroomPost.findMany({
        where: { classroomId },
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
        include: {
          author: { select: { id: true, email: true } },
          comments: {
            orderBy: { createdAt: 'asc' },
            include: { author: { select: { id: true, email: true } } }
          }
        }
      }),
      prisma.classroomPost.count({ where: { classroomId } })
    ]);

    return new Response(JSON.stringify({ posts, total, page, pageSize }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Classroom posts list error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ params, cookies, request }) => {
  try {
    const classroomId = parseInt(params.id || '', 10);
    const userId = await getUserId(cookies);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const membership = await requireActiveMember(classroomId, userId);
    if (!membership) {
      return new Response(JSON.stringify({ error: 'Membership required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const content = body.content?.toString().trim();

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const post = await prisma.classroomPost.create({
      data: {
        classroomId,
        authorId: userId,
        content,
        pinned: false
      }
    });

    return new Response(JSON.stringify({ message: 'Post created', post }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Classroom post create error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

