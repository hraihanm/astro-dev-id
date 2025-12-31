import type { APIRoute } from 'astro';
import { prisma } from '../../../../../../lib/db';
import { requireAdmin } from '../../../../../../lib/auth-guard';

export const prerender = false;

export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Authenticate admin
    const user = await requireAdmin(cookies);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    const attemptId = parseInt(id || '0');

    if (isNaN(attemptId)) {
      return new Response(JSON.stringify({ error: 'Invalid attempt ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get attempt
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: true
      }
    });

    if (!attempt) {
      return new Response(JSON.stringify({ error: 'Attempt not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const body = await request.json();
    const { questionIndex, score, maxScore, feedback } = body;

    if (questionIndex === undefined || questionIndex === null) {
      return new Response(JSON.stringify({ error: 'questionIndex is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (score === undefined || score === null || maxScore === undefined || maxScore === null) {
      return new Response(JSON.stringify({ error: 'score and maxScore are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const questionIndexNum = parseInt(questionIndex);
    const scoreNum = parseFloat(score);
    const maxScoreNum = parseFloat(maxScore);

    if (isNaN(questionIndexNum) || isNaN(scoreNum) || isNaN(maxScoreNum)) {
      return new Response(JSON.stringify({ error: 'Invalid questionIndex, score, or maxScore' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate score range
    if (scoreNum < 0 || scoreNum > maxScoreNum) {
      return new Response(JSON.stringify({ error: 'Score must be between 0 and maxScore' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse existing essay grading or initialize
    let essayGrading: Record<string, any> = {};
    if (attempt.essayGrading && typeof attempt.essayGrading === 'object') {
      essayGrading = attempt.essayGrading as Record<string, any>;
    }

    // Update grading for this question
    essayGrading[questionIndexNum.toString()] = {
      score: scoreNum,
      maxScore: maxScoreNum,
      feedback: feedback || '',
      gradedBy: user.id,
      gradedAt: new Date().toISOString()
    };

    // Parse questions and detailed results
    const questions = JSON.parse(attempt.quiz.questions || '[]');
    const detailedResults = JSON.parse(attempt.detailedResults || '[]');

    // Update detailed results for this question
    if (detailedResults[questionIndexNum]) {
      detailedResults[questionIndexNum].points = scoreNum;
      detailedResults[questionIndexNum].maxPoints = maxScoreNum;
      detailedResults[questionIndexNum].isCorrect = scoreNum === maxScoreNum;
    }

    // Recalculate total score
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

    // Update attempt
    const updatedAttempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        essayGrading: essayGrading,
        score: Math.round(earnedPoints),
        correctAnswers: correctAnswers,
        percentage: percentage,
        detailedResults: JSON.stringify(detailedResults)
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Essay graded successfully',
      attempt: {
        id: updatedAttempt.id,
        score: updatedAttempt.score,
        percentage: updatedAttempt.percentage,
        correctAnswers: updatedAttempt.correctAnswers,
        totalQuestions: updatedAttempt.totalQuestions
      },
      grading: essayGrading[questionIndexNum.toString()]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Essay grading error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

