import ExcelJS from 'exceljs';
import { GameyaGroup, GameyaType, PaymentMethod } from '../../financial/gameya.js';
import { Money } from '../../financial/money.js';
import { TripStatus } from '../../operations/trip-logistics.js';
import type { UiLanguage } from '../i18n.js';
import type { GameyaRecord, GroupWorkspace } from '../supervisor/types.js';

const PLAN_LABELS: Record<GameyaType, { ar: string; en: string }> = {
  [GameyaType.DEPOSIT_PLUS_MONTHLY]: { ar: 'مقدم + أقساط شهرية', en: 'Deposit + Monthly' },
  [GameyaType.DIRECT_INSTALLMENT]: { ar: 'تقسيط شهري مباشر', en: 'Monthly Installments' },
  [GameyaType.ROTATING_ROSCA]: { ar: 'جمعية دورية بالأدوار', en: 'Rotating ROSCA' },
  [GameyaType.DEPOSIT_PLUS_FINAL]: { ar: 'مقدم + الباقي قبل السفر', en: 'Deposit + Pre-Trip Balance' },
  [GameyaType.BIWEEKLY_INSTALLMENT]: { ar: 'تقسيط كل أسبوعين', en: 'Biweekly Installments' },
  [GameyaType.FULL_CASH]: { ar: 'سداد نقدي كامل', en: 'Full Cash' },
};

const METHOD_LABELS: Record<PaymentMethod, { ar: string; en: string }> = {
  [PaymentMethod.INSTAPAY]: { ar: 'إنستاباي', en: 'InstaPay' },
  [PaymentMethod.CASH]: { ar: 'نقدي', en: 'Cash' },
  [PaymentMethod.VODAFONE_CASH]: { ar: 'محفظة إلكترونية', en: 'Mobile Wallet' },
  [PaymentMethod.BANK_TRANSFER]: { ar: 'تحويل بنكي', en: 'Bank Transfer' },
  [PaymentMethod.CARD]: { ar: 'بطاقة بنكية', en: 'Card' },
};

const STAGE_LABELS: Record<TripStatus, { ar: string; en: string }> = {
  [TripStatus.DRAFT]: { ar: 'مسودة الإعداد', en: 'Draft' },
  [TripStatus.REGISTRATION_OPEN]: { ar: 'باب التسجيل مفتوح', en: 'Registration Open' },
  [TripStatus.PRE_DEPARTURE]: { ar: 'تجهيز ما قبل السفر', en: 'Pre-Departure' },
  [TripStatus.IN_TRANSIT]: { ar: 'في الطريق / الميقات', en: 'In Transit / Miqat' },
  [TripStatus.IN_MAKKAH]: { ar: 'في مكة المكرمة', en: 'In Makkah' },
  [TripStatus.IN_MADINAH]: { ar: 'في المدينة المنورة', en: 'In Madinah' },
  [TripStatus.RETURN_TRANSIT]: { ar: 'الاستعداد للعودة', en: 'Return Transit' },
  [TripStatus.COMPLETED]: { ar: 'رحلة مكتملة', en: 'Completed' },
};

const COLOR_EMERALD_DARK = 'FF064E3B';
const COLOR_EMERALD_HEAD = 'FF065F46';
const COLOR_EMERALD_SOFT = 'FFECFDF5';
const COLOR_GOLD_TEXT = 'FFFDE68A';
const COLOR_GOLD_ACCENT = 'FFB45309';
const COLOR_BORDER = 'FFD1D5DB';
const COLOR_ZEBRA = 'FFF8FAFC';

function colLetter(colNumber: number): string {
  let letter = '';
  let n = colNumber;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}

function currencyFormat(isEn: boolean): string {
  return isEn ? '#,##0 "EGP"' : '#,##0 "ج.م"';
}

function parseIsoDate(iso?: string): Date | string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || '';
  const dt = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(dt.getTime()) ? iso : dt;
}

