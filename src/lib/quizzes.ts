import { prisma } from './db';

export async function getCourseQuizzes(courseId: number, chapterId?: number) {
  return await prisma.quiz.findMany({
    where: {
      courseId,
      ...(chapterId !== undefined ? { chapterId } : {})
    },
    include: {
      course: {
        select: { title: true, slug: true }
      },
      chapter: {
        select: { title: true, order: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getChapterQuizzes(chapterId: number) {
  return await prisma.quiz.findMany({
    where: { chapterId },
    include: {
      course: {
        select: { title: true, slug: true }
      },
      chapter: {
        select: { title: true, order: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getStandaloneQuizzes(options?: { userId?: number; role?: string; classroomIds?: number[] }) {
  const { role, classroomIds = [] } = options || {};

  const baseWhere = { courseId: null as any };

  const visibilityFilter =
    role === 'admin'
      ? {}
      : {
          OR: [
            { NOT: { visibility: 'PRIVATE' } },
            {
              visibility: 'PRIVATE',
              classroomResources: classroomIds.length
                ? { some: { classroomId: { in: classroomIds } } }
                : { some: { classroomId: -1 } }
            }
          ]
        };

  return await prisma.quiz.findMany({
    where: {
      ...baseWhere,
      ...visibilityFilter
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getAllQuizzes() {
  return await prisma.quiz.findMany({
    include: {
      course: {
        select: { title: true, slug: true }
      },
      chapter: {
        select: { title: true, order: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getQuiz(quizId: number, options?: { role?: string; classroomIds?: number[] }) {
  const { role, classroomIds = [] } = options || {};
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      course: {
        select: { title: true, slug: true }
      },
      chapter: {
        select: { title: true, order: true }
      },
      classroomResources: {
        select: { classroomId: true }
      }
    }
  });

  if (!quiz) return null;

  const canAccess =
    quiz.visibility !== 'PRIVATE' ||
    quiz.visibility === null ||
    role === 'admin' ||
    (classroomIds.length > 0 && quiz.classroomResources.some((r: any) => classroomIds.includes(r.classroomId)));

  if (!canAccess) return null;

  return {
    ...quiz,
    questions: JSON.parse(quiz.questions),
    settings: quiz.settings ? JSON.parse(quiz.settings) : {}
  };
}

export async function createQuiz(data: {
  courseId?: number | null;
  chapterId?: number | null;
  title: string;
  questions: any[];
  settings?: any;
  quizType?: string;
  attemptLimit?: number | null;
  scoreReleaseMode?: string;
  visibility?: string;
}) {
  const courseId = data.courseId === undefined ? null : data.courseId;
  const chapterId = data.chapterId === undefined ? null : data.chapterId;
  const visibility = data.visibility?.toUpperCase() === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';

  return await prisma.quiz.create({
    data: {
      courseId: courseId as any,
      chapterId: chapterId as any,
      title: data.title,
      questions: JSON.stringify(data.questions),
      settings: data.settings ? JSON.stringify(data.settings) : null,
      quizType: data.quizType || 'latihan',
      attemptLimit: data.attemptLimit ?? null,
      scoreReleaseMode: data.scoreReleaseMode || 'immediate',
      visibility
    }
  });
}

export async function getQuizAttempts(userId: number, quizId?: number) {
  return await prisma.quizAttempt.findMany({
    where: {
      userId,
      ...(quizId && { quizId })
    },
    include: {
      quiz: {
        select: {
          title: true,
          course: { select: { title: true, slug: true } }
        }
      }
    },
    orderBy: { completedAt: 'desc' }
  });
}

