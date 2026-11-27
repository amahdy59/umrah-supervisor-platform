/**
 * Centralized verified personal branding, licensing, community links,
 * curated zero-women visual assets, WhatsApp messaging presets, and
 * marketing copy for Sheikh Mostafa Flefel (Abshirou).
 *
 * Every URL, phone number, handle, follower count, and asset path matches
 * strictly verified public profiles and local assets in /images/.
 */

export interface BrandLocalizedText {
  ar: string;
  en: string;
}

export interface BrandImageAsset {
  id: string;
  src: string;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape' | 'square';
  caption: BrandLocalizedText;
  alt: BrandLocalizedText;
  sourceLabel: BrandLocalizedText;
}

export interface BrandSocialChannel {
  id: 'facebook-page' | 'facebook-profile' | 'youtube' | 'instagram' | 'whatsapp-group';
  platform: 'facebook' | 'youtube' | 'instagram' | 'whatsapp';
  icon: string;
  name: BrandLocalizedText;
  handle: string;
  metric: BrandLocalizedText;
  verifiedBadge: boolean;
  url: string;
}

export interface BrandFeaturedVideo {
  id: string;
  url: string;
  title: BrandLocalizedText;
  topic: BrandLocalizedText;
  viewsLabel: BrandLocalizedText;
}

export interface BrandMarketingTemplate {
  id: string;
  title: BrandLocalizedText;
  audience: BrandLocalizedText;
  message: BrandLocalizedText;
}

export interface WhatsAppIntentPreset {
  id: 'booking' | 'fiqh' | 'group' | 'join';
  icon: string;
  label: BrandLocalizedText;
  template: BrandLocalizedText;
}

export const SHEIKH_BRAND = {
  brandName: {
    ar: 'أبشروا',
    en: 'Abshirou',
  },
  name: {
    ar: 'الشيخ مصطفى فليفل (أبو رضوى)',
    en: 'Sheikh Mostafa Flefel (Abu Radwa)',
  },
  shortName: {
    ar: 'الشيخ مصطفى فليفل',
    en: 'Sheikh Mostafa Flefel',
  },
  roleTitle: {
    ar: 'مدير السياحة الدينية — شركة غرناطة للسياحة (ترخيص ١٠٩٤)',
    en: 'Director of Religious Tourism — Granada Tourism Co. (License 1094)',
  },
  secondaryTitles: {
    ar: 'مشرف سياحة دينية • داعية إسلامي • خريج كلية الشريعة والقانون بطنطا',
    en: 'Religious Tourism Supervisor • Islamic Preacher • Faculty of Sharia & Law, Tanta',
  },
  supervisorExperience: {
    ar: 'مشرف سياحة دينية (منذ ١٣ أبريل ٢٠٢٥ حتى الآن)',
    en: 'Religious Tourism Supervisor (since April 13, 2025 – present)',
  },
  education: {
    ar: 'الفقه والقانون — كلية الشريعة والقانون، طنطا',
    en: 'Fiqh & Law — Faculty of Sharia & Law, Tanta',
  },
  agencyName: {
    ar: 'شركة غرناطة للسياحة',
    en: 'Granada Tourism Co.',
  },
  agencyLicense: '1094',
  agencyAddress: {
    ar: 'صلاح سالم، القاهرة، مصر',
    en: 'Salah Salem, Cairo, Egypt',
  },
  homeBase: {
    ar: 'القاهرة / أشمون، المنوفية — مصر',
    en: 'Cairo / Ashmun, Monufia — Egypt',
  },
  missionQuote: {
    ar: 'نشر سماحة الإسلام، وبث الأمل والطمأنينة في القلوب من رحاب مكة المكرمة والمدينة المنورة، مع إشراف شرعي وتنظيمي متكامل لضيوف الرحمن.',
    en: 'Spreading the peaceful message of Islam and heartfelt serenity from Makkah and Madinah, alongside structured Sharia & logistical care for pilgrims.',
  },
  channelBio: {
    ar: 'قناة دعوية تهدف إلى نشر سماحة الإسلام، وبث الأمل والطمأنينة في القلوب من رحاب الأماكن المقدسة. نقدم لكم نفحات إيمانية من قلب المدينة المنورة ومكة المكرمة، ودروساً في السيرة النبوية وأدعية تلامس الروح.',
    en: 'An Islamic channel dedicated to spreading the peaceful message of Islam and bringing hope to hearts. We share spiritual moments from the Holy Cities of Madinah and Makkah, along with lessons from the Seerah of Prophet Muhammad (PBUH) and heartfelt prayers.',
  },
  bookingHook: {
    ar: 'لو نفسك في العمرة معانا كلمني واتساب مباشرة: 01040414659',
    en: 'Planning your Umrah journey with us? Message directly on WhatsApp: +20 104 041 4659',
  },
  contact: {
    umrahWhatsappDisplay: '01040414659',
    umrahWhatsappIntl: '+201040414659',
    umrahWhatsappDigits: '201040414659',
    agencyPhoneDisplay: '01041060008',
    agencyPhoneIntl: '+201041060008',
    agencyPhoneDigits: '201041060008',
    whatsappGroupUrl: 'https://chat.whatsapp.com/JKJgvqRVRAD0mJ4ThjkLVh',
  },
  establishedYear: '2011',
  pageCreatedLabel: {
    ar: 'تأسست المنصة الرقمية منذ ٢٠١١ / ٢٠١٢',
    en: 'Verified Digital Presence since 2011 / 2012',
  },
} as const;

