export enum ZiyaratCity {
  MAKKAH = 'MAKKAH',
  MADINAH = 'MADINAH',
}

export interface ZiyaratSite {
  id: string;
  nameAr: string;
  nameEn: string;
  city: ZiyaratCity;
  virtueAr: string;
  sunnahEtiquette: string;
  bidahWarnings?: string;
  recommendedTimes?: string;
}

export class ZiyaratGuideCatalog {
  private sites: ZiyaratSite[] = [
    // Madinah Sites
    {
      id: 'MASJID_QUBA',
      nameAr: 'مسجد قباء',
      nameEn: 'Quba Mosque',
      city: ZiyaratCity.MADINAH,
      virtueAr:
        'أول مسجد أُسس على التقوى في الإسلام، وصلاة ركعتين فيه تعدل صلاة فيه أجر عمرة تامة بنص حديث رسول الله ﷺ: «مَنْ تَطَهَّرَ فِي بَيْتِهِ ثُمَّ أَتَى مَسْجِدَ قُبَاءٍ فَصَلَّى فِيهِ صَلَاةً كَانَ لَهُ كَأَجْرِ عُمْرَةٍ».',
      sunnahEtiquette:
        'يُسن التطهر والوضوء في الفندق قبل الخروج إليه، ثم صلاة ركعتين تحية المسجد أو نافلة، والإكثار من الدعاء.',
      recommendedTimes: 'كان النبي ﷺ يزوره كل سبت راكباً وماشياً، وأفضل أوقاته في الضحى.',
    },
    {
      id: 'MOUNT_UHUD',
      nameAr: 'جبل أحد ومقبرة شهداء أحد',
      nameEn: 'Mount Uhud & Martyrs Cemetery',
      city: ZiyaratCity.MADINAH,
      virtueAr:
        'جبل عظيم قال فيه النبي ﷺ: «أُحُدٌ جَبَلٌ يُحِبُّنَا وَنُحِبُّهُ»، وموقع معركة أحد المشهورة حيث دُفن سبعون صحابياً شهيداً.',
      sunnahEtiquette:
        'زيارة مقبرة الشهداء والسلام عليهم بالدعاء المأثور: «السَّلَامُ عَلَيْكُمْ أَهْلَ الدِّيَارِ مِنَ الْمُؤْمِنِينَ وَالْمُسْلِمِينَ...»، واستحضار تضحيات الصحابة الكرام وعلى رأسهم سيد الشهداء حمزة ومصعب بن عمير رضي الله عنهما.',
      bidahWarnings:
        'يجب الحذر من المخالفات: عدم التمسح بالأحجار أو تراب المقبرة، عدم الطواف حول القبور، وعدم دعاء الأموات أو رمي النقود في الشباك.',
      recommendedTimes: 'في الصباح الباكر أو قبل الغروب لتجنب أشعة الشمس الحارقة.',
    },
    {
      id: 'MASJID_QIBLATAYN',
      nameAr: 'مسجد القبلتين',
      nameEn: 'Al-Qiblatayn Mosque',
      city: ZiyaratCity.MADINAH,
      virtueAr:
        'المسجد التاريخي الذي نزل فيه الوحي بتحويل القبلة أثناء الصلاة من بيت المقدس إلى الكعبة المشرفة بمكة المكرمة استجابة لرغبة النبي ﷺ ﴿قَدْ نَرَى تَقَلُّبَ وَجْهِكَ فِي السَّمَاءِ فَلَنُوَلِّيَنَّكَ قِبْلَةً تَرْضَاهَا﴾.',
      sunnahEtiquette: 'صلاة ركعتين تحية المسجد، وتأمل هذا الحدث التاريخي العظيم في ترسيخ هوية الأمة.',
    },

    // Makkah Sites
    {
      id: 'JABAL_AL_NUR',
      nameAr: 'جبل النور وغار حراء',
      nameEn: 'Jabal al-Nur & Hira Cave',
      city: ZiyaratCity.MAKKAH,
      virtueAr:
        'المكان الذي كان يتحنث فيه رسول الله ﷺ قبل البعثة، وفيه نزل جبريل عليه السلام بأول آيات القرآن الكريم: ﴿اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ﴾.',
      sunnahEtiquette:
        'مشاهدة الجبل وتذكر بداية بزوغ نور الإسلام. الصعود للغار ليس نسكاً ولا سنة واجبة، ويحذر كبار السن وأصحاب أمراض القلب من صعوده لشدة وعورته.',
      bidahWarnings: 'تجنب الكتابة على صخور الجبل أو ترك القمامة أو الاعتقاد ببركة مادية في حجارة الغار.',
    },
    {
      id: 'JABAL_THAWR',
      nameAr: 'غار ثور (جبل ثور)',
      nameEn: 'Cave Thawr',
      city: ZiyaratCity.MAKKAH,
      virtueAr:
        'الغار الذي أوى إليه رسول الله ﷺ وصاحبه الصديق أبو بكر رضي الله عنه أثناء الهجرة النبوية الشريفة إلى المدينة، وفيه تجلت عناية الله ومعيته: ﴿إِذْ يَقُولُ لِصَاحِبِهِ لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا﴾.',
      sunnahEtiquette:
        'استحضار دروس الهجرة والتوكل على الله وبذل الأسباب وحب الصحابة للنبي ﷺ.',
      bidahWarnings: 'الصعود للغار شاق جداً وليس من مناسك العمرة، ويجب تجنب التبرك بالحجارة أو الصلاة بقصد الغار نفسه.',
    },
    {
      id: 'HOLY_SITES_MINA_ARAFAT',
      nameAr: 'المشاعر المقدسة (منى، مزدلفة، عرفات)',
      nameEn: 'Holy Shrines (Mina, Muzdalifah, Arafat)',
      city: ZiyaratCity.MAKKAH,
      virtueAr:
        'أرض المناسك الكبرى، وفيها جبل الرحمة ومسجد نمرة بعرفات، ومسجد الخيف بمنى، وجمرات العقبة.',
      sunnahEtiquette:
        'المرور بها للعبرة والاطلاع على أماكن الحج، والتضرع بالدعاء أن يرزق الله المعتمر حجاً مبروراً.',
    },
  ];

  getAllSites(): ZiyaratSite[] {
    return this.sites;
  }

  getSitesByCity(city: ZiyaratCity): ZiyaratSite[] {
    return this.sites.filter((s) => s.city === city);
  }

  getSiteById(id: string): ZiyaratSite | undefined {
    return this.sites.find((s) => s.id === id);
  }
}
