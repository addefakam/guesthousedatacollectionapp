import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/password';

export async function POST() {
  try {
    const existing = await db.user.findUnique({
      where: { username: 'admin' },
    });

    if (existing) {
      return NextResponse.json({ message: 'Admin already exists' });
    }

    await db.user.create({
      data: {
        username: 'admin',
        password: hashPassword('admin123'),
        name: 'Administrator',
        role: 'ADMIN',
      },
    });

    return NextResponse.json({ message: 'Admin created: admin / admin123' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Seed failed' },
      { status: 500 }
    );
  }
}