export const BRAND_IMAGES: Record<
  'avatar' | 'kaabaDua' | 'nabawiChamber' | 'kaabaDoor' | 'nabawiUmbrellas',
  BrandImageAsset
> = {
  avatar: {
    id: 'sheikh-avatar',
    src: '/images/brand/sheikh-mostafa-avatar.jpg',
    width: 512,
    height: 519,
    orientation: 'square',
    caption: {
      ar: 'الشيخ مصطفى فليفل في المسجد النبوي الشريف',
      en: 'Sheikh Mostafa Flefel at Al-Masjid an-Nabawi',
    },
    alt: {
      ar: 'صورة شخصية للشيخ مصطفى فليفل أمام مقصورة الحجرة الشريفة بالمسجد النبوي',
      en: 'Portrait of Sheikh Mostafa Flefel in front of the Sacred Chamber grille in Masjid an-Nabawi',
    },
    sourceLabel: {
      ar: 'الصورة التعريفية الرسمية — أبشروا',
      en: 'Official verified profile portrait',
    },
  },
  kaabaDua: {
    id: 'kaaba-dua',
    src: '/images/brand/sheikh-kaaba-dua.jpg',
    width: 1000,
    height: 1504,
    orientation: 'portrait',
    caption: {
      ar: 'الدعاء في صحن المطاف أمام الكعبة المشرفة — مكة المكرمة',
      en: 'Supplication in the Mataf before the Holy Kaaba — Makkah',
    },
    alt: {
      ar: 'الشيخ مصطفى فليفل بملابس الإحرام رافعاً يديه بالدعاء أمام الكعبة المشرفة في المسجد الحرام',
      en: 'Sheikh Mostafa Flefel in white Ihram raising his hands in dua before the Holy Kaaba in Makkah',
    },
    sourceLabel: {
      ar: 'الحساب الشخصي الموثق — مكة المكرمة',
      en: 'Verified personal profile — Makkah',
    },
  },
  nabawiChamber: {
    id: 'nabawi-chamber',
    src: '/images/brand/sheikh-nabawi-rawdah.jpg',
    width: 960,
    height: 1536,
    orientation: 'portrait',
    caption: {
      ar: 'في رحاب الحجرة الشريفة بالمسجد النبوي — المدينة المنورة',
      en: 'Inside Al-Masjid an-Nabawi by the Sacred Chamber — Madinah',
    },
    alt: {
      ar: 'الشيخ مصطفى فليفل بالزي الأبيض داخل المسجد النبوي أمام الشبك الذهبي للحجرة الشريفة',
      en: 'Sheikh Mostafa Flefel inside Al-Masjid an-Nabawi beside the golden Sacred Chamber grille',
    },
    sourceLabel: {
      ar: 'رحلات أبشروا — المدينة المنورة',
      en: 'Abshirou journeys — Madinah',
    },
  },
  kaabaDoor: {
    id: 'kaaba-door',
    src: '/images/makkah/kaaba-door.webp',
    width: 800,
    height: 500,
    orientation: 'landscape',
    caption: {
      ar: 'باب الكعبة المشرفة ومقام إبراهيم عليه السلام',
      en: 'Door of the Holy Kaaba & Maqam Ibrahim',
    },
    alt: {
      ar: 'باب الكعبة المشرفة بكسوتها المذهبة ومقام إبراهيم عليه السلام في المسجد الحرام',
      en: 'Door of the Holy Kaaba with golden calligraphy and Maqam Ibrahim in Masjid al-Haram',
    },
    sourceLabel: {
      ar: 'معالم المسجد الحرام — مكة المكرمة',
      en: 'Masjid al-Haram — Makkah',
    },
  },
  nabawiUmbrellas: {
    id: 'nabawi-umbrellas',
    src: '/images/madinah/nabawi-umbrellas.webp',
    width: 800,
    height: 500,
    orientation: 'landscape',
    caption: {
      ar: 'ساحات ومظلات المسجد النبوي والقبة الخضراء',
      en: 'Al-Masjid an-Nabawi Courtyard Umbrellas & Green Dome',
    },
    alt: {
      ar: 'مظلات ساحات المسجد النبوي الشريف والقبة الخضراء في المدينة المنورة عند الغروب',
      en: 'Courtyard shade umbrellas and Green Dome of Al-Masjid an-Nabawi in Madinah',
    },
    sourceLabel: {
      ar: 'معالم المسجد النبوي — المدينة المنورة',
      en: 'Al-Masjid an-Nabawi — Madinah',
    },
  },
};

