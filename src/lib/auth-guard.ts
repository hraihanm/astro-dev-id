import { prisma } from './db';
import type { AstroCookies } from 'astro';

export async function getSessionUser(cookies: AstroCookies) {
    const userId = cookies.get('user_id')?.value;
    if (!userId) return null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            include: { profile: true }
        });
        return user;
    } catch (error) {
        console.error('Error fetching session user:', error);
        return null;
    }
}

// Get display name for user (nickname > firstName > email username)
export function getDisplayName(user: any): string {
    if (!user) return '';
    
    // Priority: nickname > firstName > fullName > email username
    if (user.profile?.nickname) return user.profile.nickname;
    if (user.profile?.firstName) return user.profile.firstName;
    if (user.profile?.fullName) return user.profile.fullName.split(' ')[0];
    
    // Fallback to email username
    return user.email.split('@')[0];
}

// Get user initials for avatar
export function getUserInitials(user: any): string {
    if (!user) return '?';
    
    if (user.profile?.nickname) return user.profile.nickname[0].toUpperCase();
    if (user.profile?.firstName) return user.profile.firstName[0].toUpperCase();
    if (user.profile?.fullName) return user.profile.fullName[0].toUpperCase();
    
    return user.email[0].toUpperCase();
}

export async function requireAdmin(cookies: AstroCookies) {
    const user = await getSessionUser(cookies);

    if (!user || user.role !== 'admin') {
        return null;
    }

    return user;
}
