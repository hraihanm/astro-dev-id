import type { APIRoute } from 'astro';
import { prisma } from '../../../../../../../lib/db';
import { put } from '@vercel/blob';

export const prerender = false;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'];

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

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
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
    if (!membership) {
      return new Response(JSON.stringify({ error: 'Membership required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, classroomId }
    });

    if (!assessment) {
      return new Response(JSON.stringify({ error: 'Assessment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    if (assessment.status !== 'published') {
      return new Response(JSON.stringify({ error: 'Assessment not published yet' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const form = await request.formData();
    const files = form.getAll('files').filter((f): f is File => f instanceof File);
    const linkRaw = form.get('links');
    const links: string[] = [];
    if (typeof linkRaw === 'string') {
      try {
        const parsed = JSON.parse(linkRaw);
        if (Array.isArray(parsed)) {
          parsed.forEach((l) => {
            if (typeof l === 'string' && l.trim()) links.push(l.trim());
          });
        }
      } catch {
        // ignore malformed
      }
    }

    if (files.length === 0 && links.length === 0) {
      return new Response(JSON.stringify({ error: 'At least one file or link is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const uploaded: Array<{ url: string; name: string; size: number; type: string }> = [];
    const timestamp = Date.now();

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return new Response(JSON.stringify({ error: `File ${file.name} exceeds size limit` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return new Response(JSON.stringify({ error: `Unsupported file type for ${file.name}` }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = sanitizeFilename(file.name);
      const blobPath = `assessments/${assessmentId}/${user.id}/${timestamp}-${safeName}`;

      const blob = await put(blobPath, buffer, {
        access: 'public',
        contentType: file.type || 'application/octet-stream'
      });

      uploaded.push({
        url: blob.url,
        name: file.name,
        size: file.size,
        type: file.type
      });
    }

    links.forEach((url) => {
      uploaded.push({ url, name: url, size: 0, type: 'link' });
    });

    const now = new Date();
    const late = assessment.dueAt ? now > new Date(assessment.dueAt) : false;

    const submission = await prisma.assessmentSubmission.upsert({
      where: {
        assessmentId_studentId: {
          assessmentId,
          studentId: user.id
        }
      },
      create: {
        assessmentId,
        studentId: user.id,
        status: 'handed_in',
        submittedAt: now,
        late,
        files: uploaded
      },
      update: {
        status: 'handed_in',
        submittedAt: now,
        late,
        files: uploaded,
        score: null,
        comment: null,
        graderId: null,
        gradedAt: null
      }
    });

    return new Response(JSON.stringify({ message: 'Submission saved', submission }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Assessment submit error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