function setupBrandedSheet(
  wb: ExcelJS.Workbook,
  sheetName: string,
  title: string,
  subtitle: string,
  headers: string[],
  isEn: boolean
): ExcelJS.Worksheet {
  const safeName = sheetName.replace(/[*?:\\/[\]]/g, '').slice(0, 31) || 'Sheet';
  const ws = wb.addWorksheet(safeName, {
    views: [{ state: 'frozen', ySplit: 4, rightToLeft: !isEn }],
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  const lastCol = colLetter(Math.max(1, headers.length));

  ws.mergeCells(`A1:${lastCol}1`);
  const r1 = ws.getCell('A1');
  r1.value = title;
  r1.font = { name: 'Cairo', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  r1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_EMERALD_DARK } };
  r1.alignment = { horizontal: isEn ? 'left' : 'right', vertical: 'middle' };
  ws.getRow(1).height = 28;

  ws.mergeCells(`A2:${lastCol}2`);
  const r2 = ws.getCell('A2');
  r2.value = subtitle;
  r2.font = { name: 'Cairo', size: 10, bold: true, color: { argb: COLOR_GOLD_TEXT } };
  r2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_EMERALD_DARK } };
  r2.alignment = { horizontal: isEn ? 'left' : 'right', vertical: 'middle' };
  ws.getRow(2).height = 20;

  ws.getRow(3).height = 8;

  const headerRow = ws.getRow(4);
  headerRow.values = headers;
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Cairo', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_EMERALD_HEAD } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: COLOR_EMERALD_HEAD } },
      bottom: { style: 'medium', color: { argb: COLOR_GOLD_ACCENT } },
      left: { style: 'thin', color: { argb: 'FF047857' } },
      right: { style: 'thin', color: { argb: 'FF047857' } },
    };
  });

  ws.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4, column: headers.length },
  };

  return ws;
}

function styleDataRow(row: ExcelJS.Row, indexZeroBased: number): void {
  const fillColor = indexZeroBased % 2 === 1 ? COLOR_ZEBRA : 'FFFFFFFF';
  row.height = 21;
  row.eachCell((cell) => {
    cell.font = cell.font || { name: 'Cairo', size: 10 };
    if (!cell.fill) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
    }
    if (!cell.alignment) {
      cell.alignment = { vertical: 'middle', wrapText: true };
    }
    cell.border = {
      top: { style: 'thin', color: { argb: COLOR_BORDER } },
      bottom: { style: 'thin', color: { argb: COLOR_BORDER } },
      left: { style: 'thin', color: { argb: COLOR_BORDER } },
      right: { style: 'thin', color: { argb: COLOR_BORDER } },
    };
  });
}

function styleStatusCell(cell: ExcelJS.Cell, tone: 'success' | 'warning' | 'danger'): void {
  const palette = {
    success: { bg: 'FFDCFCE7', fg: 'FF166534' },
    warning: { bg: 'FFFEF3C7', fg: 'FF92400E' },
    danger: { bg: 'FFFEE2E2', fg: 'FF991B1B' },
  }[tone];
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: palette.bg } };
  cell.font = { name: 'Cairo', size: 10, bold: true, color: { argb: palette.fg } };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
}

function applyAutoColumnWidths(ws: ExcelJS.Worksheet, minWidth = 12, maxWidth = 38): void {
  ws.columns.forEach((column) => {
    let widest = minWidth;
    column.eachCell?.({ includeEmpty: false }, (cell, rowNumber) => {
      if (rowNumber <= 3) return;
      const val = cell.value;
      const str =
        val && typeof val === 'object' && 'formula' in val
          ? '123,456 ج.م'
          : val instanceof Date
            ? '2026-12-31'
            : String(val ?? '');
      widest = Math.max(widest, str.length + 5);
    });
    column.width = Math.min(maxWidth, widest);
  });
}

function computeMemberOverdueCount(m: GameyaRecord, departureDateStr: string): number {
  const grp = new GameyaGroup({
    id: m.id,
    name: 'export',
    type: m.planType,
    targetAmountPerMember: Money.fromDecimal(Math.max(1, m.totalTarget), 'EGP'),
    downPayment: m.downPayment > 0 ? Money.fromDecimal(m.downPayment, 'EGP') : undefined,
    durationMonths: Math.max(1, m.installmentCount),
    startDate: new Date(m.startDateIso || Date.now()),
    departureDate: departureDateStr ? new Date(departureDateStr) : undefined,
    currency: 'EGP',
  });
  grp.registerMember({
    id: m.id,
    pilgrimId: m.id,
    fullName: m.name,
    phone: m.phone,
    turnNumber: m.turnMonth,
    customPlanType: m.planType,
    downPayment: m.downPayment > 0 ? Money.fromDecimal(m.downPayment, 'EGP') : undefined,
  });
  grp.generateMemberSchedule(m.id, {
    planType: m.planType,
    installmentCount: Math.max(1, m.installmentCount),
  });
  if (m.payments.length > 0) {
    for (const p of m.payments) {
      if (p.amount > 0) {
        grp.recordFlexiblePayment({
          memberId: m.id,
          amount: Money.fromDecimal(p.amount, 'EGP'),
          method: p.method,
          supervisorId: 'sup',
          transactionRef: p.ref,
        });
      }
    }
  } else if (m.totalPaid > 0) {
    grp.recordFlexiblePayment({
      memberId: m.id,
      amount: Money.fromDecimal(Math.min(m.totalPaid, m.totalTarget), 'EGP'),
      method: PaymentMethod.CASH,
      supervisorId: 'sup',
    });
  }
  return grp.getMemberSummary(m.id).overdueCount;
}

