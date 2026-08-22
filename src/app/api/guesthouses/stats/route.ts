import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [total, subCityStats, licenseStats, totalBeds, avgRating] =
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
          _sum: { maxBeds: true },
        }),
        db.guestHouse.aggregate({
          _avg: { serviceRating: true },
        }),
      ]);

    return NextResponse.json({
      total,
      subCityStats,
      licenseStats,
      totalBeds: totalBeds._sum.maxBeds || 0,
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
