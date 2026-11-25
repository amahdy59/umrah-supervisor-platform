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

export interface SunnahDhikrItem {
  titleAr: string;
  arabic: string;
  transliteration: string;
  meaningEn: string;
  sourceAr: string;
}

export class TawafCounter {
  private _currentLap: number = 1;
  private _isCompleted: boolean = false;

  /**
   * Authentic Sunnah & Quranic Adhkar (Jawami' al-Du'a) for general remembrance during Tawaf.
   * Note: Per Imam Ibn Baz & Imam Ibn Uthaymeen, no specific Dua is prescribed per lap;
   * these are verified Quranic/Prophetic supplications the pilgrim may recite freely in any lap.
   */
  private static readonly SUGGESTED_ADHKAR: Record<number, SunnahDhikrItem> = {
    1: {
      titleAr: 'الافتتاح عند الحجر الأسود (سنة ثابتة)',
      arabic: 'بِسْمِ اللَّهِ، وَاللَّهُ أَكْبَرُ (يُكَبِّرُ عند محاذاة الحجر الأسود في بداية كل شوط ويشير إليه بيده اليمنى).',
      transliteration: 'Bismillahi, Allahu Akbar (say upon facing the Black Stone at the start of each circuit).',
      meaningEn: 'In the name of Allah, Allah is the Greatest.',
      sourceAr: 'صحيح البخاري (حديث ابن عباس في الإشارة والتكبير)',
    },
    2: {
      titleAr: 'دعاء جامع من القرآن الكريم',
      arabic: 'رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ، وَتُبْ عَلَيْنَا إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ.',
      transliteration: 'Rabbana taqabbal minna innaka Antas-Sami’ul-Alim, wa tub ‘alayna innaka Antat-Tawwabur-Rahim.',
      meaningEn: 'Our Lord, accept from us; indeed You are the Hearing, the Knowing, and accept our repentance.',
      sourceAr: 'سورة البقرة: 127-128 (دعاء إبراهيم وإسماعيل عليهما السلام عند بناء البيت)',
    },
    3: {
      titleAr: 'سيد الاستغفار وطلب المغفرة',
      arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ.',
      transliteration: 'Allahumma Anta Rabbi la ilaha illa Anta, khalaqtani wa ana ‘abduka... faghfir li.',
      meaningEn: 'O Allah, You are my Lord, none has the right to be worshipped except You... forgive me.',
      sourceAr: 'صحيح البخاري (6306)',
    },
    4: {
      titleAr: 'دعاء العفو والعافية في الدنيا والآخرة',
      arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي.',
      transliteration: 'Allahumma inni as’alukal-‘afwa wal-‘afiyata fid-dunya wal-akhirah.',
      meaningEn: 'O Allah, I ask You for pardon and well-being in this life and the Hereafter.',
      sourceAr: 'سنن أبي داود وابن ماجه (حديث صحيح)',
    },
    5: {
      titleAr: 'سؤال الله الهداية والتقوى والغنى',
      arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى، رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا.',
      transliteration: 'Allahumma inni as’alukal-huda wat-tuqa wal-‘afafa wal-ghina.',
      meaningEn: 'O Allah, I ask You for guidance, piety, chastity, and contentment.',
      sourceAr: 'صحيح مسلم (2721) وسورة الفرقان: 74',
    },
    6: {
      titleAr: 'الباقيات الصالحات والذكر المطلق',
      arabic: 'سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ.',
      transliteration: 'Subhanallahi walhamdulillahi wa la ilaha illallahu wallahu Akbar.',
      meaningEn: 'Glory be to Allah, praise be to Allah, none has the right to be worshipped except Allah, Allah is the Greatest.',
      sourceAr: 'صحيح مسلم (أحب الكلام إلى الله)',
    },
    7: {
      titleAr: 'دعاء الصلاح في الدين والدنيا والآخرة',
      arabic: 'اللَّهُمَّ أَصْلِحْ لِي دِينِي الَّذِي هُوَ عِصْمَةُ أَمْرِي، وَأَصْلِحْ لِي دُنْيَايَ الَّتِي فِيهَا مَعَاشِي، وَأَصْلِحْ لِي آخِرَتِي الَّتِي فِيهَا مَعَادِي، وَاجْعَلِ الْحَيَاةَ زِيَادَةً لِي فِي كُلِّ خَيْرٍ.',
      transliteration: 'Allahumma aslih li dini alladhi huwa ‘ismatu amri, wa aslih li dunyaya wa akhirati.',
      meaningEn: 'O Allah, set right for me my religion, my worldly affairs, and my Hereafter.',
      sourceAr: 'صحيح مسلم (2720)',
    },
  };

