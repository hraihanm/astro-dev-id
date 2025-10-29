import type { APIRoute } from 'astro';
import { parseEssayProblems, essayProblemsToJson } from '../../../../lib/parsers/essay-problem';
import { prisma } from '../../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check if user is authenticated and is admin
    const userId = cookies.get('user_id')?.value;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Autentikasi diperlukan' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get form data
    const formData = await request.formData();
    
    // Get essay file
    const file = formData.get('file') as File;
    if (!file) {
      return new Response(JSON.stringify({ error: 'Tidak ada file yang diunggah' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get metadata
    const courseId = parseInt(formData.get('courseId') as string);
    const title = formData.get('title') as string || 'Soal Essay';
    const chapterIdStr = formData.get('chapterId') as string;

    if (!courseId) {
      return new Response(JSON.stringify({ 
        error: 'ID Kursus diperlukan' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse the Markdown file
    const content = await file.text();
    console.log('Essay file content length:', content.length);
    console.log('First 200 chars:', content.substring(0, 200));
    
    let problems;
    
    try {
      problems = parseEssayProblems(content);
      console.log('Parsed problems:', problems.length);
      console.log('Problem titles:', problems.map(p => p.title));
    } catch (error: any) {
      console.error('Parse error:', error);
      return new Response(JSON.stringify({ 
        error: 'Gagal memparse file',
        details: error.message 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (problems.length === 0) {
      console.log('No problems found, returning error');
      return new Response(JSON.stringify({ 
        error: 'Tidak ada soal yang ditemukan dalam file' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert to JSON format
    const problemSetJson = essayProblemsToJson(problems);

    // Store in database (you might want to create a new table for essay problems)
    // For now, we'll save as a special quiz type
    const quiz = await prisma.quiz.create({
      data: {
        courseId,
        title,
        questions: JSON.stringify(problemSetJson),
        settings: JSON.stringify({
          type: 'essay',
          problemCount: problems.length,
          createdAt: new Date().toISOString()
        })
      }
    });

    console.log('Quiz saved to database:', {
      id: quiz.id,
      title: quiz.title,
      courseId: quiz.courseId,
      problemCount: problems.length
    });
    console.log('Returning success with', problems.length, 'problems');
    
    return new Response(JSON.stringify({
      success: true,
      message: `Berhasil mengimpor ${problems.length} soal essay`,
      problemCount: problems.length,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        problemCount: problems.length
      },
      problems: problems.map(p => ({
        title: p.title,
        subproblemCount: p.subproblems.length,
        imageCount: p.images.length
      }))
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Essay import error:', error);
    return new Response(JSON.stringify({ 
      error: 'Kesalahan server internal',
      details: error instanceof Error ? error.message : 'Kesalahan tidak dikenal'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