function appendInstallmentWorksheets(wb: ExcelJS.Workbook, group: GroupWorkspace, isEn: boolean): void {
  const s = group.settings;
  const brandLine = isEn
    ? `Abshirou • Granada Tourism (License #1094) • ${s.supervisorName} • Exported ${new Date().toISOString().slice(0, 10)}`
    : `أبشروا • شركة غرناطة للسياحة (ترخيص ١٠٩٤) • ${s.supervisorName} • تاريخ التصدير: ${new Date().toISOString().slice(0, 10)}`;

  // Installments Summary Sheet
  const instSheetName = isEn ? 'Installments' : 'خطط الأقساط';
  const instHeaders = isEn
    ? ['#', 'Subscriber', 'Phone', 'Payment Plan', 'Start Date', 'Total Target', 'Total Paid', 'Remaining', 'Progress %', 'Payments', 'Status']
    : ['#', 'المشترك', 'رقم الواتساب', 'نظام السداد', 'تاريخ البدء', 'الإجمالي', 'المسدد', 'المتبقي', 'نسبة السداد', 'الدفعات', 'الحالة'];

  const wsInst = setupBrandedSheet(
    wb,
    instSheetName,
    isEn ? `${s.tripTitle} (${s.tripCode}) — Installments Report` : `${s.tripTitle} (${s.tripCode}) — كشف الأقساط والجمعية`,
    brandLine,
    instHeaders,
    isEn
  );

  const curFmt = currencyFormat(isEn);
  group.gameya.forEach((m, idx) => {
    const rIdx = idx + 5;
    const overdue = computeMemberOverdueCount(m, s.endDate);
    const rem = Math.max(0, m.totalTarget - m.totalPaid);
    const statusLabel =
      rem === 0
        ? isEn
          ? 'Paid in Full'
          : 'مكتمل السداد'
        : overdue > 0
          ? isEn
            ? `Overdue (${overdue})`
            : `متأخر (${overdue})`
          : isEn
            ? 'Active'
            : 'قيد السداد';

    const row = wsInst.addRow([
      idx + 1,
      m.name,
      m.phone || '-',
      PLAN_LABELS[m.planType][isEn ? 'en' : 'ar'],
      parseIsoDate(m.startDateIso),
      m.totalTarget,
      m.totalPaid,
      { formula: `MAX(0,F${rIdx}-G${rIdx})` },
      { formula: `IF(F${rIdx}>0,G${rIdx}/F${rIdx},0)` },
      m.payments.length,
      statusLabel,
    ]);
    styleDataRow(row, idx);
    row.getCell(3).numFmt = '@';
    row.getCell(5).numFmt = 'yyyy-mm-dd';
    row.getCell(6).numFmt = curFmt;
    row.getCell(7).numFmt = curFmt;
    row.getCell(8).numFmt = curFmt;
    row.getCell(9).numFmt = '0.0%';
    row.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
    styleStatusCell(row.getCell(11), rem === 0 ? 'success' : overdue > 0 ? 'danger' : 'warning');
  });

  if (group.gameya.length > 0) {
    const lastRow = 4 + group.gameya.length;
    const totRow = wsInst.addRow([
      '',
      isEn ? 'Totals' : 'الإجمالي الكلي',
      '',
      '',
      '',
      { formula: `SUM(F5:F${lastRow})` },
      { formula: `SUM(G5:G${lastRow})` },
      { formula: `SUM(H5:H${lastRow})` },
      { formula: `IF(F${lastRow + 1}>0,G${lastRow + 1}/F${lastRow + 1},0)` },
      { formula: `SUM(J5:J${lastRow})` },
      '',
    ]);
    totRow.height = 24;
    totRow.eachCell((cell) => {
      cell.font = { name: 'Cairo', size: 10.5, bold: true, color: { argb: COLOR_EMERALD_DARK } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_EMERALD_SOFT } };
      cell.border = {
        top: { style: 'thin', color: { argb: COLOR_EMERALD_HEAD } },
        bottom: { style: 'double', color: { argb: COLOR_EMERALD_DARK } },
      };
    });
    totRow.getCell(6).numFmt = curFmt;
    totRow.getCell(7).numFmt = curFmt;
    totRow.getCell(8).numFmt = curFmt;
    totRow.getCell(9).numFmt = '0.0%';
  }
  applyAutoColumnWidths(wsInst);

  // Payment Transactions Ledger Sheet
  const paySheetName = isEn ? 'Payment Ledger' : 'سجل المدفوعات';
  const payHeaders = isEn
    ? ['#', 'Payment ID', 'Subscriber', 'Phone', 'Payment Date', 'Method', 'Reference', 'Amount Paid']
    : ['#', 'رقم العملية', 'المشترك', 'الهاتف', 'تاريخ السداد', 'الوسيلة', 'المرجع', 'المبلغ المدفوع'];
  const wsPay = setupBrandedSheet(
    wb,
    paySheetName,
    isEn ? `${s.tripTitle} — Verified Payment Ledger` : `${s.tripTitle} — سجل الإيصالات والمدفوعات`,
    brandLine,
    payHeaders,
    isEn
  );

  let paySeq = 0;
  group.gameya.forEach((m) => {
    m.payments.forEach((p) => {
      paySeq++;
      const row = wsPay.addRow([
        paySeq,
        p.id,
        m.name,
        m.phone || '-',
        parseIsoDate(p.dateIso),
        METHOD_LABELS[p.method][isEn ? 'en' : 'ar'],
        p.ref || '-',
        p.amount,
      ]);
      styleDataRow(row, paySeq - 1);
      row.getCell(2).numFmt = '@';
      row.getCell(4).numFmt = '@';
      row.getCell(5).numFmt = 'yyyy-mm-dd';
      row.getCell(7).numFmt = '@';
      row.getCell(8).numFmt = curFmt;
    });
  });

  if (paySeq > 0) {
    const lastPayRow = 4 + paySeq;
    const totPay = wsPay.addRow([
      '',
      isEn ? 'Total Recorded Payments' : 'إجمالي المدفوعات المسجلة',
      '',
      '',
      '',
      '',
      '',
      { formula: `SUM(H5:H${lastPayRow})` },
    ]);
    totPay.height = 24;
    totPay.eachCell((cell) => {
      cell.font = { name: 'Cairo', size: 10.5, bold: true, color: { argb: COLOR_EMERALD_DARK } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_EMERALD_SOFT } };
      cell.border = {
        top: { style: 'thin', color: { argb: COLOR_EMERALD_HEAD } },
        bottom: { style: 'double', color: { argb: COLOR_EMERALD_DARK } },
      };
    });
    totPay.getCell(8).numFmt = curFmt;
  }
  applyAutoColumnWidths(wsPay);
}

