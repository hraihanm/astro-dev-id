import type { APIRoute } from 'astro';
import { requireAdminAuth } from '../../../../../lib/auth';
import { createQuiz } from '../../../../../lib/quizzes';
import { prisma } from '../../../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    const auth = await requireAdminAuth(request, cookies);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    const quizId = parseInt(id!);

    // Get the existing quiz
    const existingQuiz = await prisma.quiz.findUnique({
      where: { id: quizId }
    });

    if (!existingQuiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { 
      newTitle,
      questions: providedQuestions,
      settings: providedSettings,
      title: providedTitle,
      description,
      notes,
      timeLimit,
      quizType: providedQuizType,
      attemptLimit: providedAttemptLimit,
      scoreReleaseMode: providedScoreReleaseMode,
      visibility: providedVisibility,
      courseId: providedCourseId,
      chapterId: providedChapterId,
      availableFrom: providedAvailableFrom,
      availableUntil: providedAvailableUntil,
      openDurationSeconds: providedOpenDurationSeconds
    } = body;

    if (!newTitle || typeof newTitle !== 'string' || !newTitle.trim()) {
      return new Response(JSON.stringify({ error: 'New title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use provided data if available (includes unsaved changes), otherwise use database data
    const questions = providedQuestions || JSON.parse(existingQuiz.questions || '[]');
    const existingSettings = existingQuiz.settings ? JSON.parse(existingQuiz.settings) : {};
    const settings = providedSettings || {
      ...existingSettings,
      ...(description !== undefined && { description }),
      ...(notes !== undefined && { notes }),
      ...(timeLimit !== undefined && { timeLimit: timeLimit ? timeLimit * 60 : undefined })
    };

    // Create duplicate quiz with current state
    const duplicatedQuiz = await createQuiz({
      courseId: providedCourseId !== undefined ? providedCourseId : existingQuiz.courseId,
      chapterId: providedChapterId !== undefined ? providedChapterId : existingQuiz.chapterId,
      title: newTitle.trim(),
      questions,
      settings,
      quizType: providedQuizType || existingQuiz.quizType || 'latihan',
      attemptLimit: providedAttemptLimit !== undefined ? providedAttemptLimit : existingQuiz.attemptLimit,
      scoreReleaseMode: providedScoreReleaseMode || existingQuiz.scoreReleaseMode || 'immediate',
      visibility: providedVisibility || existingQuiz.visibility || 'PUBLIC',
      availableFrom: providedAvailableFrom !== undefined ? (providedAvailableFrom ? new Date(providedAvailableFrom) : null) : existingQuiz.availableFrom,
      availableUntil: providedAvailableUntil !== undefined ? (providedAvailableUntil ? new Date(providedAvailableUntil) : null) : existingQuiz.availableUntil,
      openDurationSeconds: providedOpenDurationSeconds !== undefined ? providedOpenDurationSeconds : existingQuiz.openDurationSeconds
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Quiz duplicated successfully',
      quiz: {
        id: duplicatedQuiz.id,
        title: duplicatedQuiz.title
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Duplicate quiz error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

