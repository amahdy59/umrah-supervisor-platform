/**
 * Haram Gates & Hotel Wayfinder Guide
 * Directs pilgrims through verified Masjid al-Haram gates to return safely to their hotel area.
 */

export interface HaramGate {
  gateNumber: number;
  nameAr: string;
  nameEn: string;
  direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  nearestAreaAr: string;
  recommendedForHotels: string[];
  descriptionAr: string;
  howToReachHotelAr: string;
  avoidWarningAr?: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  imageAltAr?: string;
}

export interface NearestGateMatch {
  gate: HaramGate;
  distanceMeters: number;
  bearingDegrees: number;
  directionAr: string;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = toRad(lat1);
  const p2 = toRad(lat2);
  const dp = toRad(lat2 - lat1);
  const dl = toRad(lon2 - lon1);
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateBearingDegrees(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p1 = toRad(lat1);
  const p2 = toRad(lat2);
  const dl = toRad(lon2 - lon1);
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function bearingToArabicDirection(deg: number): string {
  const dirs = ['شمال ⬆️', 'شمال شرق ↗️', 'شرق ➡️', 'جنوب شرق ↘️', 'جنوب ⬇️', 'جنوب غرب ↙️', 'غرب ⬅️', 'شمال غرب ↖️'];
  const idx = Math.round(((deg % 360) / 45)) % 8;
  return dirs[idx] || 'شمال ⬆️';
}

export class HaramGatesGuide {
  private gates: HaramGate[] = [
    {
      gateNumber: 79,
      nameAr: 'باب الملك فهد',
      nameEn: 'King Fahd Gate',
      direction: 'WEST',
      nearestAreaAr: 'جرول / التيسير / الشبيكة',
      recommendedForHotels: ['أبراج الكسوة', 'جرول', 'التيسير', 'دار التوحيد'],
      descriptionAr: 'البوابة الأقرب والأسهل لمعتمري فنادق جرول والتيسير (ومنها أبراج الكسوة) لتجنب زحام أجياد.',
      howToReachHotelAr:
        'اخرج من باب الملك فهد (79) واتجه نحو الساحات الغربية إلى أنفاق جرول المؤدية لشارع التيسير (12–15 دقيقة مشياً أو عبر حافلات النقل الترددي المجانية).',
      avoidWarningAr:
        'تجنب الخروج من باب الملك عبد العزيز (1) لأنه يخرجك لجهة أجياد الجنوبية ويضطرك للالتفاف مسافة ~3 كم حول الحرم للوصول لجرول.',
      latitude: 21.4226,
      longitude: 39.8235,
      imageUrl: '/images/makkah/gate-fahd.webp',
      imageAltAr: 'صورة باب الملك فهد (بوابة 79) بالمسجد الحرام',
    },
    {
      gateNumber: 100,
      nameAr: 'بوابة الملك عبد الله (التوسعة الشمالية)',
      nameEn: 'King Abdullah Expansion Gate',
      direction: 'NORTH',
      nearestAreaAr: 'جرول / الغزة / السليمانية',
      recommendedForHotels: ['أبراج الكسوة', 'فنادق الدائري الأول', 'الغزة'],
      descriptionAr: 'بوابة فسيحة ومكيفة في التوسعة السعودية الثالثة، تخرجك مباشرة للساحات الشمالية باتجاه جرول والغزة.',
      howToReachHotelAr:
        'اخرج للساحات الشمالية واتجه يساراً نحو أنفاق جرول والتيسير أو يميناً نحو الغزة ومواقف الحافلات.',
      latitude: 21.426,
      longitude: 39.8256,
      imageUrl: '/images/makkah/king-abdullah-gate.webp',
      imageAltAr: 'صورة حقيقية للوحة وأقواس بوابة الملك عبد الله التوسعة الشمالية (بوابة 100)',
    },
    {
      gateNumber: 1,
      nameAr: 'باب الملك عبد العزيز',
      nameEn: 'King Abdulaziz Gate',
      direction: 'SOUTH',
      nearestAreaAr: 'أجياد / أبراج البيت (الساعة)',
      recommendedForHotels: ['أبراج البيت', 'وقف الملك عبد العزيز', 'فنادق شارع أجياد'],
      descriptionAr: 'المدخل والمخرج الرئيسي لمنطقة أجياد ووقف الملك عبد العزيز (برج الساعة).',
      howToReachHotelAr:
        'يخرجك مباشرة إلى الساحة الجنوبية أمام مجمع وقف الملك عبد العزيز وبرج الساعة وشارع أجياد (دقيقتان مشياً).',
      latitude: 21.4202,
      longitude: 39.8257,
      imageUrl: '/images/makkah/gate-abdulaziz.webp',
      imageAltAr: 'صورة باب الملك عبد العزيز (بوابة 1) بالمسجد الحرام',
    },
    {
      gateNumber: 45,
      nameAr: 'باب الفتح',
      nameEn: 'Bab Al-Fath Gate',
      direction: 'EAST',
      nearestAreaAr: 'شعب علي / المروة / الغزة / ريع بخش',
      recommendedForHotels: ['فنادق الغزة', 'فنادق ريع بخش', 'شعب عامر'],
      descriptionAr: 'بوابة رئيسية في الجهة الشمالية/الشرقية قرب المروة، مثالية للخروج بعد إتمام الشوط السابع من السعي.',
      howToReachHotelAr:
        'بعد انتهاء السعي عند جبل المروة، اخرج عبر مخارج المروة أو باب الفتح (45) لتجد نفسك في ساحة الغزة والمدعى وريع بخش.',
      latitude: 21.4252,
      longitude: 39.828,
      imageUrl: '/images/makkah/gate-main-entrance.webp',
      imageAltAr: 'صورة حقيقية لأروقة المسجد الحرام جهة المروة وباب الفتح (بوابة 45)',
    },
    {
      gateNumber: 62,
      nameAr: 'باب العمرة',
      nameEn: 'Bab Al-Umrah Gate',
      direction: 'WEST',
      nearestAreaAr: 'الشبيكة / جبل عمر / شارع إبراهيم الخليل',
      recommendedForHotels: ['فنادق جبل عمر', 'هيلتون مكة', 'فنادق إبراهيم الخليل', 'الشبيكة'],
      descriptionAr: 'البوابة التاريخية الرئيسية في الجهة الشمالية الغربية باتجاه الشبيكة ومشروع جبل عمر (وبجواره مداخل 63–64).',
      howToReachHotelAr:
        'اخرج من باب العمرة (62) باتجاه ساحة الشبيكة ومدخل فنادق جبل عمر وشارع إبراهيم الخليل (5 دقائق مشياً).',
      latitude: 21.4241,
      longitude: 39.824,
      imageUrl: '/images/makkah/bab-al-umrah.webp',
      imageAltAr: 'صورة حقيقية لمدخل ومآذن الجهة الشمالية الغربية باتجاه باب العمرة (بوابة 62)',
    },
  ];

  getAllGates(): HaramGate[] {
    return [...this.gates];
  }

  getGateByNumber(gateNumber: number): HaramGate | undefined {
    return this.gates.find((g) => g.gateNumber === gateNumber);
  }

  getBestGatesForHotel(hotelOrAreaName: string): HaramGate[] {
    const q = hotelOrAreaName.toLowerCase();
    return this.gates.filter(
      (g) =>
        g.recommendedForHotels.some((h) => h.toLowerCase().includes(q)) ||
        g.nearestAreaAr.toLowerCase().includes(q)
    );
  }

  findNearestGate(lat: number, lng: number): NearestGateMatch {
    let best: NearestGateMatch | null = null;
    for (const gate of this.gates) {
      const dist = Math.round(haversineDistanceMeters(lat, lng, gate.latitude, gate.longitude));
      const bearing = Math.round(calculateBearingDegrees(lat, lng, gate.latitude, gate.longitude));
      if (!best || dist < best.distanceMeters) {
        best = {
          gate,
          distanceMeters: dist,
          bearingDegrees: bearing,
          directionAr: bearingToArabicDirection(bearing),
        };
      }
    }
    return best!;
  }
}
