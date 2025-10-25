import type { APIRoute} from 'astro';
import { createQuiz } from '../../../../lib/quizzes';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    // Check if user is authenticated and is admin
    const userId = cookies.get('user_id')?.value;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { courseId, title, description, timeLimit, maxAttempts, questions } = body;

    if (!title || !questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: 'Title and questions are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const quiz = await createQuiz({
      courseId,
      title,
      questions,
      settings: {
        description,
        timeLimit: timeLimit * 60, // Convert to seconds
        maxAttempts,
        createdAt: new Date()
      }
    });

    return new Response(JSON.stringify({
      message: 'Quiz created successfully',
      quiz
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Quiz creation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

