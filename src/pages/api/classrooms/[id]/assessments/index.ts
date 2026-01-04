import type { APIRoute } from 'astro';
import { prisma } from '../../../../../lib/db';

export const prerender = false;

async function getUser(cookies: APIRoute['cookies']) {
  const userId = cookies.get('user_id')?.value;
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: parseInt(userId, 10) },
    select: { id: true, role: true, email: true }
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
    if (Number.isNaN(classroomId)) {
      return new Response(JSON.stringify({ error: 'Invalid classroom id' }), {
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

    const assessments = await prisma.assessment.findMany({
      where: { classroomId },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { submissions: true } },
        submissions: {
          select: { status: true, studentId: true, score: true, late: true },
          ...(isTeacher
            ? {}
            : { where: { studentId: user.id } })
        }
      }
    });

    const data = assessments.map((a) => {
      const counts = { assigned: 0, handed_in: 0, graded: 0, rejected: 0 };
      a.submissions.forEach((s) => {
        if (s.status in counts) {
          // @ts-ignore
          counts[s.status] += 1;
        }
      });
      return {
        id: a.id,
        title: a.title,
        type: a.type,
        status: a.status,
        maxScore: a.maxScore,
        dueAt: a.dueAt,
        resources: a.resources,
        counts,
        submissions: a.submissions
      };
    });

    return new Response(JSON.stringify({ assessments: data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Assessments list error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ params, cookies, request }) => {
  try {
    const classroomId = parseInt(params.id || '', 10);
    if (Number.isNaN(classroomId)) {
      return new Response(JSON.stringify({ error: 'Invalid classroom id' }), {
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
      return new Response(JSON.stringify({ error: 'Only teacher or admin can create assessments' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const title = body.title?.toString().trim();
    const description = body.description?.toString().trim();
    const type = body.type?.toString().trim() || 'exercise';
    const maxScore = Number.isFinite(body.maxScore) ? Number(body.maxScore) : parseInt(body.maxScore, 10);
    const publish = !!body.publish;
    const resources = body.resources ?? null;
    const dueAt = body.dueAt ? new Date(body.dueAt) : null;

    if (!title) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (!Number.isFinite(maxScore) || maxScore <= 0) {
      return new Response(JSON.stringify({ error: 'maxScore must be a positive number' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const activeMembers = await prisma.classroomMembership.findMany({
      where: { classroomId, status: 'ACTIVE' },
      select: { userId: true }
    });

    const assessment = await prisma.$transaction(async (tx) => {
      const created = await tx.assessment.create({
        data: {
          classroomId,
          title,
          description,
          type,
          maxScore,
          dueAt,
          status: publish ? 'published' : 'draft',
          resources,
          createdBy: user.id
        }
      });

      if (activeMembers.length > 0) {
        await tx.assessmentSubmission.createMany({
          data: activeMembers.map((m) => ({
            assessmentId: created.id,
            studentId: m.userId,
            status: 'assigned'
          }))
        });
      }

      return created;
    });

    return new Response(JSON.stringify({ message: 'Assessment created', assessment }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Assessment create error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

