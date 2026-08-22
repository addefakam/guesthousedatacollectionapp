import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/password';

export const dynamic = 'force-dynamic';

export async function POST() {
  const results: string[] = [];

  try {
    // Step 1: Push Prisma schema to database (creates/updates tables)
    results.push('Pushing schema to database...');
    try {
      execSync('npx prisma db push --accept-data-loss --skip-generate 2>&1', {
        cwd: process.cwd(),
        timeout: 30000,
        stdio: 'pipe',
      });
      results.push('Schema pushed successfully.');
    } catch (schemaErr: unknown) {
      const errMsg = schemaErr instanceof Error ? schemaErr.message : String(schemaErr);
      // If tables already exist or are up to date, that's fine
      if (errMsg.includes('already exists') || errMsg.includes('is already up to date')) {
        results.push('Tables already exist, skipping schema push.');
      } else {
        results.push('Schema push notice: ' + errMsg);
        // Continue anyway - user creation may still work
      }
    }

    // Step 2: Create admin user if not exists
    results.push('Checking for admin user...');
    const prisma = new PrismaClient();

    try {
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
        results.push('Admin user created successfully: admin / admin123');
      }
    } finally {
      await prisma.$disconnect();
    }

    return NextResponse.json({
      success: true,
      message: 'Setup complete!',
      details: results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Setup failed',
        details: results,
      },
      { status: 500 }
    );
  }
}

// Also support GET for convenience (browser access)
export async function GET() {
  return POST();
}