import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { GameyaType, PaymentMethod } from '../../src/financial/gameya.js';
import { Gender, RoomType, TripStatus } from '../../src/operations/trip-logistics.js';
import { LuggageStatus } from '../../src/operations/luggage-tracker.js';
import { ChronicCondition } from '../../src/operations/medical-profile.js';
import {
  buildGroupExcelBuffer,
  buildInstallmentsExcelBuffer,
} from '../../src/ui/export/excel-exporter.js';
import type { GroupWorkspace } from '../../src/ui/supervisor/types.js';

function createSampleGroup(): GroupWorkspace {
  return {
    id: 'grp-excel-1',
    version: 3,
    updatedAt: '2026-11-28T10:00:00.000Z',
    settings: {
      tripTitle: 'عمرة النور المميزة',
      tripCode: '#NOOR-2026',
      status: TripStatus.IN_MAKKAH,
      startDate: '2026-12-01',
      endDate: '2026-12-10',
      busNumber: 'باص 101',
      hotelKey: 'kiswah',
      hotelNameAr: 'فندق أبراج الكسوة',
      hotelNameEn: 'Al Kiswah Towers Hotel',
      hotelAddressAr: 'التيسير، مكة المكرمة',
      hotelPhone: '+966125300000',
      hotelLat: 21.4312,
      hotelLng: 39.8165,
      supervisorName: 'الشيخ مصطفى فليفل',
      supervisorPhone: '+201040414659',
      gatheringTime: '08:00',
      meetingPoint: 'بوابة الملك عبد العزيز',
    },
    pilgrims: [
      {
        id: 'p-1',
        personId: 'per-1',
        fullName: 'عبد الرحمن محمود',
        gender: Gender.MALE,
        passportNumber: '004912345',
        phone: '01012345678',
        roomNumber: '401',
        boarded: true,
        nusukReady: true,
      },
      {
        id: 'p-2',
        personId: 'per-2',
        fullName: 'فاطمة حسن علي',
        gender: Gender.FEMALE,
        passportNumber: 'A88776655',
        phone: '01198765432',
        roomNumber: '',
        boarded: false,
        nusukReady: false,
      },
    ],
    rooms: [
      {
        id: 'r-1',
        roomNumber: '401',
        type: RoomType.DOUBLE,
        capacity: 2,
        isFamilyRoom: true,
        occupantIds: ['p-1'],
      },
    ],
    gameya: [
      {
        id: 'g-1',
        name: 'عبد الرحمن محمود',
        phone: '01012345678',
        planType: GameyaType.DEPOSIT_PLUS_MONTHLY,
        turnMonth: 1,
        totalTarget: 40000,
        downPayment: 10000,
        installmentCount: 6,
        totalPaid: 15000,
        startDateIso: '2026-10-01',
        payments: [
          {
            id: 'pay-1',
            amount: 10000,
            method: PaymentMethod.INSTAPAY,
            ref: 'IPN-9001',
            dateIso: '2026-10-01',
          },
          {
            id: 'pay-2',
            amount: 5000,
            method: PaymentMethod.CASH,
            dateIso: '2026-11-01',
          },
        ],
      },
      {
        id: 'g-2',
        name: 'فاطمة حسن علي',
        phone: '01198765432',
        planType: GameyaType.FULL_CASH,
        turnMonth: 1,
        totalTarget: 42000,
        downPayment: 42000,
        installmentCount: 1,
        totalPaid: 42000,
        startDateIso: '2026-10-15',
        payments: [
          {
            id: 'pay-3',
            amount: 42000,
            method: PaymentMethod.BANK_TRANSFER,
            ref: 'BNK-442',
            dateIso: '2026-10-15',
          },
        ],
      },
    ],
    luggage: [
      {
        id: 'l-1',
        tagCode: 'BAG-401-01',
        pilgrimName: 'عبد الرحمن محمود',
        roomNumber: '401',
        bagType: 'SUITCASE',
        status: LuggageStatus.DELIVERED_TO_ROOM,
      },
    ],
    medical: [
      {
        id: 'm-1',
        pilgrimName: 'فاطمة حسن علي',
        roomNumber: '401',
        conditions: [ChronicCondition.DIABETES],
        requiresWheelchair: true,
        requiresElectricCart: false,
        requiresInsulinRefrigeration: true,
        emergencyContactName: 'عبد الرحمن محمود',
        emergencyContactPhone: '01012345678',
        notes: 'توفير ثلاجة للأنسولين بالباص والفندق',
      },
    ],
    sosAlerts: [],
  };
}

describe('Formatted Multi-Sheet Excel (.xlsx) Exporter', () => {
  it('generates a styled 5-sheet RTL Arabic workbook with Excel formulas and literal string identifiers', async () => {
    const group = createSampleGroup();
    const bytes = await buildGroupExcelBuffer(group, 'ar');
    expect(bytes.byteLength).toBeGreaterThan(5000);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(bytes.buffer as ArrayBuffer);

    const names = wb.worksheets.map((ws) => ws.name);
    expect(names).toEqual([
      'الملخص التنفيذي',
      'كشف المعتمرين والتسكين',
      'خطط الأقساط',
      'سجل المدفوعات',
      'الأمتعة والرعاية الطبية',
    ]);

    const manifestSheet = wb.getWorksheet('كشف المعتمرين والتسكين')!;
    expect(manifestSheet.views[0]?.rightToLeft).toBe(true);
    expect(manifestSheet.views[0]?.ySplit).toBe(4);
    expect(manifestSheet.getCell('D5').value).toBe('004912345');
    expect(manifestSheet.getCell('D5').numFmt).toBe('@');
    expect(manifestSheet.getCell('E5').value).toBe('01012345678');
    expect(manifestSheet.getCell('E5').numFmt).toBe('@');

    const installmentsSheet = wb.getWorksheet('خطط الأقساط')!;
    expect(installmentsSheet.getCell('H5').value).toEqual({ formula: 'MAX(0,F5-G5)' });
    expect(installmentsSheet.getCell('I5').value).toEqual({ formula: 'IF(F5>0,G5/F5,0)' });
    expect(installmentsSheet.getCell('F7').value).toEqual({ formula: 'SUM(F5:F6)' });
    expect(installmentsSheet.getCell('G7').value).toEqual({ formula: 'SUM(G5:G6)' });

    const ledgerSheet = wb.getWorksheet('سجل المدفوعات')!;
    expect(ledgerSheet.getCell('H8').value).toEqual({ formula: 'SUM(H5:H7)' });
  });

  it('generates English LTR workbooks and standalone Installments workbook cleanly', async () => {
    const group = createSampleGroup();
    const fullBytes = await buildGroupExcelBuffer(group, 'en');
    const instBytes = await buildInstallmentsExcelBuffer(group, 'en');

    const wbFull = new ExcelJS.Workbook();
    await wbFull.xlsx.load(fullBytes.buffer as ArrayBuffer);
    expect(wbFull.worksheets.map((s) => s.name)).toEqual([
      'Summary',
      'Pilgrims Manifest',
      'Installments',
      'Payment Ledger',
      'Luggage & Medical',
    ]);
    expect(wbFull.getWorksheet('Installments')?.views[0]?.rightToLeft).toBe(false);

    const wbInst = new ExcelJS.Workbook();
    await wbInst.xlsx.load(instBytes.buffer as ArrayBuffer);
    expect(wbInst.worksheets.map((s) => s.name)).toEqual(['Installments', 'Payment Ledger']);
  });
});
