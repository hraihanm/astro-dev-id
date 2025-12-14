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

  const whereFilter =
    role === 'admin'
      ? { courseId: null }
      : classroomIds.length > 0
        ? {
          courseId: null,
          OR: [
            { visibility: { not: 'PRIVATE' } } as any,
            { visibility: 'PRIVATE', classroomResources: { some: { classroomId: { in: classroomIds } } } } as any
          ]
        }
        : {
          courseId: null,
          visibility: { not: 'PRIVATE' } as any
        };

  return await prisma.quiz.findMany({
    where: whereFilter as any,
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
      // Cast to any to accommodate generated client that may not yet include this relation
      classroomResources: {
        select: { classroomId: true }
      } as any
    } as any
  });

  if (!quiz) return null;

  const visibility = (quiz as any).visibility;
  const classroomResources = (quiz as any).classroomResources || [];
  const availableFrom = (quiz as any).availableFrom ? new Date((quiz as any).availableFrom) : null;
  const availableUntil = (quiz as any).availableUntil ? new Date((quiz as any).availableUntil) : null;
  const openDurationSeconds = (quiz as any).openDurationSeconds ?? null;

  const canAccess =
    visibility !== 'PRIVATE' ||
    visibility === null ||
    role === 'admin' ||
    (classroomIds.length > 0 && classroomResources.some((r: any) => classroomIds.includes(r.classroomId)));

  if (!canAccess) return null;

  return {
    ...quiz,
    scoreReleaseMode: (quiz as any).scoreReleaseMode || 'immediate',
    availableFrom,
    availableUntil,
    openDurationSeconds,
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
  availableFrom?: Date | string | null;
  availableUntil?: Date | string | null;
  openDurationSeconds?: number | null;
}) {
  const courseId = data.courseId === undefined ? null : data.courseId;
  const chapterId = data.chapterId === undefined ? null : data.chapterId;
  const visibility = data.visibility?.toUpperCase() === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
  const availableFrom = data.availableFrom ? new Date(data.availableFrom) : null;
  const availableUntil = data.availableUntil ? new Date(data.availableUntil) : null;

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
      visibility,
      availableFrom: availableFrom as any,
      availableUntil: availableUntil as any,
      openDurationSeconds: data.openDurationSeconds ?? null
    } as any
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

