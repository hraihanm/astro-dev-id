import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/db';

export const prerender = false;

async function getUser(cookies: APIRoute['cookies']) {
  const userId = cookies.get('user_id')?.value;
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: parseInt(userId, 10) },
    select: { id: true, role: true }
  });
}

async function isTeacher(classroomId: number, userId: number) {
  const membership = await prisma.classroomMembership.findFirst({
    where: { classroomId, userId, status: 'ACTIVE' },
    select: { role: true }
  });
  return membership?.role === 'TEACHER';
}

export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    const classroomId = parseInt(params.id || '', 10);
    if (Number.isNaN(classroomId)) {
      return new Response(JSON.stringify({ error: 'Invalid classroom id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const requester = await getUser(cookies);
    if (!requester) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const canInvite = requester.role === 'admin' || await isTeacher(classroomId, requester.id);
    if (!canInvite) {
      return new Response(JSON.stringify({ error: 'Only teacher or admin can invite' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const userIdRaw = body.userId;
    const email = body.email?.toString().trim().toLowerCase();

    if (!userIdRaw && !email) {
      return new Response(JSON.stringify({ error: 'userId or email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let targetUser;
    if (userIdRaw) {
      const userId = parseInt(userIdRaw, 10);
      if (Number.isNaN(userId)) {
        return new Response(JSON.stringify({ error: 'Invalid userId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true }
      });
    } else {
      targetUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true }
      });
    }

    if (!targetUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const existing = await prisma.classroomMembership.findFirst({
      where: { classroomId, userId: targetUser.id }
    });

    if (existing?.status === 'ACTIVE') {
      return new Response(JSON.stringify({ message: 'User already a member', membership: existing }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let membership;
    if (existing) {
      membership = await prisma.classroomMembership.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE', role: 'STUDENT' }
      });
    } else {
      membership = await prisma.classroomMembership.create({
        data: {
          classroomId,
          userId: targetUser.id,
          role: 'STUDENT',
          status: 'ACTIVE'
        }
      });
    }

    return new Response(JSON.stringify({ message: 'Member added', membership }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Classroom invite error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
