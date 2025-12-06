import type { APIRoute } from 'astro';
import { randomBytes } from 'crypto';
import { prisma } from '../../../../lib/db';
import { sendPasswordResetEmail } from '../../../../lib/mailer';
import { getUserByEmail } from '../../../../lib/users';

export const prerender = false;

const TOKEN_EXPIRY_HOURS = 1;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await getUserByEmail(email);

    // Always return success response to avoid user enumeration
    if (!user) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    const db = prisma as any;
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    const origin = request.headers.get('origin') || '';
    const resetUrl = `${origin}/auth/reset/${token}`;
    const sent = await sendPasswordResetEmail({ to: email, resetUrl });
    if (!sent.ok) {
      return new Response(JSON.stringify({ error: sent.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

