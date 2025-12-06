import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'node:fs';

const prisma = new PrismaClient();
const keys = Object.keys(prisma).filter(
  (k) =>
    !k.startsWith('_') &&
    !['$on', '$connect', '$disconnect', '$executeRaw', '$executeRawUnsafe', '$queryRaw', '$queryRawUnsafe', '$transaction', '$use', '$extends'].includes(
      k
    )
);
writeFileSync('prisma-keys.txt', keys.join('\n'), 'utf8');
await prisma.$disconnect();