export const BRAND_STATS = [
  {
    id: 'fb-page-followers',
    value: { ar: '+8.5 مليون', en: '8.5M+' },
    label: { ar: 'متابع لصفحة أبشروا الموثقة', en: 'Verified Abshirou FB Page' },
  },
  {
    id: 'fb-personal-followers',
    value: { ar: '811 ألف', en: '811K' },
    label: { ar: 'متابع لحساب الشيخ الموثق', en: 'Verified Personal Profile' },
  },
  {
    id: 'yt-views',
    value: { ar: '+25.1 مليون', en: '25.1M+' },
    label: { ar: 'مشاهدة على يوتيوب (@apopara14)', en: 'YouTube Views (@apopara14)' },
  },
  {
    id: 'license',
    value: { ar: 'ترخيص 1094', en: 'License #1094' },
    label: { ar: 'شركة غرناطة للسياحة المعتمدة', en: 'Granada Tourism Co.' },
  },
] as const;

export const WHATSAPP_DIRECT_INTENTS: readonly WhatsAppIntentPreset[] = [
  {
    id: 'booking',
    icon: '🕌',
    label: {
      ar: 'حجز واستفسار عمرة جديدة',
      en: 'Book / Inquire New Umrah',
    },
    template: {
      ar: 'السلام عليكم فضيلة الشيخ مصطفى فليفل، أرغب في معرفة مواعيد وأسعار أفواج العمرة القادمة مع مبادرة أبشروا وشركة غرناطة للسياحة (ترخيص 1094).',
      en: 'As-salamu alaykum Sheikh Mostafa Flefel, I would like details on upcoming Abshirou & Granada Tourism (License #1094) Umrah packages and dates.',
    },
  },
  {
    id: 'fiqh',
    icon: '📖',
    label: {
      ar: 'استشارة فقهية أو بالمناسك',
      en: 'Fiqh & Ritual Question',
    },
    template: {
      ar: 'السلام عليكم فضيلة الشيخ مصطفى فليفل، لديّ سؤال شرعي خاص بأحكام العمرة والمناسك وأرجو توجيهكم الكريم.',
      en: 'As-salamu alaykum Sheikh Mostafa Flefel, I have a religious ruling question regarding Umrah rituals and would appreciate your guidance.',
    },
  },
  {
    id: 'group',
    icon: '🧭',
    label: {
      ar: 'تنسيق ومتابعة داخل الفوج',
      en: 'Active Group Coordination',
    },
    template: {
      ar: 'السلام عليكم فضيلة الشيخ مصطفى، أتواصل معكم بخصوص تنسيق التجمع والانتقالات في الفوج الحالي.',
      en: 'As-salamu alaykum Sheikh Mostafa, reaching out regarding gathering point and live group coordination.',
    },
  },
  {
    id: 'join',
    icon: '👥',
    label: {
      ar: 'طلب الانضمام لجروب العمرة',
      en: 'Join Official Umrah Group',
    },
    template: {
      ar: 'السلام عليكم فضيلة الشيخ مصطفى فليفل، أود الانضمام لمتابعة رحلات العمرة وجروب المعتمرين على واتساب.',
      en: 'As-salamu alaykum Sheikh Mostafa Flefel, I would like to follow your upcoming Umrah announcements and WhatsApp community.',
    },
  },
] as const;

