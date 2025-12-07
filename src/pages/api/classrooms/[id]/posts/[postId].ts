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
    const postId = parseInt(params.postId || '', 10);
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

    const post = await prisma.classroomPost.findUnique({ where: { id: postId } });
    if (!post || post.classroomId !== classroomId) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const canModerate = membership.role === 'TEACHER' || user.role === 'admin';
    const canDelete = canModerate || post.authorId === user.id;
    if (!canDelete) {
      return new Response(JSON.stringify({ error: 'Not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await prisma.classroomPost.delete({ where: { id: postId } });
    return new Response(JSON.stringify({ message: 'Post deleted' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Classroom post delete error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PATCH: APIRoute = async ({ params, request, cookies }) => {
  try {
    const classroomId = parseInt(params.id || '', 10);
    const postId = parseInt(params.postId || '', 10);
    const user = await getUser(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const membership = await getMembership(classroomId, user.id);
    const canModerate = membership?.role === 'TEACHER' || user.role === 'admin';
    if (!canModerate) {
      return new Response(JSON.stringify({ error: 'Only teacher or admin can update post' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const pinned = Boolean(body.pinned);

    const post = await prisma.classroomPost.findUnique({ where: { id: postId } });
    if (!post || post.classroomId !== classroomId) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updated = await prisma.classroomPost.update({
      where: { id: postId },
      data: { pinned }
    });

    return new Response(JSON.stringify({ message: 'Post updated', post: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Classroom post update error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

