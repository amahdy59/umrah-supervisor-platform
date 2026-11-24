export enum BroadcastPhase {
  PRE_DEPARTURE = 'PRE_DEPARTURE', // قبل السفر وحقيبة المعتمر
  MIQAT_APPROACH = 'MIQAT_APPROACH', // اقتراب الميقات في الطائرة أو الحافلة
  ROOMMATE_ETIQUETTE = 'ROOMMATE_ETIQUETTE', // آداب السكن ورفقاء الغرفة
  TAWAF_PREPARATION = 'TAWAF_PREPARATION', // الاستعداد لدخول الحرم والطواف
  HARAMAIN_MORALS = 'HARAMAIN_MORALS', // أخلاق الحرم والصبر وكظم الغيظ
  RAWDAH_PERMIT = 'RAWDAH_PERMIT', // تنبيه موعد الروضة الشريفة وبواباتها
  DEPARTURE_WADA = 'DEPARTURE_WADA', // التجهيز للعودة وطواف الوداع
}

export interface BroadcastTemplate {
  phase: BroadcastPhase;
  title: string;
  badge: string;
  template: (params?: Record<string, string>) => string;
}

export class WhatsAppBroadcastManager {
  private templates: Map<BroadcastPhase, BroadcastTemplate>;

  constructor() {
    this.templates = new Map<BroadcastPhase, BroadcastTemplate>([
      [
        BroadcastPhase.PRE_DEPARTURE,
        {
          phase: BroadcastPhase.PRE_DEPARTURE,
          title: '🎒 قبل السفر: قائمة الحقيبة وتجهيزات الإحرام',
          badge: 'قبل السفر',
          template: (params: Record<string, string> = {}) => `*بسم الله الرحمن الرحيم* 🕋
*ضيوف الرحمن أعزاءنا في فوج (${params.tripTitle || 'رحلة العمرة المباركة'})*
السلام عليكم ورحمة الله وبركاته، تقبل الله منكم وجعلها عمرة مقبولة مبرورة.

نذكركم بأهم التجهيزات قبل التوجه للمطار:
1️⃣ *ملابس الإحرام:* (إزار ورداء أبيضين نظيفين وحزام للرجال)، ونعال مريحة غير مخيطة عند الكعب.
2️⃣ *حقيبة اليد الصغيرة:* جواز السفر، تذاكر الطيران، أدوية الأمراض المزمنة في مكان يسهل الوصول إليه، وشاحن متنقل (Power Bank).
3️⃣ *مستلزمات النظافة:* صابون وشامبو بدون رائحة/عطر، مقص صغير، ومظلة شمسية خفيفة.
4️⃣ *الاستعداد البدني:* أخذ قسط كافٍ من النوم وشرب الماء بانتظام.

📍 موعد تجمعنا بصالة المطار: *ساعة قبل موعد الرحلة بـ 4 ساعات*.
في خدمتكم طوال الرحلة: *${params.supervisorName || 'مشرف الفوج'}* 📞`,
        },
      ],
      [
        BroadcastPhase.MIQAT_APPROACH,
        {
          phase: BroadcastPhase.MIQAT_APPROACH,
          title: '✈️ تنبيه اقتراب الميقات وعقد نية الإحرام',
          badge: 'في الطريق',
          template: () => `📢 *تنبيه هام وعاجل لجميع معتمري الفوج* 🕋

نحن نقترب الآن من *محاذاة الميقات* بحمد الله وتوفيقه.

📌 *المطلوب من كل معتمر الآن:*
1️⃣ عقد النية بالقلب والتلفظ بالتلبية النبوية:
*«لَبَّيْكَ اللَّهُمَّ عُمْرَةً»*
*«لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لا شَرِيكَ لَكَ»*

2️⃣ *محظورات الإحرام تبدأ من هذه اللحظة:*
❌ تجنب الطيب والعطور والصابون المعطر.
❌ تجنب قص الشعر أو تقليم الأظافر.
❌ للرجال: تجنب تغطية الرأس بملاصق والملابس المخيطة (كالقميص والسروال).

أكثروا من التلبية والذكر حتى نصل إلى الكعبة المشرفة إن شاء الله.`,
        },
      ],
      [
        BroadcastPhase.ROOMMATE_ETIQUETTE,
        {
          phase: BroadcastPhase.ROOMMATE_ETIQUETTE,
          title: '🤝 ميثاق رفقاء الغرفة وآداب السكن بالفندق',
          badge: 'في الفندق',
          template: (params: Record<string, string> = {}) => `*ميثاق الأخوة والسكن المبارك في فندق (${params.hotelName || 'مقر الإقامة'})* 🏨🌿

أخي المعتمر الكريم، أختي المعتمرة الفاضلة:
إن رفيق الغرفة هو صاحبك في رحلة الطاعة، وحسن خلقه معك وإحسانك إليه من أعظم القربات.

نرجو التكرم بالالتزام بهذه الآداب النبوية الراقية:
🛌 *1. مراعاة مواعيد النوم والراحة:*
• خفض الصوت وعدم التحدث في الهاتف بصوت مرتفع عند نوم الرفقاء.
• استخدام سماعات الأذن (Headphones) عند الاستماع للقرآن أو الدروس.
• تجنب تشغيل الإضاءة القوية فجأة على من هو نائم واستخدام كشاف الهاتف الخافت عند الحاجة.

🚿 *2. إتيكيت استخدام الحمام المشترك:*
• عدم الإطالة في الحمام خاصة قبل مواعيد الصلوات ليتسنى للجميع الوضوء.
• الحرص على تجفيف أرضية الحمام وتركه نظيفاً ومرتباً لمن يأتي بعدك.

🔌 *3. الكهرباء والمقابس:*
• التعاون في استخدام مقابس الشحن وعدم احتكارها، ومشاركة التوصيلات بود.

🧹 *4. الترتيب وحفظ الأسرار:*
• إبقاء الحقائب والأغراض في الجانب المخصص لكل شخص.
• ما تراه أو تسمعه من خصوصيات رفيقك أمانة استر عليها.

قال ﷺ: *«أَحَبُّ النَّاسِ إِلَى اللَّهِ أَنْفَعُهُمْ لِلنَّاسِ»*.
مع تحيات مشرفكم: *${params.supervisorName || 'إدارة الفوج'}*`,
        },
      ],
      [
        BroadcastPhase.TAWAF_PREPARATION,
        {
          phase: BroadcastPhase.TAWAF_PREPARATION,
          title: '🕋 الاستعداد للنزول لأداء طواف وسعي العمرة',
          badge: 'أداء المناسك',
          template: (params: Record<string, string> = {}) => `📣 *نداء الانطلاق لأداء مناسك العمرة (طواف وسعي)* 🕋

إخواني وأخواتي ضيوف الرحمن:
سنتحرك بإذن الله تعالى كفوج واحد لأداء العمرة.

⏰ *الموعد:* التجمع في بهو الفندق الساعة *${params.gatheringTime || 'بعد صلاة العصر بنصف ساعة'}*.
📍 *نقطة التجمع بالحرم:* *${params.meetingPoint || 'بوابة الملك عبد العزيز (بوابة 1)'}*.

💡 *توجيهات هامة جداً لسلامتكم:*
• إحضار *كيس خفيف لحذائك* لحمله معك في حقيبة الظهر (لا تتركه في الممرات).
• ارتداء *بطاقة المعتمر الذكية* الخاصة بالحملة حول عنقك.
• حمل قارورة ماء صغيرة، والحرص على المشي في جماعة وعدم الاستعجال.
• كبار السن وأصحاب الكراسي المتحركة: سيتم توجيههم لمسار العربات الرسمي بالدور العلوي حفاظاً على سلامتهم.

وفقكم الله وتقبل منا ومنكم صالح الأعمال.`,
        },
      ],
      [
        BroadcastPhase.HARAMAIN_MORALS,
        {
          phase: BroadcastPhase.HARAMAIN_MORALS,
          title: '💎 أخلاق المعتمر في رحاب الحرمين الشريفين',
          badge: 'آداب الحرم',
          template: () => `🌿 *وقفة إيمانية: أخلاق زائر بيت الله الحرام* 🕋✨

قال الله تعالى: ﴿فَمَنْ فَرَضَ فِيهِنَّ الْحَجَّ فَلَا رَفَثَ وَلَا فُسُوقَ وَلَا جِدَالَ فِي الْحَجِّ﴾.

أيها المعتمر الحبيب:
أنت اليوم في أقدس بقعة على وجه الأرض، وحسن الخلق هنا يضاعف أجره:
🕊️ *الصبر وكظم الغيظ:* قد تواجه زحاماً في المداخل، أو تأخراً في المصاعد، أو تصرفاً غير مقصود من معتمر آخر؛ فقابل ذلك بالابتسامة والعفو والصفح.
🤲 *إيثار الضعفاء:* أفسح الطريق لكبير السن والمرأة وذوي الاحتياجات الخاصة، ولا تزاحم أحداً في صلاته أو طوافه.
🚪 *ممرات الطوارئ:* تجنب الصلاة أو الجلوس في ممرات المشاة، أمام السلالم الكهربائية، أو في مخارج الأمان.
📵 *حفظ الخشوع:* تجنب المبالغة في التقاط الصور والبث المباشر (السيلفي)، واجعل بصرك وقلبك معلقين بالله تعالى.

طابت أوقاتكم بذكره وشكره وحسن عبادته.`,
        },
      ],
      [
        BroadcastPhase.RAWDAH_PERMIT,
        {
          phase: BroadcastPhase.RAWDAH_PERMIT,
          title: '🕌 موعد زيارة الروضة الشريفة بالمسجد النبوي',
          badge: 'المدينة المنورة',
          template: (params: Record<string, string> = {}) => `🌸 *إشعار هام: موعد زيارة الروضة الشريفة والسلام على رسول الله ﷺ* 🕌

إلى معتمرينا الكرام في المدينة المنورة:
تم بحمد الله تأكيد تصاريح الروضة الشريفة عبر تطبيق نسك وفق المواعيد التالية:

👨 *مجموعة الرجال:*
• الموعد: *${params.menTime || 'اليوم بعد صلاة العشاء'}*
• بوابة الدخول: *${params.menGate || 'باب السلام أو باب بلال'}*
• التجمع في بهو الفندق قبل الموعد بـ 45 دقيقة.

🧕 *مجموعة النساء:*
• الموعد: *${params.womenTime || 'غداً بعد صلاة الفجر'}*
• بوابة الدخول: *${params.womenGate || 'باب عثمان بن عفان (بوابة 24/37)'}*
• التنسيق بإشراف مشرفة الفوج.

⚠️ *تنبيه ضروري:*
يجب إبراز رمز الاستجابة السريعة (QR) للتصريح على تطبيق "نسك" أو الصورة المطبوعة مع الهوية عند الدخول. الدخول دقيق جداً ولا يقبل التأخير دقيقة واحدة.`,
        },
      ],
      [
        BroadcastPhase.DEPARTURE_WADA,
        {
          phase: BroadcastPhase.DEPARTURE_WADA,
          title: '🛫 التجهيز للمغادرة وطواف الوداع وماء زمزم',
          badge: 'ختام الرحلة',
          template: (params: Record<string, string> = {}) => `🕋 *تقبل الله عمرتكم وكتب لكم الأجر العظيم* 🤲

إخواني وأخواتي الكرام:
تقترب رحلتنا المباركة من نهايتها، راجين من المولى أن يتقبل منكم الطواف والسعي والدعاء.

📋 *تعليمات المغادرة وتسليم الغرف:*
1️⃣ *طواف الوداع:* يكون قبل مغادرة مكة ليكون آخر عهدكم بالبيت (ويعفى منه أصحاب الأعذار).
2️⃣ *الحقائب:* إنزال الحقائب الكبيرة لبهو الفندق الساعة *${params.luggageTime || 'قبل المغادرة بـ 3 ساعات'}* مع التأكد من وضع بطاقة الاسم ورقم الهاتف عليها.
3️⃣ *مياه زمزم:* شراء عبوة زمزم المعتمدة للمطار (5 لتر) المغلفة رسمياً من نقاط البيع المعتمدة.
4️⃣ *بطاقات الغرف:* تسليم كروت الغرف لمشرف الفوج في الاستقبال لإتمام الإخلاء.

رافقتكم السلامة وعوداً حميداً لدياركم سالمين غانمين إن شاء الله.`,
        },
      ],
    ]);
  }