export const BRAND_PILLARS: Array<{
  id: string;
  icon: string;
  title: BrandLocalizedText;
  desc: BrandLocalizedText;
}> = [
  {
    id: 'sharia',
    icon: '⚖️',
    title: { ar: 'تأصيل شرعي أزهري موثوق', en: 'Verified Sharia Guidance' },
    desc: {
      ar: 'توجيهات المناسك والأحكام العملية على منهج الفقه والقانون (خريج كلية الشريعة والقانون بطنطا) بيسر وطمأنينة.',
      en: 'Clear, accessible Fiqh guidance rooted in Sharia & Law scholarship (Faculty of Sharia & Law, Tanta).',
    },
  },
  {
    id: 'licensed',
    icon: '🪪',
    title: { ar: 'تنظيم رسمي عبر شركة غرناطة', en: 'Licensed Organization (Granada #1094)' },
    desc: {
      ar: 'إدارة رحلات العمرة تحت مظلة شركة غرناطة للسياحة (ترخيص ١٠٩٤ — صلاح سالم، القاهرة) بمسؤولية إدارية واضحة.',
      en: 'Managed under licensed Granada Tourism Co. (License #1094, Salah Salem, Cairo) with accountable coordination.',
    },
  },
  {
    id: 'field',
    icon: '🧭',
    title: { ar: 'مرافقة ميدانية وتواصل فوري', en: 'Field Care & Direct WhatsApp Access' },
    desc: {
      ar: 'إرشاد خطوة بخطوة في الطواف والسعي والروضة الشريفة مع تواصل مباشر مع الشيخ مصطفى فليفل عبر واتساب أو بدون إنترنت.',
      en: 'Step-by-step companionship across Makkah & Madinah plus direct WhatsApp access to Sheikh Mostafa Flefel.',
    },
  },
];

