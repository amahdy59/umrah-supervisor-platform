import { describe, it, expect } from 'vitest';
import { EDITORIAL_METHODOLOGY, REF_CATALOG } from '../../src/guidance/references.js';
import {
  PrayerTimesEngine,
  CityLocation,
  isUmmAlQuraRamadan,
} from '../../src/guidance/prayer-times.js';
import {
  WhatsAppBroadcastManager,
  BroadcastPhase,
  FiqhAssistant,
} from '../../src/guidance/whatsapp-and-fiqh.js';
import { WomenFiqhCatalog, WomenFiqhTopic } from '../../src/guidance/women-fiqh.js';
import { ZiyaratGuideCatalog } from '../../src/guidance/ziyarat-guide.js';
import { HaramGatesGuide } from '../../src/guidance/haram-gates-guide.js';
import { HaramainAtlasCatalog } from '../../src/guidance/haramain-gates-and-services.js';
import { OFFICIAL_SAUDI_RESOURCES, MIQAT_ROUTE_GUIDES } from '../../src/guidance/official-resources.js';
import { CurrencyAndTaxiService } from '../../src/financial/currency-and-taxi.js';
import { TripStatus } from '../../src/operations/trip-logistics.js';
import { renderReferencePillsHtml, renderEditorialMethodologyHtml } from '../../src/ui/references-ui.js';

describe('Referenced Knowledge Schema & Provenance Completeness', () => {
  it('defines EDITORIAL_METHODOLOGY and valid non-empty citations across REF_CATALOG', () => {
    expect(EDITORIAL_METHODOLOGY.titleAr).toContain('منهجية التوثيق');
    expect(EDITORIAL_METHODOLOGY.titleEn).toContain('Methodology');
    for (const ref of Object.values(REF_CATALOG)) {
      expect(ref.id.length).toBeGreaterThan(2);
      expect(ref.bookOrAuthorityAr.length).toBeGreaterThan(3);
      expect(ref.bookOrAuthorityEn.length).toBeGreaterThan(3);
      expect(ref.citationAr.length).toBeGreaterThan(5);
      expect(ref.citationEn.length).toBeGreaterThan(5);
      expect(ref.lastVerified.length).toBeGreaterThan(3);
    }
  });

  it('attaches structured references across Fiqh, WomenFiqh, Ziyarat, Atlas, Gates, Taxi, Broadcasts, and Resources', () => {
    const fiqh = new FiqhAssistant();
    expect(fiqh.getAllRulings().every((r) => Array.isArray(r.references) && r.references.length > 0)).toBe(true);

    const women = new WomenFiqhCatalog();
    const shoesItem = women.getItemByTopic(WomenFiqhTopic.SHOE_SOCKS_PERMITTED);
    expect(shoesItem?.sourceText?.length).toBeGreaterThan(10);
    expect(women.getAllItems().every((i) => Array.isArray(i.references) && i.references.length > 0)).toBe(true);

    const ziyarat = new ZiyaratGuideCatalog();
    expect(ziyarat.getAllSites().every((s) => Array.isArray(s.references) && s.references.length > 0)).toBe(true);

    const atlas = new HaramainAtlasCatalog();
    expect(atlas.getAllLandmarksAndGates().every((l) => Array.isArray(l.references) && l.references.length > 0)).toBe(true);
    expect(atlas.getAllBenefits().every((b) => Array.isArray(b.references) && b.references.length > 0)).toBe(true);

    const gates = new HaramGatesGuide();
    expect(gates.getAllCitiesGates().every((g) => Array.isArray(g.references) && g.references.length > 0)).toBe(true);

    const taxi = new CurrencyAndTaxiService();
    expect(taxi.getAllTaxiRoutes().every((t) => Array.isArray(t.references) && t.references.length > 0)).toBe(true);

    const broadcasts = new WhatsAppBroadcastManager();
    for (const phase of broadcasts.getAllPhases()) {
      const post = broadcasts.getFormattedPost(phase);
      expect(Array.isArray(post.references) && post.references.length > 0).toBe(true);
    }

    expect(OFFICIAL_SAUDI_RESOURCES.every((r) => r.lastVerified.length > 0)).toBe(true);
    expect(MIQAT_ROUTE_GUIDES.every((m) => Array.isArray(m.references) && m.references.length > 0)).toBe(true);
  });

  it('renders accessible <details class="ref-disclosure"> HTML and editorial methodology card', () => {
    const htmlAr = renderReferencePillsHtml([REF_CATALOG.BUKHARI_1838_WOMEN_IHRAM], false);
    expect(htmlAr).toContain('<details class="ref-disclosure"');
    expect(htmlAr).toContain('صحيح البخاري');

    const methodEn = renderEditorialMethodologyHtml(true);
    expect(methodEn).toContain('Editorial &amp; Citation Methodology');
    expect(methodEn).toContain('Nusuk');
  });
});

describe('Seasonal Umm Al-Qura Ramadan Isha Offset, Madinah Gate Wayfinder & Stage Ordering', () => {
  it('switches Isha offset from +90 min to +120 min during Umm Al-Qura Ramadan', () => {
    const engine = new PrayerTimesEngine();
    const ramadanDate = new Date('2026-03-01T12:00:00Z');
    const nonRamadanDate = new Date('2026-11-25T12:00:00Z');

    expect(isUmmAlQuraRamadan(ramadanDate)).toBe(true);
    expect(isUmmAlQuraRamadan(nonRamadanDate)).toBe(false);

    const ramadanTimes = engine.getPrayerTimes(CityLocation.MAKKAH, ramadanDate);
    expect(ramadanTimes.isRamadan).toBe(true);
    expect(ramadanTimes.ishaOffsetMinutes).toBe(120);

    const standardTimes = engine.getPrayerTimes(CityLocation.MAKKAH, nonRamadanDate);
    expect(standardTimes.isRamadan).toBe(false);
    expect(standardTimes.ishaOffsetMinutes).toBe(90);
  });

  it('detects Madinah Nabawi gates automatically by latitude and computes Makkah hotel return exits', () => {
    const gates = new HaramGatesGuide();
    const madinahGates = gates.getAllGates('MADINAH');
    expect(madinahGates.map((g) => g.gateNumber)).toContain(1);
    expect(madinahGates.map((g) => g.gateNumber)).toContain(25);

    const nearestMadinah = gates.findNearestGate(24.467, 39.6104);
    expect(nearestMadinah.gate.city).toBe('MADINAH');

    const routeClock = gates.findHotelReturnRoute(21.4235, 39.8266, 21.4188, 39.8256, 'clock', 'MAKKAH');
    expect(routeClock.nearestNow.gate.city).toBe('MAKKAH');
    expect(routeClock.recommendedExits.some((g) => g.gateNumber === 1)).toBe(true);
    expect(routeClock.distanceToHotelMeters).toBeGreaterThan(200);
  });

  it('orders WhatsApp broadcasts by the active trip stage (IN_MADINAH puts RAWDAH_PERMIT first)', () => {
    const manager = new WhatsAppBroadcastManager();
    const orderedMadinah = manager.getOrderedPhasesForStage(TripStatus.IN_MADINAH);
    expect(orderedMadinah[0]).toBe(BroadcastPhase.RAWDAH_PERMIT);
  });
});
