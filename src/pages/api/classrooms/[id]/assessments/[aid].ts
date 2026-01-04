import type { APIRoute } from 'astro';
import { prisma } from '../../../../../lib/db';

export const prerender = false;

async function getUser(cookies: APIRoute['cookies']) {
  const userId = cookies.get('user_id')?.value;
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: parseInt(userId, 10) },
    select: { id: true, role: true, email: true, name: true }
  });
}

async function getMembership(classroomId: number, userId: number) {
  return prisma.classroomMembership.findFirst({
    where: { classroomId, userId, status: 'ACTIVE' },
    select: { role: true }
  });
}

export const GET: APIRoute = async ({ params, cookies }) => {
  try {
    const classroomId = parseInt(params.id || '', 10);
    const assessmentId = parseInt(params.aid || '', 10);

    if (Number.isNaN(classroomId) || Number.isNaN(assessmentId)) {
      return new Response(JSON.stringify({ error: 'Invalid id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await getUser(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const membership = await getMembership(classroomId, user.id);
    const isTeacher = user.role === 'admin' || membership?.role === 'TEACHER';
    if (!isTeacher && !membership) {
      return new Response(JSON.stringify({ error: 'Membership required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, classroomId },
      include: {
        submissions: isTeacher
          ? {
              include: { student: { select: { id: true, email: true, name: true } } }
            }
          : {
              where: { studentId: user.id },
              include: { student: { select: { id: true, email: true, name: true } } }
            }
      }
    });

    if (!assessment) {
      return new Response(JSON.stringify({ error: 'Assessment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (assessment.status !== 'published' && !isTeacher) {
      return new Response(JSON.stringify({ error: 'Assessment not published' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ assessment }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Assessment detail error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

