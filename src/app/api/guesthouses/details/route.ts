import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filterBy = searchParams.get('filterBy'); // 'licenseType' | 'subCity'
    const value = searchParams.get('value');

    if (!filterBy || !value) {
      return NextResponse.json({ error: 'Missing filterBy or value' }, { status: 400 });
    }

    const where = filterBy === 'licenseType'
      ? { licenseType: value }
      : { subCity: value };

    const records = await db.guestHouse.findMany({
      where,
      select: {
        id: true,
        guestHouseName: true,
        subCity: true,
        area: true,
        licenseType: true,
        licenseLevel: true,
        numberOfRooms: true,
        serviceRating: true,
        contactPhone: true,
        contactName: true,
        ownerName: true,
        hasRestaurant: true,
        hasParking: true,
        hasWiFi: true,
        hasHotWater: true,
      },
      orderBy: { numberOfRooms: 'desc' },
    });

    return NextResponse.json({ records, total: records.length });
  } catch (error) {
    console.error('Error fetching details:', error);
    return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
  }
}
