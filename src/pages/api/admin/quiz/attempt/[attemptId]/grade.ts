import type { APIRoute } from 'astro';
import { prisma } from '../../../../../lib/db';
import { requireAdmin } from '../../../../../lib/auth-guard';
import { calculateScore } from '../../../../../lib/scoring';
import { getQuiz } from '../../../../../lib/quizzes';

export const prerender = false;

export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Check authentication and admin role
    const user = await requireAdmin(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { attemptId } = params;
    if (!attemptId) {
      return new Response(JSON.stringify({ error: 'Attempt ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { questionId, points, feedback } = body;

    if (questionId === undefined || questionId === null) {
      return new Response(JSON.stringify({ error: 'Question ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get attempt
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: parseInt(attemptId) },
      include: { quiz: true }
    });

    if (!attempt) {
      return new Response(JSON.stringify({ error: 'Attempt not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse existing essay grading
    let essayGrading: Record<string, any> = {};
    if (attempt.essayGrading) {
      try {
        essayGrading = typeof attempt.essayGrading === 'string' 
          ? JSON.parse(attempt.essayGrading) 
          : attempt.essayGrading;
      } catch (e) {
        console.error('Error parsing essayGrading:', e);
      }
    }

    // Get quiz to find max points for the question
    const quiz = await getQuiz(attempt.quizId);
    if (!quiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const questions = typeof quiz.questions === 'string' 
      ? JSON.parse(quiz.questions) 
      : quiz.questions;

    const question = questions[questionId];
    if (!question || question.type !== 'essay') {
      return new Response(JSON.stringify({ error: 'Invalid question or not an essay question' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const maxPoints = question.maxPoints || 0;

    // Validate points
    if (points !== null && points !== undefined) {
      const pointsNum = parseInt(points);
      if (isNaN(pointsNum) || pointsNum < 0 || pointsNum > maxPoints) {
        return new Response(JSON.stringify({ 
          error: `Points must be between 0 and ${maxPoints}` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Update essay grading
    essayGrading[questionId.toString()] = {
      score: points !== null && points !== undefined ? parseFloat(points) : 0,
      maxScore: maxPoints,
      feedback: feedback || '',
      gradedAt: new Date().toISOString(),
      gradedBy: user.id
    };

    // Recalculate total score
    const answers = JSON.parse(attempt.answers);
    const detailedResults = JSON.parse(attempt.detailedResults || '[]');

    // Update detailed results for this question
    if (detailedResults[questionId]) {
      const pointsNum = points !== null && points !== undefined ? parseFloat(points) : 0;
      detailedResults[questionId].points = pointsNum;
      detailedResults[questionId].maxPoints = maxPoints;
      detailedResults[questionId].isCorrect = pointsNum === maxPoints;
    }

    // Recalculate totals
    let totalPoints = 0;
    let earnedPoints = 0;
    let correctAnswers = 0;

    detailedResults.forEach((result: any) => {
      const maxPts = result.maxPoints || 1;
      const pts = result.points || 0;
      totalPoints += maxPts;
      earnedPoints += pts;
      if (result.isCorrect) {
        correctAnswers++;
      }
    });

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const result = {
      score: Math.round(earnedPoints),
      totalQuestions: questions.length,
      correctAnswers: correctAnswers,
      incorrectAnswers: questions.length - correctAnswers,
      percentage: percentage,
      timeSpent: attempt.timeSpent,
      detailedResults: detailedResults
    };

    // Update attempt
    const updatedAttempt = await prisma.quizAttempt.update({
      where: { id: parseInt(attemptId) },
      data: {
        essayGrading: essayGrading,
        score: result.score,
        correctAnswers: result.correctAnswers,
        percentage: result.percentage,
        detailedResults: JSON.stringify(result.detailedResults)
      }
    });

    return new Response(JSON.stringify({
      success: true,
      grading: essayGrading[questionId.toString()],
      score: result.score,
      percentage: result.percentage,
      correctAnswers: result.correctAnswers
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Grading API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
