import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// GET /api/users/me — return current user's info including assignment
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as Record<string, unknown> | undefined;

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id as string },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        assignedSubCity: true,
        assignedArea: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(dbUser);
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
