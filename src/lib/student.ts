import { prisma } from './db';

export async function getStudentCourses() {
  return await prisma.course.findMany({
    include: {
      chapters: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          order: true,
          content: true
        }
      },
      quizzes: {
        select: {
          id: true,
          title: true,
          questions: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getCourseContent(courseSlug: string) {
  return await prisma.course.findUnique({
    where: { slug: courseSlug },
    include: {
      chapters: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          order: true,
          content: true
        }
      },
      quizzes: {
        select: {
          id: true,
          title: true,
          questions: true
        }
      }
    }
  });
}

export async function getChapterContent(courseSlug: string, chapterOrder: number, userId?: number) {
  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    include: {
      chapters: {
        orderBy: { order: 'asc' },
        include: {
          blockProgress: userId ? {
            where: { userId }
          } : false
        }
      }
    }
  });

  if (!course) return null;

  const chapter = course.chapters.find(ch => ch.order === chapterOrder);
  const prevChapter = course.chapters.find(ch => ch.order === chapterOrder - 1);
  const nextChapter = course.chapters.find(ch => ch.order === chapterOrder + 1);

  return {
    course,
    chapter,
    prevChapter,
    nextChapter
  };
}

