/**
 * Verified Official Saudi & Haramain Resources Directory
 * Provides official portals, emergency hotlines, airport Zamzam rules, and Miqat travel guides.
 */

export interface OfficialResource {
  id: string;
  titleAr: string;
  category: 'PERMITS' | 'EMERGENCY' | 'TRANSPORT' | 'TRAVEL';
  summaryAr: string;
  actionLabelAr: string;
  urlOrTel: string;
}

export interface MiqatRouteGuide {
  id: string;
  routeAr: string;
  miqatNameAr: string;
  timingGuidanceAr: string;
}

export const OFFICIAL_SAUDI_RESOURCES: OfficialResource[] = [
  {
    id: 'nusuk-app',
    titleAr: 'منصة وتطبيق نُسك (Nusuk)',
    category: 'PERMITS',
    summaryAr:
      'المنصة الرسمية لحجز تصاريح العمرة والروضة الشريفة (بما فيها المسار الفوري بالمدينة)، وحجز عربات الحرمين الكهربائية (الخدمات ← النقل ← عربات الحرمين).',
    actionLabelAr: 'فتح موقع نُسك الرسمي',
    urlOrTel: 'https://www.nusuk.sa/',
  },
  {
    id: 'emergency-911',
    titleAr: 'العمليات الأمنية والطوارئ الموحد (911)',
    category: 'EMERGENCY',
    summaryAr: 'رقم الطوارئ الموحد في منطقتي مكة المكرمة والمدينة المنورة للبلاغات الأمنية والعاجلة.',
    actionLabelAr: 'اتصال 911',
    urlOrTel: 'tel:911',
  },
  {
    id: 'ambulance-997',
    titleAr: 'الهلال الأحمر السعودي للإسعاف (997)',
    category: 'EMERGENCY',
    summaryAr: 'للحالات الطبية الطارئة والإغماء والإصابات؛ يُذكر للمسعف رقم البوابة أو العمود بدقة.',
    actionLabelAr: 'اتصال 997',
    urlOrTel: 'tel:997',
  },
  {
    id: 'moh-937',
    titleAr: 'مركز وزارة الصحة (937)',
    category: 'EMERGENCY',
    summaryAr: 'استشارات طبية مجانية 24/7 بعدة لغات، ومعرفة أقرب مستشفى أو مركز صحي ومواقع المنوَّمين.',
    actionLabelAr: 'اتصال 937',
    urlOrTel: 'tel:937',
  },
  {
    id: 'hajj-1966',
    titleAr: 'مركز عناية ضيوف الرحمن - وزارة الحج (1966)',
    category: 'EMERGENCY',
    summaryAr: 'الرقم الموحد لخدمة المعتمرين (1966 من الشرائح السعودية، أو 966920002814+ للشرائح الدولية والتجوال).',
    actionLabelAr: 'اتصال +966 92 000 2814',
    urlOrTel: 'tel:+966920002814',
  },
  {
    id: 'haramain-train',
    titleAr: 'قطار الحرمين السريع (HHR)',
    category: 'TRANSPORT',
    summaryAr:
      'الربط السريع بين جدة ومكة المكرمة والمدينة المنورة (~ساعتان وربع). يُشترط التقيد بوزن الأمتعة (حقيبة كبيرة + حقيبة يد لكل تذكرة).',
    actionLabelAr: 'حجز قطار الحرمين',
    urlOrTel: 'https://sar.hhr.sa/',
  },
  {
    id: 'makkah-bus',
    titleAr: 'حافلات مكة المكرمة (Makkah Bus)',
    category: 'TRANSPORT',
    summaryAr: 'حافلات نقل عام مكيفة تغطي المحاور الرئيسية ومسجد التنعيم ومحطة القطار بتعرفة اقتصادية (~4 ريالات).',
    actionLabelAr: 'موقع حافلات مكة',
    urlOrTel: 'https://makkahbus.sa/',
  },
];

export const MIQAT_ROUTE_GUIDES: MiqatRouteGuide[] = [
  {
    id: 'flight-jeddah',
    routeAr: '✈️ طيران مباشر إلى مطار جدة (من مصر / الشام / تركيا / أوروبا)',
    miqatNameAr: 'محاذاة الجحفة (رابغ) في الجو',
    timingGuidanceAr:
      'ينبه طاقم الطائرة قبل المحاذاة بنحو 20–30 دقيقة. ارتدِ ملابس الإحرام في المطار قبل الصعود لتفادي زحام دورات مياه الطائرة، واعقد النية ولَبِّ عند إعلان القبطان.',
  },
  {
    id: 'flight-madinah',
    routeAr: '🕌 الوصول إلى المدينة المنورة أولاً ثم التوجه لمكة',
    miqatNameAr: 'ميقات ذي الحليفة (أبيار علي)',
    timingGuidanceAr:
      'لا يلزم الإحرام في الطائرة المتجهة للمدينة؛ تغتسل وتلبس الإحرام في فندق المدينة، ثم تحرم وتلبي عند مسجد ميقات أبيار علي أثناء الانطلاق بالباص أو القطار.',
  },
  {
    id: 'haramain-train-makkah',
    routeAr: '🚄 قطار الحرمين من المدينة المنورة إلى مكة المكرمة',
    miqatNameAr: 'محاذاة ذي الحليفة عند تحرك القطار من محطة المدينة',
    timingGuidanceAr:
      'القطار لا يتوقف في أبيار علي؛ لذا استعد وارتدِ الإحرام في الفندق بالمدينة واعقد النية ولَبِّ فور تحرك القطار أو قبل خروجه من نطاق المدينة مباشرة.',
  },
  {
    id: 'taneem-makkah',
    routeAr: '🚌 تكرار عمرة من داخل مكة (للمقيمين أو بإذن)',
    miqatNameAr: 'مسجد التنعيم (ميقات السيدة عائشة رضي الله عنها)',
    timingGuidanceAr:
      'يبعد ~7–8 كم شمال المسجد الحرام. يُخرج إليه للإحرام إذا أراد المعتمر عمرة أخرى، مع التذكير أن الإكثار من الطواف والدعاء قد يكون أولى من تكرار العمرة في السفرة الواحدة عند جمع من العلماء.',
  },
];
