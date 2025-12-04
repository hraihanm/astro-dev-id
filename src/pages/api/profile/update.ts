import type { APIRoute } from 'astro';
import { updateUserProfile } from '../../../lib/profile';

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
    const { nickname, fullName, firstName, lastName, bio, school, grade, learningGoals, learningLevel, timezone, language } = body;

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

    return new Response(JSON.stringify({
      message: 'Profile updated successfully'
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

