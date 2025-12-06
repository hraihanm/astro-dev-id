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

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    const classroomId = parseInt(params.id || '', 10);
    const user = await getUser(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const canView = user.role === 'admin' || await isTeacher(classroomId, user.id);
    if (!canView) {
      return new Response(JSON.stringify({ error: 'Only teacher or admin can view members' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const members = await prisma.classroomMembership.findMany({
      where: { classroomId },
      include: { user: { select: { id: true, email: true, role: true } } },
      orderBy: { createdAt: 'asc' }
    });

    return new Response(JSON.stringify({ members }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Classroom members error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    const classroomId = parseInt(params.id || '', 10);
    const user = await getUser(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const teacher = user.role === 'admin' || await isTeacher(classroomId, user.id);
    if (!teacher) {
      return new Response(JSON.stringify({ error: 'Only teacher or admin can manage members' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const targetUserId = parseInt(body.userId, 10);
    const role = body.role === 'TEACHER' ? 'TEACHER' : 'STUDENT';
    const status = body.status === 'ACTIVE' ? 'ACTIVE' : 'PENDING';

    if (Number.isNaN(targetUserId)) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const existing = await prisma.classroomMembership.findFirst({
      where: { classroomId, userId: targetUserId }
    });

    if (existing) {
      const updated = await prisma.classroomMembership.update({
        where: { id: existing.id },
        data: { role, status }
      });
      return new Response(JSON.stringify({ message: 'Membership updated', membership: updated }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const membership = await prisma.classroomMembership.create({
      data: {
        classroomId,
        userId: targetUserId,
        role,
        status
      }
    });

    return new Response(JSON.stringify({ message: 'Member added', membership }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Classroom member add error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  try {
    const classroomId = parseInt(params.id || '', 10);
    const user = await getUser(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const teacher = user.role === 'admin' || await isTeacher(classroomId, user.id);
    if (!teacher) {
      return new Response(JSON.stringify({ error: 'Only teacher or admin can remove members' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const targetUserId = parseInt(body.userId, 10);
    if (Number.isNaN(targetUserId)) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await prisma.classroomMembership.deleteMany({
      where: { classroomId, userId: targetUserId }
    });

    return new Response(JSON.stringify({ message: 'Member removed' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Classroom member delete error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

