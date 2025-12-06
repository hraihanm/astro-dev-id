const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();
const keys = Object.keys(prisma).filter((k) => !k.startsWith('_') && k !== '$on' && k !== '$connect' && k !== '$disconnect' && k !== '$executeRaw' && k !== '$executeRawUnsafe' && k !== '$queryRaw' && k !== '$queryRawUnsafe' && k !== '$transaction' && k !== '$use' && k !== '$extends');
fs.writeFileSync('prisma-keys.txt', keys.join('\n'));
prisma.$disconnect();
