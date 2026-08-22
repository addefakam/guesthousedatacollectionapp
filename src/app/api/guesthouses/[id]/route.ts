import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guestHouse = await db.guestHouse.delete({
      where: { id },
    });
    return NextResponse.json(guestHouse);
  } catch (error) {
    console.error('Error deleting guest house:', error);
    return NextResponse.json(
      { error: 'Failed to delete guest house record' },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guestHouse = await db.guestHouse.findUnique({
      where: { id },
    });
    if (!guestHouse) {
      return NextResponse.json(
        { error: 'Guest house not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(guestHouse);
  } catch (error) {
    console.error('Error fetching guest house:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guest house' },
      { status: 500 }
    );
  }
}
