import type { APIRoute } from 'astro';
import { requireAdminAuth } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/db';
import { 
  extractImagesFromZip, 
  uploadImagesToBlob, 
  validateArchive 
} from '../../../../../lib/image-upload';
import { extractImagePaths, replaceImagePaths, createPathMapping } from '../../../../../lib/path-replacer';

export const prerender = false;

export const POST: APIRoute = async ({ params, request, cookies }) => {
  try {
    // Authenticate admin
    const auth = await requireAdminAuth(request, cookies);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.message }), {
        status: auth.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { id } = params;
    const quizId = parseInt(id!);

    // Verify quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId }
    });

    if (!quiz) {
      return new Response(JSON.stringify({ error: 'Quiz not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get form data
    const formData = await request.formData();
    const archiveFile = formData.get('archive') as File;
    
    if (!archiveFile) {
      return new Response(JSON.stringify({ error: 'No archive file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate archive
    const validation = validateArchive(archiveFile);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Read archive buffer
    const archiveBuffer = Buffer.from(await archiveFile.arrayBuffer());

    // Extract images from ZIP
    let images;
    try {
      images = await extractImagesFromZip(archiveBuffer, quizId);
    } catch (error: any) {
      console.error('Archive extraction error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to extract archive',
        details: error.message 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (images.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No valid images found in archive' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Upload images to Vercel Blob
    let pathMapping: Record<string, string>;
    try {
      pathMapping = await uploadImagesToBlob(images, quizId);
    } catch (error: any) {
      console.error('Blob upload error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to upload images',
        details: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract image paths from quiz questions
    let questions: any[] = [];
    try {
      questions = JSON.parse(quiz.questions || '[]');
    } catch (error) {
      questions = [];
    }

    // Extract all image paths from questions
    const allImagePaths: string[] = [];
    for (const question of questions) {
      // Extract from question text
      const questionPaths = extractImagePaths(question.question || '');
      allImagePaths.push(...questionPaths);

      // Extract from options
      if (Array.isArray(question.options)) {
        for (const option of question.options) {
          const optionPaths = extractImagePaths(option || '');
          allImagePaths.push(...optionPaths);
        }
      }

      // Extract from solution/metadata
      if (question.metadata?.solution) {
        const solutionPaths = extractImagePaths(question.metadata.solution);
        allImagePaths.push(...solutionPaths);
      }
    }

    // Create mapping for paths found in quiz
    const quizPathMapping = createPathMapping(allImagePaths, pathMapping);

    // Replace paths in questions
    const updatedQuestions = questions.map(question => {
      const updated = { ...question };

      // Replace in question text
      if (updated.question) {
        updated.question = replaceImagePaths(updated.question, quizPathMapping);
      }

      // Replace in options
      if (Array.isArray(updated.options)) {
        updated.options = updated.options.map((opt: string) => 
          replaceImagePaths(opt, quizPathMapping)
        );
      }

      // Replace in solution
      if (updated.metadata?.solution) {
        updated.metadata = {
          ...updated.metadata,
          solution: replaceImagePaths(updated.metadata.solution, quizPathMapping)
        };
      }

      return updated;
    });

    // Update quiz with new paths
    await prisma.quiz.update({
      where: { id: quizId },
      data: {
        questions: JSON.stringify(updatedQuestions)
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: `Successfully uploaded ${images.length} images`,
      uploadedCount: images.length,
      pathMapping: pathMapping,
      replacedCount: Object.keys(quizPathMapping).length,
      quiz: {
        id: quiz.id,
        title: quiz.title
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Image upload error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

