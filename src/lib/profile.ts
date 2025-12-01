import { prisma } from './db';

export async function getUserProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      profile: true
    }
  });

  if (user && user.profile) {
    return {
      ...user,
      profile: {
        ...user.profile,
        preferences: user.profile.preferences ? JSON.parse(user.profile.preferences) : {},
        learningGoals: user.profile.learningGoals ? JSON.parse(user.profile.learningGoals) : []
      }
    };
  }

  return user;
}

export async function updateUserProfile(userId: number, data: {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  preferences?: any;
  learningGoals?: string[];
  timezone?: string;
  language?: string;
  learningLevel?: string;
}) {
  const profileData = {
    firstName: data.firstName,
    lastName: data.lastName,
    bio: data.bio,
    avatar: data.avatar,
    preferences: data.preferences ? JSON.stringify(data.preferences) : undefined,
    learningGoals: data.learningGoals ? JSON.stringify(data.learningGoals) : undefined,
    timezone: data.timezone,
    language: data.language
  };

  // Remove undefined values
  Object.keys(profileData).forEach(key => 
    profileData[key as keyof typeof profileData] === undefined && delete profileData[key as keyof typeof profileData]
  );

  const existingProfile = await prisma.profile.findUnique({
    where: { userId }
  });

  if (existingProfile) {
    return await prisma.profile.update({
      where: { userId },
      data: profileData
    });
  } else {
    return await prisma.profile.create({
      data: {
        userId,
        ...profileData
      }
    });
  }
}

export async function getUserLearningStats(userId: number) {
  const [totalAttempts, averageScoreData, coursesData, recentActivity] = await Promise.all([
    prisma.quizAttempt.count({
      where: { userId }
    }),
    prisma.quizAttempt.aggregate({
      where: { userId },
      _avg: { percentage: true }
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      select: { 
        quiz: { 
          select: { 
            course: { 
              select: { slug: true } 
            } 
          } 
        } 
      },
      distinct: ['quizId']
    }),
    prisma.quizAttempt.findMany({
      where: { userId },
      take: 10,
      orderBy: { completedAt: 'desc' },
      include: {
        quiz: {
          include: {
            course: { select: { title: true, slug: true } }
          }
        }
      }
    })
  ]);

  // Filter out quizzes without courses (standalone quizzes)
  const uniqueCourses = new Set(
    coursesData
      .filter(d => d.quiz.course !== null)
      .map(d => d.quiz.course!.slug)
  );

  return {
    totalAttempts,
    averageScore: Math.round(averageScoreData._avg.percentage || 0),
    coursesCompleted: uniqueCourses.size,
    recentActivity
  };
}

export async function getUserAchievements(userId: number) {
  const stats = await getUserLearningStats(userId);
  const achievements = [];

  if (stats.totalAttempts >= 1) {
    achievements.push({
      id: 'first_quiz',
      title: 'First Steps',
      description: 'Completed your first quiz',
      icon: '🎯',
      earned: true,
      earnedAt: new Date()
    });
  }

  if (stats.totalAttempts >= 10) {
    achievements.push({
      id: 'quiz_master',
      title: 'Quiz Master',
      description: 'Completed 10 quizzes',
      icon: '🏆',
      earned: true,
      earnedAt: new Date()
    });
  }

  if (stats.averageScore >= 90) {
    achievements.push({
      id: 'excellent_student',
      title: 'Excellent Student',
      description: 'Maintained 90% average score',
      icon: '⭐',
      earned: true,
      earnedAt: new Date()
    });
  }

  if (stats.coursesCompleted >= 3) {
    achievements.push({
      id: 'course_explorer',
      title: 'Course Explorer',
      description: 'Completed 3 different courses',
      icon: '🗺️',
      earned: true,
      earnedAt: new Date()
    });
  }

  return achievements;
}