/**
 * Builds a complete multi-sheet, styled RTL/LTR `.xlsx` workbook for the active Umrah group:
 * Summary, Pilgrims & Rooming, Installments, Payment Ledger, and Luggage/Medical.
 */
export async function buildGroupExcelBuffer(
  group: GroupWorkspace,
  lang: UiLanguage = 'ar'
): Promise<Uint8Array> {
  const isEn = lang === 'en';
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Abshirou Umrah Platform — Sheikh Mostafa Flefel';
  wb.created = new Date();

  const s = group.settings;
  const brandLine = isEn
    ? `Abshirou • Granada Tourism (License #1094) • ${s.supervisorName} (${s.supervisorPhone})`
    : `أبشروا • شركة غرناطة للسياحة (ترخيص ١٠٩٤) • ${s.supervisorName} (${s.supervisorPhone})`;

  // Sheet 1: Executive Summary
  const wsSummary = setupBrandedSheet(
    wb,
    isEn ? 'Summary' : 'الملخص التنفيذي',
    isEn ? `${s.tripTitle} (${s.tripCode}) — Executive Summary` : `${s.tripTitle} (${s.tripCode}) — الملخص التنفيذي للفوج`,
    brandLine,
    isEn ? ['Metric', 'Value', 'Details'] : ['المؤشر', 'القيمة', 'التفاصيل'],
    isEn
  );
  const instSheet = isEn ? 'Installments' : 'خطط الأقساط';
  const instLastRow = Math.max(5, 4 + group.gameya.length);
  const summaryRows: Array<[string, string | number | { formula: string }, string, string?]> = [
    [isEn ? 'Group Title' : 'اسم الفوج', s.tripTitle, s.tripCode],
    [isEn ? 'Current Stage' : 'مرحلة الرحلة', STAGE_LABELS[s.status][isEn ? 'en' : 'ar'], `${s.startDate} → ${s.endDate}`],
    [isEn ? 'Makkah Hotel' : 'فندق مكة', isEn ? s.hotelNameEn : s.hotelNameAr, s.hotelAddressAr],
    [isEn ? 'Supervisor' : 'المشرف المسؤول', s.supervisorName, s.supervisorPhone],
    [isEn ? 'Registered Pilgrims' : 'إجمالي المعتمرين', group.pilgrims.length, isEn ? 'Active manifest count' : 'إجمالي المسجلين بالكشف'],
    [isEn ? 'Boarded Bus' : 'صعدوا الحافلة', group.pilgrims.filter((p) => p.boarded).length, s.busNumber],
    [isEn ? 'Installment Subscribers' : 'مشتركو الأقساط', group.gameya.length, isEn ? 'Across 6 plan types' : 'في خطط السداد والجمعية'],
    [
      isEn ? 'Total Packages Value' : 'إجمالي قيمة الباقات',
      group.gameya.length > 0 ? { formula: `SUM('${instSheet}'!F5:'${instSheet}'!F${instLastRow})` } : 0,
      isEn ? 'EGP' : 'جنيه مصري',
      currencyFormat(isEn),
    ],
    [
      isEn ? 'Total Collected' : 'إجمالي المحصّل',
      group.gameya.length > 0 ? { formula: `SUM('${instSheet}'!G5:'${instSheet}'!G${instLastRow})` } : 0,
      isEn ? 'Recorded receipts' : 'إجمالي الدفعات المحصلة',
      currencyFormat(isEn),
    ],
    [
      isEn ? 'Remaining Balance' : 'المتبقي للتحصيل',
      group.gameya.length > 0 ? { formula: `SUM('${instSheet}'!H5:'${instSheet}'!H${instLastRow})` } : 0,
      isEn ? 'Pending installments' : 'الرصيد المتبقي',
      currencyFormat(isEn),
    ],
  ];
  summaryRows.forEach((item, idx) => {
    const r = wsSummary.addRow([item[0], item[1], item[2]]);
    styleDataRow(r, idx);
    r.getCell(1).font = { name: 'Cairo', size: 10.5, bold: true, color: { argb: COLOR_EMERALD_DARK } };
    if (item[3]) r.getCell(2).numFmt = item[3];
    if (idx === 3) r.getCell(3).numFmt = '@';
  });
  applyAutoColumnWidths(wsSummary, 18, 44);

  // Sheet 2: Pilgrims & Rooming Manifest
  const wsPilgrims = setupBrandedSheet(
    wb,
    isEn ? 'Pilgrims Manifest' : 'كشف المعتمرين والتسكين',
    isEn ? `${s.tripTitle} — Pilgrims & Rooming Manifest` : `${s.tripTitle} — كشف المعتمرين والتسكين والحافلة`,
    brandLine,
    isEn
      ? ['#', 'Full Name', 'Gender', 'Passport No.', 'WhatsApp / Phone', 'Room', 'Bus Status', 'Nusuk Permit']
      : ['#', 'الاسم الكامل', 'النوع', 'رقم الجواز', 'رقم الواتساب', 'الغرفة', 'حالة الباص', 'تصريح نُسك'],
    isEn
  );
  group.pilgrims.forEach((p, idx) => {
    const row = wsPilgrims.addRow([
      idx + 1,
      p.fullName,
      p.gender === 'MALE' ? (isEn ? 'Male' : 'رجل') : isEn ? 'Female' : 'امرأة',
      p.passportNumber,
      p.phone || '-',
      p.roomNumber || (isEn ? 'Unassigned' : 'غير مسكن'),
      p.boarded ? (isEn ? 'Boarded' : 'صعد الباص') : isEn ? 'Pending' : 'لم يصعد',
      p.nusukReady ? (isEn ? 'Ready' : 'جاهز') : isEn ? 'Pending' : 'معلق',
    ]);
    styleDataRow(row, idx);
    row.getCell(4).numFmt = '@';
    row.getCell(5).numFmt = '@';
    styleStatusCell(row.getCell(7), p.boarded ? 'success' : 'warning');
    styleStatusCell(row.getCell(8), p.nusukReady ? 'success' : 'warning');
  });
  applyAutoColumnWidths(wsPilgrims);

  // Sheets 3 & 4: Installments + Payment Ledger
  appendInstallmentWorksheets(wb, group, isEn);

  // Sheet 5: Luggage & Medical Care
  const wsOps = setupBrandedSheet(
    wb,
    isEn ? 'Luggage & Medical' : 'الأمتعة والرعاية الطبية',
    isEn ? `${s.tripTitle} — Luggage Tags & Medical Cases` : `${s.tripTitle} — متابعة الأمتعة والحالات الصحية`,
    brandLine,
    isEn
      ? ['Category', 'Pilgrim Name', 'Room', 'Code / Companion', 'Detail / Bag Type', 'Status / Needs']
      : ['القسم', 'اسم المعتمر', 'الغرفة', 'الكود / المرافق', 'التفاصيل / النوع', 'الحالة / الاحتياج'],
    isEn
  );
  let opIdx = 0;
  group.luggage.forEach((b) => {
    const row = wsOps.addRow([
      isEn ? 'Luggage' : 'أمتعة',
      b.pilgrimName,
      b.roomNumber,
      b.tagCode,
      b.bagType,
      b.status,
    ]);
    styleDataRow(row, opIdx++);
    row.getCell(4).numFmt = '@';
  });
  group.medical.forEach((med) => {
    const needs = [
      med.requiresWheelchair ? (isEn ? 'Wheelchair' : 'كرسي متحرك') : '',
      med.requiresElectricCart ? (isEn ? 'Electric Cart' : 'عربة غولف') : '',
      med.requiresInsulinRefrigeration ? (isEn ? 'Insulin Fridge' : 'ثلاجة إنسولين') : '',
    ]
      .filter(Boolean)
      .join(' • ');
    const row = wsOps.addRow([
      isEn ? 'Medical Care' : 'رعاية صحية',
      med.pilgrimName,
      med.roomNumber,
      `${med.emergencyContactName} (${med.emergencyContactPhone})`,
      med.notes,
      needs || (isEn ? 'Standard monitoring' : 'متابعة عامة'),
    ]);
    styleDataRow(row, opIdx++);
  });
  applyAutoColumnWidths(wsOps);

  const rawBuffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(rawBuffer);
}

