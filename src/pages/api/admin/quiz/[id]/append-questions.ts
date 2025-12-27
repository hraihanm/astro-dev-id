import type { APIRoute } from 'astro';
import { requireAdminAuth } from '../../../../../lib/auth';
import { parseMarkdownQuiz } from '../../../../../lib/parsers/quiz-markdown';
import { parseMCProblems } from '../../../../../lib/parsers/mc-problem';
import type { QuizQuestion } from '../../../../../lib/parsers/quiz-markdown';
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

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse existing questions
    let existingQuestions: QuizQuestion[] = [];
    try {
      existingQuestions = JSON.parse(existingQuiz.questions || '[]');
    } catch (error) {
      existingQuestions = [];
    }

    // Parse the Markdown file
    const content = await file.text();
    let newQuestions: QuizQuestion[] = [];
    
    try {
      newQuestions = parseMarkdownQuiz(content);
      if (!newQuestions || newQuestions.length === 0) {
        // Fallback to MC problem parser if markdown quiz parser returns empty
        const mcProblems = parseMCProblems(content);
        if (mcProblems && mcProblems.length > 0) {
          const maxId = existingQuestions.length > 0 
            ? Math.max(...existingQuestions.map(q => q.id || 0))
            : 0;
          
          newQuestions = mcProblems.map((problem, index) => {
            const correctAnswerIndex = problem.correctAnswer.charCodeAt(0) - 64; // A -> 1
            return {
              id: maxId + index + 1,
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
      } else {
        // Assign new IDs to imported questions
        const maxId = existingQuestions.length > 0 
          ? Math.max(...existingQuestions.map(q => q.id || 0))
          : 0;
        
        newQuestions = newQuestions.map((q, index) => ({
          ...q,
          id: maxId + index + 1
        }));
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

    if (newQuestions.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No valid questions found in file' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Append new questions to existing ones
    const allQuestions = [...existingQuestions, ...newQuestions];

    // Update the quiz with merged questions
    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: {
        questions: JSON.stringify(allQuestions)
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully appended ${newQuestions.length} questions`,
      appendedCount: newQuestions.length,
      totalCount: allQuestions.length,
      quiz: {
        id: updatedQuiz.id,
        title: updatedQuiz.title
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Append questions error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

