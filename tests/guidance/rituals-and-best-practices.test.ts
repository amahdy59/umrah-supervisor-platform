import { describe, it, expect } from 'vitest';
import {
  TawafCounter,
  SaiCounter,
  TawafLocation,
  SaiLocation,
  HotelBestPracticesCatalog,
  HaramainBestPracticesCatalog,
} from '../../src/guidance/rituals-and-best-practices.js';

describe('Tawaf Interactive Counter', () => {
  it('manages 7 laps of Tawaf starting at Black Stone and tracks Duas', () => {
    const counter = new TawafCounter();

    expect(counter.currentLap).toBe(1);
    expect(counter.isCompleted).toBe(false);

    // Initial Dua for lap 1 contains Takbeer at Black stone
    const lap1Info = counter.getCurrentLapInfo();
    expect(lap1Info.lapNumber).toBe(1);
    expect(lap1Info.duaArabic).toContain('بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ');

    // Complete laps 1 through 6
    for (let i = 1; i <= 6; i++) {
      const result = counter.completeCurrentLap();
      expect(result.nextLap).toBe(i + 1);
      expect(result.hapticFeedbackPattern).toBe('VIBRATE_LAP');
    }

    expect(counter.currentLap).toBe(7);
    expect(counter.isCompleted).toBe(false);

    // Complete lap 7
    const finalResult = counter.completeCurrentLap();
    expect(counter.isCompleted).toBe(true);
    expect(finalResult.hapticFeedbackPattern).toBe('VIBRATE_COMPLETE');
    expect(finalResult.nextActionPrompt).toContain('صلاة ركعتي الطواف خلف مقام إبراهيم');
    expect(finalResult.nextActionPrompt).toContain('شرب ماء زمزم');
  });

  it('provides between Yemeni Corner and Black Stone prescribed Dua for all laps', () => {
    const counter = new TawafCounter();
    const ruknYamaniDua = counter.getRuknYamaniDua();

    expect(ruknYamaniDua.arabic).toContain('رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً');
    expect(ruknYamaniDua.arabic).toContain('وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ');
  });
});

describe('Sa\'i Interactive Counter', () => {
  it('tracks 7 laps between Safa and Marwa correctly', () => {
    const counter = new SaiCounter();

    // Lap 1: Safa to Marwa
    expect(counter.currentLap).toBe(1);
    expect(counter.currentStartingPoint).toBe(SaiLocation.SAFA);
    expect(counter.currentDestination).toBe(SaiLocation.MARWA);

    counter.completeCurrentLap();

    // Lap 2: Marwa to Safa
    expect(counter.currentLap).toBe(2);
    expect(counter.currentStartingPoint).toBe(SaiLocation.MARWA);
    expect(counter.currentDestination).toBe(SaiLocation.SAFA);

    // Complete remaining laps
    for (let i = 2; i <= 6; i++) {
      counter.completeCurrentLap();
    }

    expect(counter.currentLap).toBe(7);
    expect(counter.currentStartingPoint).toBe(SaiLocation.SAFA);
    expect(counter.currentDestination).toBe(SaiLocation.MARWA);

    const finish = counter.completeCurrentLap();
    expect(counter.isCompleted).toBe(true);
    expect(finish.nextActionPrompt).toContain('الحلق أو التقصير');
  });

  it('notifies men of the Green Lights running zone (Herwala)', () => {
    const counter = new SaiCounter();
    const guidance = counter.getHerwalaGuidance();

    expect(guidance.arabicTitle).toContain('الهرولة بين العلمين الأخضرين');
    expect(guidance.applicableFor).toBe('MEN_ONLY');
  });
});

describe('Hotel Best Practices Catalog', () => {
  it('returns comprehensive tips for key cards, safes, and elevators', () => {
    const catalog = new HotelBestPracticesCatalog();
    const categories = catalog.getAllCategories();

    expect(categories).toContain('KEY_CARD_SAFETY');
    expect(categories).toContain('ELEVATOR_RUSH_HOURS');
    expect(categories).toContain('VALUABLES_AND_SAFE');
    expect(categories).toContain('EMERGENCY_HOTEL_CARD');

    const keyCardGuide = catalog.getGuideForCategory('KEY_CARD_SAFETY');
    expect(keyCardGuide.titleAr).toContain('حماية بطاقة الغرفة الممغنطة');
    expect(keyCardGuide.actionablePoints.length).toBeGreaterThan(0);
    expect(keyCardGuide.actionablePoints.some((p) => p.includes('الهاتف المحمول'))).toBe(true);
  });
});

describe('Haramain Best Practices Catalog', () => {
  it('returns safety guidelines for footwear, hydration, heatstroke, and Nusuk', () => {
    const catalog = new HaramainBestPracticesCatalog();
    const guides = catalog.getAllGuides();

    expect(guides.some((g) => g.id === 'FOOTWEAR_SHOE_BAG')).toBe(true);
    expect(guides.some((g) => g.id === 'HEATSTROKE_HYDRATION')).toBe(true);
    expect(guides.some((g) => g.id === 'EMERGENCY_CORRIDORS')).toBe(true);
    expect(guides.some((g) => g.id === 'NUSUK_RAWDAH_PERMITS')).toBe(true);
    expect(guides.some((g) => g.id === 'OFFICIAL_WHEELCHAIR_BOOKING')).toBe(true);

    const shoeGuide = catalog.getGuideById('FOOTWEAR_SHOE_BAG');
    expect(shoeGuide?.titleAr).toContain('حقيبة الحذاء وتنظيم النعال');
    expect(shoeGuide?.practicalAdvice).toContain('عدم ترك الحذاء في الممرات العامة');
  });
});
