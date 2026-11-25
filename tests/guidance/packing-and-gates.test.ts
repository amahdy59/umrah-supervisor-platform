import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  PackingCatalog,
  ChecklistCategory,
} from '../../src/guidance/packing-checklist.js';
import { HaramGatesGuide, bearingToArabicDirection } from '../../src/guidance/haram-gates-guide.js';
import { HaramainAtlasCatalog } from '../../src/guidance/haramain-gates-and-services.js';
import { ZiyaratGuideCatalog } from '../../src/guidance/ziyarat-guide.js';
import { hashSupervisorPin } from '../../src/ui/supervisor/privacy-lock.js';
import { onRequestPost as syncPost } from '../../functions/api/sync.js';

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

describe('HaramainAtlasCatalog & Ziyarat Image Integrity', () => {
  const atlas = new HaramainAtlasCatalog();
  const ziyarat = new ZiyaratGuideCatalog();
  const gates = new HaramGatesGuide();

  it('includes Makkah Kaaba core, all major gates, Madinah mosque areas, and free Haram services', () => {
    const makkah = atlas.getByCity('MAKKAH');
    const madinah = atlas.getByCity('MADINAH');
    const benefits = atlas.getAllBenefits();

    expect(makkah.length).toBeGreaterThanOrEqual(7);
    expect(madinah.length).toBeGreaterThanOrEqual(4);
    expect(benefits.length).toBeGreaterThanOrEqual(6);
    expect(atlas.getById('KAABA_DOOR_MULTAZAM')).toBeDefined();
    expect(atlas.getById('NABAWI_RAWDAH_GREEN_DOME')).toBeDefined();
  });

  it('verifies every referenced image path across gates, atlas, benefits, and ziyarat exists locally in public/', () => {
    const urls = [
      ...atlas.getAllLandmarksAndGates().map((x) => x.imageUrl),
      ...atlas.getAllBenefits().map((b) => b.imageUrl).filter(Boolean) as string[],
      ...gates.getAllGates().map((g) => g.imageUrl).filter(Boolean) as string[],
      ...ziyarat.getAllSites().map((s) => s.imageUrl).filter(Boolean) as string[],
    ];

    expect(urls.length).toBeGreaterThanOrEqual(20);
    for (const rel of urls) {
      const fullPath = resolve(process.cwd(), 'public', rel.replace(/^\/+/, ''));
      expect(existsSync(fullPath), `Missing image asset: ${fullPath}`).toBe(true);
      expect(statSync(fullPath).size).toBeGreaterThan(5000);
    }
  });

  it('finds the nearest Haram gate and directional bearing from GPS coordinates offline', () => {
    // Near Northern Expansion Gate 100
    const northMatch = gates.findNearestGate(21.4261, 39.8255);
    expect(northMatch.gate.gateNumber).toBe(100);
    expect(northMatch.distanceMeters).toBeLessThan(100);

    // Near Southern Clock Tower / Gate 1
    const southMatch = gates.findNearestGate(21.4198, 39.8257);
    expect(southMatch.gate.gateNumber).toBe(1);
    expect(bearingToArabicDirection(0)).toContain('شمال');
  });

  it('hashes supervisor PINs deterministically and returns local-only fallback when D1 DB is unbound', async () => {
    const h1 = await hashSupervisorPin('1234');
    const h2 = await hashSupervisorPin('1234');
    const h3 = await hashSupervisorPin('9999');
    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);

    const res = await syncPost({
      request: new Request('https://example.com/api/sync', { method: 'POST', body: '{}' }),
      env: {},
    });
    const json = (await res.json()) as { mode: string; synced: boolean };
    expect(json.mode).toBe('local-only');
    expect(json.synced).toBe(false);
  });
});
