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
    const { quizId, answers, timeSpent, endReason, sessionStartedAt, flaggedQuestions } = body;

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
        return new Response(JSON.stringify({ 
          error: 'Session window has expired',
          details: {
            sessionStartedAt: started.toISOString(),
            currentTime: now.toISOString(),
            elapsedSeconds: elapsed,
            allowedSeconds: quiz.openDurationSeconds,
            exceededBySeconds: elapsed - quiz.openDurationSeconds,
            timeLimitMinutes: Math.floor(quiz.openDurationSeconds / 60),
            elapsedTimeMinutes: Math.floor(elapsed / 60)
          }
        }), { status: 403, headers: { 'Content-Type': 'application/json' } });
      }
    } else if (quiz.openDurationSeconds && !sessionStartedAt) {
      // If there's an open duration but no session start time, reject for security
      return new Response(JSON.stringify({ 
        error: 'Session start time required',
        details: {
          reason: 'Quiz has time limit but no session start time was provided',
          timeLimitMinutes: Math.floor(quiz.openDurationSeconds / 60),
          currentTime: now.toISOString()
        }
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Calculate score
    const result = await calculateScore(quiz.questions, answers);
    result.timeSpent = timeSpent || 0;

    // Determine if score should be released immediately
    const scoreReleaseMode = quiz.scoreReleaseMode || 'immediate';
    const scoreReleasedAt = scoreReleaseMode === 'immediate' ? new Date() : null;

    // Attach flagged info to answers if provided
    const flaggedSet = Array.isArray(flaggedQuestions) ? new Set(flaggedQuestions.map((n: any) => parseInt(n))) : new Set<number>();
    const answersWithFlags = Array.isArray(answers)
      ? answers.map((a: any) => ({
          ...a,
          flagged: flaggedSet.has(a.questionId) || flaggedSet.has(a.questionId + 1)
        }))
      : answers;

    // Save quiz result
    const createdAttempt = await saveQuizResult({
      userId: parseInt(userId),
      quizId,
      answers: answersWithFlags,
      result,
      timeSpent: result.timeSpent,
      scoreReleasedAt,
      endReason: endReason === 'time_up' ? 'time_up' : 'manual'
    });

    return new Response(JSON.stringify({
      message: 'Quiz submitted successfully',
      score: result.percentage,
      attemptId: createdAttempt.id,
      scoreReleasedAt,
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

