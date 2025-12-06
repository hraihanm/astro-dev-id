import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/db';

export const prerender = false;

async function getCurrentUser(cookies: APIRoute['cookies']) {
  const userId = cookies.get('user_id')?.value;
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: parseInt(userId, 10) },
    select: { id: true, role: true, email: true }
  });
}

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const user = await getCurrentUser(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const where =
      user.role === 'admin'
        ? {}
        : {
            OR: [
              { isPrivate: false },
              { memberships: { some: { userId: user.id } } }
            ]
          };

    const classes = await prisma.classroom.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        memberships: {
          where: { userId: user.id },
          select: { role: true, status: true }
        },
        _count: {
          select: { memberships: true, posts: true, resources: true }
        }
      }
    });

    const data = classes.map((cls) => ({
      id: cls.id,
      title: cls.title,
      description: cls.description,
      isPrivate: cls.isPrivate,
      createdAt: cls.createdAt,
      updatedAt: cls.updatedAt,
      counts: cls._count,
      membership: cls.memberships[0] ?? null
    }));

    return new Response(JSON.stringify({ classrooms: data, count: data.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Classrooms list error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = await getCurrentUser(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const title = body.title?.toString().trim();
    const description = body.description?.toString();
    const requestedTeacherId = body.teacherId ? parseInt(body.teacherId, 10) : null;

    if (!title) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Only admins can set a different teacher; otherwise creator is teacher.
    const teacherId = user.role === 'admin' && requestedTeacherId ? requestedTeacherId : user.id;

    const classroom = await prisma.classroom.create({
      data: {
        title,
        description,
        isPrivate: true,
        createdBy: teacherId
      }
    });

    // Ensure teacher membership exists and is active.
    await prisma.classroomMembership.create({
      data: {
        classroomId: classroom.id,
        userId: teacherId,
        role: 'TEACHER',
        status: 'ACTIVE'
      }
    });

    return new Response(JSON.stringify({ message: 'Classroom created', classroom }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Classroom create error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

