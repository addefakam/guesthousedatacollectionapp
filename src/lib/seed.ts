import { db } from './db';
import { hashPassword } from './password';

export async function seedAdmin() {
  const existing = await db.user.findUnique({
    where: { username: 'admin' },
  });

  if (!existing) {
    await db.user.create({
      data: {
        username: 'admin',
        password: hashPassword('admin123'),
        name: 'Administrator',
        role: 'ADMIN',
      },
    });
    console.log('Admin account seeded: admin / admin123');
  }
}
