import type { APIRoute } from 'astro';
import { getUserByEmail, verifyPassword } from '../../../lib/users';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect, cookies }) => {
  try {
    let email: string | undefined;
    let password: string | undefined;

    // Handle both form data and JSON
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const body = await request.json();
      email = body.email;
      password = body.password;
    } else {
      const formData = await request.formData();
      email = formData.get('email')?.toString();
      password = formData.get('password')?.toString();
    }

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Set session cookie (simplified - in production use proper session management)
    cookies.set('user_id', user.id.toString(), {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    // Return success response for JSON requests, redirect for form submissions
    if (contentType.includes('application/json')) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Signed in successfully',
        user: { id: user.id, email: user.email, role: user.role }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return redirect('/');
  } catch (error) {
    console.error('Signin error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