/**
 * Builds a dedicated formatted multi-sheet Excel `.xlsx` workbook focused on
 * Installment Plans & Payment Receipts.
 */
export async function buildInstallmentsExcelBuffer(
  group: GroupWorkspace,
  lang: UiLanguage = 'ar'
): Promise<Uint8Array> {
  const isEn = lang === 'en';
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Abshirou Umrah Platform — Sheikh Mostafa Flefel';
  wb.created = new Date();
  appendInstallmentWorksheets(wb, group, isEn);
  const rawBuffer = await wb.xlsx.writeBuffer();
  return new Uint8Array(rawBuffer);
}

function triggerExcelBrowserDownload(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadGroupExcel(group: GroupWorkspace, lang: UiLanguage = 'ar'): Promise<string> {
  const code = group.settings.tripCode.replace(/[^\w\-]/g, '') || 'group';
  const filename = `abshirou_group_${code}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const bytes = await buildGroupExcelBuffer(group, lang);
  triggerExcelBrowserDownload(bytes, filename);
  return filename;
}

export async function downloadInstallmentsExcel(group: GroupWorkspace, lang: UiLanguage = 'ar'): Promise<string> {
  const code = group.settings.tripCode.replace(/[^\w\-]/g, '') || 'group';
  const filename = `abshirou_installments_${code}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const bytes = await buildInstallmentsExcelBuffer(group, lang);
  triggerExcelBrowserDownload(bytes, filename);
  return filename;
}
