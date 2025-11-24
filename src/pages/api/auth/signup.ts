import type { APIRoute } from 'astro';
import { createUser, getUserByEmail } from '../../../lib/users';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  try {
    let email: string | undefined;
    let password: string | undefined;
    let fullName: string | undefined;
    let nickname: string | undefined;
    let grade: string | undefined;
    let school: string | undefined;

    // Handle both form data and JSON
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      email = body.email;
      password = body.password;
      fullName = body.fullName;
      nickname = body.nickname;
      grade = body.grade;
      school = body.school;
    } else {
      const formData = await request.formData();
      email = formData.get('email')?.toString();
      password = formData.get('password')?.toString();
      fullName = formData.get('fullName')?.toString();
      nickname = formData.get('nickname')?.toString();
      grade = formData.get('grade')?.toString();
      school = formData.get('school')?.toString();
    }

    if (!email || !password || !fullName || !nickname || !grade || !school) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'User already exists' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create new user
    await createUser({ email, password, fullName, nickname, grade, school });

    // Return success response for JSON requests, redirect for form submissions
    if (contentType.includes('application/json')) {
      return new Response(JSON.stringify({ success: true, message: 'Account created successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return redirect('/auth/signin');
  } catch (error) {
    console.error('Signup error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

