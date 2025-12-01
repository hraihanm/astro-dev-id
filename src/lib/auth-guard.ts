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
    if (user.profile?.nickname?.trim()) return user.profile.nickname.trim();
    if (user.profile?.firstName?.trim()) return user.profile.firstName.trim();
    if (user.profile?.fullName?.trim()) {
        const firstName = user.profile.fullName.trim().split(' ')[0];
        if (firstName) return firstName;
    }
    
    // Fallback to email username
    if (user.email?.includes('@')) {
        return user.email.split('@')[0];
    }
    return user.email || '';
}

// Get user initials for avatar
export function getUserInitials(user: any): string {
    if (!user) return '?';
    
    if (user.profile?.nickname?.trim()) {
        const firstChar = user.profile.nickname.trim()[0];
        if (firstChar) return firstChar.toUpperCase();
    }
    if (user.profile?.firstName?.trim()) {
        const firstChar = user.profile.firstName.trim()[0];
        if (firstChar) return firstChar.toUpperCase();
    }
    if (user.profile?.fullName?.trim()) {
        const firstChar = user.profile.fullName.trim()[0];
        if (firstChar) return firstChar.toUpperCase();
    }
    
    if (user.email?.trim()) {
        const firstChar = user.email.trim()[0];
        if (firstChar) return firstChar.toUpperCase();
    }
    
    return '?';
}

export async function requireAdmin(cookies: AstroCookies) {
    const user = await getSessionUser(cookies);

    if (!user || user.role !== 'admin') {
        return null;
    }

    return user;
}
