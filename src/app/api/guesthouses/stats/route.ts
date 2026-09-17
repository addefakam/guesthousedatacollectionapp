import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [total, subCityStats, licenseStats, licenseBedStats, totalRooms, avgRating, woredaStats, woredaBedStats] =
      await Promise.all([
        db.guestHouse.count(),
        db.guestHouse.groupBy({
          by: ['subCity'],
          _count: true,
          _sum: { numberOfRooms: true },
          orderBy: { subCity: 'asc' },
        }),
        db.guestHouse.groupBy({
          by: ['licenseType'],
          _count: true,
        }),
        db.guestHouse.groupBy({
          by: ['licenseType'],
          _sum: { numberOfRooms: true },
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
        db.guestHouse.groupBy({
          by: ['subCity', 'area'],
          _sum: { numberOfRooms: true },
          orderBy: { subCity: 'asc' },
        }),
      ]);

    // Group woreda stats by subCity for easy lookup
    const woredaBySubCity: Record<string, { area: string; count: number; beds: number }[]> = {};
    for (const w of woredaStats) {
      if (!woredaBySubCity[w.subCity]) woredaBySubCity[w.subCity] = [];
      woredaBySubCity[w.subCity].push({ area: w.area, count: w._count, beds: 0 });
    }
    // Merge bed counts into woreda stats
    for (const wb of woredaBedStats) {
      const arr = woredaBySubCity[wb.subCity];
      if (arr) {
        const entry = arr.find((e) => e.area === wb.area);
        if (entry) entry.beds = wb._sum.numberOfRooms || 0;
      }
    }

    // Group total beds by subCity
    const subCityBeds: Record<string, number> = {};
    for (const sc of subCityStats) {
      subCityBeds[sc.subCity] = sc._sum.numberOfRooms || 0;
    }

    // Map beds per license type
    const licenseBeds: Record<string, number> = {};
    for (const lb of licenseBedStats) {
      licenseBeds[lb.licenseType] = lb._sum.numberOfRooms || 0;
    }

    return NextResponse.json({
      total,
      subCityStats: subCityStats.map((s) => ({ subCity: s.subCity, _count: s._count })),
      subCityBeds,
      woredaBySubCity,
      licenseStats,
      licenseBeds,
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
