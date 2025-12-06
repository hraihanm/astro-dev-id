import { prisma } from './db';

export async function getCourses() {
  return await prisma.course.findMany({
    include: {
      creator: {
        select: { email: true }
      },
      chapters: {
        orderBy: { order: 'asc' }
      }
    }
  });
}

export async function getCourse(slug: string) {
  return await prisma.course.findUnique({
    where: { slug },
    include: {
      chapters: {
        orderBy: { order: 'asc' }
      },
      quizzes: true
    }
  });
}

export async function createCourse(data: {
  title: string;
  description?: string;
  slug: string;
  createdBy: number;
  visibility?: string;
}) {
  const visibility = data.visibility?.toUpperCase() === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC';
  return await prisma.course.create({
    data: {
      ...data,
      visibility
    }
  });
}

export async function createChapter(data: {
  courseId: number;
  title: string;
  order: number;
  content?: string;
}) {
  return await prisma.chapter.create({
    data
  });
}

