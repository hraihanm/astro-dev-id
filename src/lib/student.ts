import { prisma } from './db';

export async function getStudentCourses(options?: { userId?: number; role?: string; classroomIds?: number[] }) {
  const { userId, role, classroomIds = [] } = options || {};
  const visibilityFilter =
    role === 'admin'
      ? {}
      : {
          OR: [
            {
              OR: [
                { visibility: { not: 'PRIVATE' } },
                { visibility: null as any }
              ]
            },
            {
              visibility: 'PRIVATE',
              classroomResources: classroomIds.length
                ? { some: { classroomId: { in: classroomIds } } }
                : { some: { classroomId: -1 } }
            }
          ]
        };

  return await prisma.course.findMany({
    where: visibilityFilter,
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

export async function getCourseContent(courseSlug: string, options?: { userId?: number; role?: string; classroomIds?: number[] }) {
  const { role, classroomIds = [] } = options || {};
  const course = await prisma.course.findUnique({
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
      },
      classroomResources: {
        select: { classroomId: true }
      }
    }
  });

  if (!course) return null;

  const canAccess =
    course.visibility === 'PUBLIC' ||
    course.visibility !== 'PRIVATE' ||
    course.visibility === null ||
    role === 'admin' ||
    (classroomIds.length > 0 &&
      course.classroomResources.some((r: any) => classroomIds.includes(r.classroomId)));

  if (!canAccess) return null;

  return course;
}

export async function getChapterContent(courseSlug: string, chapterOrder: number, userId?: number, options?: { role?: string; classroomIds?: number[] }) {
  const { role, classroomIds = [] } = options || {};
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
      },
      classroomResources: {
        select: { classroomId: true }
      }
    }
  });

  if (!course) return null;

  const canAccess =
    course.visibility === 'PUBLIC' ||
    course.visibility !== 'PRIVATE' ||
    course.visibility === null ||
    role === 'admin' ||
    (classroomIds.length > 0 &&
      course.classroomResources.some((r: any) => classroomIds.includes(r.classroomId)));

  if (!canAccess) return null;

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

