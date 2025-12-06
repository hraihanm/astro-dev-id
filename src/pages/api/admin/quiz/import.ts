import type { APIRoute } from 'astro';
import { createQuiz } from '../../../../lib/quizzes';
import { parseMarkdownQuiz } from '../../../../lib/parsers/quiz-markdown';
import { parseMCProblems } from '../../../../lib/parsers/mc-problem';
import type { QuizQuestion } from '../../../../lib/parsers/quiz-markdown';
import { prisma } from '../../../../lib/db';

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
    const courseIdRaw = formData.get('courseId') as string | null;
    const chapterIdRaw = formData.get('chapterId') as string | null;
    const title = formData.get('title') as string;
    const timeLimitMinutes = formData.get('timeLimit') as string;
    const maxAttemptsStr = formData.get('maxAttempts') as string;

    const parsedCourseId = courseIdRaw ? parseInt(courseIdRaw) : null;
    const parsedChapterId = chapterIdRaw ? parseInt(chapterIdRaw) : null;

    let courseId: number | null = Number.isFinite(parsedCourseId as any) ? (parsedCourseId as number) : null;
    let chapterId: number | null = Number.isFinite(parsedChapterId as any) ? (parsedChapterId as number) : null;

    if (!title) {
      return new Response(JSON.stringify({ 
        error: 'Title is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (chapterId !== null) {
      const chapter = await prisma.chapter.findUnique({
        where: { id: chapterId },
        select: { id: true, courseId: true }
      });

      if (!chapter) {
        return new Response(JSON.stringify({ error: 'Invalid chapterId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (courseId === null) {
        courseId = chapter.courseId;
      } else if (courseId !== chapter.courseId) {
        return new Response(JSON.stringify({ error: 'chapterId does not belong to courseId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (courseId !== null) {
      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        return new Response(JSON.stringify({ error: 'Invalid courseId' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (courseId === null && chapterId === null) {
      return new Response(JSON.stringify({ 
        error: 'courseId or chapterId is required' 
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
        const mcProblems = parseMCProblems(content);
        if (mcProblems && mcProblems.length > 0) {
          questions = mcProblems.map((problem, index) => {
            const correctAnswerIndex = problem.correctAnswer.charCodeAt(0) - 64; // A -> 1
            return {
              id: index + 1,
              type: 'multiple-choice',
              question: problem.question,
              options: problem.options.map((opt) => opt.text),
              correctAnswer: correctAnswerIndex,
              images: problem.questionImages,
              metadata: {
                solution: problem.solution,
                solutionImages: problem.solutionImages
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

    // Create quiz with settings
    const quiz = await createQuiz({
      courseId,
      chapterId,
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

