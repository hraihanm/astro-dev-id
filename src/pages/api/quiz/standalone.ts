import type { APIRoute } from 'astro';
import { getStandaloneQuizzes } from '../../../lib/quizzes';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const quizzes = await getStandaloneQuizzes();

    // Parse questions for each quiz
    const quizzesWithParsed = quizzes.map(quiz => ({
      ...quiz,
      questions: JSON.parse(quiz.questions),
      settings: quiz.settings ? JSON.parse(quiz.settings) : {}
    }));

    return new Response(JSON.stringify({
      quizzes: quizzesWithParsed
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Standalone quizzes fetch error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      quizzes: []
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

