import type { APIRoute } from 'astro';
import { parseMCProblems, mcProblemsToJson } from '../../../../lib/parsers/mc-problem';
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
    
    // Get MC file
    const file = formData.get('file') as File;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get metadata
    const title = formData.get('title') as string || 'Soal Pilihan Ganda';

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
    let problems;
    
    try {
      problems = parseMCProblems(content);
    } catch (error: any) {
      console.error('Parse error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse file',
        details: error.message 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (problems.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No problems found in file' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert to JSON format
    const problemSetJson = mcProblemsToJson(problems);

    // Store in database as standalone quiz (courseId = null)
    const quiz = await prisma.quiz.create({
      data: {
        courseId: null,
        title,
        questions: JSON.stringify(problemSetJson),
        settings: JSON.stringify({
          type: 'multiple-choice',
          problemCount: problems.length,
          createdAt: new Date().toISOString()
        })
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully imported ${problems.length} multiple choice problems`,
      problemCount: problems.length,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        problemCount: problems.length
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Standalone MC import error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

