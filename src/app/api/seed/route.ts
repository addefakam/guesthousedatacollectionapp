import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/password';

export async function POST() {
  try {
    const prisma = new PrismaClient();

    const existing = await prisma.user.findUnique({
      where: { username: 'admin' },
    });

    if (existing) {
      await prisma.$disconnect();
      return NextResponse.json({ message: 'Admin already exists' });
    }

    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashPassword('admin123'),
        name: 'Administrator',
        role: 'ADMIN',
      },
    });

    await prisma.$disconnect();
    return NextResponse.json({ message: 'Admin created: admin / admin123' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Seed failed' },
      { status: 500 }
    );
  }
}
