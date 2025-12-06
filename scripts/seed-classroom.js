// Seed a starter classroom and teacher membership.
// Usage: node scripts/seed-classroom.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminUser = await prisma.user.findFirst({
    where: { role: 'admin' },
    orderBy: { id: 'asc' }
  });

  if (!adminUser) {
    console.log('No admin user found; create an admin first (see scripts/create-admin.js).');
    return;
  }

  const existing = await prisma.classroom.findFirst({ where: { title: 'Sample Class' } });
  if (existing) {
    console.log('Sample Class already exists (id:', existing.id, '). Skipping.');
    return;
  }

  const classroom = await prisma.classroom.create({
    data: {
      title: 'Sample Class',
      description: 'Contoh kelas awal untuk mulai menggunakan fitur classroom.',
      createdBy: adminUser.id,
      memberships: {
        create: {
          userId: adminUser.id,
          role: 'TEACHER',
          status: 'ACTIVE'
        }
      }
    }
  });

  console.log('Created Sample Class with id:', classroom.id, 'teacher:', adminUser.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
