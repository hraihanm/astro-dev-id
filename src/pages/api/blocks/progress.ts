import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/db';

export const prerender = false;

// GET: Get block progress for a user and chapter
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const userId = cookies.get('user_id')?.value;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const chapterId = url.searchParams.get('chapterId');
    
    if (!chapterId) {
      return new Response(JSON.stringify({ error: 'chapterId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const progress = await prisma.blockProgress.findMany({
      where: {
        userId: parseInt(userId),
        chapterId: parseInt(chapterId)
      }
    });

    return new Response(JSON.stringify({ progress }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching block progress:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch progress' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST: Update block progress
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const userId = cookies.get('user_id')?.value;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { chapterId, blockId, blockType, completed, score, data } = body;

    if (!chapterId || !blockId || !blockType) {
      return new Response(JSON.stringify({ 
        error: 'chapterId, blockId, and blockType are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Upsert block progress
    const progress = await prisma.blockProgress.upsert({
      where: {
        userId_chapterId_blockId: {
          userId: parseInt(userId),
          chapterId: parseInt(chapterId),
          blockId: String(blockId)
        }
      },
      update: {
        completed: completed ?? undefined,
        score: score !== undefined ? parseFloat(score) : undefined,
        attempts: { increment: 1 },
        data: data ? JSON.stringify(data) : undefined
      },
      create: {
        userId: parseInt(userId),
        chapterId: parseInt(chapterId),
        blockId: String(blockId),
        blockType: String(blockType),
        completed: completed ?? false,
        score: score !== undefined ? parseFloat(score) : undefined,
        attempts: 1,
        data: data ? JSON.stringify(data) : undefined
      }
    });

    return new Response(JSON.stringify({ progress }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating block progress:', error);
    return new Response(JSON.stringify({ error: 'Failed to update progress' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

