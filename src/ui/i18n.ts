export type UiLanguage = 'ar' | 'en';

const LANG_STORAGE_KEY = 'umrah_ui_lang';

const DICTIONARY: Record<string, { ar: string; en: string }> = {
  // App Shell & Skip Link
  'nav.skip': { ar: 'تخطي إلى المحتوى الرئيسي', en: 'Skip to main content' },
  'app.pilgrim.title': { ar: 'رفيق المعتمر (Pilgrim Companion)', en: 'Pilgrim Companion' },
  'app.supervisor.title': { ar: 'غرفة عمليات مشرف العمرة (Mission Control)', en: 'Supervisor Mission Control' },
  'app.supervisor.subtitle': {
    ar: 'إدارة الأفواج المتزامنة والمتتابعة، سجل الأشخاص، والأقساط',
    en: 'Multi-Group Operations, Pilgrim CRM & Flexible Installments',
  },
  'app.pilgrim.footer': {
    ar: 'رفيق المعتمر • يعمل بدون إنترنت داخل الحرمين الشريفين •',
    en: 'Pilgrim Companion • Works Offline Inside Al-Haramain •',
  },
  'app.pilgrim.supervisorLink': { ar: 'دخول بوابة المشرفين', en: 'Supervisor Portal' },

  // Pilgrim Navigation (Desktop + Mobile + Popover)
  'nav.rituals': { ar: '🤲 مناسكي', en: '🤲 Rituals' },
  'nav.fiqh': { ar: '📖 الفقه', en: '📖 Fiqh' },
  'nav.packing': { ar: '🧳 الحقيبة ونُسك', en: '🧳 Packing & Nusuk' },
  'nav.gates': { ar: '🧭 البوابات والطوارئ', en: '🧭 Gates & SOS' },
  'nav.atlas': { ar: '⛩️ أبواب ومنافع الحرمين', en: '⛩️ Haramain Atlas' },
  'nav.ziyarat': { ar: '🕌 المزارات والميقات', en: '🕌 Ziyarat & Miqat' },
  'nav.women': { ar: '🧕 فقه المرأة', en: '🧕 Women Fiqh' },
  'nav.more': { ar: '☰ المزيد والأدوات', en: '☰ More & Tools' },
  'nav.popoverTitle': { ar: 'أقسام وأدوات إضافية', en: 'More Sections & Tools' },
  'nav.mobile.rituals': { ar: 'مناسكي', en: 'Rituals' },
  'nav.mobile.fiqh': { ar: 'الفقه', en: 'Fiqh' },
  'nav.mobile.packing': { ar: 'نُسك', en: 'Nusuk' },
  'nav.mobile.gates': { ar: 'البوابات', en: 'Gates' },
  'nav.mobile.more': { ar: 'المزيد', en: 'More' },

  // Supervisor Navigation
  'sup.nav.manifest': { ar: '🚌 الأفواج والتسكين', en: '🚌 Groups & Rooming' },
  'sup.nav.people': { ar: '👥 سجل الأشخاص', en: '👥 People CRM' },
  'sup.nav.gameya': { ar: '💰 الأقساط والجمعية', en: '💰 Installments' },
  'sup.nav.whatsapp': { ar: '💬 منشورات الواتساب', en: '💬 WhatsApp Hub' },
  'sup.nav.print': { ar: '🖨️ الطباعة و QR', en: '🖨️ Print & QR' },
  'sup.nav.sos': { ar: '🚨 الطوارئ', en: '🚨 SOS Center' },
  'sup.nav.women': { ar: '🧕 فقه النساء', en: '🧕 Women Guide' },
  'sup.nav.atlas': { ar: '⛩️ أطلس الحرمين', en: '⛩️ Haramain Atlas' },
  'sup.nav.logistics': { ar: '🧳 الأمتعة والطب', en: '🧳 Luggage & Medical' },
  'sup.nav.mobile.manifest': { ar: 'الأفواج', en: 'Groups' },
  'sup.nav.mobile.people': { ar: 'الأشخاص', en: 'People' },
  'sup.nav.mobile.gameya': { ar: 'الأقساط', en: 'Payments' },
  'sup.nav.mobile.whatsapp': { ar: 'الواتساب', en: 'WhatsApp' },
  'sup.popoverTitle': { ar: 'أقسام وأدوات المشرف', en: 'Supervisor Sections & Tools' },

  // Shared Header Tools
  'tools.sos': { ar: 'طوارئ', en: 'SOS' },
  'tools.senior': { ar: 'وضع كبار السن', en: 'Senior Mode' },
  'tools.seniorActive': { ar: 'خط كبير: مُفعّل', en: 'Large Text: ON' },
  'tools.theme': { ar: 'الوضع الليلي', en: 'Dark Mode' },
  'tools.themeLight': { ar: 'الوضع النهاري', en: 'Light Mode' },
  'tools.wake': { ar: 'منع إغلاق الشاشة', en: 'Keep Screen On' },
  'tools.wakeActive': { ar: 'الشاشة مضاءة ✓', en: 'Screen Awake ✓' },
  'tools.lang': { ar: '🌐 English', en: '🌐 العربية' },
  'tools.netOnline': { ar: 'جاهز أوفلاين ✅', en: 'Offline Ready ✅' },
  'tools.netOffline': { ar: 'وضع بدون إنترنت 📴', en: 'Offline Mode 📴' },
  'tools.newGroup': { ar: '➕ فوج جديد', en: '➕ New Group' },
  'tools.settings': { ar: '⚙️ إعدادات الفوج', en: '⚙️ Group Settings' },
  'tools.sync': { ar: '☁️ مزامنة', en: '☁️ Sync' },
  'tools.pinLock': { ar: '🔒 قفل', en: '🔒 Lock' },
  'tools.pilgrimApp': { ar: '🤲 تطبيق المعتمر', en: '🤲 Pilgrim App' },

  // Prayer Bar & Badge
  'prayer.makkahBtn': { ar: '🕋 مكة', en: '🕋 Makkah' },
  'prayer.madinahBtn': { ar: '🕌 المدينة', en: '🕌 Madinah' },
  'badge.cardTitle': { ar: 'بطاقة معتمر رقمية', en: 'Digital Pilgrim Badge' },
  'badge.editBtn': { ar: '✏️ تعديل بياناتي', en: '✏️ Edit Profile' },
  'badge.hotelLabel': { ar: 'الفندق بمكة:', en: 'Makkah Hotel:' },
  'badge.roomLabel': { ar: 'رقم الغرفة:', en: 'Room No.:' },
  'badge.busLabel': { ar: 'رقم الباص:', en: 'Bus No.:' },
  'badge.supPhoneLabel': { ar: 'هاتف المشرف:', en: 'Supervisor Phone:' },
  'badge.taxiBtn': { ar: '🚕 كارت التاكسي والأمن', en: '🚕 Taxi & Security Card' },
  'badge.nusukBtn': { ar: '📲 تصريح نُسك', en: '📲 Nusuk Permits' },
  'badge.accountBtn': { ar: '💳 حسابي وأقساطي', en: '💳 My Installments' },
  'badge.certBtn': { ar: '📜 الشهادة', en: '📜 Certificate' },
  'sos.cardTitle': { ar: '🚨 نداء الطوارئ ونقطة التجمع', en: '🚨 SOS Emergency & Meeting Point' },
  'sos.cardBadge': { ar: 'GPS + واتساب', en: 'GPS + WhatsApp' },
  'sos.cardDesc': {
    ar: 'إذا ضللت الطريق في الحرم، قف عند أقرب باب مرقم أو عمود مميز، واضغط الزر لإرسال موقعك الجغرافي للمشرف وإظهار بطاقة الفندق لرجل الأمن.',
    en: 'If you get lost inside the Haram, stand near the nearest numbered gate or pillar and tap below to send your GPS coordinates to your supervisor.',
  },
  'sos.meetingLabel': { ar: 'نقطة التجمع المعتمدة لفوجكم:', en: 'Group Meeting Point:' },
  'sos.triggerBtn': { ar: '🆘 أنا تائه — إرسال موقعي للمشرف', en: '🆘 Lost — Send My Location to Supervisor' },
  'sos.callBtn': { ar: '📞 اتصال مباشر', en: '📞 Call Supervisor' },

  // Rituals (Talbiyah, Tawaf, Sai, Focus)
  'talbiyah.title': {
    ar: '🔊 التلبية النبوية (من الميقات حتى بدء الطواف)',
    en: '🔊 Prophetic Talbiyah (Miqat until Tawaf)',
  },
  'talbiyah.badge': { ar: 'سُنّة الإحرام المؤكدة', en: 'Confirmed Ihram Sunnah' },
  'talbiyah.playBtn': { ar: 'تشغيل التلبية بالتكرار التلقائي', en: 'Play Talbiyah Loop' },
  'talbiyah.pauseBtn': { ar: 'إيقاف التلبية النبوية', en: 'Pause Talbiyah' },
  'talbiyah.stopBtn': { ar: '⏹️ إيقاف', en: '⏹️ Stop' },
  'tawaf.title': { ar: '🕋 عداد الطواف التفاعلي (7 أشواط)', en: '🕋 Interactive Tawaf Counter (7 Laps)' },
  'tawaf.reset': { ar: 'إعادة', en: 'Reset' },
  'tawaf.hint': {
    ar: 'الشوط الحالي (يبدأ وينتهي بمحاذاة الحجر الأسود — الكعبة عن يسارك)',
    en: 'Current Lap (Start/End aligned with Black Stone — Kaaba on your left)',
  },
  'tawaf.nextBtn': { ar: '✅ إتمام الشوط للتالي', en: '✅ Complete Lap' },
  'tawaf.ruknBtn': { ar: '📍 دعاء الركن اليماني', en: '📍 Yamani Corner Dua' },
  'tawaf.doubtBtn': {
    ar: '⚖️ نسيت أنا في أي شوط؟ احسب القاعدة الفقهية',
    en: '⚖️ Forgot lap count? Fiqh Uncertainty Rule',
  },
  'tawaf.focusBtn': { ar: '🎯 وضع الطواف المركّز (بدون تشتيت)', en: '🎯 Tawaf Focus Mode (Distraction-Free)' },
  'sai.title': { ar: '🚶‍♂️ عداد السعي بين الصفا والمروة', en: "🚶‍♂️ Sa'i Counter (Safa & Marwah)" },
  'sai.nextBtn': { ar: '✅ وصول الشوط للتالي', en: '✅ Reached Hill — Next Lap' },
  'sai.safaBtn': { ar: '⛰️ ذكر الوقوف على الصفا والمروة (صحيح مسلم)', en: '⛰️ Dhikr on Safa & Marwah (Sahih Muslim)' },
  'sai.focusBtn': { ar: '🎯 وضع السعي المركّز (بدون تشتيت)', en: "🎯 Sa'i Focus Mode (Distraction-Free)" },

  // Atlas, Ziyarat & Gates Headers & Filters
  'atlas.title': {
    ar: '⛩️ أطلس أبواب الكعبة والحرمين الشريفين ومنافعهما (بالصور الحقيقية)',
    en: '⛩️ Al-Haramain Gates, Kaaba Zones & Services Atlas (Real Photos)',
  },
  'atlas.badge': { ar: 'مكة المكرمة + المدينة المنورة', en: 'Makkah + Madinah' },
  'atlas.intro': {
    ar: 'تعرّف بالصور الواقعية على باب الكعبة المشرفة والملتزم وحِجر إسماعيل والمسعى، وأهم بوابات المسجد الحرام والمسجد النبوي، مع شرح كل الخدمات والمنافع المجانية المتاحة لخدمة المعتمر وكبار السن.',
    en: 'Explore real photography of the Kaaba zones, Masa, and numbered gates across Makkah & Madinah, along with free wheelchairs, Zamzam stations, clinics, and accessibility services.',
  },
  'atlas.filter.all': { ar: '🕌 الكل', en: '🕌 All' },
  'atlas.filter.kaaba': { ar: '🕋 الكعبة والمسعى', en: '🕋 Kaaba & Masa' },
  'atlas.filter.makkah': { ar: '🚪 أبواب الحرم المكي', en: '🚪 Makkah Gates' },
  'atlas.filter.madinah': { ar: '🌴 المسجد النبوي والروضة', en: '🌴 Madinah & Rawdah' },
  'atlas.benefitsTitle': {
    ar: '🎁 الخدمات والمنافع المجانية وفضائل العبادة داخل الحرمين',
    en: '🎁 Free Services, Senior Accessibility & Blessings Inside Al-Haramain',
  },
  'atlas.benefitsBadge': { ar: 'اغتنمها في رحلتك', en: 'Essential Pilgrim Benefits' },
  'ziyarat.miqatTitle': { ar: '🧭 دليل الميقات حسب مسار سفرك', en: '🧭 Miqat Guide by Travel Route' },
  'ziyarat.miqatBadge': { ar: 'طيران / باص / قطار الحرمين', en: 'Flight / Bus / Haramain Train' },
  'ziyarat.madinahHeading': { ar: '🌴 مزارات المدينة المنورة', en: '🌴 Madinah Historical Ziyarat Sites' },
  'ziyarat.makkahHeading': { ar: '🕋 معالم مكة المكرمة', en: '🕋 Makkah Landmarks & Shrines' },
  'ziyarat.fieldTitle': {
    ar: '🏛️ إرشادات ميدانية رسمية بالحرمين والمطار (العربات، زمزم، والضياع)',
    en: '🏛️ Official Field Guides (Wheelchairs, Zamzam Rules & Lost Item Protocol)',
  },
  'ziyarat.fieldBadge': { ar: 'مصادر رسمية موثقة', en: 'Verified Official Guidance' },

  // Gates & Compass
  'gates.title': { ar: '🧭 دليل بوابات الحرم المكي المصحح ومسار الفندق', en: '🧭 Corrected Haram Gates & Hotel Wayfinder' },
  'gates.atlasBtn': { ar: '⛩️ أطلس كل الأبواب والمنافع بالصور', en: '⛩️ Full Photo Atlas' },
  'gates.hotelLabel': { ar: 'اختر منطقة فندق إقامتك:', en: 'Select Your Hotel Area:' },
  'compass.btn': { ar: '🧭 حدد أقرب بوابة لي الآن (GPS)', en: '🧭 Find Nearest Gate Now (GPS)' },

  // Supervisor Atlas & Filters
  'sup.atlas.title': {
    ar: '⛩️ الدليل المصوّر لأبواب الحرمين ومنافعهما والمعالم (مرجع المشرف)',
    en: '⛩️ Al-Haramain Gates, Services & Ziyarat Photo Reference (Supervisor)',
  },
  'sup.atlas.badge': { ar: 'صور حقيقية لمكة والمدينة', en: 'Authentic Makkah & Madinah Photos' },
  'sup.atlas.filter.all': { ar: '🕌 الكل', en: '🕌 All' },
  'sup.atlas.filter.makkah': { ar: '🕋 مكة وأبوابها', en: '🕋 Makkah & Gates' },
  'sup.atlas.filter.madinah': { ar: '🌴 المدينة والروضة', en: '🌴 Madinah & Rawdah' },
  'sup.atlas.filter.ziyarat': { ar: '⛰️ المزارات والمشاعر', en: '⛰️ Ziyarat Sites' },
  'sup.atlas.benefitsTitle': {
    ar: '🎁 منافع وخدمات الحرمين الشريفين للمعتمرين',
    en: '🎁 Free Al-Haramain Services & Pilgrim Support',
  },
};

