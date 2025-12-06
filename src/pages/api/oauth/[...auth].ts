import type { APIRoute } from 'astro';
import { Auth } from '@auth/core';
import Google from '@auth/core/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '../../../lib/db';
import { getUserByEmail } from '../../../lib/users';

export const prerender = false;

const requireEnv = (value: string | undefined, key: string) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' as const },
  trustHost: true,
  basePath: '/api/oauth',
  secret: import.meta.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: requireEnv(import.meta.env.GOOGLE_CLIENT_ID, 'GOOGLE_CLIENT_ID'),
      clientSecret: requireEnv(import.meta.env.GOOGLE_CLIENT_SECRET, 'GOOGLE_CLIENT_SECRET')
    })
  ],
  pages: {
    signIn: '/auth/signin'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'student';
        token.email = user.email;
        token.name = user.name;
      }

      // Refresh role/email if token already exists
      if (!user && token?.email) {
        const dbUser = await getUserByEmail(token.email);
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.name = dbUser.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as number;
        session.user.role = (token as any).role || 'student';
        session.user.email = token.email as string | undefined;
        session.user.name = (token as any).name as string | undefined;
      }
      return session;
    }
  },
  events: {
    async createUser({ user }) {
      try {
        await prisma.profile.create({
          data: {
            userId: user.id as number,
            fullName: user.name || user.email?.split('@')[0] || 'New User'
          }
        });
      } catch (error) {
        // Ignore if profile already exists
        console.error('Profile creation skipped:', error);
      }
    }
  }
};

export const GET: APIRoute = async ({ request }) => Auth(request, authConfig);
export const POST: APIRoute = async ({ request }) => Auth(request, authConfig);

