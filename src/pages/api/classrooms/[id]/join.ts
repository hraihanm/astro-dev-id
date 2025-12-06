import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/db';

export const prerender = false;

async function getUserId(cookies: APIRoute['cookies']) {
  const userId = cookies.get('user_id')?.value;
  return userId ? parseInt(userId, 10) : null;
}

export const POST: APIRoute = async ({ params, cookies }) => {
  try {
    const classroomId = parseInt(params.id || '', 10);
    if (Number.isNaN(classroomId)) {
      return new Response(JSON.stringify({ error: 'Invalid classroom id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = await getUserId(cookies);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { isPrivate: true }
    });

    if (!classroom) {
      return new Response(JSON.stringify({ error: 'Classroom not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const existing = await prisma.classroomMembership.findFirst({
      where: { classroomId, userId }
    });

    if (existing) {
      if (existing.status === 'ACTIVE') {
        return new Response(JSON.stringify({ message: 'Already a member', membership: existing }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const updated = await prisma.classroomMembership.update({
        where: { id: existing.id },
        data: { status: classroom.isPrivate ? 'PENDING' : 'ACTIVE' }
      });

      return new Response(JSON.stringify({
        message: classroom.isPrivate ? 'Join request refreshed' : 'Joined classroom',
        membership: updated
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const membership = await prisma.classroomMembership.create({
      data: {
        classroomId,
        userId,
        role: 'STUDENT',
        status: classroom.isPrivate ? 'PENDING' : 'ACTIVE'
      }
    });

    return new Response(JSON.stringify({
      message: classroom.isPrivate ? 'Join request submitted' : 'Joined classroom',
      membership
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Classroom join error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

