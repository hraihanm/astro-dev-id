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

export const POST: APIRoute = async ({ params, cookies, request }) => {
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
      return new Response(JSON.stringify({ error: 'Only teacher or admin can grade' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const studentId = parseInt(body.studentId, 10);
    const score = body.score !== undefined ? Number(body.score) : null;
    const comment = body.comment?.toString();
    const status = body.status?.toString() || 'graded';

    if (Number.isNaN(studentId)) {
      return new Response(JSON.stringify({ error: 'studentId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, classroomId },
      select: { maxScore: true }
    });
    if (!assessment) {
      return new Response(JSON.stringify({ error: 'Assessment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (score !== null && (!Number.isFinite(score) || score < 0 || score > assessment.maxScore)) {
      return new Response(JSON.stringify({ error: 'Score must be between 0 and maxScore' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date();
    const updated = await prisma.assessmentSubmission.updateMany({
      where: { assessmentId, studentId },
      data: {
        status: status === 'rejected' ? 'rejected' : 'graded',
        score,
        comment,
        gradedAt: now,
        graderId: user.id
      }
    });

    if (updated.count === 0) {
      return new Response(JSON.stringify({ error: 'Submission not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ message: 'Submission updated' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Assessment grade error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

