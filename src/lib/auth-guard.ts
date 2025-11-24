import { prisma } from './db';
import type { AstroCookies } from 'astro';

export async function getSessionUser(cookies: AstroCookies) {
    const userId = cookies.get('user_id')?.value;
    if (!userId) return null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) }
        });
        return user;
    } catch (error) {
        console.error('Error fetching session user:', error);
        return null;
    }
}

export async function requireAdmin(cookies: AstroCookies) {
    const user = await getSessionUser(cookies);

    if (!user || user.role !== 'admin') {
        return null;
    }

    return user;
}
