/**
 * Currency Converter & Makkah/Madinah Taxi Fare Guide
 * Protects pilgrims from overcharging and facilitates easy budget planning.
 */

export interface CurrencyRates {
  SAR_TO_EGP: number; // e.g. 13.10
  SAR_TO_USD: number; // e.g. 0.267
  USD_TO_SAR: number; // e.g. 3.75
  EGP_TO_SAR: number; // e.g. 0.076
}

export interface TaxiRouteFare {
  id: string;
  city: 'MAKKAH' | 'MADINAH';
  fromAr: string;
  toAr: string;
  distanceKm: number;
  fairPriceMinSAR: number;
  fairPriceMaxSAR: number;
  adviceAr: string;
}

export class CurrencyAndTaxiService {
  private rates: CurrencyRates = {
    SAR_TO_EGP: 13.15,
    SAR_TO_USD: 0.267,
    USD_TO_SAR: 3.75,
    EGP_TO_SAR: 0.076,
  };

  private taxiRoutes: TaxiRouteFare[] = [
    {
      id: 'mkk-haram-train',
      city: 'MAKKAH',
      fromAr: 'المسجد الحرام / الفندق',
      toAr: 'محطة قطار الحرمين السريع (الرصيفة)',
      distanceKm: 6.5,
      fairPriceMinSAR: 25,
      fairPriceMaxSAR: 35,
      adviceAr: 'لا تدفع أكثر من 35 ريالاً، أو استخدم تطبيق أوبر / بولت لتفادي استغلال السائقين عند الزحام.',
    },
    {
      id: 'mkk-haram-taneem',
      city: 'MAKKAH',
      fromAr: 'الفندق / الحرم',
      toAr: 'مسجد التنعيم (ميقات عائشة رضي الله عنها)',
      distanceKm: 8.0,
      fairPriceMinSAR: 25,
      fairPriceMaxSAR: 40,
      adviceAr: 'تتوفر حافلات مكة المكرمة العامة بـ 4 ريالات فقط، أو سيارة مشتركة بـ 5 إلى 10 ريالات للشخص.',
    },
    {
      id: 'mkk-haram-hira',
      city: 'MAKKAH',
      fromAr: 'الحرم المكي',
      toAr: 'غار حراء (حي حراء الثقافي)',
      distanceKm: 9.5,
      fairPriceMinSAR: 35,
      fairPriceMaxSAR: 50,
      adviceAr: 'اتفق مع السائق مسبقاً قبل الركوب على انتظارك لمدة ساعة إذا أردت العودة معه.',
    },
    {
      id: 'mad-haram-quba',
      city: 'MADINAH',
      fromAr: 'المسجد النبوي الشريف',
      toAr: 'مسجد قباء',
      distanceKm: 3.5,
      fairPriceMinSAR: 15,
      fairPriceMaxSAR: 25,
      adviceAr: 'يمكنك المشي عبر درب السنة المخصص للمشاة (3 كم ممشى رائع ومكيف ومخدوم بعربات الغولف بـ 10 ريالات).',
    },
    {
      id: 'mad-haram-train',
      city: 'MADINAH',
      fromAr: 'المسجد النبوي',
      toAr: 'محطة قطار الحرمين (المدينة)',
      distanceKm: 9.0,
      fairPriceMinSAR: 30,
      fairPriceMaxSAR: 45,
      adviceAr: 'تتواجد سيارات الأجرة الرسمية الخضراء بالعداد، أو اطلب السيارة عبر التطبيقات الذكية.',
    },
  ];

  convertSARtoEGP(sarAmount: number): number {
    return Math.round(sarAmount * this.rates.SAR_TO_EGP * 100) / 100;
  }

  convertEGPtoSAR(egpAmount: number): number {
    return Math.round(egpAmount * this.rates.EGP_TO_SAR * 100) / 100;
  }

  convertSARtoUSD(sarAmount: number): number {
    return Math.round(sarAmount * this.rates.SAR_TO_USD * 100) / 100;
  }

  getAllTaxiRoutes(): TaxiRouteFare[] {
    return [...this.taxiRoutes];
  }

  getRoutesByCity(city: 'MAKKAH' | 'MADINAH'): TaxiRouteFare[] {
    return this.taxiRoutes.filter((r) => r.city === city);
  }
}
