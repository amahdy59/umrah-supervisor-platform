/**
 * Standardized Reference & Provenance Schema for Islamic Jurisprudence (Fiqh),
 * Haramain Gates, Field Operations, and Official Saudi Government Resources.
 */

export type ReferenceKind =
  | 'QURAN'
  | 'HADITH'
  | 'FATWA'
  | 'OFFICIAL_AUTHORITY'
  | 'FIELD_TARIFF';

export interface KnowledgeReference {
  id: string;
  kind: ReferenceKind;
  bookOrAuthorityAr: string;
  bookOrAuthorityEn: string;
  citationAr: string;
  citationEn: string;
  gradeOrScopeAr?: string;
  gradeOrScopeEn?: string;
  url?: string;
  lastVerified: string;
}

export const EDITORIAL_METHODOLOGY = {
  titleAr: 'منهجية التوثيق والمصادر المعتمدة',
  titleEn: 'Editorial & Citation Methodology',
  summaryAr:
    'تُراجع جميع أحكام العمرة من القرآن الكريم وصحيحَي البخاري ومسلم والسنن الأربعة وفتاوى اللجنة الدائمة وسماحة الشيخ ابن باز والشيخ ابن عثيمين رحمهما الله، مع الإشارة للخلاف المعتبر عند المذاهب الأربعة. وتُوثَّق أرقام البوابات والعربات والتعرفة من الجهات السعودية الرسمية (وزارة الحج والعمرة - نُسك، الهيئة العامة للعناية بشؤون الحرمين، الطيران المدني GACA، وهيئة النقل العام).',
  summaryEn:
    'Ritual rulings are sourced from the Holy Quran, Sahih al-Bukhari, Sahih Muslim, the Four Sunan, and accredited fatwa councils (Lajnah Da’imah, Ibn Baz, Ibn Uthaymeen), noting recognized madhhab differences where relevant. Operational gates, carts, and fares reference Saudi official authorities (Ministry of Hajj / Nusuk, Two Holy Mosques Care Authority, GACA, Transport General Authority).',
  lastAudit: '1448 هـ / 2026-11',
};

