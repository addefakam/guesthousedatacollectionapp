import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json({ error: 'Only Excel files (.xlsx, .xls) are accepted' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      return NextResponse.json({ error: 'Empty Excel file' }, { status: 400 });
    }

    // Read header row to map column indices
    const headerRow = sheet.getRow(1);
    const headers: Record<string, number> = {};
    headerRow.eachCell((cell, colNumber) => {
      const val = String(cell.value || '').trim().toLowerCase();
      if (val.includes('organization') || val.includes('name') && !val.includes('owner') && !val.includes('contact') && !val.includes('surveyor')) {
        headers.organizationName = colNumber;
      }
      if (val.includes('sub-city') || val.includes('subcity') || val.includes('kuttaa')) {
        headers.subCity = colNumber;
      }
      if (val.includes('werreda') || val.includes('area') || val.includes('kebele')) {
        headers.area = colNumber;
      }
      if (val.includes('address') || val.includes('baka') || val.includes('teessoo')) {
        headers.specificAddress = colNumber;
      }
      if (val.includes('room') || val.includes('qubeettii')) {
        headers.numberOfRooms = colNumber;
      }
      if (val.includes('license type') || val.includes('goossa')) {
        headers.licenseType = colNumber;
      }
      if (val.includes('license level') || val.includes('saddarkaa')) {
        headers.licenseLevel = colNumber;
      }
      if (val.includes('license no') || val.includes('license number') || val.includes('lakofsaa')) {
        headers.licenseNumber = colNumber;
      }
      if (val.includes('owner') || val.includes('qaabeyee')) {
        headers.ownerName = colNumber;
      }
      if (val.includes('contact person') || val.includes('adadura')) {
        headers.contactName = colNumber;
      }
      if (val.includes('phone') || val.includes('bilbila')) {
        headers.contactPhone = colNumber;
      }
    });

    // Validate required headers
    const requiredHeaders = ['organizationName', 'subCity', 'area', 'specificAddress', 'numberOfRooms', 'licenseType', 'licenseLevel', 'licenseNumber', 'ownerName', 'contactName', 'contactPhone'];
    const missing = requiredHeaders.filter(h => !headers[h]);
    if (missing.length > 0) {
      return NextResponse.json({
        error: `Missing columns in Excel: ${missing.join(', ')}. Download the template first.`,
        missing
      }, { status: 400 });
    }

    const phoneRegex = /^(\+251|251|0)?(9|7)\d{8}$/;
    const results = { success: 0, failed: 0, errors: [] as string[] };

    // Read data rows (skip header)
    for (let rowNum = 2; rowNum <= sheet.rowCount; rowNum++) {
      const row = sheet.getRow(rowNum);
      const getCell = (col: number) => {
        const cell = row.getCell(col);
        return cell.value ? String(cell.value).trim() : '';
      };

      const organizationName = getCell(headers.organizationName!);
      if (!organizationName) continue; // skip empty rows

      const subCity = getCell(headers.subCity!);
      const area = getCell(headers.area!);
      const specificAddress = getCell(headers.specificAddress!);
      const numberOfRooms = getCell(headers.numberOfRooms!);
      const licenseType = getCell(headers.licenseType!);
      const licenseLevel = getCell(headers.licenseLevel!);
      const licenseNumber = getCell(headers.licenseNumber!);
      const ownerName = getCell(headers.ownerName!);
      const contactName = getCell(headers.contactName!);
      const contactPhone = getCell(headers.contactPhone!);

      // Validate
      if (!subCity || !area || !specificAddress || !numberOfRooms || !licenseType || !licenseLevel || !licenseNumber || !ownerName || !contactName || !contactPhone) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Missing required fields`);
        continue;
      }

      const phoneClean = contactPhone.replace(/[\s-]/g, '');
      if (!phoneRegex.test(phoneClean)) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Invalid phone number "${contactPhone}"`);
        continue;
      }

      try {
        await db.guestHouse.create({
          data: {
            guestHouseName: organizationName,
            organizationName: organizationName || null,
            subCity,
            area,
            specificAddress,
            numberOfRooms: Number(numberOfRooms) || 1,
            licenseType,
            licenseLevel,
            licenseNumber: licenseNumber || null,
            serviceRating: 0,
            contactPhone: contactPhone || null,
            contactName: contactName || null,
            ownerName: ownerName || null,
            surveyorName: 'Admin Import',
          },
        });
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${rowNum}: Database error`);
      }
    }

    return NextResponse.json({
      message: `Import complete: ${results.success} succeeded, ${results.failed} failed`,
      ...results,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to process Excel file', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
