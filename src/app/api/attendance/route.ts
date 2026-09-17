import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// GET /api/attendance?meetingId=xxx
// Returns attendance records for a meeting, optionally filtered by subCity/area for collectors
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as Record<string, unknown> | undefined;

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get('meetingId');
    const subCity = searchParams.get('subCity');
    const area = searchParams.get('area');

    if (!meetingId) {
      return NextResponse.json({ error: 'meetingId is required' }, { status: 400 });
    }

    // Build where filter for guest houses
    const ghWhere: Record<string, unknown> = {};
    if (subCity) ghWhere.subCity = subCity;
    if (area) ghWhere.area = area;

    const records = await db.attendance.findMany({
      where: { meetingId },
      include: {
        guestHouse: {
          select: {
            id: true,
            guestHouseName: true,
            subCity: true,
            area: true,
            numberOfRooms: true,
            ownerName: true,
            licenseType: true,
          },
        },
        collector: {
          select: { id: true, name: true },
        },
      },
      orderBy: { guestHouse: { subCity: 'asc' } },
    });

    // If subCity/area filter, only return matching
    const filtered = subCity || area
      ? records.filter((r) => {
          if (subCity && r.guestHouse.subCity !== subCity) return false;
          if (area && r.guestHouse.area !== area) return false;
          return true;
        })
      : records;

    return NextResponse.json({ records: filtered });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST /api/attendance — mark attendance for a guest house in a meeting
// Body: { meetingId, guestHouseId, status: "PRESENT"|"ABSENT" }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as Record<string, unknown> | undefined;

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { meetingId, guestHouseId, status } = await request.json();

    if (!meetingId || !guestHouseId || !status) {
      return NextResponse.json({ error: 'meetingId, guestHouseId, and status are required' }, { status: 400 });
    }

    if (status !== 'PRESENT' && status !== 'ABSENT') {
      return NextResponse.json({ error: 'Status must be PRESENT or ABSENT' }, { status: 400 });
    }

    // Upsert: create or update attendance for this guest house in this meeting
    const attendance = await db.attendance.upsert({
      where: {
        meetingId_guestHouseId: { meetingId, guestHouseId },
      },
      update: {
        status,
        collectorId: user.id as string,
      },
      create: {
        meetingId,
        guestHouseId,
        collectorId: user.id as string,
        status,
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
