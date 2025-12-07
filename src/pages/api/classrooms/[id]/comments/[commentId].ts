import type { APIRoute } from 'astro';
import { prisma } from '../../../../../lib/db';

export const prerender = false;

async function getUser(cookies: APIRoute['cookies']) {
  const id = cookies.get('user_id')?.value;
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id: parseInt(id, 10) },
    select: { id: true, role: true }
  });
}

async function getMembership(classroomId: number, userId: number) {
  return prisma.classroomMembership.findFirst({
    where: { classroomId, userId, status: 'ACTIVE' },
    select: { role: true }
  });
}

export const DELETE: APIRoute = async ({ params, cookies }) => {
  try {
    const classroomId = parseInt(params.id || '', 10);
    const commentId = parseInt(params.commentId || '', 10);
    const user = await getUser(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const membership = await getMembership(classroomId, user.id);
    if (!membership) {
      return new Response(JSON.stringify({ error: 'Membership required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const comment = await prisma.classroomComment.findUnique({
      where: { id: commentId },
      include: { post: { select: { classroomId: true } } }
    });

    if (!comment || comment.post.classroomId !== classroomId) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const canModerate = membership.role === 'TEACHER' || user.role === 'admin';
    const canDelete = canModerate || comment.authorId === user.id;
    if (!canDelete) {
      return new Response(JSON.stringify({ error: 'Not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await prisma.classroomComment.delete({ where: { id: commentId } });
    return new Response(JSON.stringify({ message: 'Comment deleted' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Classroom comment delete error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

