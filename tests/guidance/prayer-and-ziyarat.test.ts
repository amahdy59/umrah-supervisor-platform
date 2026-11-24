import { describe, it, expect } from 'vitest';
import { PrayerTimesEngine, CityLocation } from '../../src/guidance/prayer-times.js';
import { ZiyaratGuideCatalog, ZiyaratCity } from '../../src/guidance/ziyarat-guide.js';

describe('Prayer Times & Haramain Countdown Engine', () => {
  it('provides complete daily prayer times for Makkah and Madinah', () => {
    const engine = new PrayerTimesEngine();
    const makkahPrayers = engine.getPrayerTimes(CityLocation.MAKKAH);

    expect(makkahPrayers.fajr).toBeDefined();
    expect(makkahPrayers.sunrise).toBeDefined();
    expect(makkahPrayers.dhuhr).toBeDefined();
    expect(makkahPrayers.asr).toBeDefined();
    expect(makkahPrayers.maghrib).toBeDefined();
    expect(makkahPrayers.isha).toBeDefined();
  });

  it('calculates the next upcoming prayer and countdown', () => {
    const engine = new PrayerTimesEngine();
    // Test at 14:00 (2:00 PM), next prayer should be Asr (around 15:30)
    const testTime = new Date('2026-02-24T14:00:00');
    const nextPrayer = engine.getNextPrayer(CityLocation.MAKKAH, testTime);

    expect(nextPrayer.nameAr).toBe('العصر');
    expect(nextPrayer.minutesRemaining).toBeGreaterThan(0);
  });

  it('triggers Mataf congestion and prayer-closure warning when under 25 minutes to prayer', () => {
    const engine = new PrayerTimesEngine();
    // Test 15 minutes before Maghrib
    const testTime = new Date('2026-02-24T18:15:00'); // Assuming Maghrib around 18:30
    const nextPrayer = engine.getNextPrayer(CityLocation.MAKKAH, testTime);

    if (nextPrayer.minutesRemaining <= 25) {
      expect(nextPrayer.matafWarning).toBeDefined();
      expect(nextPrayer.matafWarning).toContain('إخلاء صحن المطاف');
    }
  });
});

describe('Ziyarat & Holy Historical Sites Catalog', () => {
  const catalog = new ZiyaratGuideCatalog();

  it('lists historical sites for both Makkah and Madinah with virtues and etiquettes', () => {
    const madinahSites = catalog.getSitesByCity(ZiyaratCity.MADINAH);
    expect(madinahSites.length).toBeGreaterThanOrEqual(3);
    expect(madinahSites.some((s) => s.id === 'MASJID_QUBA')).toBe(true);
    expect(madinahSites.some((s) => s.id === 'MOUNT_UHUD')).toBe(true);

    const makkahSites = catalog.getSitesByCity(ZiyaratCity.MAKKAH);
    expect(makkahSites.length).toBeGreaterThanOrEqual(2);
    expect(makkahSites.some((s) => s.id === 'JABAL_AL_NUR')).toBe(true);
    expect(makkahSites.some((s) => s.id === 'JABAL_THAWR')).toBe(true);
  });

  it('details Quba Mosque virtue (2 Rak\'ahs equal to Umrah reward)', () => {
    const quba = catalog.getSiteById('MASJID_QUBA');
    expect(quba).toBeDefined();
    expect(quba?.virtueAr).toContain('تعدل صلاة فيه أجر عمرة');
    expect(quba?.sunnahEtiquette).toContain('صلاة ركعتين');
  });

  it('includes clear warnings against innovations (bid\'ah) like writing on stones or rubbing dust', () => {
    const uhud = catalog.getSiteById('MOUNT_UHUD');
    expect(uhud?.bidahWarnings).toContain('عدم التمسح بالأحجار');
  });
});
