/**
 * Haram Gates & Hotel Wayfinder Guide
 * Directs pilgrims through verified Masjid al-Haram gates to return safely to their hotel area.
 */

export interface HaramGate {
  gateNumber: number;
  nameAr: string;
  direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  nearestAreaAr: string;
  recommendedForHotels: string[];
  descriptionAr: string;
  howToReachHotelAr: string;
  avoidWarningAr?: string;
}

export class HaramGatesGuide {
  private gates: HaramGate[] = [
    {
      gateNumber: 79,
      nameAr: 'باب الملك فهد',
      direction: 'WEST',
      nearestAreaAr: 'جرول / التيسير / الشبيكة',
      recommendedForHotels: ['أبراج الكسوة', 'جرول', 'التيسير', 'دار التوحيد'],
      descriptionAr: 'البوابة الأقرب والأسهل لمعتمري فنادق جرول والتيسير (ومنها أبراج الكسوة) لتجنب زحام أجياد.',
      howToReachHotelAr:
        'اخرج من باب الملك فهد (79) واتجه نحو الساحات الغربية إلى أنفاق جرول المؤدية لشارع التيسير (12–15 دقيقة مشياً أو عبر حافلات النقل الترددي المجانية).',
      avoidWarningAr:
        'تجنب الخروج من باب الملك عبد العزيز (1) لأنه يخرجك لجهة أجياد الجنوبية ويضطرك للالتفاف مسافة ~3 كم حول الحرم للوصول لجرول.',
    },
    {
      gateNumber: 100,
      nameAr: 'بوابة الملك عبد الله (التوسعة الشمالية)',
      direction: 'NORTH',
      nearestAreaAr: 'جرول / الغزة / السليمانية',
      recommendedForHotels: ['أبراج الكسوة', 'فنادق الدائري الأول', 'الغزة'],
      descriptionAr: 'بوابة فسيحة ومكيفة في التوسعة السعودية الثالثة، تخرجك مباشرة للساحات الشمالية باتجاه جرول والغزة.',
      howToReachHotelAr:
        'اخرج للساحات الشمالية واتجه يساراً نحو أنفاق جرول والتيسير أو يميناً نحو الغزة ومواقف الحافلات.',
    },
    {
      gateNumber: 1,
      nameAr: 'باب الملك عبد العزيز',
      direction: 'SOUTH',
      nearestAreaAr: 'أجياد / أبراج البيت (الساعة)',
      recommendedForHotels: ['أبراج البيت', 'وقف الملك عبد العزيز', 'فنادق شارع أجياد'],
      descriptionAr: 'المدخل والمخرج الرئيسي لمنطقة أجياد ووقف الملك عبد العزيز (برج الساعة).',
      howToReachHotelAr:
        'يخرجك مباشرة إلى الساحة الجنوبية أمام مجمع وقف الملك عبد العزيز وبرج الساعة وشارع أجياد (دقيقتان مشياً).',
    },
    {
      gateNumber: 45,
      nameAr: 'باب الفتح',
      direction: 'EAST',
      nearestAreaAr: 'شعب علي / المروة / الغزة / ريع بخش',
      recommendedForHotels: ['فنادق الغزة', 'فنادق ريع بخش', 'شعب عامر'],
      descriptionAr: 'بوابة رئيسية في الجهة الشمالية/الشرقية قرب المروة، مثالية للخروج بعد إتمام الشوط السابع من السعي.',
      howToReachHotelAr:
        'بعد انتهاء السعي عند جبل المروة، اخرج عبر مخارج المروة أو باب الفتح (45) لتجد نفسك في ساحة الغزة والمدعى وريع بخش.',
    },
    {
      gateNumber: 62,
      nameAr: 'باب العمرة',
      direction: 'WEST',
      nearestAreaAr: 'الشبيكة / جبل عمر / شارع إبراهيم الخليل',
      recommendedForHotels: ['فنادق جبل عمر', 'هيلتون مكة', 'فنادق إبراهيم الخليل', 'الشبيكة'],
      descriptionAr: 'البوابة التاريخية الرئيسية في الجهة الشمالية الغربية باتجاه الشبيكة ومشروع جبل عمر (وبجواره مداخل 63–64).',
      howToReachHotelAr:
        'اخرج من باب العمرة (62) باتجاه ساحة الشبيكة ومدخل فنادق جبل عمر وشارع إبراهيم الخليل (5 دقائق مشياً).',
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
}
