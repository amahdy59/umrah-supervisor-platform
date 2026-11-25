/**
 * Comprehensive Makkah & Madinah Haramain Atlas:
 * - Sacred Kaaba core zones (Door, Multazam, Maqam Ibrahim, Hijr Ismail, Black Stone, Safa-Marwah)
 * - Major Masjid al-Haram & Masjid an-Nabawi gates (real gate numbers, directions, hotel links)
 * - Free Services, Facilities & Spiritual Benefits available inside Al-Haramain
 */

export type HaramCity = 'MAKKAH' | 'MADINAH';

export type HaramFeatureCategory =
  | 'KAABA_CORE'
  | 'MAKKAH_GATE'
  | 'MAKKAH_FACILITY'
  | 'MADINAH_GATE'
  | 'MADINAH_FACILITY';

export type BenefitCategoryAr =
  | 'خدمة مجانية'
  | 'تسهيلات لكبار السن'
  | 'فضائل ومنافع شرعية'
  | 'تنظيم وأمان';

export interface HaramLandmarkGateItem {
  id: string;
  city: HaramCity;
  category: HaramFeatureCategory;
  gateNumber?: number;
  nameAr: string;
  nameEn: string;
  directionAr: string;
  areaOrLandmarkAr: string;
  imageUrl: string;
  imageAltAr: string;
  summaryAr: string;
  benefitsAndServicesAr: string[];
  hotelAccessNoteAr?: string;
}

export interface HaramServiceBenefit {
  id: string;
  city: HaramCity | 'BOTH';
  titleAr: string;
  categoryAr: BenefitCategoryAr;
  whereToFindAr: string;
  howToBenefitAr: string;
  imageUrl?: string;
  imageAltAr?: string;
}

