import { prisma } from './db';
import bcrypt from 'bcryptjs';

export async function createUser(data: {
  email: string;
  password: string;
  role?: string;
}) {
  const hashedPassword = await bcrypt.hash(data.password, 12);
  
  return await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role: data.role || 'student'
    }
  });
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email }
  });
}

export async function verifyPassword(password: string, hashedPassword: string) {
  return await bcrypt.compare(password, hashedPassword);
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
      createdAt: true
    }
  });
}

