/**
 * Women's Fiqh in Umrah & Hajj
 * Extracted directly from authentic verified scholarly sources:
 * «دليل المعتمر» (أبو محمد يوسف العطير - مراجعة فتاوى ابن باز وابن عثيمين والعباد)
 */

import { KnowledgeReference, REF_CATALOG } from './references.js';

export enum WomenFiqhTopic {
  MIQAT_MENSTRUATION = 'MIQAT_MENSTRUATION', // الحيض والنفاس عند الميقات
  IHRAM_CLOTHING = 'IHRAM_CLOTHING', // لباس إحرام المرأة (لا نقاب ولا قفازين)
  WHITE_GREEN_BIDAH = 'WHITE_GREEN_BIDAH', // بدعة تخصيص الثوب الأبيض أو الأخضر
  FACE_VEIL_SADL = 'FACE_VEIL_SADL', // سدل الخمار وتغطية الوجه بحضرة الأجانب
  TAWAF_NO_RAMAL = 'TAWAF_NO_RAMAL', // لا رمل ولا اضطباع ولا هرولة للمرأة
  MENSTRUATION_AFTER_TAWAF = 'MENSTRUATION_AFTER_TAWAF', // من طافت ثم أتاها الحيض قبل السعي
  TAQSEER_HAIR_CUT = 'TAQSEER_HAIR_CUT', // التقصير قدر أنملة فقط ولا حلق
  SHOE_SOCKS_PERMITTED = 'SHOE_SOCKS_PERMITTED', // جواز لبس الجوارب والخفين العاديين
  SHARIA_HIJAB_CONDITIONS = 'SHARIA_HIJAB_CONDITIONS', // شروط الحجاب الثمانية في الحرمين
  VISITING_PROPHET_MOSQUE = 'VISITING_PROPHET_MOSQUE', // الصلاة بالمسجد النبوي والروضة دون زيارة القبور
  ISTIHADAH_DIFFERENCE = 'ISTIHADAH_DIFFERENCE', // الفرق بين الحيض والاستحاضة في الطواف
}

export interface WomenFiqhItem {
  id: WomenFiqhTopic;
  titleAr: string;
  questionAr: string;
  rulingAr: string;
  practicalGuidance: string;
  sourceText?: string;
  madhhabNoteAr?: string;
  madhhabNoteEn?: string;
  references: KnowledgeReference[];
}