export const BRAND_SOCIAL_LINKS: readonly BrandSocialChannel[] = [
  {
    id: 'facebook-page',
    platform: 'facebook',
    icon: '📘',
    name: {
      ar: 'صفحة أبشروا — مصطفى فليفل',
      en: 'Abshirou — Mostafa Flefel (Official Page)',
    },
    handle: '100064043891945',
    metric: { ar: '8.5 مليون متابع • صفحة موثقة', en: '8.5M followers • Verified' },
    verifiedBadge: true,
    url: 'https://www.facebook.com/people/%D8%A3%D8%A8%D8%B4%D8%B1%D9%88%D8%A7-%D9%85%D8%B5%D8%B7%D9%81%D9%89-%D9%81%D9%84%D9%8A%D9%81%D9%84/100064043891945/',
  },
  {
    id: 'facebook-profile',
    platform: 'facebook',
    icon: '👤',
    name: {
      ar: 'الحساب الشخصي — أبو رضوى مصطفى فليفل',
      en: 'Abu Radwa Mostafa Flefel (Personal Profile)',
    },
    handle: 'mstfy.flyfl',
    metric: { ar: '811 ألف متابع • حساب موثق', en: '811K followers • Verified' },
    verifiedBadge: true,
    url: 'https://www.facebook.com/mstfy.flyfl/',
  },
  {
    id: 'youtube',
    platform: 'youtube',
    icon: '▶️',
    name: {
      ar: 'قناة أبشروا الرسمية — يوتيوب',
      en: 'Abshirou Official YouTube',
    },
    handle: '@apopara14',
    metric: { ar: '90.4 ألف مشترك • 25.1M+ مشاهدة', en: '90.4K subs • 25.1M+ views' },
    verifiedBadge: false,
    url: 'https://www.youtube.com/@apopara14',
  },
  {
    id: 'instagram',
    platform: 'instagram',
    icon: '📸',
    name: {
      ar: 'إنستجرام أبشروا',
      en: 'Abshirou Instagram',
    },
    handle: '@apshro14',
    metric: { ar: '203 ألف متابع', en: '203K followers' },
    verifiedBadge: false,
    url: 'https://www.instagram.com/apshro14/',
  },
  {
    id: 'whatsapp-group',
    platform: 'whatsapp',
    icon: '💬',
    name: {
      ar: 'جروب العمرة الرسمي (واتساب)',
      en: 'Official Umrah WhatsApp Group',
    },
    handle: 'جروب العمرة',
    metric: { ar: 'إعلانات الأفواج والاستفسارات', en: 'Trip updates & direct Q&A' },
    verifiedBadge: false,
    url: 'https://chat.whatsapp.com/JKJgvqRVRAD0mJ4ThjkLVh',
  },
] as const;

export const BRAND_FEATURED_VIDEOS: readonly BrandFeaturedVideo[] = [
  {
    id: 'pEdZ71kcM0E',
    url: 'https://www.youtube.com/watch?v=pEdZ71kcM0E',
    title: {
      ar: 'أجمل لحظات مع المعتمرين أمام المسجد النبوي الشريف',
      en: 'Cherished moments with pilgrims before the Prophet’s Mosque in Madinah',
    },
    topic: { ar: 'المدينة المنورة', en: 'Madinah' },
    viewsLabel: { ar: '165 ألف مشاهدة', en: '165K views' },
  },
  {
    id: 'jAYxRMBjcic',
    url: 'https://www.youtube.com/watch?v=jAYxRMBjcic',
    title: {
      ar: 'الروضة الشريفة: ماذا تفعل عند دخول الروضة الشريفة؟',
      en: 'Al-Rawdah Al-Sharifah: Essential Etiquette & Guide',
    },
    topic: { ar: 'إرشاد الروضة', en: 'Rawdah Etiquette' },
    viewsLabel: { ar: '103 ألف مشاهدة', en: '103K views' },
  },
  {
    id: 'Jfti1KirM2U',
    url: 'https://www.youtube.com/watch?v=Jfti1KirM2U',
    title: {
      ar: 'دعاء الطواف حول الكعبة المشرفة من الحرم المكي',
      en: 'Supplications During Tawaf Around the Holy Kaaba',
    },
    topic: { ar: 'الطواف والدعاء', en: 'Tawaf Duas' },
    viewsLabel: { ar: '67 ألف مشاهدة', en: '67K views' },
  },
  {
    id: 'u7YHo6_zLWU',
    url: 'https://www.youtube.com/watch?v=u7YHo6_zLWU',
    title: {
      ar: 'شرح مناسك العمرة للمعتمرين خطوة بخطوة مع الشيخ مصطفى فليفل',
      en: 'Step-by-Step Umrah Rituals Explanation with Sheikh Mostafa Flefel',
    },
    topic: { ar: 'شرح المناسك', en: 'Ritual Guide' },
    viewsLabel: { ar: 'دليل الفوج الميداني', en: 'Group Field Briefing' },
  },
] as const;

