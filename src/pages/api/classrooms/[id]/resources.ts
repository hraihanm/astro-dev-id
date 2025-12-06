import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/db';

export const prerender = false;

async function getUser(cookies: APIRoute['cookies']) {
  const id = cookies.get('user_id')?.value;
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id: parseInt(id, 10) },
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
    const user = await getUser(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    const canManage = user.role === 'admin' || await isTeacher(classroomId, user.id);
    if (!canManage) {
      return new Response(JSON.stringify({ error: 'Only teacher or admin can pin resources' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const courseId = body.courseId ? parseInt(body.courseId, 10) : null;
    const quizId = body.quizId ? parseInt(body.quizId, 10) : null;

    if (!courseId && !quizId) {
      return new Response(JSON.stringify({ error: 'courseId or quizId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const resource = await prisma.classroomResource.create({
      data: {
        classroomId,
        courseId,
        quizId,
        addedBy: user.id,
        pinnedAt: new Date()
      }
    });

    return new Response(JSON.stringify({ message: 'Resource pinned', resource }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Classroom resource add error:', error);
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
    const canManage = user.role === 'admin' || await isTeacher(classroomId, user.id);
    if (!canManage) {
      return new Response(JSON.stringify({ error: 'Only teacher or admin can unpin resources' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const resourceId = parseInt(body.resourceId, 10);
    if (Number.isNaN(resourceId)) {
      return new Response(JSON.stringify({ error: 'resourceId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await prisma.classroomResource.deleteMany({
      where: { id: resourceId, classroomId }
    });

    return new Response(JSON.stringify({ message: 'Resource removed' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Classroom resource delete error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

