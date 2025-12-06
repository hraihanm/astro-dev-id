import { prisma } from './db';
import bcrypt from 'bcryptjs';

export async function createUser(data: {
  email: string;
  password?: string;
  role?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  headline?: string;
  jobTitle?: string;
  company?: string;
  grade?: string;
  school?: string;
  bio?: string;
  avatar?: string;
  website?: string;
  location?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  preferences?: string;
  learningGoals?: string;
  timezone?: string;
  language?: string;
}) {
  const hashedPassword = data.password ? await bcrypt.hash(data.password, 12) : null;
  const computedFullName =
    data.fullName ||
    [data.firstName, data.lastName].filter(Boolean).join(' ').trim() ||
    undefined;

  return await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword || undefined,
      role: data.role || 'student',
      name: computedFullName,
      profile: {
        create: {
          fullName: computedFullName,
          firstName: data.firstName,
          lastName: data.lastName,
          nickname: data.nickname,
          headline: data.headline,
          jobTitle: data.jobTitle,
          company: data.company,
          grade: data.grade,
          school: data.school,
          bio: data.bio,
          avatar: data.avatar,
          website: data.website,
          location: data.location,
          phone: data.phone,
          linkedin: data.linkedin,
          github: data.github,
          twitter: data.twitter,
          preferences: data.preferences,
          learningGoals: data.learningGoals,
          timezone: data.timezone,
          language: data.language
        }
      }
    }
  });
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email }
  });
}

export async function getUserById(id: number) {
  return await prisma.user.findUnique({
    where: { id }
  });
}

export async function verifyPassword(password: string, hashedPassword: string) {
  if (!hashedPassword) return false;
  return await bcrypt.compare(password, hashedPassword);
}

export async function updateUserPassword(userId: number, newPassword: string) {
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  return await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });
}

export async function updateUserRole(userId: number, role: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: { role }
  });
}

export async function getAllUsers() {
  return await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      profile: {
        select: {
          fullName: true,
          firstName: true,
          lastName: true,
          nickname: true,
          headline: true,
          jobTitle: true,
          company: true,
          avatar: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
}

