import { describe, it, expect } from 'vitest';
import {
  PackingCatalog,
  ChecklistCategory,
} from '../../src/guidance/packing-checklist.js';
import { HaramGatesGuide } from '../../src/guidance/haram-gates-guide.js';

describe('PackingCatalog - قائمة تجهيز حقيبة المعتمر', () => {
  const catalog = new PackingCatalog();

  it('should contain essential items across all 5 categories', () => {
    const items = catalog.getAllItems();
    expect(items.length).toBeGreaterThanOrEqual(14);

    const menItems = catalog.getItemsByCategory(ChecklistCategory.MENS_IHRAM);
    expect(menItems.length).toBeGreaterThanOrEqual(3);

    const womenItems = catalog.getItemsByCategory(ChecklistCategory.WOMENS_IHRAM);
    expect(womenItems.length).toBeGreaterThanOrEqual(3);
  });

  it('should calculate readiness score correctly', () => {
    const all = catalog.getAllItems();
    // take first 5 items out of 15 items -> 33%
    const fiveIds = all.slice(0, 5).map((i) => i.id);

    const readiness = catalog.calculateReadiness(fiveIds);
    expect(readiness.checked).toBe(5);
    expect(readiness.total).toBe(all.length);
    expect(readiness.percentage).toBe(33);
  });
});

describe('HaramGatesGuide - دليل بوابات الحرم ومسار الفندق', () => {
  const guide = new HaramGatesGuide();

  it('should find King Fahd Gate 79 and North Expansion for Kiswah / Jarwal hotels', () => {
    const gatesForKiswah = guide.getBestGatesForHotel('أبراج الكسوة');
    expect(gatesForKiswah.length).toBeGreaterThanOrEqual(2);

    const gateNumbers = gatesForKiswah.map((g) => g.gateNumber);
    expect(gateNumbers).toContain(79); // King Fahd
    expect(gateNumbers).toContain(100); // King Abdullah Expansion
  });

  it('should map Bab al-Fath to Gate 45 and Bab al-Umrah to Gate 62 accurately', () => {
    const gate45 = guide.getGateByNumber(45);
    expect(gate45).toBeDefined();
    expect(gate45?.nameAr).toContain('باب الفتح');

    const gate62 = guide.getGateByNumber(62);
    expect(gate62).toBeDefined();
    expect(gate62?.nameAr).toContain('باب العمرة');
  });

  it('should retrieve gate by exact number', () => {
    const gate1 = guide.getGateByNumber(1);
    expect(gate1).toBeDefined();
    expect(gate1?.nameAr).toContain('الملك عبد العزيز');
    expect(gate1?.nearestAreaAr).toContain('أجياد');
  });
});
