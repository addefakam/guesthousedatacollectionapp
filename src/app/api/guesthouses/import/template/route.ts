import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'BGH Survey System';

    const sheet = workbook.addWorksheet('Import Template');

    const columns = [
      { header: 'Organization Name / Maqaa Dhaabbataa', key: 'organizationName', width: 30 },
      { header: 'Sub-City / Kuttaa Maggalaa', key: 'subCity', width: 25 },
      { header: 'Werreda', key: 'area', width: 22 },
      { header: 'Specific Address / Baka Addaa', key: 'specificAddress', width: 30 },
      { header: 'Number of Rooms / Lakkoofsa Qubeettii', key: 'numberOfRooms', width: 18 },
      { header: 'License Type / Goossa Eyyema', key: 'licenseType', width: 24 },
      { header: 'License Level / Saddarkaa Eyyema', key: 'licenseLevel', width: 24 },
      { header: 'License Number / Lakofsaa Eyyema', key: 'licenseNumber', width: 22 },
      { header: 'Owner Name / Maqaa Abbaa Qaabeyee', key: 'ownerName', width: 28 },
      { header: 'Contact Person / Nama Adadura Qunnamnu', key: 'contactName', width: 30 },
      { header: 'Contact Phone / Lakkoofsa Bilbila', key: 'contactPhone', width: 22 },
    ];

    sheet.columns = columns;

    // Style header
    const headerRow = sheet.getRow(1);
    headerRow.height = 36;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10, name: 'Calibri' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } } };
    });

    // Add 2 example rows
    sheet.addRow({
      organizationName: 'GOLD MARK HOTEL',
      subCity: 'Dukam',
      area: 'Bishoftu 01',
      specificAddress: 'Near Main Bus Station',
      numberOfRooms: 25,
      licenseType: 'Hotel',
      licenseLevel: 'Level 1',
      licenseNumber: 'GH-2024-001',
      ownerName: 'Abebe Kebede',
      contactName: 'Hana Tadesse',
      contactPhone: '+251 91 234 5678',
    });

    // Add instructions sheet
    const instrSheet = workbook.addWorksheet('Instructions');
    instrSheet.getColumn(1).width = 80;
    const instructions = [
      'How to use this template:',
      '',
      '1. Fill in ALL columns - every field is required',
      '2. Organization Name: The name of the guest house / hotel',
      '3. Sub-City: Dukam, Chelaleka, or Debaayyuu',
      '4. Werreda: The werreda/area name under the sub-city',
      '5. Specific Address: Street name, landmark, or description',
      '6. Number of Rooms: Total number of rooms (number)',
      '7. License Type: Hotel, Lodge, Guest House, Hostel',
      '8. License Level: Level 1, Level 2, Level 3, Level 4',
      '9. License Number: The official license number',
      '10. Owner Name: Full name of the owner',
      '11. Contact Person: Full name of the contact person',
      '12. Contact Phone: Ethiopian phone (e.g., +251 91 234 5678 or 0912345678)',
      '',
      'DO NOT change the header row names!',
      'Delete the example rows before importing your data.',
    ];
    instructions.forEach((text, idx) => {
      const cell = instrSheet.getCell(idx + 1, 1);
      cell.value = text;
      if (idx === 0) {
        cell.font = { bold: true, size: 14, name: 'Calibri', color: { argb: 'FF059669' } };
      } else {
        cell.font = { size: 11, name: 'Calibri' };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="bgh_import_template.xlsx"',
      },
    });
  } catch (error) {
    console.error('Template error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