export class WomenFiqhCatalog {
  private items: Map<WomenFiqhTopic, WomenFiqhItem> = new Map([
    [
      WomenFiqhTopic.MIQAT_MENSTRUATION,
      {
        id: WomenFiqhTopic.MIQAT_MENSTRUATION,
        titleAr: 'وصول المرأة للميقات وهي حائض أو نفساء',
        questionAr: 'إذا بلغت المرأة الميقات وهي حائض أو نُفساء، فهل تحرم أم تؤخر إحرامها حتى تطهر بمكة؟',
        rulingAr:
          'تغتسل وتُحرم مع الناس من الميقات وجوباً، وتفعل كل ما يفعله المعتمر من الذكر والدعاء والتلبية، غير أنها لا تطوف بالبيت حتى تطهر وتغتسل.',
        practicalGuidance:
          'لا يجوز لها تجاوز الميقات دون إحرام، بل تنوي وتلبي. إذا وصلت مكة تنتظر في الفندق حتى تطهر، ثم تغتسل وتذهب لأداء الطواف والسعي. ولا يجوز لها تقديم سعي العمرة على الطواف بحال.',
        sourceText: 'حديث عائشة رضي الله عنها حين حاضت في سرف فقال لها النبي ﷺ: «افْعَلِي مَا يَفْعَلُ الْحَاجُّ غَيْرَ أَنْ لا تَطُوفِي بِالْبَيْتِ حَتَّى تَطْهُرِي». (متفق عليه)',
        references: [REF_CATALOG.AGREED_AISHA_HAID_MIQAT],
      },
    ],
    [
      WomenFiqhTopic.IHRAM_CLOTHING,
      {
        id: WomenFiqhTopic.IHRAM_CLOTHING,
        titleAr: 'صفة لباس إحرام المرأة وما يحرم عليها لبسه',
        questionAr: 'ما هو اللباس المخصص لإحرام المرأة؟ وما الذي يحرم عليها ارتداؤه؟',
        rulingAr:
          'ليس للمرأة لباس محدد للإحرام، بل تُحرم في لباسها المعتاد الساتر الفضفاض الذي لا زينة فيه ولا يصف جسدها. ويحرم عليها شيئان فقط: النقاب (البُرقُع) والقفازان.',
        practicalGuidance:
          'تلبس المرأة ثيابها الساترة المعتادة. يحرم عليها لبس النقاب المفصل للوجه أو القفازين، وتغطي وجهها بسدل خمارها على وجهها عند مرور الرجال الأجانب دون الحاجة لعصابة أو طربوش.',
        sourceText: 'قوله ﷺ: «لا تَنْتَقِبِ المَرْأَةُ المُحْرِمَةُ، ولا تَلْبَسِ القُفَّازَيْنِ». (رواه البخاري 1838)',
        references: [REF_CATALOG.BUKHARI_1838_WOMEN_IHRAM],
      },
    ],
    [
      WomenFiqhTopic.WHITE_GREEN_BIDAH,
      {
        id: WomenFiqhTopic.WHITE_GREEN_BIDAH,
        titleAr: 'بدعة تخصيص الثوب الأبيض أو الأخضر لإحرام المرأة',
        questionAr: 'هل يجب أو يُستحب للمرأة أن تلبس ثوباً أبيض أو أخضر للإحرام كما يعتقد البعض؟',
        rulingAr:
          'تخصيص ثوب أبيض أو أخضر لإحرام المرأة لا أصل له في الشرع وهو من البدع والمحدثات.',
        practicalGuidance:
          'يجوز لها الإحرام في الأسود أو الكحلي أو البني أو أي لون ساتر غير لافت. أما لبس الأبيض للمرأة فقد عده العلماء مكروهاً لما فيه من التشبه بالرجال أو التبرج إذا لفت الأنظار، كما أن وضع لفافة بيضاء خاصة على الرأس بدعة محدثة.',
        sourceText: '«دليل المعتمر» ص 17 و 54: تخصيص بعض العامة إحرام المرأة في الأخضر أو الأبيض لا أصل له.',
        references: [REF_CATALOG.UTAYR_DALIL_MUTAMIR],
      },
    ],
    [
      WomenFiqhTopic.FACE_VEIL_SADL,
      {
        id: WomenFiqhTopic.FACE_VEIL_SADL,
        titleAr: 'سدل الخمار على الوجه بحضرة الرجال الأجانب',
        questionAr: 'كيف تغطي المحرمة وجهها إذا مر بها رجال أجانب مع تحريم النقاب؟',
        rulingAr:
          'تسدل خمارها أو جلبابها من فوق رأسها على وجهها، ولا يضر إن مس الخمار وجهها، وبدعة وضع (العصابة أو الطربوش) لرفع الخمار لا أصل لها.',
        practicalGuidance:
          'كانت أمهات المؤمنين والصحابيات يسدلن أثوابهن على وجوههن إذا حاذاهن الركبان، فإذا جاوزوهن كشفن وجوههن. ومس الخمار للوجه جائز تماماً ولا فدية فيه.',
        sourceText: 'حديث عائشة رضي الله عنها: «كَانَ الرُّكْبَانُ يَمُرُّونَ بِنَا وَنَحْنُ مَعَ رَسُولِ اللَّهِ ﷺ مُحْرِمَاتٌ، فَإِذَا حَاذَوْا بِنَا سَدَلَتْ إِحْدَانَا جِلْبَابَهَا مِنْ رَأْسِهَا عَلَى وَجْهِهَا، فَإِذَا جَاوَزُونَا كَشَفْنَاهُ». (أبو داود 1833)',
        references: [REF_CATALOG.ABU_DAWUD_1833_SADL],
      },
    ],
    [
      WomenFiqhTopic.TAWAF_NO_RAMAL,
      {
        id: WomenFiqhTopic.TAWAF_NO_RAMAL,
        titleAr: 'الرمل والاضطباع والهرولة لا يُشرع للنساء مطلقاً',
        questionAr: 'هل ترمل المرأة في الأشواط الأولى للطواف أو تسرع بين العلمين الأخضرين في السعي؟',
        rulingAr:
          'إجماع العلماء على أنه لا رمل ولا اضطباع ولا هرولة على النساء في طواف ولا سعي.',
        practicalGuidance:
          'تمشي المرأة مشياً عادياً هادئاً بسكينة وتستر في جميع أشواط الطواف والسعي. وتطوف من وراء الرجال في الأطراف لتجنب الاحتكاك والزحام، وذلك أعظم لأجرها من الطواف قرب الكعبة مع مزاحمة الرجال.',
        sourceText: 'ابن المنذر والإمام النووي: أجمع أهل العلم على أن المرأة لا رمل عليها حول البيت ولا بين الصفا والمروة، وشأنها الستر.',
        references: [REF_CATALOG.UTAYR_DALIL_MUTAMIR],
      },
    ],
    [
      WomenFiqhTopic.MENSTRUATION_AFTER_TAWAF,
      {
        id: WomenFiqhTopic.MENSTRUATION_AFTER_TAWAF,
        titleAr: 'نزول الحيض بعد إتمام الطواف وقبل السعي',
        questionAr: 'امرأة طافت بالبيت طوافاً صحيحاً، ثم أتاها الحيض قبل أن تسعى، فهل تسعى أم تنتظر؟',
        rulingAr:
          'تسعى بين الصفا والمروة وهي حائض وتتم عمرتها وتقصر من شعرها وتتحلل، وعمرتها صحيحة تامة.',
        practicalGuidance:
          'لأن الطهارة شرط لصحة الطواف بالبيت، وليست شرطاً لصحة السعي بين الصفا والمروة، بل السعي تصح فيه الطهارة استحباباً فقط، والمسعى ليس جزءاً من المسجد الذي يُمنع الحائض من المكث فيه.',
        sourceText: '«دليل المعتمر» ص 44: لو حاضت المرأة أو نفست بعد الطواف سعت وأجزأها ذلك لأن الطهارة في السعي مستحبة وليست شرطاً.',
        references: [REF_CATALOG.UTAYR_DALIL_MUTAMIR],
      },
    ],
    [
      WomenFiqhTopic.TAQSEER_HAIR_CUT,
      {
        id: WomenFiqhTopic.TAQSEER_HAIR_CUT,
        titleAr: 'صفة تقصير المرأة لشعرها للتحلل من العمرة',
        questionAr: 'كيف تتحلل المرأة من عمرتها؟ وهل تحلق رأسها؟',
        rulingAr:
          'المرأة لا يُشرع لها الحلق بالإجماع، بل الواجب عليها التقصير فقط.',
        practicalGuidance:
          'تجمع أطراف شعرها أو كل ضفيرة وتقص منها قدر (أنملة الأصبع) فقط، أي ما يقارب 1.5 إلى 2 سم من أسفل الشعر. ولا يجوز لها الحلق بالموسى كالرجال، كما يحرم عليها كشف شعرها للقص أمام الرجال في المروة، بل تقصر في غرفتها بالفندق.',
        sourceText: 'قوله ﷺ: «لَيْسَ عَلَى النِّسَاءِ حَلْقٌ، إِنَّمَا عَلَى النِّسَاءِ التَّقْصِيرُ». (رواه أبو داود وصححه الألباني)',
        references: [REF_CATALOG.ABU_DAWUD_1984_WOMEN_TAQSEER],
      },
    ],
    [
      WomenFiqhTopic.SHOE_SOCKS_PERMITTED,
      {
        id: WomenFiqhTopic.SHOE_SOCKS_PERMITTED,
        titleAr: 'جواز لبس الجوارب (الشرابات) والأحذية المخيطة للمرأة',
        questionAr: 'هل يجوز للمرأة المحرمة لبس الجوارب أو الأحذية العادية؟',
        rulingAr:
          'يجوز للمرأة المحرمة لبس الجوارب والخفين والأحذية المخيطة دون أي كراهة.',
        practicalGuidance:
          'النهي عن المخيط خاص بالرجال فقط، أما المرأة فرجلاها عورة في الصلاة والطواف، ويسن لها لبس الجوارب لستر قدميها عن أنظار الأجانب أثناء المشي.',
        sourceText: 'صحيح البخاري (1838): اقتصر النهي على النقاب والقفازين، وأقرَّ العلماء جواز الجوارب والمخيط للمرأة («دليل المعتمر»).',
        references: [REF_CATALOG.BUKHARI_1838_WOMEN_IHRAM, REF_CATALOG.UTAYR_DALIL_MUTAMIR],
      },
    ],
    [
      WomenFiqhTopic.SHARIA_HIJAB_CONDITIONS,
      {
        id: WomenFiqhTopic.SHARIA_HIJAB_CONDITIONS,
        titleAr: 'شروط الحجاب الشرعي للمعتمرة داخل الحرمين',
        questionAr: 'ما هي مواصفات العباءة والحجاب الشرعي المقبول في أقدس البقاع؟',
        rulingAr:
          'الحجاب عبادة يُقصد به الستر لا الزينة، ويجب أن تتوافر فيه ثمانية شروط شرعية.',
        practicalGuidance:
          '1. ساتر لجميع البدن. 2. فضفاض واسع لا يحدد تقاطيع الجسم. 3. غير شفاف. 4. ليس زينة في نفسه كالمطرز والمذهب والملون اللافت. 5. غير معطر ولا مبخر. 6. لا يشبه لباس الرجال. 7. لا يشبه لباس الكافرات. 8. ليس ثوب شهرة.',
        sourceText: '«دليل المعتمر» ص 128: الحجاب شرع للستر وليس للزينة ولفت الأنظار، فاحذري من الألبسة المتبرجة التي تسوق على أنها حجاب.',
        references: [REF_CATALOG.UTAYR_DALIL_MUTAMIR],
      },
    ],
    [
      WomenFiqhTopic.VISITING_PROPHET_MOSQUE,
      {
        id: WomenFiqhTopic.VISITING_PROPHET_MOSQUE,
        titleAr: 'زيارة المرأة للمسجد النبوي والروضة الشريفة وحكم المقابر',
        questionAr: 'هل تزور المرأة قبر النبي ﷺ والشهداء في البقيع وأحد؟',
        rulingAr:
          'يُشرع للمرأة الصلاة في المسجد النبوي ودخول الروضة الشريفة بتصريح نسك، لكن لا تزور القبور على القول الراجح في «دليل المعتمر».',
        practicalGuidance:
          'تصلي المرأة في الأقسام والروضة المخصصة للنساء بالمسجد النبوي، وتسلم على النبي ﷺ بالصلاة عليه من أي مكان داخل المسجد وخارجه فالملائكة تبلغه سلامها. وتجتنب النساء زيارة المقابر (كالبقيع وأحد) على فتوى سماحة الشيخ ابن باز والشيخ ابن عثيمين لحديث: «لَعَنَ الله زَوَّارَاتِ القُبُورِ» (مع وجود خلاف فقهي معتبر عند بعض المذاهب في الزيارة العابرة دون سفر خاص).',
        sourceText: '«دليل المعتمر» ص 85: الصلاة بالمسجد النبوي مشروعة للجميع، أما زيارة القبور فالراجح منع النساء منها حفظاً لهن.',
        madhhabNoteAr:
          'الخلاف المعتبر: يرى الحنفية وجمع من المالكية والشافعية جواز الزيارة العابرة دون إطالة أو تبرج أو إحداث، بينما يرى الحنابلة وابن باز المنع؛ كما أن بقيع الغرقد مخصص ميدانياً للرجال.',
        madhhabNoteEn:
          'Recognized school view: Hanafi, Maliki, and many Shafi’i jurists allow brief orderly visits without dedicated travel, while Ibn Baz & Hanbali scholars forbid them; Al-Baqi is operationally men-only.',
        references: [REF_CATALOG.UTAYR_DALIL_MUTAMIR, REF_CATALOG.AGREED_RAWDAH],
      },
    ],
    [
      WomenFiqhTopic.ISTIHADAH_DIFFERENCE,
      {
        id: WomenFiqhTopic.ISTIHADAH_DIFFERENCE,
        titleAr: 'الفرق بين الحيض والاستحاضة (النزيف غير المعتاد) للمعتمرة',
        questionAr: 'نزل دم خفيف بسبب التوتر أو السفر أو في غير وقت الدورة المعتادة، فهل أتوقف عن الطواف؟',
        rulingAr:
          'الاستحاضة (دم العرق أو النزيف الخارج عن صفة الحيض وزمنه المعتاد) لا تمنع من الصلاة ولا من الطواف.',
        practicalGuidance:
          'تتحفظ المرأة وتغتسل/تستنجي وتتوضأ لكل صلاة وعند إرادة الطواف، وتطوف وتسعى وتتم عمرتها كاملة دون تأخير، بخلاف دم الحيض المعروف بصفاته ووقته.',
        sourceText: 'حديث فاطمة بنت أبي حبيش: «إِنَّمَا ذَلِكَ عِرْقٌ وَلَيْسَ بِحَيْضٍ... فَتَوَضَّئِي لِكُلِّ صَلَاةٍ» (متفق عليه).',
        references: [REF_CATALOG.AGREED_ISTIHADAH],
      },
    ],
  ]);

  getAllItems(): WomenFiqhItem[] {
    return Array.from(this.items.values());
  }

  getItemByTopic(topic: WomenFiqhTopic): WomenFiqhItem | undefined {
    return this.items.get(topic);
  }
}
