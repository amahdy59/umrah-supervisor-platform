export enum TawafLocation {
  BLACK_STONE = 'BLACK_STONE', // الحجر الأسود
  RUKN_YAMANI = 'RUKN_YAMANI', // الركن اليماني
  MAQAM_IBRAHIM = 'MAQAM_IBRAHIM', // مقام إبراهيم
  HATIM = 'HATIM', // حجر إسماعيل
}

export enum SaiLocation {
  SAFA = 'SAFA', // الصفا
  MARWA = 'MARWA', // المروة
}

export interface LapResult {
  nextLap: number;
  hapticFeedbackPattern: 'VIBRATE_LAP' | 'VIBRATE_COMPLETE';
  nextActionPrompt?: string;
}

export class TawafCounter {
  private _currentLap: number = 1;
  private _isCompleted: boolean = false;

  private static readonly LAP_DUAS: Record<number, { arabic: string; transliteration: string; meaningEn: string }> = {
    1: {
      arabic: 'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ، اللَّهُمَّ إِيمَانًا بِكَ وَتَصْدِيقًا بِكِتَابِكَ وَوَفَاءً بِعَهْدِكَ وَاتِّبَاعًا لِسُنَّةِ نَبِيِّكَ مُحَمَّدٍ ﷺ.',
      transliteration: "Bismillahi Allahu Akbar, Allahumma imanan bika wa tasdiqan bikitabik wa wafa'an bi'ahdika wattiba'an lisunnati Nabiyyika Muhammad ﷺ.",
      meaningEn: 'In the name of Allah, Allah is the greatest. O Allah, out of faith in You, belief in Your Book, fulfilling Your covenant, and following the Sunnah of Your Prophet Muhammad ﷺ.',
    },
    2: {
      arabic: 'اللَّهُمَّ إِنَّ هَذَا الْبَيْتَ بَيْتُكَ، وَالْحَرَمَ حَرَمُكَ، وَالأَمْنَ أَمْنُكَ، وَهَذَا مَقَامُ الْعَائِذِ بِكَ مِنَ النَّارِ.',
      transliteration: "Allahumma inna hadhal-bayta baytuk, wal-harama haramuk, wal-amna amnuk, wa hadha maqamul-'a'idhi bika minan-nar.",
      meaningEn: 'O Allah, this House is Your House, this sanctuary is Your sanctuary, this safety is Your safety, and this is the station of one who seeks refuge in You from the Fire.',
    },
    3: {
      arabic: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الشَّكِّ وَالشِّرْكِ وَالشِّقَاقِ وَالنِّفَاقِ وَسُوءِ الأَخْلاقِ، وَسُوءِ الْمُنْقَلَبِ فِي الْمَالِ وَالأَهْلِ وَالْوَلَدِ.',
      transliteration: "Allahumma inni a'udhu bika minash-shakki wash-shirki wash-shiqaqi wan-nifaqi wa su'il-akhlaq.",
      meaningEn: 'O Allah, I seek refuge in You from doubt, association of partners, dissension, hypocrisy, bad manners, and an unfortunate return to family and wealth.',
    },
    4: {
      arabic: 'اللَّهُمَّ اجْعَلْهُ حَجًّا مَبْرُورًا، وَسَعْيًا مَشْكُورًا، وَذَنْبًا مَغْفُورًا، وَعَمَلاً صَالِحًا مَقْبُولاً، وَتِجَارَةً لَنْ تَبُورَ.',
      transliteration: "Allahummaj-'alhu hajjan mabruran, wa sa'yan mashkuran, wa dhanban maghfuran, wa 'amalan salihan maqbula.",
      meaningEn: 'O Allah, make it an accepted pilgrimage, a praiseworthy striving, a forgiven sin, an accepted righteous deed, and an enduring commerce.',
    },
    5: {
      arabic: 'اللَّهُمَّ أَظِلَّنِي تَحْتَ ظِلِّ عَرْشِكَ يَوْمَ لا ظِلَّ إِلا ظِلُّكَ، وَلا بَاقِيَ إِلا وَجْهُكَ، وَاسْقِنِي مِنْ حَوْضِ نَبِيِّكَ مُحَمَّدٍ ﷺ شَرْبَةً هَنِيئَةً لا أَظْمَأُ بَعْدَهَا أَبَدًا.',
      transliteration: "Allahumma azillani tahta zilli 'arshika yawma la zilla illa zilluk.",
      meaningEn: 'O Allah, shade me beneath the shade of Your Throne on the Day when there is no shade except Your shade, and grant me a drink from the basin of Your Prophet Muhammad ﷺ.',
    },
    6: {
      arabic: 'اللَّهُمَّ إِنَّ لَكَ عَلَيَّ حُقُوقًا كَثِيرَةً فِيمَا بَيْنِي وَبَيْنَكَ، وَحُقُوقًا كَثِيرَةً فِيمَا بَيْنِي وَبَيْنَ خَلْقِكَ، اللَّهُمَّ مَا كَانَ لَكَ مِنْهَا فَاغْفِرْهُ لِي، وَمَا كَانَ لِخَلْقِكَ فَتَحَمَّلْهُ عَنِّي.',
      transliteration: "Allahumma inna laka 'alayya huquqan kathirah... faghfirhu li.",
      meaningEn: 'O Allah, You have many rights over me between me and You, and between me and Your creation. Forgive what is Yours, and absolve me from what is owed to Your creation.',
    },
    7: {
      arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ إِيمَانًا كَامِلاً، وَيَقِينًا صَادِقًا، وَرِزْقًا وَاسِعًا، وَقَلْبًا خَاشِعًا، وَلِسَانًا ذَاكِرًا، وَتَوْبَةً نَصُوحًا قَبْلَ الْمَوْتِ، وَرَاحَةً عِنْدَ الْمَوْتِ، وَمَغْفِرَةً وَرَحْمَةً بَعْدَ الْمَوْتِ.',
      transliteration: "Allahumma inni as'aluka imanan kamilan, wa yaqinan sadiqan, wa rizqan wasi'an, wa qalban khashi'an.",
      meaningEn: 'O Allah, I ask You for complete faith, truthful certainty, abundant provision, a humble heart, a tongue constantly remembering You, and sincere repentance before death.',
    },
  };

