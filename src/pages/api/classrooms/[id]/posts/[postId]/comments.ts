import type { APIContext } from 'astro';
import { prisma } from '../../../../../../lib/db';

// TypeScript may not pick up freshly generated Prisma types in some editors;
// use a locally-typed alias to avoid blocking errors while retaining runtime safety.
const db = prisma as any;

export const prerender = false;

async function getUserId(cookies: APIContext['cookies']) {
  const id = cookies.get('user_id')?.value;
  return id ? parseInt(id, 10) : null;
}

async function requireActiveMember(classroomId: number, userId: number) {
  return db.classroomMembership.findFirst({
    where: { classroomId, userId, status: 'ACTIVE' },
    select: { role: true }
  });
}

export const POST = async (context: APIContext) => {
  try {
    const { params, cookies, request } = context;
    const classroomId = parseInt(params.id || '', 10);
    const postId = parseInt(params.postId || '', 10);
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

    const post = await db.classroomPost.findUnique({ where: { id: postId } });
    if (!post || post.classroomId !== classroomId) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const comment = await db.classroomComment.create({
      data: {
        postId,
        authorId: userId,
        content
      }
    });

    return new Response(JSON.stringify({ message: 'Comment added', comment }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Classroom comment create error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

