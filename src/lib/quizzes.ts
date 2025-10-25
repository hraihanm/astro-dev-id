import { prisma } from './db';

export async function getCourseQuizzes(courseId: number) {
  return await prisma.quiz.findMany({
    where: { courseId },
    include: {
      course: {
        select: { title: true, slug: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getQuiz(quizId: number) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      course: {
        select: { title: true, slug: true }
      }
    }
  });

  if (quiz) {
    return {
      ...quiz,
      questions: JSON.parse(quiz.questions),
      settings: quiz.settings ? JSON.parse(quiz.settings) : {}
    };
  }

  return null;
}

export async function createQuiz(data: {
  courseId: number;
  title: string;
  questions: any[];
  settings?: any;
}) {
  return await prisma.quiz.create({
    data: {
      courseId: data.courseId,
      title: data.title,
      questions: JSON.stringify(data.questions),
      settings: data.settings ? JSON.stringify(data.settings) : null
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

