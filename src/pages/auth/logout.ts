import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect }) => {
  // Clear the user_id cookie
  cookies.delete('user_id', { path: '/' });
  
  // Redirect to signin page
  return redirect('/auth/signin');
};

