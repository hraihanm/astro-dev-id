import type { APIRoute } from 'astro';
import { prisma } from '../../../../lib/db';
import { generateApiKey, requireAdminAuth } from '../../../../lib/auth';

export const prerender = false;

/**
 * Generate/regenerate a per-admin API key.
 *
 * Auth: must be an admin (via cookie, per-admin api key, or global ADMIN_API_KEY/dev-admin-key).
 *
 * Request body (JSON):
 * - email?: string  // target admin email; if omitted, uses authenticated admin (when using cookie)
 *
 * Response:
 * {
 *   message: string,
 *   user: { id, email },
 *   apiKey: string
 * }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const auth = await requireAdminAuth(request, cookies);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json().catch(() => ({}));
    const targetEmail = body?.email?.toString().toLowerCase();

    let targetUserEmail: string | undefined = targetEmail;

    if (!targetUserEmail) {
      if (!auth.userEmail) {
        return new Response(JSON.stringify({ error: 'Email is required when using API key auth' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      targetUserEmail = auth.userEmail.toLowerCase();
    }

    const user = await prisma.user.findUnique({
      where: { email: targetUserEmail },
      select: { id: true, email: true, role: true }
    });

    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Target user is not an admin' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const apiKey = generateApiKey();

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { apiKey }
    });

    return new Response(JSON.stringify({
      message: 'Admin API key generated',
      user: { id: updated.id, email: updated.email },
      apiKey
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API key generation error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
