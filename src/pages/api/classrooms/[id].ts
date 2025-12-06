import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/db';

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
    where: { classroomId, userId },
    select: { role: true, status: true }
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

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: {
        id: true,
        title: true,
        description: true,
        isPrivate: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true
      }
    });

    if (!classroom) {
      return new Response(JSON.stringify({ error: 'Classroom not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const membership = await getMembership(classroomId, user.id);
    const isTeacher = membership?.role === 'TEACHER';
    const isActiveMember = membership?.status === 'ACTIVE';

    // If not a member, return limited detail to allow join prompt.
    if (!isActiveMember && user.role !== 'admin') {
      return new Response(JSON.stringify({
        classroom,
        membership: membership ?? null,
        access: 'limited'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const full = await prisma.classroom.findUnique({
      where: { id: classroomId },
      include: {
        memberships: {
          select: { userId: true, role: true, status: true, user: { select: { email: true, role: true } } }
        },
        resources: {
          include: {
            course: { select: { id: true, title: true, slug: true } },
            quiz: { select: { id: true, title: true, quizType: true } }
          },
          orderBy: { pinnedAt: 'desc' }
        },
        posts: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            author: { select: { id: true, email: true } },
            comments: {
              orderBy: { createdAt: 'asc' },
              include: { author: { select: { id: true, email: true } } }
            }
          }
        }
      }
    });

    return new Response(JSON.stringify({
      classroom: full,
      membership,
      access: 'full',
      canModerate: isTeacher || user.role === 'admin'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Classroom detail error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const PUT: APIRoute = async ({ params, request, cookies }) => {
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
    const canEdit = membership?.role === 'TEACHER' || user.role === 'admin';
    if (!canEdit) {
      return new Response(JSON.stringify({ error: 'Only teacher or admin can update classroom' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const title = body.title?.toString().trim();
    const description = body.description?.toString();
    const isPrivate = typeof body.isPrivate === 'boolean' ? body.isPrivate : undefined;

    const current = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { title: true, description: true, isPrivate: true }
    });
    if (!current) {
      return new Response(JSON.stringify({ error: 'Classroom not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updated = await prisma.classroom.update({
      where: { id: classroomId },
      data: {
        title: title || current.title,
        description: description ?? current.description,
        ...(isPrivate === undefined ? {} : { isPrivate })
      }
    });

    return new Response(JSON.stringify({ message: 'Classroom updated', classroom: updated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Classroom update error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ params, cookies, request }) => {
  try {
    const classroomId = parseInt(params.id || '', 10);
    if (Number.isNaN(classroomId)) {
      return new Response(JSON.stringify({ error: 'Invalid classroom id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await getUser(cookies);
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admin can delete classroom' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await prisma.$transaction([
      prisma.classroomComment.deleteMany({
        where: {
          post: { classroomId }
        }
      }),
      prisma.classroomPost.deleteMany({
        where: { classroomId }
      }),
      prisma.classroomResource.deleteMany({
        where: { classroomId }
      }),
      prisma.classroomMembership.deleteMany({
        where: { classroomId }
      }),
      prisma.classroom.delete({ where: { id: classroomId } })
    ]);

    return new Response(JSON.stringify({ message: 'Classroom deleted' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Classroom delete error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

