import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

async function ensureTables(prisma: PrismaClient) {
  // Create tables using raw SQL if they don't exist
  // This avoids needing the Prisma CLI on Vercel serverless
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "username" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'COLLECTOR',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GuestHouse" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "guestHouseName" TEXT NOT NULL,
      "organizationName" TEXT,
      "subCity" TEXT NOT NULL,
      "area" TEXT NOT NULL,
      "specificAddress" TEXT NOT NULL,
      "numberOfRooms" INTEGER NOT NULL,
      "licenseType" TEXT NOT NULL,
      "licenseLevel" TEXT NOT NULL,
      "licenseNumber" TEXT,
      "serviceRating" INTEGER NOT NULL,
      "contactPhone" TEXT,
      "contactName" TEXT,
      "contactPhone2" TEXT,
      "contactName2" TEXT,
      "ownerName" TEXT,
      "hasRestaurant" BOOLEAN NOT NULL DEFAULT false,
      "hasParking" BOOLEAN NOT NULL DEFAULT false,
      "hasWiFi" BOOLEAN NOT NULL DEFAULT false,
      "hasHotWater" BOOLEAN NOT NULL DEFAULT false,
      "additionalServices" TEXT,
      "surveyorName" TEXT,
      "surveyorId" TEXT,
      "signature" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL
    );
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "GuestHouse" ADD COLUMN IF NOT EXISTS "signature" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "GuestHouse" ADD COLUMN IF NOT EXISTS "contactPhone2" TEXT;
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "GuestHouse" ADD COLUMN IF NOT EXISTS "contactName2" TEXT;
  `);
}

export async function POST() {
  const results: string[] = [];

  try {
    const prisma = new PrismaClient();

    try {
      // Step 1: Ensure tables exist via raw SQL
      results.push('Creating tables if needed...');
      await ensureTables(prisma);
      results.push('Tables ready.');

      // Step 2: Create admin user if not exists
      results.push('Checking for admin user...');
      const existing = await prisma.user.findUnique({
        where: { username: 'admin' },
      });

      if (existing) {
        results.push('Admin user already exists.');
      } else {
        await prisma.user.create({
          data: {
            username: 'admin',
            password: hashPassword('admin123'),
            name: 'Administrator',
            role: 'ADMIN',
          },
        });
        results.push('Admin user created: admin / admin123');
      }
    } finally {
      await prisma.$disconnect();
    }

    return NextResponse.json({
      success: true,
      message: 'Setup complete! You can now log in.',
      details: results,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        success: false,
        error: msg,
        hint: 'Make sure DATABASE_URL in Vercel env points to your Neon PostgreSQL database and starts with postgresql://',
        details: results,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
