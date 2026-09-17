import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// GET /api/assignments?meetingId=xxx&collectorId=yyy
// Returns assignments, optionally filtered
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as Record<string, unknown> | undefined;

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get('meetingId');
    const collectorId = searchParams.get('collectorId');

    const where: Record<string, unknown> = {};
    if (meetingId) where.meetingId = meetingId;
    if (collectorId) where.collectorId = collectorId;

    // For collectors, only return their own assignments
    if (user.role !== 'ADMIN') {
      where.collectorId = user.id as string;
    }

    const assignments = await db.collectorAssignment.findMany({
      where,
      include: {
        collector: { select: { id: true, name: true, username: true } },
        meeting: { select: { id: true, title: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST /api/assignments — create one or more assignments
// Body: { collectorId, meetingId, assignments: [{ subCity, area }] }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as Record<string, unknown> | undefined;

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { collectorId, meetingId, assignments } = body;

    if (!collectorId || !meetingId || !Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json(
        { error: 'collectorId, meetingId, and assignments array are required' },
        { status: 400 }
      );
    }

    // Validate each assignment has subCity and area
    for (const a of assignments) {
      if (!a.subCity || !a.area) {
        return NextResponse.json(
          { error: 'Each assignment must have subCity and area' },
          { status: 400 }
        );
      }
    }

    // Use createMany with skipDuplicates to handle unique constraint
    const result = await db.collectorAssignment.createMany({
      data: assignments.map((a: { subCity: string; area: string }) => ({
        collectorId,
        meetingId,
        subCity: a.subCity,
        area: a.area,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ created: result.count }, { status: 201 });
  } catch (error) {
    console.error('Error creating assignments:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE /api/assignments — remove an assignment
// Body: { id } or { collectorId, meetingId, subCity, area }
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as Record<string, unknown> | undefined;

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    if (body.id) {
      await db.collectorAssignment.delete({ where: { id: body.id } });
    } else if (body.collectorId && body.meetingId && body.subCity && body.area) {
      await db.collectorAssignment.delete({
        where: {
          collectorId_meetingId_subCity_area: {
            collectorId: body.collectorId,
            meetingId: body.meetingId,
            subCity: body.subCity,
            area: body.area,
          },
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Provide id or (collectorId, meetingId, subCity, area)' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
