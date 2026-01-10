import type { APIRoute } from 'astro';
import { getQuiz } from '../../../lib/quizzes';
import { prisma } from '../../../lib/db';

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
    const { quizId, answers, currentQuestionIndex, timeSpent, flaggedQuestions } = body;

    if (!quizId) {
      return new Response(JSON.stringify({ error: 'Quiz ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify quiz exists and user has access
    const quiz = await getQuiz(quizId);
    if (!quiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if quiz is still available
    const now = new Date();
    if (quiz.availableFrom && now < new Date(quiz.availableFrom)) {
      return new Response(JSON.stringify({ error: 'Quiz not yet open' }), { 
        status: 403, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    if (quiz.availableUntil && now > new Date(quiz.availableUntil)) {
      return new Response(JSON.stringify({ error: 'Quiz has been closed' }), { 
        status: 403, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Create or update temporary progress record
    const progressData = {
      userId: parseInt(userId),
      quizId,
      currentAnswers: JSON.stringify(answers || []),
      currentQuestionIndex: currentQuestionIndex || 0,
      timeSpent: timeSpent || 0,
      flaggedQuestions: JSON.stringify(flaggedQuestions || []),
      lastSavedAt: new Date(),
      isCompleted: false
    };

    // Upsert progress (create if not exists, update if exists)
    const progress = await prisma.quizProgress.upsert({
      where: {
        userId_quizId: {
          userId: parseInt(userId),
          quizId: quizId
        }
      },
      update: {
        currentAnswers: progressData.currentAnswers,
        currentQuestionIndex: progressData.currentQuestionIndex,
        timeSpent: progressData.timeSpent,
        flaggedQuestions: progressData.flaggedQuestions,
        lastSavedAt: progressData.lastSavedAt
      },
      create: progressData
    });

    return new Response(JSON.stringify({
      message: 'Progress saved successfully',
      progressId: progress.id,
      lastSavedAt: progressData.lastSavedAt
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Progress save error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const userId = cookies.get('user_id')?.value;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const quizId = parseInt(url.searchParams.get('quizId') || '0');

    if (!quizId) {
      return new Response(JSON.stringify({ error: 'Quiz ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Retrieve existing progress
    const progress = await prisma.quizProgress.findUnique({
      where: {
        userId_quizId: {
          userId: parseInt(userId),
          quizId: quizId
        }
      }
    });

    if (!progress) {
      return new Response(JSON.stringify({ 
        exists: false,
        message: 'No saved progress found' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if quiz is still available
    const quiz = await getQuiz(quizId);
    if (!quiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const now = new Date();
    const isExpired = quiz.availableUntil && now > new Date(quiz.availableUntil);

    return new Response(JSON.stringify({
      exists: true,
      progress: {
        currentAnswers: JSON.parse(progress.currentAnswers),
        currentQuestionIndex: progress.currentQuestionIndex,
        timeSpent: progress.timeSpent,
        flaggedQuestions: JSON.parse(progress.flaggedQuestions),
        lastSavedAt: progress.lastSavedAt
      },
      isExpired,
      quizAvailable: {
        availableFrom: quiz.availableFrom,
        availableUntil: quiz.availableUntil
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Progress retrieve error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
