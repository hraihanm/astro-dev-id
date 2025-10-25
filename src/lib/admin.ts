import { prisma } from './db';

export async function getAdminStats() {
  const [totalUsers, totalCourses, totalChapters, recentActivity] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.chapter.count(),
    prisma.course.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { email: true } },
        chapters: { select: { id: true } }
      }
    })
  ]);

  return {
    totalUsers,
    totalCourses,
    totalChapters,
    recentActivity
  };
}

export async function getAllCourses() {
  return await prisma.course.findMany({
    include: {
      creator: { select: { email: true } },
      chapters: { select: { id: true, title: true, order: true } },
      quizzes: { select: { id: true, title: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

