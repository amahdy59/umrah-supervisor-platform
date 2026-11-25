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
  imageUrl?: string;
  imageAltAr?: string;
}

export class ZiyaratGuideCatalog {
  private sites: ZiyaratSite[] = [
    // Madinah Sites
    {
      id: 'MASJID_QUBA',
      nameAr: 'مسجد قباء',
      nameEn: 'Quba Mosque',
      city: ZiyaratCity.MADINAH,
      imageUrl: '/images/madinah/quba-mosque.jpg',
      imageAltAr: 'صورة حقيقية لمسجد قباء بالمدينة المنورة بقبابه البيضاء ومآذنه',
      virtueAr:
        'أول مسجد أُسس على التقوى في الإسلام، وصلاة ركعتين فيه تعدل أجر عمرة تامة بنص حديث رسول الله ﷺ: «مَنْ تَطَهَّرَ فِي بَيْتِهِ ثُمَّ أَتَى مَسْجِدَ قُبَاءٍ فَصَلَّى فِيهِ صَلَاةً كَانَ لَهُ كَأَجْرِ عُمْرَةٍ» (رواه ابن ماجه وصححه الألباني).',
      sunnahEtiquette:
        'يُسن التطهر والوضوء في الفندق قبل الخروج إليه، ثم صلاة ركعتين تحية المسجد أو نافلة، والإكثار من الدعاء. ويمكن المشي إليه عبر ممشى درب السنة (~3 كم) من المسجد النبوي.',
      recommendedTimes: 'كان النبي ﷺ يزوره كل سبت راكباً وماشياً، وأفضل أوقاته في الضحى.',
    },
    {
      id: 'MOUNT_UHUD',
      nameAr: 'جبل أحد ومقبرة شهداء أحد',
      nameEn: 'Mount Uhud & Martyrs Cemetery',
      city: ZiyaratCity.MADINAH,
      imageUrl: '/images/madinah/mount-uhud.jpg',
      imageAltAr: 'صورة حقيقية لجبل أحد وساحة شهداء أحد بالمدينة المنورة',
      virtueAr:
        'جبل عظيم قال فيه النبي ﷺ: «أُحُدٌ جَبَلٌ يُحِبُّنَا وَنُحِبُّهُ» (متفق عليه)، وموقع معركة أحد المشهورة حيث دُفن سبعون صحابياً شهيداً وعلى رأسهم حمزة بن عبد المطلب ومصعب بن عمير رضي الله عنهما.',
      sunnahEtiquette:
        'زيارة مقبرة الشهداء (للرجال) والسلام عليهم بالدعاء المأثور: «السَّلَامُ عَلَيْكُمْ أَهْلَ الدِّيَارِ مِنَ الْمُؤْمِنِينَ وَالْمُسْلِمِينَ، وَإِنَّا إِنْ شَاءَ اللَّهُ بِكُمْ لَلَاحِقُونَ، نَسْأَلُ اللَّهَ لَنَا وَلَكُمُ الْعَافِيَةَ» (رواه مسلم).',
      bidahWarnings:
        'يجب الحذر من المخالفات: عدم التمسح بالأحجار أو تراب المقبرة، عدم الطواف حول القبور، وعدم دعاء الأموات أو رمي النقود في الشباك.',
      recommendedTimes: 'في الصباح الباكر أو قبل الغروب لتجنب أشعة الشمس الحارقة.',
    },
    {
      id: 'MASJID_QIBLATAYN',
      nameAr: 'مسجد القبلتين',
      nameEn: 'Al-Qiblatayn Mosque',
      city: ZiyaratCity.MADINAH,
      imageUrl: '/images/madinah/qiblatayn-mosque.jpg',
      imageAltAr: 'صورة حقيقية لمسجد القبلتين بالمدينة المنورة',
      virtueAr:
        'المسجد التاريخي الذي نزل فيه الوحي بتحويل القبلة أثناء الصلاة من بيت المقدس إلى الكعبة المشرفة بمكة المكرمة استجابة لرغبة النبي ﷺ: ﴿قَدْ نَرَى تَقَلُّبَ وَجْهِكَ فِي السَّمَاءِ فَلَنُوَلِّيَنَّكَ قِبْلَةً تَرْضَاهَا﴾ (البقرة: 144).',
      sunnahEtiquette: 'صلاة ركعتين تحية المسجد، وتأمل هذا الحدث التاريخي العظيم في ترسيخ هوية الأمة والسمع والطاعة.',
    },
    {
      id: 'AL_BAQI_CEMETERY',
      nameAr: 'بقيع الغرقد (مقبرة أهل المدينة)',
      nameEn: 'Al-Baqi Cemetery',
      city: ZiyaratCity.MADINAH,
      imageUrl: '/images/madinah/baqi-cemetery.jpg',
      imageAltAr: 'صورة حقيقية لبقيع الغرقد الملاصق للساحة الشرقية للمسجد النبوي',
      virtueAr:
        'مقبرة الصحابة والتابعين وأمهات المؤمنين وبنات النبي ﷺ الملاصقة للجهة الشرقية من المسجد النبوي الشريف، وكان النبي ﷺ يخرج إلى أهلها ويدعو لهم بالمغفرة.',
      sunnahEtiquette:
        'الوقوف خارج الأسوار أو عند الدخول للرجال السلام بالسنة: «السَّلَامُ عَلَيْكُمْ دَارَ قَوْمٍ مُؤْمِنِينَ وَإِنَّا إِنْ شَاءَ اللَّهُ بِكُمْ لَاحِقُونَ» والدعاء لهم بالمغفرة والرحمة.',
      bidahWarnings: 'عدم التمسح بالأسوار أو الدعاء عند القبور بطلب الحاجات من أهلها، فالزيارة للاتعاظ والدعاء للأموات.',
      recommendedTimes: 'يُفتح للرجال غالباً بعد صلاتي الفجر والعصر.',
    },

    // Makkah Sites
    {
      id: 'JABAL_AL_NUR',
      nameAr: 'جبل النور وغار حراء (وحي حراء الثقافي)',
      nameEn: 'Jabal al-Nur & Hira Cave',
      city: ZiyaratCity.MAKKAH,
      imageUrl: '/images/makkah/jabal-al-nour.jpg',
      imageAltAr: 'صورة حقيقية لجبل النور بمكة المكرمة حيث يقع غار حراء',
      virtueAr:
        'المكان الذي كان يتحنث فيه رسول الله ﷺ قبل البعثة، وفيه نزل جبريل عليه السلام بأول آيات القرآن الكريم: ﴿اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ﴾ (العلق: 1).',
      sunnahEtiquette:
        'مشاهدة الجبل وزيارة حي حراء الثقافي للتعرف على قصة الوحي. الصعود للغار ليس نسكاً ولا سنة واجبة، ويُحذّر كبار السن وأصحاب أمراض القلب من صعوده لشدة وعورته.',
      bidahWarnings: 'تجنب الكتابة على صخور الجبل أو ترك القمامة أو الاعتقاد ببركة مادية في حجارة الغار أو الصلاة بقصد التبرك بالمكان.',
    },
    {
      id: 'JABAL_THAWR',
      nameAr: 'غار ثور (جبل ثور)',
      nameEn: 'Cave Thawr',
      city: ZiyaratCity.MAKKAH,
      imageUrl: '/images/makkah/jabal-thawr.jpg',
      imageAltAr: 'صورة حقيقية لجبل ثور التاريخي في مكة المكرمة',
      virtueAr:
        'الغار الذي أوى إليه رسول الله ﷺ وصاحبه الصديق أبو بكر رضي الله عنه أثناء الهجرة النبوية الشريفة إلى المدينة، وفيه تجلت عناية الله ومعيته: ﴿إِذْ يَقُولُ لِصَاحِبِهِ لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا﴾ (التوبة: 40).',
      sunnahEtiquette:
        'استحضار دروس الهجرة والتوكل على الله وبذل الأسباب وحب الصحابة للنبي ﷺ.',
      bidahWarnings: 'الصعود للغار شاق جداً وليس من مناسك العمرة، ويجب تجنب التبرك بالحجارة أو الصلاة بقصد الغار نفسه.',
    },
    {
      id: 'HOLY_SITES_MINA_ARAFAT',
      nameAr: 'المشاعر المقدسة (منى، مزدلفة، عرفات)',
      nameEn: 'Holy Shrines (Mina, Muzdalifah, Arafat)',
      city: ZiyaratCity.MAKKAH,
      imageUrl: '/images/makkah/jabal-arafat.jpg',
      imageAltAr: 'صورة حقيقية لجبل الرحمة بصعيد عرفات الطاهر في مكة المكرمة',
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
