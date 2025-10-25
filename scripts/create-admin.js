// Script to create an admin user
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.argv[2] || 'admin@example.com';
  const password = process.argv[3] || 'admin123';

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log(`User ${email} already exists. Updating role to admin...`);
      
      await prisma.user.update({
        where: { email },
        data: { role: 'admin' }
      });
      
      console.log('✅ User role updated to admin!');
    } else {
      console.log(`Creating new admin user: ${email}`);
      
      const hashedPassword = await bcrypt.hash(password, 12);
      
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'admin'
        }
      });
      
      console.log('✅ Admin user created successfully!');
    }

    console.log('\nYou can now sign in with:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\nVisit: http://localhost:3000/auth/signin');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();