  getAllPhases(): BroadcastPhase[] {
    return Array.from(this.templates.keys());
  }

  getFormattedPost(
    phase: BroadcastPhase,
    params?: Record<string, string>
  ): { title: string; badge: string; messageBody: string } {
    const item = this.templates.get(phase);
    if (!item) {
      throw new Error(`Broadcast phase ${phase} not found`);
    }

    return {
      title: item.title,
      badge: item.badge,
      messageBody: item.template(params),
    };
  }
}

export enum FiqhRulingCategory {
  ACCIDENTAL_SCENT = 'ACCIDENTAL_SCENT',
  FORGETFUL_HAIR_NAIL_CLIP = 'FORGETFUL_HAIR_NAIL_CLIP',
  PASSING_MIQAT_WITHOUT_IHRAM = 'PASSING_MIQAT_WITHOUT_IHRAM',
  WUDU_BREAK_DURING_TAWAF = 'WUDU_BREAK_DURING_TAWAF',
  BLACK_STONE_CROWD_PUSHING = 'BLACK_STONE_CROWD_PUSHING',
  WOMEN_MENSTRUATION_DURING_UMRAH = 'WOMEN_MENSTRUATION_DURING_UMRAH',
}

export interface FiqhRuling {
  id: FiqhRulingCategory;
  titleAr: string;
  questionAr: string;
  rulingArabic: string;
  actionRequired: string;
  evidenceSummary: string;
}

