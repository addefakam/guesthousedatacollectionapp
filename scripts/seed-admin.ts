import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function main() {
  const prisma = new PrismaClient();

  try {
    const existing = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (existing) {
      console.log('Admin user already exists. Updating password...');
      await prisma.user.update({
        where: { username: 'admin' },
        data: { password: hashPassword('admin123') },
      });
      console.log('Admin password updated successfully.');
    } else {
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashPassword('admin123'),
          name: 'Administrator',
          role: 'ADMIN',
        },
      });
      console.log('Admin user created: admin / admin123');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
