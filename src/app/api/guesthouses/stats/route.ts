import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [total, subCityStats, licenseStats, totalRooms, avgRating, woredaStats] =
      await Promise.all([
        db.guestHouse.count(),
        db.guestHouse.groupBy({
          by: ['subCity'],
          _count: true,
          orderBy: { subCity: 'asc' },
        }),
        db.guestHouse.groupBy({
          by: ['licenseType'],
          _count: true,
        }),
        db.guestHouse.aggregate({
          _sum: { numberOfRooms: true },
        }),
        db.guestHouse.aggregate({
          _avg: { serviceRating: true },
        }),
        db.guestHouse.groupBy({
          by: ['subCity', 'area'],
          _count: true,
          orderBy: { subCity: 'asc' },
        }),
      ]);

    // Group woreda stats by subCity for easy lookup
    const woredaBySubCity: Record<string, { area: string; count: number }[]> = {};
    for (const w of woredaStats) {
      if (!woredaBySubCity[w.subCity]) woredaBySubCity[w.subCity] = [];
      woredaBySubCity[w.subCity].push({ area: w.area, count: w._count });
    }

    return NextResponse.json({
      total,
      subCityStats,
      woredaBySubCity,
      licenseStats,
      totalRooms: totalRooms._sum.numberOfRooms || 0,
      avgRating: avgRating._avg.serviceRating
        ? Math.round(avgRating._avg.serviceRating * 10) / 10
        : 0,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