export class FiqhAssistant {
  private rulings: Map<FiqhRulingCategory, FiqhRuling> = new Map([
    [
      FiqhRulingCategory.ACCIDENTAL_SCENT,
      {
        id: FiqhRulingCategory.ACCIDENTAL_SCENT,
        titleAr: 'استخدام العطر أو الصابون المعطر ناسياً أثناء الإحرام',
        questionAr: 'توضأت بصابون معطر أو تعطرت ناسياً أنني محرم، فماذا يلزمني؟',
        rulingArabic:
          'من تعطر أو استعمل صابوناً معطراً ناسياً أو جاهلاً فلا إثم عليه ولا فدية.',
        actionRequired:
          'غسله بالماء فور تذكره ولا فدية عليه، لقوله تعالى: ﴿رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا﴾.',
        evidenceSummary:
          'القاعدة الفقهية: محظورات الإحرام من باب التروك، فإذا وقعت نسياناً أو جهلاً سقط الإثم والفدية.',
      },
    ],
    [
      FiqhRulingCategory.FORGETFUL_HAIR_NAIL_CLIP,
      {
        id: FiqhRulingCategory.FORGETFUL_HAIR_NAIL_CLIP,
        titleAr: 'تقليم الأظافر أو تساقط الشعر ناسياً للمحرم',
        questionAr: 'قصصت ظفراً أو سقط شعر من لحيتي أو رأسي دون قصد، فهل بطل إحرامي؟',
        rulingArabic:
          'الإحرام صحيح تماماً، وما سقط بغير قصد أو قُص ناسياً لا شيء فيه.',
        actionRequired: 'لا فدية عليه عند جمهور العلماء للنسيان، ويستمر في إحرامه بشكل طبيعي.',
        evidenceSummary: 'الخطأ والنسيان معفو عنهما شرعاً بنص حديث رسول الله ﷺ.',
      },
    ],
    [
      FiqhRulingCategory.PASSING_MIQAT_WITHOUT_IHRAM,
      {
        id: FiqhRulingCategory.PASSING_MIQAT_WITHOUT_IHRAM,
        titleAr: 'تجاوز الميقات في الطائرة دون إحرام',
        questionAr: 'نمت في الطائرة ولم أستيقظ إلا بعد الهبوط في جدة، ماذا أفعل؟',
        rulingArabic:
          'لا يجوز لمن أراد العمرة تجاوز الميقات دون إحرام.',
        actionRequired:
          'الواجب أن يخرج إلى أقرب ميقات (مثل ميقات الجحفة/رابغ أو يرجع بالسيارة للميقات) ويحرم منه. فإن تعذر وأحرم من جدة لزمه ذبح شاة (دم) يوزع على فقراء الحرم بمكة.',
        evidenceSummary: 'لقول ابن عباس رضي الله عنهما: "من نسي من نسكه شيئاً أو تركه فليهرق دماً".',
      },
    ],
    [
      FiqhRulingCategory.WUDU_BREAK_DURING_TAWAF,
      {
        id: FiqhRulingCategory.WUDU_BREAK_DURING_TAWAF,
        titleAr: 'انتقاض الوضوء أثناء أشواط الطواف',
        questionAr: 'انتقض وضوئي في الشوط الرابع من الطواف، هل أعيد الطواف من البداية؟',
        rulingArabic:
          'يخرج المعتمر بهدوء ليتوضأ من دورات مياه الحرم القريبة.',
        actionRequired:
          'الصحيح عند جمهور الفقهاء أنه يعود ويكمل من حيث توقف (يبدأ الشوط الرابع ولا يعيد الأشواط السابقة). وعند مذهب الحنفية وجمع من المحققين تصح الطهارة قبل الطواف ولا يبطله الحدث أثناءه إن شق الخروج في الزحام الشديد.',
        evidenceSummary: 'المشقة تجلب التيسير، والبناء على ما مضى أيسر للمعتمر في شدة الزحام.',
      },
    ],
    [
      FiqhRulingCategory.BLACK_STONE_CROWD_PUSHING,
      {
        id: FiqhRulingCategory.BLACK_STONE_CROWD_PUSHING,
        titleAr: 'حكم التزاحم العنيف لتقبيل الحجر الأسود',
        questionAr: 'هل يكتمل الطواف دون لمس أو تقبيل الحجر الأسود؟',
        rulingArabic:
          'الطواف تام وصحيح 100% بدون تقبيل الحجر.',
        actionRequired:
          'تقبيل الحجر أو استلامه سنة، بينما إيذاء المسلمين والتدافع محرم قطعاً. يكفي تماماً الإشارة إليه باليد اليمنى من بعيد مع التكبير (الله أكبر) عند محاذاته.',
        evidenceSummary: 'ثبت عن النبي ﷺ أنه طاف على بعيره وأشار إلى الحجر بمحجنه وكبّر.',
      },
    ],
  ]);

  resolveLapDoubt(countA: number, countB: number): { recommendedLap: number; rulingArabic: string } {
    const lesser = Math.min(countA, countB);
    return {
      recommendedLap: lesser,
      rulingArabic: `إذا شك المعتمر هل طاف ${countA} أو ${countB} أشواط، فالقاعدة الشرعية هي: "البناء على اليقين وهو الأقل"، فيعتبر نفسه في الشوط (${lesser}) ويكمل حتى يتم سبعة أشواط كاملة.`,
    };
  }

  getRuling(category: FiqhRulingCategory): FiqhRuling | undefined {
    return this.rulings.get(category);
  }

  getAllRulings(): FiqhRuling[] {
    return Array.from(this.rulings.values());
  }
}
