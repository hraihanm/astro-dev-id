/* Seed a first classroom using the first admin user found.
 * Run with: node scripts/seed-first-class.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: { id: true, email: true }
  });

  if (!admin) {
    console.error('No admin user found. Create an admin user first.');
    return;
  }

  const existing = await prisma.classroom.findFirst({
    where: { title: 'Kelas Perdana' }
  });

  if (existing) {
    console.log('Classroom already exists:', existing.id);
    return;
  }

  const classroom = await prisma.classroom.create({
    data: {
      title: 'Kelas Perdana',
      description: 'Kelas contoh pertama',
      isPrivate: true,
      createdBy: admin.id
    }
  });

  await prisma.classroomMembership.create({
    data: {
      classroomId: classroom.id,
      userId: admin.id,
      role: 'TEACHER',
      status: 'ACTIVE'
    }
  });

  console.log('Seeded classroom', classroom.id, 'with teacher', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
