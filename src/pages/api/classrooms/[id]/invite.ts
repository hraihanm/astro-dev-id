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

    // Use transaction with retry logic to handle race conditions atomically
    let membership;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        membership = await prisma.$transaction(async (tx) => {
          // Check if user is already an active member
          const existingActive = await tx.classroomMembership.findFirst({
            where: { 
              classroomId, 
              userId: targetUser.id,
              status: 'ACTIVE'
            }
          });

          if (existingActive) {
            return { membership: existingActive, alreadyActive: true };
          }

          // Check for any existing membership (including inactive)
          const existing = await tx.classroomMembership.findFirst({
            where: { 
              classroomId, 
              userId: targetUser.id
            }
          });

          if (existing) {
            // Update existing membership to active
            const updated = await tx.classroomMembership.update({
              where: { id: existing.id },
              data: { status: 'ACTIVE', role: 'STUDENT' }
            });
            return { membership: updated, alreadyActive: false };
          }

          // Create new membership
          const created = await tx.classroomMembership.create({
            data: {
              classroomId,
              userId: targetUser.id,
              role: 'STUDENT',
              status: 'ACTIVE'
            }
          });
          return { membership: created, alreadyActive: false };
        });
        break; // Success, exit retry loop
      } catch (error: any) {
        // If unique constraint violation (P2002), another request created it concurrently
        if (error.code === 'P2002') {
          retries++;
          if (retries >= maxRetries) {
            // Final attempt: just fetch and return/update what exists
            const existing = await prisma.classroomMembership.findFirst({
              where: { classroomId, userId: targetUser.id }
            });
            if (existing) {
              if (existing.status === 'ACTIVE') {
                membership = { membership: existing, alreadyActive: true };
                break;
              }
              const updated = await prisma.classroomMembership.update({
                where: { id: existing.id },
                data: { status: 'ACTIVE', role: 'STUDENT' }
              });
              membership = { membership: updated, alreadyActive: false };
              break;
            }
          }
          // Wait a bit before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 50 * retries));
          continue;
        }
        // For other errors, throw immediately
        throw error;
      }
    }

    if (!membership) {
      throw new Error('Failed to create or update membership after retries');
    }

    // If user was already an active member, return appropriate response
    if (membership.alreadyActive) {
      return new Response(JSON.stringify({ message: 'User already a member', membership: membership.membership }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ message: 'Member added', membership: membership.membership }), {
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