export class HaramainAtlasCatalog {
  private items: HaramLandmarkGateItem[] = [
    // ==================== KAABA & INNER HARAM CORE ====================
    {
      id: 'KAABA_DOOR_MULTAZAM',
      city: 'MAKKAH',
      category: 'KAABA_CORE',
      nameAr: 'باب الكعبة المشرفة والملتزم ومقام إبراهيم',
      nameEn: 'Door of the Kaaba, Al-Multazam & Maqam Ibrahim',
      directionAr: 'الجهة الشرقية للكعبة المشرفة',
      areaOrLandmarkAr: 'صحن المطاف أمام مقام إبراهيم عليه السلام',
      imageUrl: '/images/makkah/kaaba-door.jpg',
      imageAltAr: 'صورة حقيقية لباب الكعبة المشرفة المذهب وكسوة الكعبة وأمامه مقام إبراهيم عليه السلام',
      summaryAr:
        'باب الكعبة المذهب يقع في الجدار الشرقي للكعبة المشرفة، وبين الحجر الأسود وباب الكعبة يوجد «الملتزم» الذي يُستحب عنده الدعاء إذا تيسر دون مزاحمة، وأمامهما «مقام إبراهيم» حيث يُصلى ركعتا سنة الطواف.',
      benefitsAndServicesAr: [
        'الوقوف للدعاء بعد الطواف خلف مقام إبراهيم ولو بعيداً في الصحن أو الأدوار العليا تجنباً للازدحام.',
        'مياه زمزم المبردة قريبة في أطراف صحن المطاف وبعد صلاة الركعتين مباشرة.',
        'الإمامة ومكبرات الصوت واللوحات الإرشادية المضيئة لبداية الشوط عند الحجر الأسود.',
      ],
    },
    {
      id: 'KAABA_COURTYARD_HIJR',
      city: 'MAKKAH',
      category: 'KAABA_CORE',
      nameAr: 'صحن المطاف وحِجر إسماعيل (الحطيم) والركن اليماني',
      nameEn: 'Mataf Courtyard, Hijr Ismail & Yamani Corner',
      directionAr: 'مركز المسجد الحرام حول الكعبة',
      areaOrLandmarkAr: 'المطاف الأرضي والأدوار العلوية',
      imageUrl: '/images/makkah/kaaba-courtyard.jpg',
      imageAltAr: 'صورة شاملة للكعبة المشرفة وحِجر إسماعيل وصحن المطاف والمعتمرين',
      summaryAr:
        'الحِجر (الحطيم) جزء من أصل بناء الكعبة؛ لذا يجب أن يكون الطواف من خارجه بجميع الجسد، ومن دخله أثناء الطواف لم يُحتسب شوطه. وبين الركن اليماني والحجر الأسود يُقال: ﴿رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ﴾.',
      benefitsAndServicesAr: [
        'المطاف الأرضي مخصص غالباً للمحرمين بلباس الإحرام، وللعجزة والمنفردين أدوار مظللة ومكيفة.',
        'مراقبة الحشود وتدخل الهلال الأحمر السريع عند أي إعياء داخل صحن المطاف.',
        'كراسي متحركة مجانية وعربات كهربائية مخصصة في الدور الأول والثاني.',
      ],
    },
    {
      id: 'SAFA_MARWAH_MASA',
      city: 'MAKKAH',
      category: 'MAKKAH_FACILITY',
      nameAr: 'المسعى بين الصفا والمروة (الأدوار المكيفة)',
      nameEn: 'Al-Masaa (Safa & Marwah Gallery)',
      directionAr: 'الجهة الشرقية من المسجد الحرام',
      areaOrLandmarkAr: 'بداية السعي من الصفا والانتهاء عند المروة',
      imageUrl: '/images/makkah/safa-marwah-masa.jpg',
      imageAltAr: 'صورة داخلية لممر المسعى المكيف بين الصفا والمروة والأنوار الخضراء',
      summaryAr:
        'يمتد المسعى عبر عدة أدوار مكيفة ومزودة بسلالم كهربائية ومصاعد، وتوضح الإضاءة الخضراء في السقف مسافة الهرولة المسنونة للرجال فقط، بينما تمشي النساء بسكينة في جميع الأشواط.',
      benefitsAndServicesAr: [
        'مسار معزول وآمن لعربات كبار السن والكراسي الكهربائية في الأدوار المخصصة.',
        'مبردات مياه زمزم ودورات استراحة ومقاعد موزعة على امتداد جانبي المسعى.',
        'مخارج سريعة بعد الشوط السابع عند جبل المروة نحو الغزة (بوابة 45) والتوسعة الشمالية.',
      ],
    },

    // ==================== MAKKAH HARAM GATES ====================
    {
      id: 'GATE_KING_ABDULAZIZ_1',
      city: 'MAKKAH',
      category: 'MAKKAH_GATE',
      gateNumber: 1,
      nameAr: 'باب الملك عبد العزيز (بوابة 1)',
      nameEn: 'King Abdulaziz Gate (Gate 1)',
      directionAr: 'الجهة الجنوبية (مقابل برج الساعة)',
      areaOrLandmarkAr: 'أجياد / مجمع وقف الملك عبد العزيز',
      imageUrl: '/images/makkah/gate-abdulaziz.jpg',
      imageAltAr: 'صورة لبوابة الملك عبد العزيز ومئذنتيها الشامختين في الساحة الجنوبية للمسجد الحرام',
      summaryAr:
        'أشهر البوابات الجنوبية وأكبرها في الساحة المقابلة لبرج الساعة (وقف الملك عبد العزيز)، ومنها وصول مباشر نحو صحن المطاف ومصليات الدور الأرضي والأول.',
      benefitsAndServicesAr: [
        'توافر محطات استلام الكراسي المتحركة المجانية في الساحة الجنوبية.',
        'سلالم كهربائية ومصاعد قريبة تصعد بك إلى أدوار المطاف المكيفة والسطح.',
        'مراكز إرشاد التائهين وعيادة إسعافية مجهزة عند مداخل الساحة الجنوبية.',
      ],
      hotelAccessNoteAr: 'الأقرب لفنادق وقف الملك عبد العزيز (برج الساعة) وشارع أجياد العام (دقيقتان مشياً).',
    },
    {
      id: 'GATE_KING_FAHD_79',
      city: 'MAKKAH',
      category: 'MAKKAH_GATE',
      gateNumber: 79,
      nameAr: 'باب الملك فهد (بوابة 79)',
      nameEn: 'King Fahd Gate (Gate 79)',
      directionAr: 'الجهة الغربية (جبل عمر / التيسير)',
      areaOrLandmarkAr: 'الساحات الغربية وأنفاق جرول والتيسير',
      imageUrl: '/images/makkah/gate-fahd.jpg',
      imageAltAr: 'صورة لباب الملك فهد ومئذنتيه في التوسعة الغربية للمسجد الحرام',
      summaryAr:
        'المدخل الغربي المهيب بتوسعة الملك فهد، يمتاز بسلالمه الكهربائية السريعة نحو الدور الأول والسطح وتوسعة الصحن الغربية بعيداً عن زحام أجياد.',
      benefitsAndServicesAr: [
        'محطة حافلات النقل الترددي المجاني وساحات واسعة مظللة للانتظار والتجمع.',
        'أمانات حقائب وأحذية منظمة ومواضئ قريبة تحت الساحات الغربية.',
        'توزيع كراسي متحركة مجانية عند المدخل الغربي لكبار السن.',
      ],
      hotelAccessNoteAr: 'المخرج المثالي لنزلاء أبراج الكسوة وجرول والتيسير ودار التوحيد (عبر أنفاق جرول أو الحافلات).',
    },
    {
      id: 'GATE_KING_ABDULLAH_100',
      city: 'MAKKAH',
      category: 'MAKKAH_GATE',
      gateNumber: 100,
      nameAr: 'بوابة الملك عبد الله (التوسعة الشمالية - 100)',
      nameEn: 'King Abdullah Expansion Gate (Gate 100)',
      directionAr: 'الجهة الشمالية (التوسعة السعودية الثالثة)',
      areaOrLandmarkAr: 'الساحات الشمالية / الغزة / جرول',
      imageUrl: '/images/makkah/king-abdullah-gate.jpg',
      imageAltAr: 'صورة لبوابة التوسعة الشمالية الكبرى للمسجد الحرام وساحاتها الرخامية الواسعة',
      summaryAr:
        'أضخم مداخل التوسعة السعودية الثالثة من الجهة الشمالية؛ تتميز بمساحات صلاة ضخمة فائقة التبريد وهدوء نسبي وإمكانية الوصول السهل للحافلات.',
      benefitsAndServicesAr: [
        'تكييف مركزي فائق البرودة وساحات صلاة مكيفة بالكامل ومراوح رذاذ خارجية.',
        'خزائن أمانات للأمتعة والحقائب مجانية خارج الساحات ومرافق دورات مياه حديثة.',
        'مكاتب إفتاء وتوزيع مصاحف مجانية ومراكز إسعاف ومصاعد عالية السعة.',
      ],
      hotelAccessNoteAr: 'الأفضل لحافلات أفواج التيسير والغزة والدائري الأول لتلافي اختناقات الجنوب.',
    },
    {
      id: 'GATE_UMRAH_62',
      city: 'MAKKAH',
      category: 'MAKKAH_GATE',
      gateNumber: 62,
      nameAr: 'باب العمرة (بوابة 62)',
      nameEn: 'Bab Al-Umrah (Gate 62)',
      directionAr: 'الجهة الشمالية الغربية',
      areaOrLandmarkAr: 'الشبيكة / جبل عمر / شارع إبراهيم الخليل',
      imageUrl: '/images/makkah/bab-al-umrah.jpg',
      imageAltAr: 'صورة لمدخل باب العمرة التاريخي بأقواسه الرخامية وأبوابه المزخرفة',
      summaryAr:
        'بوابة تاريخية في الجهة الشمالية الغربية تقود مباشرة إلى المطاف وهي أقرب المداخل لضيوف فنادق جبل عمر وهيلتون ومنطقة الشبيكة.',
      benefitsAndServicesAr: [
        'نقطة انطلاق رئيسية لمكاتب عربات كبار السن (اليدوية والكهربائية).',
        'قربها الشديد من حجر إسماعيل والركن الشامي واليماني داخل المطاف.',
        'وجود دورات مياه ومواضئ مجهزة لذوي الهمم في ساحة الشبيكة الملاصقة.',
      ],
      hotelAccessNoteAr: 'الأقرب لفنادق جبل عمر وهيلتون وشارع إبراهيم الخليل (5 دقائق مشياً).',
    },
    {
      id: 'GATE_AL_FATH_45',
      city: 'MAKKAH',
      category: 'MAKKAH_GATE',
      gateNumber: 45,
      nameAr: 'باب الفتح وباب السلام ومخارج المروة (بوابة 45)',
      nameEn: 'Bab Al-Fath & Marwah Exits (Gate 45)',
      directionAr: 'الجهة الشمالية الشرقية',
      areaOrLandmarkAr: 'ساحة الغزة / المروة / شعب علي',
      imageUrl: '/images/makkah/gate-main-entrance.jpg',
      imageAltAr: 'صورة لواجهة ومدخل رئيسي في الجهة الشرقية الشمالية للمسجد الحرام بمكة',
      summaryAr:
        'مخرج مباشر في محيط جبل المروة وباب الفتح، يستخدمه المعتمرون فور الانتهاء من الشوط السابع للسعي والتحلل من الإحرام.',
      benefitsAndServicesAr: [
        'وصول مباشر إلى محطة الحلاقة النظامية والمغاسل في ساحة المروة والغزة.',
        'نقطة التقاء مثالية لأفواج العمرة بعد إنهاء السعي بالكامل.',
        'توفر مياه زمزم وممرات مظللة نحو مواقف باصات الغزة وريع بخش.',
      ],
      hotelAccessNoteAr: 'مناسب لنزلاء فنادق الغزة وريع بخش وشعب عامر.',
    },

    // ==================== MADINAH PROPHETIC MOSQUE GATES & ZONES ====================
    {
      id: 'NABAWI_BAB_SALAM_1',
      city: 'MADINAH',
      category: 'MADINAH_GATE',
      gateNumber: 1,
      nameAr: 'باب السلام بالمسجد النبوي (بوابة 1)',
      nameEn: 'Bab Al-Salam - Prophet Mosque (Gate 1)',
      directionAr: 'الجهة الجنوبية الغربية (جهة السلام على النبي ﷺ)',
      areaOrLandmarkAr: 'الممر المؤدي للروضة والحجرة النبوية الشريفة',
      imageUrl: '/images/madinah/nabawi-bab-salam.jpg',
      imageAltAr: 'صورة حقيقية لباب السلام المزخرف بالنحاس والذهب في المسجد النبوي بالمدينة المنورة',
      summaryAr:
        'المدخل التاريخي والأشهر لدخول الرجال للسلام بأدب وسكينة وخفض صوت على رسول الله ﷺ وصاحبيه أبي بكر وعمر رضي الله عنهما.',
      benefitsAndServicesAr: [
        'مسار منظم هادئ يراعي الوقار ويمنع التزاحم أمام الحجرة الشريفة.',
        'وجود مرشدين شرعيين ومراقبين لمساعدة كبار السن على الكراسي المتحركة.',
        'انتهاء المسار إلى الخروج باتجاه بقيع الغرقد وساحة المظلات الشرقية.',
      ],
      hotelAccessNoteAr: 'قريب من فنادق المنطقة المركزية الجنوبية والغربية.',
    },
    {
      id: 'NABAWI_RAWDAH_GREEN_DOME',
      city: 'MADINAH',
      category: 'MADINAH_FACILITY',
      nameAr: 'الروضة الشريفة والقبة الخضراء',
      nameEn: 'Ar-Rawdah Ash-Sharifah & The Green Dome',
      directionAr: 'قلب المسجد النبوي الشريف بين الحجرة والمنبر',
      areaOrLandmarkAr: 'الدخول المنظم بتصريح نُسك (عبر الساحات الجنوبية/الشرقية)',
      imageUrl: '/images/madinah/nabawi-rawdah.jpg',
      imageAltAr: 'صورة للقبة الخضراء ومبنى المسجد النبوي الشريف جهة الروضة الشريفة بالمدينة المنورة',
      summaryAr:
        'قال رسول الله ﷺ: «مَا بَيْنَ بَيْتِي وَمِنْبَرِي رَوْضَةٌ مِنْ رِيَاضِ الْجَنَّةِ» (متفق عليه). يتم تنظيم الدخول إليها بتصاريح تطبيق «نُسك» لضمان طمأنينة الصلاة فيها.',
      benefitsAndServicesAr: [
        'تفعل خيار «المسار الفوري» في تطبيق نُسك عند وجودك داخل ساحات الحرم المدني وتفعيل GPS.',
        'تخصص فترات مستقلة للرجال وأخرى للنساء لضمان الخصوصية والخشوع.',
        'إمكانية تأدية ركعتين بخشوع والدعاء عند التيسر دون إطالة تضر بالمنتظرين.',
      ],
    },
    {
      id: 'NABAWI_BAB_UTHMAN_25',
      city: 'MADINAH',
      category: 'MADINAH_GATE',
      gateNumber: 25,
      nameAr: 'باب عثمان بن عفان وبوابات المصليات النسائية (بوابة 25)',
      nameEn: 'Bab Uthman ibn Affan & Women Access Plaza (Gate 25)',
      directionAr: 'الجهة الشمالية والشرقية للمسجد النبوي',
      areaOrLandmarkAr: 'تجمع مصليات النساء وتنظيم دخول الروضة النسائي',
      imageUrl: '/images/madinah/nabawi-bab-uthman-25.jpg',
      imageAltAr: 'صورة لساحة المسجد النبوي وبوابة عثمان بن عفان رقم 25 مع المظلات البيضاء',
      summaryAr:
        'نقطة التوجيه الرئيسية لدخول مصليات النساء وتنسيق أفواج الأخوات الحاملات لتصاريح الروضة الشريفة عبر تطبيق «نُسك» (مع بوابات 24–26 و32/37).',
      benefitsAndServicesAr: [
        'أماكن انتظار نسائية مظللة ومكيفة ومزودة بفرز وتنظيم مباشر قبل الدخول.',
        'عربات وكراسي مجانية لكبيرات السن من مدخل الساحة حتى الروضة والمصلى.',
        'حلقات نسائية لتصحيح تلاوة الفاتحة والقرآن ومكاتب فتوى نسائية مخصصة.',
      ],
      hotelAccessNoteAr: 'مثالية لنزلاء فنادق المنطقة المركزية الشمالية (بجوار بوابة الملك فهد 21 وعثمان 25).',
    },
    {
      id: 'NABAWI_COURTYARD_UMBRELLAS',
      city: 'MADINAH',
      category: 'MADINAH_FACILITY',
      nameAr: 'ساحات المظلات العملاقة ومراوح الرذاذ (وباب البقيع)',
      nameEn: 'Shading Canopy Courtyards & Al-Baqi Plaza',
      directionAr: 'الساحات المحيطة بالمسجد النبوي وباب البقيع شرقاً',
      areaOrLandmarkAr: '250 مظلة عملاقة + دورات المياه تحت الأرض + بوابة 36/41 للبقيع',
      imageUrl: '/images/madinah/nabawi-umbrellas.jpg',
      imageAltAr: 'صورة للمصلين تحت المظلات العملاقة المبردة في ساحات المسجد النبوي الشريف بالمدينة المنورة',
      summaryAr:
        'تضم الساحات 250 مظلة ذكية مزودة بمراوح رذاذ تبرد الأجواء صيفاً، وأبراج مداخل سلالم كهربائية تنزل مباشرة لمواضئ ودورات مياه واسعة ومواقف سيارات تحت الأرض.',
      benefitsAndServicesAr: [
        'مجمعات مياه زمزم الباردة المنتشرة على طول الساحات المظللة وداخل أروقة المسجد.',
        'الوصول إلى زيارة بقيع الغرقد عبر البوابة الشرقية في أوقات الفتح بعد الفجر والعصر.',
        'عربات جولف كهربائية لنقل كبار السن بين الفنادق وأطراف الساحة النبوية مجاناً أو بتعرفة رمزية.',
      ],
    },
  ];