export const MARKETING_BROADCAST_TEMPLATES: readonly BrandMarketingTemplate[] = [
  {
    id: 'umrah-invite',
    title: {
      ar: '📣 دعوة التقديم لأفواج العمرة (أبشروا × غرناطة ١٠٩٤)',
      en: '📣 Umrah Group Registration Invite (Abshirou × Granada #1094)',
    },
    audience: {
      ar: 'للراغبين في الحجز والاستعلام على واتساب',
      en: 'Prospective pilgrims & inquiries',
    },
    message: {
      ar: '✨ أبشروا لرحلات العمرة بإشراف الشيخ مصطفى فليفل (أبو رضوى)\n🏢 تحت مظلة شركة غرناطة للسياحة (ترخيص رقم 1094 — صلاح سالم، القاهرة)\n🤲 مرافقة علمية وروحية كاملة من لحظة السفر حتى العودة، وإرشاد ميداني في المسجد الحرام والمدينة المنورة.\n\n📲 لو نفسك في العمرة معانا كلمنا مباشرة على واتساب:\nhttps://wa.me/201040414659 (01040414659)\nأو هاتف الشركة: 01041060008\n🔗 جروب العمرة الرسمي: https://chat.whatsapp.com/JKJgvqRVRAD0mJ4ThjkLVh',
      en: '✨ Abshirou Umrah Journeys supervised by Sheikh Mostafa Flefel (Abu Radwa)\n🏢 Licensed under Granada Tourism Co. (License #1094 — Salah Salem, Cairo)\n🤲 Complete Sharia guidance and on-ground support across Makkah & Madinah.\n\n📲 Message directly on WhatsApp to inquire or reserve:\nhttps://wa.me/201040414659 (+20 104 041 4659)\nAgency phone: +20 104 106 0008\n🔗 Official Umrah WhatsApp Group: https://chat.whatsapp.com/JKJgvqRVRAD0mJ4ThjkLVh',
    },
  },
  {
    id: 'companion-share',
    title: {
      ar: '🧭 رسالة مشاركة تطبيق رفيق المعتمر + قنوات أبشروا',
      en: '🧭 Share Pilgrim Companion App + Official Channels',
    },
    audience: {
      ar: 'للمعتمرين المسجلين بالفوج وذويهم',
      en: 'Registered group members & families',
    },
    message: {
      ar: '🕋 أهلاً بكم في فوج أبشروا بإشراف الشيخ مصطفى فليفل (ترخيص غرناطة للسياحة 1094).\nيمكنكم متابعة مناسك الطواف والسعي، بوابات الحرم، أوقات الصلاة، والتواصل المباشر مع المشرف بدون إنترنت داخل الحرم عبر تطبيق «رفيق المعتمر».\n▶️ قناة أبشروا (يوتيوب): https://www.youtube.com/@apopara14\n📘 صفحة أبشروا (فيسبوك): https://www.facebook.com/share/1AEP9oRLcB\n📸 إنستجرام: https://www.instagram.com/apshro14/\n💬 استفسارات الواتساب المباشر: https://wa.me/201040414659 (01040414659)',
      en: '🕋 Welcome to the Abshirou Umrah Group supervised by Sheikh Mostafa Flefel (Granada Tourism License #1094).\nTrack your Tawaf/Sa’i rounds, Haram gates, prayer times, and instant WhatsApp support inside the Two Holy Mosques.\n▶️ Abshirou YouTube: https://www.youtube.com/@apopara14\n📘 Abshirou Facebook: https://www.facebook.com/share/1AEP9oRLcB\n📸 Instagram: https://www.instagram.com/apshro14/\n💬 Direct WhatsApp: https://wa.me/201040414659 (+20 104 041 4659)',
    },
  },
] as const;

export function buildMostafaDirectWhatsAppUrl(text: string): string {
  return `https://wa.me/${SHEIKH_BRAND.contact.umrahWhatsappDigits}?text=${encodeURIComponent(text)}`;
}