  get currentLap(): number {
    return this._currentLap;
  }

  get isCompleted(): boolean {
    return this._isCompleted;
  }

  getSunnahNote(): string {
    return 'تنبيه شرعي: لم يثبت في السنة تخصيص دعاء معين لكل شوط (فتوى ابن باز وابن عثيمين رحمهما الله)؛ هذه أدعية قرآنية ونبوية جامعة للاستئناس بها، وادعُ الله بما يفتح به عليك من خيري الدنيا والآخرة.';
  }

  getCurrentLapInfo(): {
    lapNumber: number;
    titleAr: string;
    duaArabic: string;
    duaTransliteration: string;
    meaningEn: string;
    sourceAr: string;
    sunnahNote: string;
  } {
    const info = TawafCounter.SUGGESTED_ADHKAR[this._currentLap] || TawafCounter.SUGGESTED_ADHKAR[1];
    return {
      lapNumber: this._currentLap,
      titleAr: info.titleAr,
      duaArabic: info.arabic,
      duaTransliteration: info.transliteration,
      meaningEn: info.meaningEn,
      sourceAr: info.sourceAr,
      sunnahNote: this.getSunnahNote(),
    };
  }

  getRuknYamaniDua(): { arabic: string; transliteration: string; sourceAr: string } {
    return {
      arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ.',
      transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar.',
      sourceAr: 'سنن أبي داود (1892) - الدعاء الثابت بين الركن اليماني والحجر الأسود',
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

  undoLap(): number {
    if (this._isCompleted) {
      this._isCompleted = false;
      return this._currentLap;
    }
    if (this._currentLap > 1) {
      this._currentLap -= 1;
    }
    return this._currentLap;
  }

  reset(): void {
    this._currentLap = 1;
    this._isCompleted = false;
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
    return this._currentLap % 2 === 1 ? SaiLocation.SAFA : SaiLocation.MARWA;
  }

  get currentDestination(): SaiLocation {
    return this._currentLap % 2 === 1 ? SaiLocation.MARWA : SaiLocation.SAFA;
  }

  getSafaMarwaDhikr(): {
    verseOnFirstSafa: string;
    hillDhikr: string;
    instructionAr: string;
  } {
    return {
      verseOnFirstSafa: '﴿إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ﴾ — أَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ.',
      hillDhikr:
        'اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ، أَنْجَزَ وَعْدَهُ، وَنَصَرَ عَبْدَهُ، وَهَزَمَ الْأَحْزَابَ وَحْدَهُ.',
      instructionAr: 'يستقبل الكعبة على الصفا والمروة، ويكبر ثلاثاً، ويقول الذكر ثم يدعو ويردد ذلك ثلاث مرات (صحيح مسلم 1218).',
    };
  }

  completeCurrentLap(): { nextLap: number; isCompleted: boolean; nextActionPrompt?: string } {
    if (this._isCompleted) {
      return {
        nextLap: 7,
        isCompleted: true,
        nextActionPrompt: 'تم السعي بحمد الله بنجاح. الآن مرحلة التحلل: الحلق أو التقصير (الحلق أفضل للرجال، وتقصير قيد أنملة للنساء). تقبل الله عمرتكم!',
      };
    }

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

  undoLap(): number {
    if (this._isCompleted) {
      this._isCompleted = false;
      return this._currentLap;
    }
    if (this._currentLap > 1) {
      this._currentLap -= 1;
    }
    return this._currentLap;
  }

  reset(): void {
    this._currentLap = 1;
    this._isCompleted = false;
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
      officialSource: 'وزارة الصحة السعودية (937)',
    },
    {
      id: 'EMERGENCY_CORRIDORS',
      titleAr: 'المحافظة على ممرات الطوارئ وتجنب التدافع',
      titleEn: 'Emergency Corridors & Crowd Movement Safety',
      practicalAdvice:
        'يمنع الصلاة أو الجلوس في ممرات المشاة، أمام السلالم الكهربائية، أو في مسارات عربات الطوارئ وكبار السن. عند حدوث تكدس، استمر في التحرك الهادئ مع اتجاه تيار المشاة وتجنب الوقوف المفاجئ.',
      officialSource: 'قوات أمن الحج والعمرة (911)',
    },
    {
      id: 'NUSUK_RAWDAH_PERMITS',
      titleAr: 'تصاريح الروضة الشريفة عبر تطبيق نسك',
      titleEn: 'Nusuk App Permits for Rawdah Al-Sharifa',
      practicalAdvice:
        'دخول الروضة الشريفة في المسجد النبوي يتطلب تصريحاً مسبقاً مؤكداً عبر تطبيق "نسك" (Nusuk). احرص على الحضور قبل الموعد بـ 15 إلى 30 دقيقة عند البوابة المحددة باللوحات الإرشادية (مثل باب عثمان بن عفان 25 أو مسار 37/32 للنساء، وباب السلام للرجال)، واحتفظ بلقطة شاشة عالية الوضوح مع إبقاء التطبيق جاهزاً.',
      officialSource: 'وزارة الحج والعمرة (منصة نُسك)',
    },
    {
      id: 'OFFICIAL_WHEELCHAIR_BOOKING',
      titleAr: 'حجز عربات الطواف والسعي الرسمية (الكهربائية واليدوية)',
      titleEn: 'Official Electric Golf Carts & Wheelchairs',
      practicalAdvice:
        'احجز العربات الكهربائية الرسمية عبر تطبيق «نُسك» (الخدمات ← النقل ← عربات الحرمين) أو من نقاط التوزيع المعتمدة بالدور العلوي والميزانين والسطح (حيث يمنع دخول العربات لصحن المطاف الأرضي وقت الذروة). احذر الوسطاء غير المرخصين في الساحات.',
      officialSource: 'الهيئة العامة للعناية بشؤون المسجد الحرام والمسجد النبوي',
    },
    {
      id: 'ZAMZAM_AIRPORT_RULES',
      titleAr: 'ضوابط شحن عبوات ماء زمزم (5 لتر) في المطار',
      titleEn: 'Official 5-Liter Zamzam Airport Regulations',
      practicalAdvice:
        'يُسمح لكل معتمر بعبوة واحدة فقط (5 لتر) مغلفة رسمياً من مشروع الملك عبد الله بن عبد العزيز لسقيا زمزم وتُشترى من منافذ المطار الرسمية بجدة أو المدينة (~12 ريالاً). يُمنع وضع جالونات غير مغلفة داخل الحقائب، وتُشحن العبوة الرسمية على سير الأمتعة المخصص لزمزم.',
      officialSource: 'الهيئة العامة للطيران المدني السعودي (GACA)',
    },
    {
      id: 'LOST_PILGRIM_PROTOCOL',
      titleAr: 'بروتوكول التصرف عند الضياع داخل الحرمين',
      titleEn: 'Lost Pilgrim Safety Protocol',
      practicalAdvice:
        'لا تواصل المشي العشوائي إذا ضللت الطريق؛ توقف عند أقرب باب مرقم أو عمود مميز، وأظهر بطاقة الفندق أو شاشة الطوارئ لرجال الأمن أو المشرفات، وشارك موقعك (GPS) عبر واتساب مع مشرف الفوج.',
      officialSource: 'قوات أمن الحج والعمرة',
    },
  ];

  getAllGuides(): HaramainGuideItem[] {
    return this.guides;
  }

  getGuideById(id: string): HaramainGuideItem | undefined {
    return this.guides.find((g) => g.id === id);
  }
}