  get currentLap(): number {
    return this._currentLap;
  }

  get isCompleted(): boolean {
    return this._isCompleted;
  }

  getCurrentLapInfo(): { lapNumber: number; duaArabic: string; duaTransliteration: string; meaningEn: string } {
    const info = TawafCounter.LAP_DUAS[this._currentLap] || TawafCounter.LAP_DUAS[1];
    return {
      lapNumber: this._currentLap,
      duaArabic: info.arabic,
      duaTransliteration: info.transliteration,
      meaningEn: info.meaningEn,
    };
  }

  getRuknYamaniDua(): { arabic: string; transliteration: string } {
    return {
      arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ.',
      transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar.',
    };
  }

  completeCurrentLap(): LapResult {
    if (this._isCompleted) {
      return {
        nextLap: 7,
        hapticFeedbackPattern: 'VIBRATE_COMPLETE',
        nextActionPrompt: 'اكتمل الطواف بفضل الله. توجه لصلاة ركعتي الطواف خلف مقام إبراهيم ثم شرب ماء زمزم.',
      };
    }

    if (this._currentLap === 7) {
      this._isCompleted = true;
      return {
        nextLap: 7,
        hapticFeedbackPattern: 'VIBRATE_COMPLETE',
        nextActionPrompt: 'اكتمل الطواف بفضل الله (7 أشواط). توجه لصلاة ركعتي الطواف خلف مقام إبراهيم ثم شرب ماء زمزم والتوجه إلى الصفا لبدء السعي.',
      };
    }

    this._currentLap += 1;
    return {
      nextLap: this._currentLap,
      hapticFeedbackPattern: 'VIBRATE_LAP',
    };
  }
}

export class SaiCounter {
  private _currentLap: number = 1;
  private _isCompleted: boolean = false;

  get currentLap(): number {
    return this._currentLap;
  }

  get isCompleted(): boolean {
    return this._isCompleted;
  }

  get currentStartingPoint(): SaiLocation {
    // Odd laps (1, 3, 5, 7) start at Safa; Even laps (2, 4, 6) start at Marwa
    return this._currentLap % 2 === 1 ? SaiLocation.SAFA : SaiLocation.MARWA;
  }

