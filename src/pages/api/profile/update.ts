import type { APIRoute } from 'astro';
import { updateUserProfile } from '../../../lib/profile';
import { getUserById, updateUserPassword, verifyPassword } from '../../../lib/users';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check if user is authenticated
    const userId = cookies.get('user_id')?.value;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const {
      nickname,
      fullName,
      firstName,
      lastName,
      bio,
      school,
      grade,
      learningGoals,
      learningLevel,
      timezone,
      language,
      currentPassword,
      newPassword
    } = body;

    const profileData = {
      nickname,
      fullName,
      firstName,
      lastName,
      bio,
      school,
      grade,
      learningGoals,
      learningLevel,
      timezone,
      language
    };

    await updateUserProfile(parseInt(userId), profileData);

    let passwordChanged = false;
    if (newPassword && typeof newPassword === 'string' && newPassword.trim().length > 0) {
      const trimmedNewPassword = newPassword.trim();

      if (trimmedNewPassword.length < 8) {
        return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const userRecord = await getUserById(parseInt(userId));
      if (!userRecord) {
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (userRecord.password) {
        if (!currentPassword || typeof currentPassword !== 'string' || currentPassword.length === 0) {
          return new Response(JSON.stringify({ error: 'Current password is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const isValid = await verifyPassword(currentPassword, userRecord.password);
        if (!isValid) {
          return new Response(JSON.stringify({ error: 'Current password is incorrect' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      await updateUserPassword(userRecord.id, trimmedNewPassword);
      passwordChanged = true;
    }

    return new Response(JSON.stringify({
      message: 'Profile updated successfully',
      passwordChanged
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

