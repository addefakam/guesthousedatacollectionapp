import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subCity = searchParams.get('subCity');
    const area = searchParams.get('area');

    const where: Record<string, unknown> = {};
    if (subCity) where.subCity = subCity;
    if (area) where.area = area;

    const guestHouses = await db.guestHouse.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (guestHouses.length === 0) {
      return NextResponse.json(
        { error: 'No data to export' },
        { status: 404 }
      );
    }

    const headers = [
      'Guest House Name',
      'Sub-City',
      'Area/Kebele',
      'Specific Address',
      'Max Beds',
      'License Type',
      'License Level',
      'License Number',
      'Service Rating (1-5)',
      'Contact Phone',
      'Contact Person',
      'Owner Name',
      'Has Restaurant',
      'Has Parking',
      'Has WiFi',
      'Has Hot Water',
      'Additional Services',
      'Surveyor Name',
      'Date Collected',
    ];

    const rows = guestHouses.map((gh) => [
      gh.guestHouseName,
      gh.subCity,
      gh.area,
      gh.specificAddress,
      gh.maxBeds,
      gh.licenseType,
      gh.licenseLevel,
      gh.licenseNumber || '',
      gh.serviceRating,
      gh.contactPhone || '',
      gh.contactName || '',
      gh.ownerName || '',
      gh.hasRestaurant ? 'Yes' : 'No',
      gh.hasParking ? 'Yes' : 'No',
      gh.hasWiFi ? 'Yes' : 'No',
      gh.hasHotWater ? 'Yes' : 'No',
      gh.additionalServices || '',
      gh.surveyorName || '',
      gh.createdAt.toISOString().split('T')[0],
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""') }"`).join(',')
      ),
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="bishoftu_guesthouses_survey_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
