/**
 * Haram Gates & Hotel Wayfinder Guide
 * Directs pilgrims through the best Haram gates to return safely to their hotel area.
 */

export interface HaramGate {
  gateNumber: number;
  nameAr: string;
  direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  nearestAreaAr: string;
  recommendedForHotels: string[];
  descriptionAr: string;
}

export class HaramGatesGuide {
  private gates: HaramGate[] = [
    {
      gateNumber: 79,
      nameAr: 'باب الملك فهد',
      direction: 'WEST',
      nearestAreaAr: 'جرول / التيسير / الشبيكة',
      recommendedForHotels: ['أبراج الكسوة', 'جرول', 'التيسير', 'دار التوحيد'],
      descriptionAr: 'البوابة الأقرب والأسهل لمعتمري فنادق جرول والتيسير (ومنها أبراج الكسوة) وتجنب زحام أجياد.',
    },
    {
      gateNumber: 100,
      nameAr: 'بوابات توسعة الملك عبد الله (الشمالية)',
      direction: 'NORTH',
      nearestAreaAr: 'جرول / الغزة / السليمانية',
      recommendedForHotels: ['أبراج الكسوة', 'فنادق الدائري الأول', 'الغزة'],
      descriptionAr: 'بوابات فسيحة ومكيفة جداً، تخرجك مباشرة للساحات الشمالية باتجاه أنفاق جرول.',
    },
    {
      gateNumber: 1,
      nameAr: 'باب الملك عبد العزيز',
      direction: 'SOUTH',
      nearestAreaAr: 'أجياد / أبراج البيت (الساعة)',
      recommendedForHotels: ['أبراج البيت', 'وقف الملك عبد العزيز', 'فنادق شارع أجياد'],
      descriptionAr: 'المدخل والمخرج الرئيسي لمنطقة أجياد ووقف الملك عبد العزيز.',
    },
    {
      gateNumber: 64,
      nameAr: 'باب الفتح',
      direction: 'EAST',
      nearestAreaAr: 'شعب علي / المروة / الغزة',
      recommendedForHotels: ['فنادق الغزة', 'فنادق ريع بخش'],
      descriptionAr: 'يقع مباشرة خلف جبل المروة، مثالي للخروج بعد إتمام الشوط السابع من السعي.',
    },
    {
      gateNumber: 45,
      nameAr: 'باب العمرة',
      direction: 'WEST',
      nearestAreaAr: 'الشبيكة / جبل عمر',
      recommendedForHotels: ['فنادق جبل عمر', 'هيلتون مكة', 'فنادق إبراهيم الخليل'],
      descriptionAr: 'المنفذ الرئيسي باتجاه شارع إبراهيم الخليل وفنادق مشروع جبل عمر.',
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
