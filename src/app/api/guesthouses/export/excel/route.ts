import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

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

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Bishoftu Guest House Survey System';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Survey Data', {
      properties: { defaultColWidth: 18 },
    });

    // Define columns with headers
    const columns = [
      { header: '#', key: 'row', width: 5 },
      { header: 'Guest House Name', key: 'guestHouseName', width: 28 },
      { header: 'Organization Name', key: 'organizationName', width: 25 },
      { header: 'Sub-City / Kuttaa Maggalaa', key: 'subCity', width: 22 },
      { header: 'Area / Kebele', key: 'area', width: 20 },
      { header: 'Specific Address', key: 'specificAddress', width: 30 },
      { header: 'Number of Rooms', key: 'numberOfRooms', width: 16 },
      { header: 'License Type / Goossa Eyyeema', key: 'licenseType', width: 24 },
      { header: 'License Level / Saddarkaa Eyyeema', key: 'licenseLevel', width: 26 },
      { header: 'License Number / Lakofsaa Eyyeema', key: 'licenseNumber', width: 24 },
      { header: 'Service Rating', key: 'serviceRating', width: 14 },
      { header: 'Contact Person / Nama Adadura Qunnamnu', key: 'contactName', width: 28 },
      { header: 'Contact Phone', key: 'contactPhone', width: 18 },
      { header: 'Owner Name / Abbaa Qaabeyee', key: 'ownerName', width: 24 },
      { header: 'Restaurant', key: 'hasRestaurant', width: 12 },
      { header: 'Parking', key: 'hasParking', width: 12 },
      { header: 'WiFi', key: 'hasWiFi', width: 10 },
      { header: 'Hot Water', key: 'hasHotWater', width: 12 },
      { header: 'Additional Services', key: 'additionalServices', width: 28 },
      { header: 'Surveyor Name', key: 'surveyorName', width: 20 },
      { header: 'Date Collected', key: 'createdAt', width: 18 },
    ];

    sheet.columns = columns;

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.height = 32;
    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 11,
        name: 'Calibri',
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF059669' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      };
    });

    // Add data rows
    guestHouses.forEach((gh, index) => {
      const rowNumber = index + 1;
      const row = sheet.addRow({
        row: rowNumber,
        guestHouseName: gh.guestHouseName,
        organizationName: gh.organizationName || '',
        subCity: gh.subCity,
        area: gh.area,
        specificAddress: gh.specificAddress,
        numberOfRooms: gh.numberOfRooms,
        licenseType: gh.licenseType,
        licenseLevel: gh.licenseLevel,
        licenseNumber: gh.licenseNumber || '',
        serviceRating: gh.serviceRating,
        contactName: gh.contactName || '',
        contactPhone: gh.contactPhone || '',
        ownerName: gh.ownerName || '',
        hasRestaurant: gh.hasRestaurant ? 'Yes' : 'No',
        hasParking: gh.hasParking ? 'Yes' : 'No',
        hasWiFi: gh.hasWiFi ? 'Yes' : 'No',
        hasHotWater: gh.hasHotWater ? 'Yes' : 'No',
        additionalServices: gh.additionalServices || '',
        surveyorName: gh.surveyorName || '',
        createdAt: new Date(gh.createdAt).toLocaleDateString('en-GB'),
      });

      // Alternating row colors
      const isEven = rowNumber % 2 === 0;
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { size: 10, name: 'Calibri' };
        cell.border = {
          bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } },
        };
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0FDF4' },
          };
        }
      });

      // Center-align the # column
      row.getCell(1).alignment = { horizontal: 'center' };
    });

    // Add summary row at bottom
    const summaryRow = sheet.addRow({});
    summaryRow.getCell(1).value = '';
    summaryRow.height = 8;

    const totalRow = sheet.addRow({
      row: '',
      guestHouseName: `Total Records: ${guestHouses.length}`,
    });
    totalRow.getCell(2).font = { bold: true, size: 11, name: 'Calibri', color: { argb: 'FF059669' } };

    const dateRow = sheet.addRow({
      row: '',
      guestHouseName: `Exported on: ${new Date().toLocaleString('en-GB')}`,
    });
    dateRow.getCell(2).font = { italic: true, size: 10, name: 'Calibri', color: { argb: 'FF6B7280' } };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const filename = `bishoftu_guesthouses_survey_${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting Excel:', error);
    return NextResponse.json(
      { error: 'Failed to export Excel file' },
      { status: 500 }
    );
  }
}
