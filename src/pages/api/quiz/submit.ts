import type { APIRoute } from 'astro';
import { getQuiz } from '../../../lib/quizzes';
import { calculateScore, saveQuizResult } from '../../../lib/scoring';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
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
    const { quizId, answers, timeSpent, endReason, sessionStartedAt } = body;

    if (!quizId || !answers) {
      return new Response(JSON.stringify({ error: 'Quiz ID and answers are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get quiz details
    const quiz = await getQuiz(quizId);
    if (!quiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Enforce availability window
    const now = new Date();
    if (quiz.availableFrom && now < new Date(quiz.availableFrom)) {
      return new Response(JSON.stringify({ error: 'Quiz not yet open' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
    if (quiz.availableUntil && now > new Date(quiz.availableUntil)) {
      return new Response(JSON.stringify({ error: 'Quiz has been closed' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
    if (quiz.openDurationSeconds && sessionStartedAt) {
      const started = new Date(sessionStartedAt);
      const elapsed = Math.floor((now.getTime() - started.getTime()) / 1000);
      if (elapsed > quiz.openDurationSeconds) {
        return new Response(JSON.stringify({ error: 'Session window has expired' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // Calculate score
    const result = calculateScore(quiz.questions, answers);
    result.timeSpent = timeSpent || 0;

    // Determine if score should be released immediately
    const scoreReleaseMode = quiz.scoreReleaseMode || 'immediate';
    const scoreReleasedAt = scoreReleaseMode === 'immediate' ? new Date() : null;

    // Save quiz result
    await saveQuizResult({
      userId: parseInt(userId),
      quizId,
      answers,
      result,
      timeSpent: result.timeSpent,
      scoreReleasedAt,
      endReason: endReason === 'time_up' ? 'time_up' : 'manual'
    });

    return new Response(JSON.stringify({
      message: 'Quiz submitted successfully',
      score: result.percentage,
      result: {
        score: result.score,
        percentage: result.percentage,
        correctAnswers: result.correctAnswers,
        totalQuestions: result.totalQuestions,
        timeSpent: result.timeSpent
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Quiz submission error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