  get currentDestination(): SaiLocation {
    // Odd laps end at Marwa; Even laps end at Safa
    return this._currentLap % 2 === 1 ? SaiLocation.MARWA : SaiLocation.SAFA;
  }

  completeCurrentLap(): { nextLap: number; isCompleted: boolean; nextActionPrompt?: string } {
    if (this._currentLap === 7) {
      this._isCompleted = true;
      return {
        nextLap: 7,
        isCompleted: true,
        nextActionPrompt: 'تم السعي بحمد الله بنجاح. الآن مرحلة التحلل: الحلق أو التقصير (الحلق أفضل للرجال، وتقصير قيد أنملة للنساء). تقبل الله عمرتكم!',
      };
    }

    this._currentLap += 1;
    return {
      nextLap: this._currentLap,
      isCompleted: false,
    };
  }

  getHerwalaGuidance(): { arabicTitle: string; description: string; applicableFor: 'MEN_ONLY' } {
    return {
      arabicTitle: 'الهرولة بين العلمين الأخضرين (بطن الوادي)',
      description: 'يُسن للرجال فقط الإسراع والمشي السريع (الهرولة) بين العمودين الأخضرين مع الحذر من الزحام، أما النساء فيمشين كالمعتاد دون إسراع.',
      applicableFor: 'MEN_ONLY',
    };
  }
}

export interface HotelGuideItem {
  category: string;
  titleAr: string;
  titleEn: string;
  actionablePoints: string[];
}

export class HotelBestPracticesCatalog {
  private guides: Map<string, HotelGuideItem> = new Map([
    [
      'KEY_CARD_SAFETY',
      {
        category: 'KEY_CARD_SAFETY',
        titleAr: 'حماية بطاقة الغرفة الممغنطة وتجنب تلفها',
        titleEn: 'Room Magnetic Key Card Care',
        actionablePoints: [
          'تجنب وضع كارت الغرفة بجوار الهاتف المحمول مباشرة أو في جيب واحد مع المغناطيسات لتفادي إزالة الشحنة المغناطيسية.',
          'احتفظ بكرت الغرفة بعيداً عن أقفال الحقائب المغناطيسية وسماعات البلوتوث.',
          'في حال توقف الكرت عن فتح الباب، راجع الاستقبال فوراً لإعادة برمجته (مجاناً في معظم الفنادق).',
        ],
      },
    ],
    [
      'ELEVATOR_RUSH_HOURS',
      {
        category: 'ELEVATOR_RUSH_HOURS',
        titleAr: 'أوقات ذروة المصاعد والنزول للحرم',
        titleEn: 'Elevator Congestion & Prayer Timing',
        actionablePoints: [
          'تبلغ ذروة المصاعد ذروتها خلال 15 إلى 30 دقيقة بعد انتهاء كل صلاة في الحرم؛ يفضل الانتظار قليلاً في الحرم أو المشي بالسلالم إن كانت الطوابق منخفضة.',
          'للنزول إلى صلاة الجمعة أو التراويح في الوقت المناسب، غادر غرفتك قبل الأذان بـ 45 إلى 60 دقيقة على الأقل.',
        ],
      },
    ],
    [
      'VALUABLES_AND_SAFE',
      {
        category: 'VALUABLES_AND_SAFE',
        titleAr: 'حفظ المتعلقات الثمينة وخزينة الغرفة',
        titleEn: 'Safe Deposit Box & Valuables Management',
        actionablePoints: [
          'ضع جوازات السفر والمبالغ النقدية الكبيرة والمصوغات الذهبية دائماً داخل الخزينة الرقمية بغرفتك.',
          'لا تأخذ مبالغ نقدية كبيرة معك أثناء الطواف أو السعي تفادياً للضياع أثناء الزحام الشديد.',
        ],
      },
    ],
    [
      'EMERGENCY_HOTEL_CARD',
      {
        category: 'EMERGENCY_HOTEL_CARD',
        titleAr: 'كرت الفندق الورقي في الجيب',
        titleEn: 'Keep Physical Hotel Business Card',
        actionablePoints: [
          'احتفظ دائماً بكرت الفندق الورقي (المطبوع عليه اسم الفندق وعنوانه وهاتفه بالعربية والإنجليزية) في جيبك أو محفظتك طوال الرحلة.',
          'في حال نفاد بطارية الهاتف أو ضياع الطريق، أظهر الكرت لأي سائق تاكسي أو رجل أمن في الحرم.',
        ],
      },
    ],
  ]);

