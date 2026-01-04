import type { APIRoute } from 'astro';
import { prisma } from '../../../../../../../lib/db';

export const prerender = false;

async function getUser(cookies: APIRoute['cookies']) {
  const userId = cookies.get('user_id')?.value;
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: parseInt(userId, 10) },
    select: { id: true, role: true }
  });
}

async function getMembership(classroomId: number, userId: number) {
  return prisma.classroomMembership.findFirst({
    where: { classroomId, userId, status: 'ACTIVE' },
    select: { role: true }
  });
}

export const POST: APIRoute = async ({ params, cookies }) => {
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
    if (!isTeacher) {
      return new Response(JSON.stringify({ error: 'Only teacher or admin can publish' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, classroomId },
      select: { id: true, status: true }
    });
    if (!assessment) {
      return new Response(JSON.stringify({ error: 'Assessment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (assessment.status === 'published') {
      return new Response(JSON.stringify({ message: 'Already published' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const activeMembers = await prisma.classroomMembership.findMany({
      where: { classroomId, status: 'ACTIVE' },
      select: { userId: true }
    });

    await prisma.$transaction(async (tx) => {
      await tx.assessment.update({
        where: { id: assessmentId },
        data: { status: 'published' }
      });

      if (activeMembers.length > 0) {
        const existing = await tx.assessmentSubmission.findMany({
          where: { assessmentId },
          select: { studentId: true }
        });
        const existingIds = new Set(existing.map((e) => e.studentId));
        const toCreate = activeMembers.filter((m) => !existingIds.has(m.userId));
        if (toCreate.length > 0) {
          await tx.assessmentSubmission.createMany({
            data: toCreate.map((m) => ({
              assessmentId,
              studentId: m.userId,
              status: 'assigned'
            }))
          });
        }
      }
    });

    return new Response(JSON.stringify({ message: 'Assessment published' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Assessment publish error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

