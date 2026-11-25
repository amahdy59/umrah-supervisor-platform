import { describe, it, expect } from 'vitest';
import { PrayerTimesEngine, CityLocation } from '../../src/guidance/prayer-times.js';
import { ZiyaratGuideCatalog, ZiyaratCity } from '../../src/guidance/ziyarat-guide.js';

describe('Prayer Times & Haramain Countdown Engine', () => {
  it('computes seasonal daily prayer times for Makkah and Madinah in Asia/Riyadh', () => {
    const engine = new PrayerTimesEngine();
    const febMakkah = engine.getPrayerTimes(CityLocation.MAKKAH, new Date('2026-02-24T10:00:00+03:00'));
    const junMakkah = engine.getPrayerTimes(CityLocation.MAKKAH, new Date('2026-06-21T10:00:00+03:00'));

    expect(febMakkah.fajr).toBeDefined();
    expect(febMakkah.maghrib).not.toBe(junMakkah.maghrib); // Seasonal variation
    expect(febMakkah.isha).toBeDefined();
  });

  it('calculates the next upcoming prayer and countdown in Asia/Riyadh regardless of host timezone', () => {
    const engine = new PrayerTimesEngine();
    // 14:00 Asia/Riyadh -> next prayer should be Asr (~15:40-15:50 in Feb)
    const testTime = new Date('2026-02-24T14:00:00+03:00');
    const nextPrayer = engine.getNextPrayer(CityLocation.MAKKAH, testTime);

    expect(nextPrayer.nameAr).toBe('العصر');
    expect(nextPrayer.minutesRemaining).toBeGreaterThan(0);
  });

  it('triggers Mataf congestion and prayer-closure warning when under 25 minutes to prayer', () => {
    const engine = new PrayerTimesEngine();
    const times = engine.getPrayerTimes(CityLocation.MAKKAH, new Date('2026-02-24T12:00:00+03:00'));
    const [mh, mm] = times.maghrib.split(':').map(Number);
    const tenMinsBeforeMaghrib = new Date(
      `2026-02-24T${String(mh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00+03:00`
    );
    tenMinsBeforeMaghrib.setMinutes(tenMinsBeforeMaghrib.getMinutes() - 10);

    const nextPrayer = engine.getNextPrayer(CityLocation.MAKKAH, tenMinsBeforeMaghrib);
    expect(nextPrayer.nameAr).toBe('المغرب');
    expect(nextPrayer.minutesRemaining).toBe(10);
    expect(nextPrayer.matafWarning).toContain('إخلاء صحن المطاف');
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
    expect(quba?.virtueAr).toContain('تعدل أجر عمرة');
    expect(quba?.sunnahEtiquette).toContain('صلاة ركعتين');
  });

  it('includes clear warnings against innovations (bid\'ah) like writing on stones or rubbing dust', () => {
    const uhud = catalog.getSiteById('MOUNT_UHUD');
    expect(uhud?.bidahWarnings).toContain('عدم التمسح بالأحجار');
  });
});