  private benefits: HaramServiceBenefit[] = [
    {
      id: 'ZAMZAM_STATIONS',
      city: 'BOTH',
      titleAr: 'سقيا مياه زمزم المباركة (مبردة وغير مبردة) في كل الأدوار',
      categoryAr: 'خدمة مجانية',
      whereToFindAr: 'موزعة عند كل بوابة، وأطراف صحن المطاف، والمسعى، وساحات المسجد النبوي',
      howToBenefitAr:
        'اشرب من ماء زمزم وتضلع منه بنية صالحة (شفاءً وعلماً ورزقاً)، وتُستخدم الحافظات ذات اللون الخشبي للماء غير المبرد لكبار السن وأصحاب الحساسية.',
      imageUrl: '/images/makkah/zamzam-stations.jpg',
      imageAltAr: 'صورة لحافظات مياه زمزم المبردة داخل المسجد الحرام مع الأكواب الورقية النظيفة',
    },
    {
      id: 'WHEELCHAIRS_AND_CARTS',
      city: 'BOTH',
      titleAr: 'العربات اليدوية المجانية وعربات الغولف الكهربائية (نُسك)',
      categoryAr: 'تسهيلات لكبار السن',
      whereToFindAr: 'مداخل الملك عبد العزيز (1)، العمرة (62)، الملك فهد (79)، المروة، وساحات النبوي',
      howToBenefitAr:
        'احجز العربة الكهربائية رسمياً من تطبيق «نُسك» أو اطلب عربة يدوية مجانية بالهوية/الإقامة من نقاط التسليم الرسمية داخل الحرم لتجنب الاستغلال.',
    },
    {
      id: 'QURAN_AND_IFTA',
      city: 'BOTH',
      titleAr: 'حلقات تصحيح التلاوة ومكاتب الإفتاء والترجمة الفورية',
      categoryAr: 'فضائل ومنافع شرعية',
      whereToFindAr: 'دواليب المصاحف بكل عامود + مكاتب شؤون التوجيه والإفتاء حول المطاف والروضة',
      howToBenefitAr:
        'لا تغادر الحرمين قبل اغتنام حلقات تصحيح سورة الفاتحة وقصار السور المجانية على يد مقرئين مجازين، ومراجعة المفتين المعتمدين في أي مسألة طارئة.',
    },
    {
      id: 'PRAYER_MULTIPLICATION',
      city: 'BOTH',
      titleAr: 'تضاعف أجر الصلوات الخمس والنافلة وصلاة الجنازة',
      categoryAr: 'فضائل ومنافع شرعية',
      whereToFindAr: 'أي بقعة داخل حدود المسجد الحرام (100 ألف صلاة) والمسجد النبوي (1,000 صلاة)',
      howToBenefitAr:
        'لا تقتصر بركة المضاعفة على صحن الكعبة فقط بل تشمل كل توسعات المسجد الحرام؛ واحرص على متابعة صلاة الجنازة بعد الفرائض فلكل صلاة قيراط مثل جبل أحد.',
    },
    {
      id: 'LOCKERS_LOST_MEDICAL',
      city: 'BOTH',
      titleAr: 'أمانات الأمتعة، مراكز المفقودات، وعيادات الهلال الأحمر (24/7)',
      categoryAr: 'تنظيم وأمان',
      whereToFindAr: 'الساحات الخارجية (خصوصاً التوسعة الشمالية 100 وأجياد وباب السلام بالمدينة)',
      howToBenefitAr:
        'تمنع الأنظمة إدخال الحقائب الكبيرة لصحن المطاف والروضة؛ أودعها بأمانات الساحات مجاناً، وتوجه لأقرب نقطة إسعافية عند أي دوار أو هبوط سكر فوراً وبلا مقابل.',
    },
    {
      id: 'ELEVATORS_AC_BASEMENTS',
      city: 'BOTH',
      titleAr: 'المواضئ تحت الأرض والسلالم الكهربائية والتكييف الذكي',
      categoryAr: 'تسهيلات لكبار السن',
      whereToFindAr: 'تحت ساحات الحرمين بمكة والمدينة ومصاعد الأدوار العليا',
      howToBenefitAr:
        'تُجنبك الأدوار المكيفة العليا والسطح ليلاً الزحام وتمنحك طوافاً هادئاً وكراسي متوفرة، كما توفر المواضئ السفلية كراسي وضوء خاصة لكبار السن.',
    },
  ];

  getAllLandmarksAndGates(): HaramLandmarkGateItem[] {
    return [...this.items];
  }

  getByCity(city: HaramCity): HaramLandmarkGateItem[] {
    return this.items.filter((i) => i.city === city);
  }

  getByCategory(category: HaramFeatureCategory): HaramLandmarkGateItem[] {
    return this.items.filter((i) => i.category === category);
  }

  getById(id: string): HaramLandmarkGateItem | undefined {
    return this.items.find((i) => i.id === id);
  }

  getAllBenefits(city?: HaramCity): HaramServiceBenefit[] {
    if (!city) return [...this.benefits];
    return this.benefits.filter((b) => b.city === 'BOTH' || b.city === city);
  }
}