export const REF_CATALOG = {
  BUKHARI_1838_WOMEN_IHRAM: {
    id: 'bukhari-1838',
    kind: 'HADITH' as const,
    bookOrAuthorityAr: 'صحيح البخاري',
    bookOrAuthorityEn: 'Sahih al-Bukhari',
    citationAr: 'حديث رقم 1838 — نهى النبي ﷺ المحرمة عن النقاب والقفازين',
    citationEn: 'Hadith #1838 — Prohibition of tailored niqab and gloves in Ihram',
    gradeOrScopeAr: 'صحيح',
    gradeOrScopeEn: 'Sahih (Agreed standard)',
    url: 'https://dorar.net/hadith/sharh/26544',
    lastVerified: '1448 هـ / 2026-11',
  },
  AGREED_AISHA_HAID_MIQAT: {
    id: 'agreed-haid-miqat',
    kind: 'HADITH' as const,
    bookOrAuthorityAr: 'صحيح البخاري (1650) ومسلم (1211)',
    bookOrAuthorityEn: 'Sahih al-Bukhari #1650 & Muslim #1211',
    citationAr: 'حديث عائشة بسرف: افعلي ما يفعل الحاج غير ألا تطوفي بالبيت',
    citationEn: 'Hadith of Aishah at Sarif: Perform all rites except Tawaf until purified',
    gradeOrScopeAr: 'متفق عليه',
    gradeOrScopeEn: 'Agreed Upon (Muttafaqun Alayh)',
    lastVerified: '1448 هـ / 2026-11',
  },
  BUKHARI_1613_BLACK_STONE_SIGN: {
    id: 'bukhari-1613',
    kind: 'HADITH' as const,
    bookOrAuthorityAr: 'صحيح البخاري',
    bookOrAuthorityEn: 'Sahih al-Bukhari',
    citationAr: 'حديث رقم 1613 — طاف النبي ﷺ على بعير وأشار إلى الركن وكبّر',
    citationEn: 'Hadith #1613 — Pointing to the Black Stone with Takbir without crowding',
    gradeOrScopeAr: 'صحيح',
    gradeOrScopeEn: 'Sahih',
    lastVerified: '1448 هـ / 2026-11',
  },
  AGREED_ISTIHADAH: {
    id: 'agreed-istihadah',
    kind: 'HADITH' as const,
    bookOrAuthorityAr: 'صحيح البخاري (306) ومسلم (333)',
    bookOrAuthorityEn: 'Sahih al-Bukhari #306 & Muslim #333',
    citationAr: 'حديث فاطمة بنت أبي حبيش: إنما ذلك عرق وليس بالحيضة فتوضئي لكل صلاة',
    citationEn: 'Istihadah ruling: non-menstrual spotting requires wudu without halting rituals',
    gradeOrScopeAr: 'متفق عليه',
    gradeOrScopeEn: 'Agreed Upon',
    lastVerified: '1448 هـ / 2026-11',
  },
  ABU_DAWUD_1833_SADL: {
    id: 'abudawud-1833',
    kind: 'HADITH' as const,
    bookOrAuthorityAr: 'سنن أبي داود (1833) وأحمد',
    bookOrAuthorityEn: 'Sunan Abi Dawud #1833',
    citationAr: 'حديث عائشة: كنا نسدل جلابيبنا من رؤوسنا على وجوهنا إذا حاذانا الركبان',
    citationEn: 'Draping headscarf over face in front of non-mahram men without headbands',
    gradeOrScopeAr: 'حسن/صحيح بشواهده',
    gradeOrScopeEn: 'Authenticated in Umrah guides',
    lastVerified: '1448 هـ / 2026-11',
  },
  ABU_DAWUD_1984_WOMEN_TAQSEER: {
    id: 'abudawud-1984',
    kind: 'HADITH' as const,
    bookOrAuthorityAr: 'سنن أبي داود (1984) والدارقطني',
    bookOrAuthorityEn: 'Sunan Abi Dawud #1984',
    citationAr: 'حديث ابن عباس: ليس على النساء حلق إنما على النساء التقصير',
    citationEn: 'No head shaving for women; only trimming a fingertip length of hair',
    gradeOrScopeAr: 'صححه الألباني',
    gradeOrScopeEn: 'Graded Sahih by Al-Albani',
    lastVerified: '1448 هـ / 2026-11',
  },
  MUSLIM_1218_SAFA_MARWA: {
    id: 'muslim-1218',
    kind: 'HADITH' as const,
    bookOrAuthorityAr: 'صحيح مسلم',
    bookOrAuthorityEn: 'Sahih Muslim',
    citationAr: 'حديث جابر الطويل رقم 1218 — صفة الوقوف على الصفا والمروة والذكر والتكبير',
    citationEn: 'Hadith of Jabir #1218 — Supplications facing Qiblah at Safa and Marwah',
    gradeOrScopeAr: 'صحيح',
    gradeOrScopeEn: 'Sahih',
    lastVerified: '1448 هـ / 2026-11',
  },
  ABU_DAWUD_1892_RUKN_YAMANI: {
    id: 'abudawud-1892',
    kind: 'HADITH' as const,
    bookOrAuthorityAr: 'سنن أبي داود',
    bookOrAuthorityEn: 'Sunan Abi Dawud',
    citationAr: 'حديث رقم 1892 — الدعاء الثابت بين الركن اليماني والحجر الأسود',
    citationEn: 'Hadith #1892 — Supplication between the Yamani Corner and Black Stone',
    gradeOrScopeAr: 'حسن صحيح',
    gradeOrScopeEn: 'Hasan Sahih',
    lastVerified: '1448 هـ / 2026-11',
  },
  IBN_MAJAH_2043_FORGETTING: {
    id: 'ibnmajah-2043',
    kind: 'HADITH' as const,
    bookOrAuthorityAr: 'سنن ابن ماجه (2043) والقرآن (البقرة: 286)',
    bookOrAuthorityEn: 'Quran 2:286 & Sunan Ibn Majah #2043',
    citationAr: 'رفع الحرج والإثم عن الخطأ والنسيان في محظورات الإحرام غير الإتلاف',
    citationEn: 'No sin or ransom for inadvertent scent/hair mistakes forgiven upon awareness',
    gradeOrScopeAr: 'صححه الألباني',
    gradeOrScopeEn: 'Graded Sahih',
    lastVerified: '1448 هـ / 2026-11',
  },
  LAJNAH_MIQAT_CROSSING: {
    id: 'lajnah-miqat',
    kind: 'FATWA' as const,
    bookOrAuthorityAr: 'اللجنة الدائمة للإفتاء والشيخ ابن عثيمين',
    bookOrAuthorityEn: 'Permanent Committee (Lajnah) & Ibn Uthaymeen',
    citationAr: 'أثر ابن عباس (الموطأ): وجوب الرجوع للميقات لمن جاوزه، وإلا فدم شاة لفقراء الحرم',
    citationEn: 'Return to nearest Miqat (no dam) or slaughter a sacrificial sheep if unable',
    gradeOrScopeAr: 'فتوى جمهور الفقهاء',
    gradeOrScopeEn: 'Majority Scholarly Consensus',
    url: 'https://binbaz.org.sa/',
    lastVerified: '1448 هـ / 2026-11',
  },
  UTAYR_DALIL_MUTAMIR: {
    id: 'dalil-mutamir',
    kind: 'FATWA' as const,
    bookOrAuthorityAr: '«دليل المعتمر» (أبو محمد يوسف العطير) — فتاوى ابن باز وابن عثيمين',
    bookOrAuthorityEn: 'Dalil al-Mu’tamir — Reviewed against Ibn Baz & Ibn Uthaymeen Fatawa',
    citationAr: 'مراجعة أحكام المرأة في الطواف والسعي والملابس والزيارة (ص 17–128)',
    citationEn: 'Compiled authentic women-specific Umrah & Madinah rulings (pp. 17–128)',
    gradeOrScopeAr: 'موثق بفتاوى هيئة كبار العلماء',
    gradeOrScopeEn: 'Verified Senior Scholars Compilation',
    lastVerified: '1448 هـ / 2026-11',
  },
  AGREED_HARAM_MULTIPLIER: {
    id: 'agreed-100k',
    kind: 'HADITH' as const,
    bookOrAuthorityAr: 'صحيح البخاري (1190) ومسلم (1394) وأحمد (14694)',
    bookOrAuthorityEn: 'Bukhari #1190, Muslim #1394 & Ahmad #14694',
    citationAr: 'صلاة في المسجد النبوي خير من ألف صلاة، وفي المسجد الحرام بمائة ألف صلاة',
    citationEn: '1,000× prayer reward in Masjid an-Nabawi and 100,000× in Masjid al-Haram',
    gradeOrScopeAr: 'صحيح',
    gradeOrScopeEn: 'Sahih',
    lastVerified: '1448 هـ / 2026-11',
  },
  AGREED_RAWDAH: {
    id: 'agreed-rawdah',
    kind: 'HADITH' as const,
    bookOrAuthorityAr: 'صحيح البخاري (1196) ومسلم (1391)',
    bookOrAuthorityEn: 'Sahih al-Bukhari #1196 & Muslim #1391',
    citationAr: 'ما بين بيتي ومنبري روضة من رياض الجنة',
    citationEn: 'Between my house and my pulpit lies a garden from the gardens of Paradise',
    gradeOrScopeAr: 'متفق عليه',
    gradeOrScopeEn: 'Agreed Upon',
    lastVerified: '1448 هـ / 2026-11',
  },
  QUBA_IBN_MAJAH_1412: {
    id: 'ibnmajah-1412',
    kind: 'HADITH' as const,
    bookOrAuthorityAr: 'سنن ابن ماجه (1412) والنسائي (699)',
    bookOrAuthorityEn: 'Sunan Ibn Majah #1412 & An-Nasa’i #699',
    citationAr: 'من تطهر في بيته ثم أتى مسجد قباء فصلى فيه كان له كأجر عمرة',
    citationEn: 'Purifying at residence and praying in Quba carries the reward of an Umrah',
    gradeOrScopeAr: 'صححه الألباني',
    gradeOrScopeEn: 'Graded Sahih',
    lastVerified: '1448 هـ / 2026-11',
  },
  HARAMAIN_CARE_AUTHORITY: {
    id: 'haramain-care',
    kind: 'OFFICIAL_AUTHORITY' as const,
    bookOrAuthorityAr: 'الهيئة العامة للعناية بشؤون المسجد الحرام والمسجد النبوي',
    bookOrAuthorityEn: 'General Authority for the Care of the Affairs of the Two Holy Mosques',
    citationAr: 'أرقام البوابات الرسمية، عربات الطواف، أمانات الساحات، ومواقع مياه زمزم',
    citationEn: 'Official gate numbers, upper-floor cart zones, lockers, and Zamzam stations',
    url: 'https://www.alharamain.gov.sa/',
    lastVerified: '1448 هـ / 2026-11',
  },
  NUSUK_MINISTRY_HAJJ: {
    id: 'nusuk-official',
    kind: 'OFFICIAL_AUTHORITY' as const,
    bookOrAuthorityAr: 'وزارة الحج والعمرة السعودية — منصة نُسك',
    bookOrAuthorityEn: 'Saudi Ministry of Hajj & Umrah — Nusuk Portal',
    citationAr: 'تصاريح العمرة والروضة الشريفة وحجز عربات الحرمين الكهربائية',
    citationEn: 'Official permits for Umrah, Al-Rawdah (incl. Instant Track), and mobility carts',
    url: 'https://www.nusuk.sa/',
    lastVerified: '1448 هـ / 2026-11',
  },
  GACA_ZAMZAM_CIRCULAR: {
    id: 'gaca-zamzam',
    kind: 'OFFICIAL_AUTHORITY' as const,
    bookOrAuthorityAr: 'الهيئة العامة للطيران المدني السعودي (GACA)',
    bookOrAuthorityEn: 'General Authority of Civil Aviation (GACA)',
    citationAr: 'تعميم شحن عبوة واحدة (5 لتر) من مشروع سقيا زمزم بمنافذ المطارات المعتمدة (~12 ر.س)',
    citationEn: 'Aviation rule: one factory-sealed 5L Zamzam carton per passenger on dedicated belt (~12 SAR)',
    url: 'https://gaca.gov.sa/',
    lastVerified: '1448 هـ / 2026-11',
  },
  MAKKAH_TRANSPORT_TARIFF: {
    id: 'tga-makkah-bus',
    kind: 'FIELD_TARIFF' as const,
    bookOrAuthorityAr: 'الهيئة الملكية لمدينة مكة — مشروع حافلات مكة والهيئة العامة للنقل',
    bookOrAuthorityEn: 'Royal Commission for Makkah & Transport General Authority',
    citationAr: 'الأسعار الميدانية الاسترشادية لسيارات الأجرة بالعداد، حافلات مكة (~4 ر.س)، وقطار الحرمين',
    citationEn: 'Reference taxi ranges, flat Makkah Bus (~4 SAR), and official HHR station routes',
    url: 'https://makkahbus.sa/',
    lastVerified: '1448 هـ / 2026-11',
  },
  UMM_AL_QURA_CALENDAR: {
    id: 'umm-alqura',
    kind: 'OFFICIAL_AUTHORITY' as const,
    bookOrAuthorityAr: 'تقويم أم القرى الرسمي (الرياض / مكة المكرمة UTC+3)',
    bookOrAuthorityEn: 'Official Umm Al-Qura Calendar (UTC+3)',
    citationAr: 'زاوية الفجر 18.5°، العشاء +90 دقيقة بعد المغرب (و+120 دقيقة في رمضان المبارك)',
    citationEn: 'Fajr 18.5°, Isha +90 min post-Maghrib (+120 min during Ramadan per Umm Al-Qura)',
    lastVerified: '1448 هـ / 2026-11',
  },
} as const satisfies Record<string, KnowledgeReference>;
