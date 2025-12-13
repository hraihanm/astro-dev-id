import type { APIRoute } from 'astro';
import { prisma } from '../../../../../lib/db';
import { requireAdminAuth } from '../../../../../lib/auth';

export const prerender = false;

interface QuestionUpdate {
    id: number;
    [key: string]: any;
}

interface QuestionUpdates {
    updated?: QuestionUpdate[];
    added?: any[];
    deleted?: number[];
    reordered?: number[];
}

function validateQuestion(q: any, idx: number, prefix: string): string[] {
    const errors: string[] = [];

    if (!q || typeof q !== 'object') {
        errors.push(`${prefix}[${idx}] must be an object`);
        return errors;
    }
    if (!q.question || typeof q.question !== 'string' || !q.question.trim()) {
        errors.push(`${prefix}[${idx}].question is required`);
    }
    const type = q.type || 'multiple-choice';
    if (type === 'multiple-choice') {
        if (!Array.isArray(q.options) || q.options.length < 2) {
            errors.push(`${prefix}[${idx}].options must be an array with at least 2 options`);
        }
        if (q.correctAnswer === undefined || q.correctAnswer === null || !Number.isInteger(q.correctAnswer)) {
            errors.push(`${prefix}[${idx}].correctAnswer is required and must be an integer index`);
        } else if (Array.isArray(q.options)) {
            const len = q.options.length;
            const zeroBasedValid = q.correctAnswer >= 0 && q.correctAnswer < len;
            const oneBasedValid = q.correctAnswer >= 1 && q.correctAnswer <= len;
            if (!zeroBasedValid && !oneBasedValid) {
                errors.push(`${prefix}[${idx}].correctAnswer must be a valid index into options`);
            }
        }
    }

    return errors;
}

export const PATCH: APIRoute = async ({ params, cookies, request }) => {
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

        // Fetch current quiz
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
            title,
            description,
            timeLimit,
            quizType,
            attemptLimit,
            scoreReleaseMode,
            visibility,
            courseId: rawCourseId,
            chapterId: rawChapterId,
            availableFrom,
            availableUntil,
            openDurationSeconds,
            notes,
            questionUpdates
        }: {
            title?: string;
            description?: string;
            timeLimit?: number;
            quizType?: string;
            attemptLimit?: number | null;
            scoreReleaseMode?: string;
            visibility?: string;
            courseId?: number | string | null;
            chapterId?: number | string | null;
            availableFrom?: string | null;
            availableUntil?: string | null;
            openDurationSeconds?: number | null;
            notes?: string;
            questionUpdates?: QuestionUpdates;
        } = body;

        // Parse existing questions
        let questions: any[] = [];
        try {
            questions = JSON.parse(existingQuiz.questions);
        } catch {
            questions = [];
        }

        // Apply delta updates if provided
        if (questionUpdates) {
            const { updated, added, deleted, reordered } = questionUpdates;
            const errors: string[] = [];

            // Create a map for quick lookup
            const questionMap = new Map<number, any>();
            questions.forEach(q => {
                if (q.id !== undefined) {
                    questionMap.set(q.id, q);
                }
            });

            // Apply deletions first
            if (deleted && Array.isArray(deleted)) {
                deleted.forEach(qId => {
                    questionMap.delete(qId);
                });
            }

            // Apply updates
            if (updated && Array.isArray(updated)) {
                updated.forEach((q, idx) => {
                    if (q.id !== undefined && questionMap.has(q.id)) {
                        // Validate updated question
                        const qErrors = validateQuestion(q, idx, 'questionUpdates.updated');
                        errors.push(...qErrors);

                        // Merge with existing question
                        questionMap.set(q.id, { ...questionMap.get(q.id), ...q });
                    }
                });
            }

            // Apply additions
            if (added && Array.isArray(added)) {
                // Find max existing ID
                let maxId = 0;
                questionMap.forEach((_, id) => {
                    if (id > maxId) maxId = id;
                });

                added.forEach((q, idx) => {
                    // Validate added question
                    const qErrors = validateQuestion(q, idx, 'questionUpdates.added');
                    errors.push(...qErrors);

                    // Assign new ID if not present
                    const newId = q.id ?? ++maxId;
                    questionMap.set(newId, { ...q, id: newId });
                });
            }

            if (errors.length > 0) {
                return new Response(JSON.stringify({ error: 'Invalid questions', details: errors }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Apply reordering if provided
            if (reordered && Array.isArray(reordered)) {
                questions = reordered
                    .filter(id => questionMap.has(id))
                    .map(id => questionMap.get(id));

                // Add any questions not in reorder list at the end
                questionMap.forEach((q, id) => {
                    if (!reordered.includes(id)) {
                        questions.push(q);
                    }
                });
            } else {
                // Convert map back to array, maintaining insertion order
                questions = Array.from(questionMap.values());
            }
        }

        // Build update data
        const updateData: any = {};

        if (title !== undefined) updateData.title = title;
        if (quizType !== undefined) updateData.quizType = quizType || 'exercise';
        if (attemptLimit !== undefined) updateData.attemptLimit = attemptLimit ?? null;
        if (scoreReleaseMode !== undefined) updateData.scoreReleaseMode = scoreReleaseMode || 'immediate';
        if (visibility !== undefined) {
            const vis = visibility.toString().toUpperCase();
            updateData.visibility = vis === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
        }
        if (availableFrom !== undefined) {
            updateData.availableFrom = availableFrom ? new Date(availableFrom) : null;
        }
        if (availableUntil !== undefined) {
            updateData.availableUntil = availableUntil ? new Date(availableUntil) : null;
        }
        if (openDurationSeconds !== undefined) {
            updateData.openDurationSeconds = openDurationSeconds ?? null;
        }

        // Handle course/chapter relationships
        if (rawCourseId !== undefined || rawChapterId !== undefined) {
            const parsedCourseId = rawCourseId !== undefined && rawCourseId !== null ? parseInt(String(rawCourseId)) : null;
            const parsedChapterId = rawChapterId !== undefined && rawChapterId !== null ? parseInt(String(rawChapterId)) : null;

            let courseId: number | null = Number.isFinite(parsedCourseId) ? parsedCourseId : null;
            let chapterId: number | null = Number.isFinite(parsedChapterId) ? parsedChapterId : null;

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
                const courseExists = await prisma.course.findUnique({ where: { id: courseId } });
                if (!courseExists) {
                    return new Response(JSON.stringify({ error: 'Invalid courseId' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
            }

            updateData.courseId = courseId;
            updateData.chapterId = chapterId;
        }

        // Always update questions if delta was provided
        if (questionUpdates) {
            updateData.questions = JSON.stringify(questions);
        }

        // Update settings
        let existingSettings: any = {};
        try {
            existingSettings = existingQuiz.settings ? JSON.parse(existingQuiz.settings) : {};
        } catch {
            existingSettings = {};
        }

        const newSettings = { ...existingSettings };
        if (description !== undefined) newSettings.description = description;
        if (notes !== undefined) newSettings.notes = notes;
        if (timeLimit !== undefined) newSettings.timeLimit = timeLimit ? timeLimit * 60 : undefined;

        updateData.settings = JSON.stringify(newSettings);

        // Perform update
        const quiz = await prisma.quiz.update({
            where: { id: quizId },
            data: updateData
        });

        return new Response(JSON.stringify({
            message: 'Quiz updated successfully',
            quiz,
            questionsCount: questions.length
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Quiz patch error:', error);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