  getAllCategories(): string[] {
    return Array.from(this.guides.keys());
  }

  getGuideForCategory(category: string): HotelGuideItem {
    const item = this.guides.get(category);
    if (!item) {
      throw new Error(`Category ${category} not found in hotel catalog`);
    }
    return item;
  }
}

export interface HaramainGuideItem {
  id: string;
  titleAr: string;
  titleEn: string;
  practicalAdvice: string;
  officialSource?: string;
}

export class HaramainBestPracticesCatalog {
  private guides: HaramainGuideItem[] = [
    {
      id: 'FOOTWEAR_SHOE_BAG',
      titleAr: 'حقيبة الحذاء وتنظيم النعال داخل الحرم',
      titleEn: 'Footwear Management & Shoe Bags',
      practicalAdvice:
        'احمل معك كيس قماشي خفيف لوضع حذائك فيه وأخذه معك في حقيبة الظهر. عدم ترك الحذاء في الممرات العامة أو عند بوابات الدخول لتفادي مصادرته من عمال النظافة وضمان سلامة المصلين.',
      officialSource: 'رئاسة الشؤون الدينية للمسجد الحرام والمسجد النبوي',
    },
    {
      id: 'HEATSTROKE_HYDRATION',
      titleAr: 'الوقاية من الإجهاد الحراري وضربات الشمس وشرب زمزم',
      titleEn: 'Heatstroke Prevention & Zamzam Etiquette',
      practicalAdvice:
        'احرص على شرب كميات وفيرة من ماء زمزم البارد والمعتدل بانتظام، واستخدم مظلة شمسية فاتحة اللون، وتجنب أداء الطواف والسعي في صحن المطاف المكشوف وقت اشتداد الظهيرة (11:30 ص إلى 3:30 م) لكبار السن.',
      officialSource: 'وزارة الصحة السعودية',
    },
    {
      id: 'EMERGENCY_CORRIDORS',
      titleAr: 'المحافظة على ممرات الطوارئ وتجنب التدافع',
      titleEn: 'Emergency Corridors & Crowd Movement Safety',
      practicalAdvice:
        'يمنع الصلاة أو الجلوس في ممرات المشاة، أمام السلالم الكهربائية، أو في مسارات عربات الطوارئ وكبار السن. عند حدوث تكدس، استمر في التحرك الهادئ مع اتجاه تيار المشاة وتجنب الوقوف المفاجئ.',
      officialSource: 'قوات أمن الحج والعمرة',
    },
    {
      id: 'NUSUK_RAWDAH_PERMITS',
      titleAr: 'تصاريح الروضة الشريفة عبر تطبيق نسك',
      titleEn: 'Nusuk App Permits for Rawdah Al-Sharifa',
      practicalAdvice:
        'دخول الروضة الشريفة في المسجد النبوي يتطلب تصريحاً مسبقاً مؤكداً عبر تطبيق "نسك" (Nusuk). احرص على الحضور قبل الموعد بنصف ساعة عند البوابة المحددة للرجال أو النساء مع إبراز رمز الاستجابة السريعة (QR).',
      officialSource: 'وزارة الحج والعمرة',
    },
    {
      id: 'OFFICIAL_WHEELCHAIR_BOOKING',
      titleAr: 'حجز عربات الطواف والسعي الرسمية (الكهربائية واليدوية)',
      titleEn: 'Official Electric Golf Carts & Wheelchairs',
      practicalAdvice:
        'احجز العربات الكهربائية الرسمية من خلال منصة نسك أو من نقاط التوزيع المعتمدة داخل الحرمين في الميزانين والدور العلوي. احذر التعامل مع الوسطاء غير المرخصين في الساحات الخارجية.',
      officialSource: 'الهيئة العامة للعناية بشؤون المسجد الحرام والمسجد النبوي',
    },
  ];

  getAllGuides(): HaramainGuideItem[] {
    return this.guides;
  }

  getGuideById(id: string): HaramainGuideItem | undefined {
    return this.guides.find((g) => g.id === id);
  }
}
