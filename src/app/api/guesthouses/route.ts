import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      guestHouseName,
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
    } = body;

    if (!guestHouseName || !subCity || !area || !numberOfRooms || !licenseType || !licenseLevel || !serviceRating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const guestHouse = await db.guestHouse.create({
      data: {
        guestHouseName,
        subCity,
        area,
        specificAddress: specificAddress || '',
        numberOfRooms: Number(numberOfRooms),
        licenseType,
        licenseLevel,
        licenseNumber: licenseNumber || null,
        serviceRating: Number(serviceRating),
        contactPhone: contactPhone || null,
        contactName: contactName || null,
        ownerName: ownerName || null,
        hasRestaurant: Boolean(hasRestaurant),
        hasParking: Boolean(hasParking),
        hasWiFi: Boolean(hasWiFi),
        hasHotWater: Boolean(hasHotWater),
        additionalServices: additionalServices || null,
        surveyorName: surveyorName || null,
      },
    });

    return NextResponse.json(guestHouse, { status: 201 });
  } catch (error) {
    console.error('Error creating guest house:', error);
    return NextResponse.json(
      { error: 'Failed to create guest house record' },
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
