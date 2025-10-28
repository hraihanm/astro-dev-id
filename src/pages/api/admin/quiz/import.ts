import type { APIRoute } from 'astro';
import { createQuiz } from '../../../../lib/quizzes';
import { parseMarkdownQuiz } from '../../../../lib/parsers/quiz-markdown';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check if user is authenticated and is admin
    const userId = cookies.get('user_id')?.value;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get form data
    const formData = await request.formData();
    
    // Get quiz file
    const file = formData.get('file') as File;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get quiz metadata
    const courseId = parseInt(formData.get('courseId') as string);
    const title = formData.get('title') as string;
    const timeLimitMinutes = formData.get('timeLimit') as string;
    const maxAttemptsStr = formData.get('maxAttempts') as string;

    if (!courseId || !title) {
      return new Response(JSON.stringify({ 
        error: 'Course ID and title are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse the Markdown file
    const content = await file.text();
    let questions;
    
    try {
      questions = parseMarkdownQuiz(content);
    } catch (error: any) {
      return new Response(JSON.stringify({ 
        error: 'Failed to parse quiz file',
        details: error.message 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (questions.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No valid questions found in file' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create quiz with settings
    const quiz = await createQuiz({
      courseId,
      title,
      questions,
      settings: {
        timeLimit: timeLimitMinutes ? parseInt(timeLimitMinutes) * 60 : undefined,
        maxAttempts: maxAttemptsStr ? parseInt(maxAttemptsStr) : undefined,
        createdAt: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: `Quiz created successfully with ${questions.length} questions`,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        questionCount: questions.length
      },
      questions: questions.map(q => ({
        id: q.id,
        type: q.type,
        optionCount: q.options.length
      }))
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Quiz import error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

