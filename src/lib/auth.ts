import type { APIRoute } from 'astro';
import { randomBytes } from 'crypto';
import { prisma } from './db';

type AuthResult =
  | { ok: true; userId: number | null; userEmail?: string; method: 'cookie' | 'api-key' }
  | { ok: false; status: number; message: string };

/**
 * Robust admin authorization helper.
 * Supports:
 * - Cookie-based session: user_id cookie + role === 'admin'
 * - API key: header `x-api-key: <ADMIN_API_KEY>` or `Authorization: Bearer <ADMIN_API_KEY>`
 *
 * For local development convenience, if ADMIN_API_KEY is not set,
 * a default key of `dev-admin-key` is accepted (non-production only).
 */
export async function requireAdminAuth(request: Request, cookies: APIRoute['cookies']): Promise<AuthResult> {
  const headerAuth = request.headers.get('authorization');
  const headerApiKey = request.headers.get('x-api-key');

  const apiKeyFromAuthHeader = headerAuth?.toLowerCase().startsWith('bearer ')
    ? headerAuth.slice(7)
    : undefined;
  const providedApiKey = headerApiKey || apiKeyFromAuthHeader;

  // First: check per-admin user API key
  if (providedApiKey) {
    const userWithKey = await prisma.user.findFirst({
      where: { apiKey: providedApiKey, role: 'admin' },
      select: { id: true, email: true }
    });
    if (userWithKey) {
      return { ok: true, userId: userWithKey.id, userEmail: userWithKey.email, method: 'api-key' };
    }
  }

  const configuredKey = process.env.ADMIN_API_KEY;
  const devKey = !configuredKey && process.env.NODE_ENV !== 'production' ? 'dev-admin-key' : null;
  const acceptedApiKey = configuredKey || devKey;

  if (providedApiKey && acceptedApiKey && providedApiKey === acceptedApiKey) {
    return { ok: true, userId: null, method: 'api-key' };
  }

  const userId = cookies.get('user_id')?.value;
  if (!userId) {
    return { ok: false, status: 401, message: 'Authentication required' };
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    select: { id: true, email: true, role: true }
  });

  if (!user) {
    return { ok: false, status: 401, message: 'User not found' };
  }

  if (user.role !== 'admin') {
    return { ok: false, status: 403, message: 'Admin access required' };
  }

  return { ok: true, userId: user.id, userEmail: user.email, method: 'cookie' };
}

export function generateApiKey(): string {
  return randomBytes(32).toString('hex');
}
