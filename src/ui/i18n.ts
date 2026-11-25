export type UiLanguage = 'ar' | 'en';

const LANG_STORAGE_KEY = 'umrah_ui_lang';

const DICTIONARY: Record<string, { ar: string; en: string }> = {
  'app.pilgrim.title': { ar: 'رفيق المعتمر', en: 'Pilgrim Companion' },
  'app.supervisor.title': { ar: 'غرفة عمليات مشرف العمرة', en: 'Supervisor Mission Control' },
  'nav.rituals': { ar: '🤲 مناسكي', en: '🤲 Rituals' },
  'nav.fiqh': { ar: '📖 الفقه', en: '📖 Fiqh' },
  'nav.packing': { ar: '🧳 الحقيبة ونُسك', en: '🧳 Packing & Nusuk' },
  'nav.gates': { ar: '🧭 البوابات والطوارئ', en: '🧭 Gates & SOS' },
  'nav.atlas': { ar: '⛩️ أبواب ومنافع الحرمين', en: '⛩️ Haramain Atlas' },
  'nav.ziyarat': { ar: '🕌 المزارات والميقات', en: '🕌 Ziyarat & Miqat' },
  'nav.women': { ar: '🧕 فقه المرأة', en: '🧕 Women Fiqh' },
  'nav.more': { ar: '☰ المزيد والأدوات', en: '☰ More & Tools' },
  'sup.nav.manifest': { ar: '🚌 الأفواج والتسكين', en: '🚌 Groups & Rooming' },
  'sup.nav.people': { ar: '👥 سجل الأشخاص', en: '👥 People CRM' },
  'sup.nav.gameya': { ar: '💰 الأقساط والجمعية', en: '💰 Installments' },
  'sup.nav.whatsapp': { ar: '💬 منشورات الواتساب', en: '💬 WhatsApp Hub' },
  'sup.nav.print': { ar: '🖨️ الطباعة و QR', en: '🖨️ Print & QR' },
  'sup.nav.sos': { ar: '🚨 الطوارئ', en: '🚨 SOS Center' },
  'sup.nav.women': { ar: '🧕 فقه النساء', en: '🧕 Women Guide' },
  'sup.nav.atlas': { ar: '⛩️ أطلس الحرمين', en: '⛩️ Haramain Atlas' },
  'sup.nav.logistics': { ar: '🧳 الأمتعة والطب', en: '🧳 Luggage & Medical' },
  'tools.sos': { ar: 'طوارئ', en: 'SOS' },
  'tools.senior': { ar: 'وضع كبار السن', en: 'Senior Mode' },
  'tools.theme': { ar: 'الوضع الليلي', en: 'Dark Mode' },
  'tools.themeLight': { ar: 'الوضع النهاري', en: 'Light Mode' },
  'tools.wake': { ar: 'منع إغلاق الشاشة', en: 'Keep Screen On' },
  'tools.lang': { ar: '🌐 English', en: '🌐 العربية' },
  'badge.cardTitle': { ar: 'بطاقة معتمر رقمية', en: 'Digital Pilgrim Badge' },
  'badge.accountBtn': { ar: '💳 حسابي وأقساطي', en: '💳 My Installments' },
  'compass.btn': { ar: '🧭 حدد أقرب بوابة لي الآن (GPS)', en: '🧭 Find Nearest Gate Now (GPS)' },
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
