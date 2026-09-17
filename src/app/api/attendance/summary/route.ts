import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// GET /api/attendance/summary?meetingId=xxx
// Returns attendance summary grouped by subCity and area
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as Record<string, unknown> | undefined;

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get('meetingId');

    if (!meetingId) {
      return NextResponse.json({ error: 'meetingId is required' }, { status: 400 });
    }

    // Get all attendance records for this meeting with guest house info
    const records = await db.attendance.findMany({
      where: { meetingId },
      include: {
        guestHouse: {
          select: {
            subCity: true,
            area: true,
            guestHouseName: true,
          },
        },
      },
    });

    // Group by subCity then area
    const summary: Record<string, {
      total: number;
      present: number;
      areas: Record<string, { total: number; present: number }>;
    }> = {};

    for (const rec of records) {
      const sc = rec.guestHouse.subCity;
      const ar = rec.guestHouse.area;

      if (!summary[sc]) {
        summary[sc] = { total: 0, present: 0, areas: {} };
      }
      if (!summary[sc].areas[ar]) {
        summary[sc].areas[ar] = { total: 0, present: 0 };
      }

      summary[sc].total++;
      summary[sc].areas[ar].total++;

      if (rec.status === 'PRESENT') {
        summary[sc].present++;
        summary[sc].areas[ar].present++;
      }
    }

    // Also get total guest houses that should have attendance (all in the system)
    const totalGuestHouses = await db.guestHouse.count();
    const totalMarked = records.length;

    return NextResponse.json({
      meetingId,
      totalGuestHouses,
      totalMarked,
      totalPresent: records.filter((r) => r.status === 'PRESENT').length,
      totalAbsent: records.filter((r) => r.status === 'ABSENT').length,
      summary,
    });
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
