import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationName,
      subCity,
      area,
      specificAddress,
      numberOfRooms,
      licenseType,
      licenseLevel,
      licenseNumber,
      serviceRating,
      contactPhone,
      contactName,
      ownerName,
      hasRestaurant,
      hasParking,
      hasWiFi,
      hasHotWater,
      additionalServices,
      surveyorName,
      surveyorId,
    } = body;

    // Validate required fields from the 4-step form
    if (!organizationName || !subCity || !area || !specificAddress || !numberOfRooms || !licenseType || !licenseLevel || !licenseNumber || !ownerName || !contactName || !contactPhone) {
      return NextResponse.json(
        { error: 'Missing required fields', missing: { organizationName: !organizationName, subCity: !subCity, area: !area, specificAddress: !specificAddress, numberOfRooms: !numberOfRooms, licenseType: !licenseType, licenseLevel: !licenseLevel, licenseNumber: !licenseNumber, ownerName: !ownerName, contactName: !contactName, contactPhone: !contactPhone } },
        { status: 400 }
      );
    }

    const guestHouse = await db.guestHouse.create({
      data: {
        guestHouseName: organizationName, // Use organization name as guest house name
        organizationName: organizationName || null,
        subCity,
        area,
        specificAddress: specificAddress || '',
        numberOfRooms: Number(numberOfRooms),
        licenseType,
        licenseLevel,
        licenseNumber: licenseNumber || null,
        serviceRating: Number(serviceRating) || 0,
        contactPhone: contactPhone || null,
        contactName: contactName || null,
        ownerName: ownerName || null,
        hasRestaurant: Boolean(hasRestaurant),
        hasParking: Boolean(hasParking),
        hasWiFi: Boolean(hasWiFi),
        hasHotWater: Boolean(hasHotWater),
        additionalServices: additionalServices || null,
        surveyorName: surveyorName || null,
        surveyorId: surveyorId || null,
      },
    });

    return NextResponse.json(guestHouse, { status: 201 });
  } catch (error) {
    console.error('Error creating guest house:', error);
    return NextResponse.json(
      { error: 'Failed to create guest house record', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subCity = searchParams.get('subCity');
    const area = searchParams.get('area');
    const search = searchParams.get('search');
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 20;

    const where: Record<string, unknown> = {};

    if (subCity) {
      where.subCity = subCity;
    }
    if (area) {
      where.area = area;
    }
    if (search) {
      where.OR = [
        { guestHouseName: { contains: search } },
        { organizationName: { contains: search } },
        { specificAddress: { contains: search } },
        { ownerName: { contains: search } },
        { contactName: { contains: search } },
      ];
    }

    const [guestHouses, total] = await Promise.all([
      db.guestHouse.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.guestHouse.count({ where }),
    ]);

    return NextResponse.json({
      data: guestHouses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching guest houses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guest houses' },
      { status: 500 }
    );
  }
}
