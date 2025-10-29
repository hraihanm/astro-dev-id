import type { APIRoute } from 'astro';
import { getCourseQuizzes } from '../../../../lib/quizzes';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    // Check if user is authenticated
    const userId = cookies.get('user_id')?.value;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Autentikasi diperlukan' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get courseId from query params
    const courseIdStr = url.searchParams.get('courseId');
    if (!courseIdStr) {
      return new Response(JSON.stringify({ error: 'courseId diperlukan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const courseId = parseInt(courseIdStr);
    
    // Get quizzes for this course
    const quizzes = await getCourseQuizzes(courseId);
    
    console.log(`Found ${quizzes.length} quizzes for course ${courseId}`);
    
    // Transform to include parsed settings and type information
    const quizzesWithDetails = quizzes.map(quiz => {
      const settings = quiz.settings ? JSON.parse(quiz.settings) : {};
      const questions = quiz.questions ? JSON.parse(quiz.questions) : [];
      
      // Determine type
      let type = settings.type || 'multiple-choice';
      if (settings.type === 'essay') {
        type = 'essay';
      } else if (Array.isArray(questions) && questions.length > 0) {
        // Check first question type
        type = questions[0].type || 'multiple-choice';
      }
      
      return {
        id: quiz.id,
        title: quiz.title,
        courseId: quiz.courseId,
        type,
        questionCount: Array.isArray(questions) ? questions.length : 0,
        problemCount: settings.problemCount || 0,
        settings,
        createdAt: quiz.createdAt
      };
    });

    return new Response(JSON.stringify(quizzesWithDetails), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Quiz list error:', error);
    return new Response(JSON.stringify({ 
      error: 'Kesalahan server internal',
      details: error instanceof Error ? error.message : 'Kesalahan tidak dikenal'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