let currentLang: UiLanguage = 'ar';

export function getCurrentLanguage(): UiLanguage {
  return currentLang;
}

export function t(key: string): string {
  const entry = DICTIONARY[key];
  if (!entry) return key;
  return entry[currentLang];
}

export function getDictionaryKeys(): string[] {
  return Object.keys(DICTIONARY);
}

export function getDictionaryEntry(key: string): { ar: string; en: string } | undefined {
  return DICTIONARY[key];
}

export function applyLanguage(lang: UiLanguage): void {
  currentLang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key && DICTIONARY[key]) {
      el.textContent = DICTIONARY[key][lang];
    }
  });

  document.querySelectorAll<HTMLElement>('[data-lang-toggle]').forEach((btn) => {
    btn.textContent = DICTIONARY['tools.lang'][lang];
    btn.setAttribute('aria-label', lang === 'ar' ? 'Switch interface to English' : 'التبديل إلى اللغة العربية');
  });

  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // ignore storage restriction
  }
}

export function initLanguage(): UiLanguage {
  let saved: UiLanguage = 'ar';
  try {
    const raw = localStorage.getItem(LANG_STORAGE_KEY);
    if (raw === 'en' || raw === 'ar') saved = raw;
  } catch {
    saved = 'ar';
  }
  applyLanguage(saved);
  return saved;
}

export function toggleLanguage(): UiLanguage {
  const next: UiLanguage = currentLang === 'ar' ? 'en' : 'ar';
  applyLanguage(next);
  return next;
}
