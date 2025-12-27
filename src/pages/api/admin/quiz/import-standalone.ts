import type { APIRoute } from 'astro';
import { createQuiz } from '../../../../lib/quizzes';
import { parseMarkdownQuiz } from '../../../../lib/parsers/quiz-markdown';
import { parseMCProblems } from '../../../../lib/parsers/mc-problem';
import type { QuizQuestion } from '../../../../lib/parsers/quiz-markdown';

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
    const title = formData.get('title') as string;
    const timeLimitMinutes = formData.get('timeLimit') as string;
    const maxAttemptsStr = formData.get('maxAttempts') as string;

    if (!title) {
      return new Response(JSON.stringify({ 
        error: 'Title is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse the Markdown file
    const content = await file.text();
    let questions: QuizQuestion[] = [];
    
    try {
      questions = parseMarkdownQuiz(content);
      if (!questions || questions.length === 0) {
        // Fallback to MC problem parser if markdown quiz parser returns empty
        const mcProblems = parseMCProblems(content);
        if (mcProblems && mcProblems.length > 0) {
          questions = mcProblems.map((problem, index) => {
            const correctAnswerIndex = problem.correctAnswer.charCodeAt(0) - 64; // A -> 1
            return {
              id: index + 1,
              type: 'multiple-choice',
              question: problem.question, // Images are now embedded in text as markdown
              options: problem.options.map((opt) => opt.text), // Images are now embedded in option text as markdown
              correctAnswer: correctAnswerIndex,
              images: [], // Images are now in text, not separate
              metadata: {
                solution: problem.solution, // Images are now embedded in solution text as markdown
                solutionImages: [] // Images are now in solution text, not separate
              }
            } as QuizQuestion;
          });
        }
      }
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

    // Create standalone quiz (courseId = null)
    const quiz = await createQuiz({
      courseId: null,
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
      message: `Successfully imported ${questions.length} questions`,
      questionCount: questions.length,
      quiz: {
        id: quiz.id,
        title: quiz.title
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Standalone quiz import error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

