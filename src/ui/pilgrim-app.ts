import { PrayerTimesEngine, CityLocation } from '../guidance/prayer-times.js';
import {
  TawafCounter,
  SaiCounter,
  HaramainBestPracticesCatalog,
} from '../guidance/rituals-and-best-practices.js';
import { ZiyaratGuideCatalog, ZiyaratCity } from '../guidance/ziyarat-guide.js';
import { FiqhAssistant } from '../guidance/whatsapp-and-fiqh.js';
import { WomenFiqhCatalog } from '../guidance/women-fiqh.js';
import { PackingCatalog, ChecklistCategory } from '../guidance/packing-checklist.js';
import { HaramGatesGuide } from '../guidance/haram-gates-guide.js';
import { CurrencyAndTaxiService } from '../financial/currency-and-taxi.js';
import { EmergencySOSDispatcher, Hotel, TripStatus } from '../operations/trip-logistics.js';
import { OFFICIAL_SAUDI_RESOURCES, MIQAT_ROUTE_GUIDES } from '../guidance/official-resources.js';
import {
  TRIP_STAGE_LABELS,
  escapeHtml,
  buildWhatsAppUrl,
  renderQrSvg,
  getMakkahHijriDate,
  showToast,
  copyToClipboard,
  setupDialogs,
  openDialogById,
  closeDialogById,
  initStickyHeaders,
  initThemeSync,
  toggleColorScheme,
  registerServiceWorkerAndNetworkStatus,
} from './shared.js';
import { dataUrlToBlob, idbDeleteBlob, idbGetBlob, idbSetBlob } from './storage.js';

interface PilgrimProfile {
  fullName: string;
  passportNumber: string;
  tripCode: string;
  tripTitle: string;
  tripStage: TripStatus;
  hotelKey: string;
  hotelNameAr: string;
  hotelNameEn: string;
  hotelAddressAr: string;
  hotelPhone: string;
  hotelLat: number;
  hotelLng: number;
  roomNumber: string;
  busNumber: string;
  supervisorName: string;
  supervisorPhone: string;
  meetingPoint: string;
  medicalNote: string;
}

const DEFAULT_PROFILE: PilgrimProfile = {
  fullName: 'أحمد محمود الشريف',
  passportNumber: 'A12345678',
  tripCode: '#UMR-1447',
  tripTitle: 'فوج عمرة شعبان المبارك',
  tripStage: TripStatus.IN_MAKKAH,
  hotelKey: 'kiswah',
  hotelNameAr: 'فندق أبراج الكسوة',
  hotelNameEn: 'Al Kiswah Towers Hotel',
  hotelAddressAr: 'التيسير، جرول، مكة المكرمة',
  hotelPhone: '+966125300000',
  hotelLat: 21.4312,
  hotelLng: 39.8165,
  roomNumber: '502 (الدور الخامس)',
  busNumber: 'باص رقم (1)',
  supervisorName: 'أبو عبد الرحمن',
  supervisorPhone: '+966501234567',
  meetingPoint: 'ساحة بوابة الملك عبد العزيز (بوابة 1) بجوار صيدلية برج الساعة',
  medicalNote: 'لا توجد حساسية أو حالات مزمنة مسجلة',
};

const HOTEL_PRESETS: Record<
  string,
  { nameAr: string; nameEn: string; addressAr: string; phone: string; lat: number; lng: number }
> = {
  kiswah: {
    nameAr: 'فندق أبراج الكسوة',
    nameEn: 'Al Kiswah Towers Hotel',
    addressAr: 'التيسير، جرول، مكة المكرمة',
    phone: '+966125300000',
    lat: 21.4312,
    lng: 39.8165,
  },
  clock: {
    nameAr: 'وقف الملك عبد العزيز (أبراج البيت)',
    nameEn: 'Abraj Al Bait / Clock Tower',
    addressAr: 'أجياد، أمام بوابة الملك عبد العزيز (بوابة 1)',
    phone: '+966125718888',
    lat: 21.4189,
    lng: 39.8257,
  },
  'jabal-omar': {
    nameAr: 'فنادق جبل عمر / هيلتون مكة',
    nameEn: 'Jabal Omar / Hilton Makkah',
    addressAr: 'شارع إبراهيم الخليل، الشبيكة، مكة المكرمة',
    phone: '+966125340000',
    lat: 21.4212,
    lng: 39.8209,
  },
  ghazza: {
    nameAr: 'فنادق الغزة وريع بخش',
    nameEn: 'Al Ghazza / Rea Bakhash Hotels',
    addressAr: 'حي الغزة، الجهة الشمالية الشرقية للحرم',
    phone: '+966125730000',
    lat: 21.4285,
    lng: 39.8295,
  },
};

const STAGE_RELEVANCE: Record<TripStatus, { hintAr: string; targetTab: string; ctaAr: string }> = {
  [TripStatus.DRAFT]: { hintAr: 'تحقق من جاهزية جواز السفر (صلاحية > 6 أشهر) وقائمة الحقيبة.', targetTab: 'packing', ctaAr: '🧳 افتح قائمة الحقيبة' },
  [TripStatus.REGISTRATION_OPEN]: { hintAr: 'تأكد من تفعيل تطبيق نُسك وحفظ تصاريح العمرة والروضة.', targetTab: 'packing', ctaAr: '📲 محفظة نُسك' },
  [TripStatus.PRE_DEPARTURE]: { hintAr: 'موعد التجهيز للسفر: راجع الحقيبة وتأكد من ارتداء الإحرام قبل صعود الطائرة.', targetTab: 'packing', ctaAr: '✅ راجع جاهزية الحقيبة' },
  [TripStatus.IN_TRANSIT]: { hintAr: 'أنت في طريقك للميقات: راجع مواضع الإحرام والتلبية ومحظورات الإحرام.', targetTab: 'ziyarat', ctaAr: '🧭 دليل الميقات' },
  [TripStatus.IN_MAKKAH]: { hintAr: 'أهلاً بك في مكة: استخدم عداد الطواف والسعي ودليل بوابات الحرم للعودة للفندق.', targetTab: 'rituals', ctaAr: '🕋 عداد الطواف والسعي' },
  [TripStatus.IN_MADINAH]: { hintAr: 'أهلاً بك في المدينة المنورة: راجع مزارات قباء وأحد وتصاريح الروضة الشريفة.', targetTab: 'ziyarat', ctaAr: '🌴 مزارات المدينة' },
  [TripStatus.RETURN_TRANSIT]: { hintAr: 'تذكير المغادرة: طواف الوداع، وضوابط عبوة زمزم (5 لتر) المغلفة بمطار جدة أو المدينة.', targetTab: 'ziyarat', ctaAr: '🛫 ضوابط زمزم والمطار' },
  [TripStatus.COMPLETED]: { hintAr: 'تقبل الله عمرتكم! يمكنك طباعة شهادة إتمام العمرة التذكارية من بطاقتك.', targetTab: 'rituals', ctaAr: '📜 عرض الشهادة' },
};

const STORAGE_KEYS = {
  PROFILE: 'umrah_pilgrim_profile_v2',
  TAWAF_LAP: 'umrah_tawaf_lap_v2',
  SAI_LAP: 'umrah_sai_lap_v2',
  PACKING: 'umrah_packing_checked',
  SENIOR: 'umrah_senior_mode_v2',
  RATES: 'umrah_sar_egp_rate_v2',
  NUSUK_UMRAH_IMG: 'umrah_nusuk_umrah_img_v2',
  NUSUK_RAWDAH_IMG: 'umrah_nusuk_rawdah_img_v2',
};

const prayerEngine = new PrayerTimesEngine();
const tawafCounter = new TawafCounter();
const saiCounter = new SaiCounter();
const haramainCatalog = new HaramainBestPracticesCatalog();
const ziyaratCatalog = new ZiyaratGuideCatalog();
const fiqhAssistant = new FiqhAssistant();
const womenFiqhCatalog = new WomenFiqhCatalog();
const packingCatalog = new PackingCatalog();
const gatesGuide = new HaramGatesGuide();
const currencyService = new CurrencyAndTaxiService();

let profile: PilgrimProfile = { ...DEFAULT_PROFILE };
let activePrayerCity: CityLocation = CityLocation.MAKKAH;
let isSeniorMode = false;
let isTalbiyahPlaying = false;
let talbiyahTimer: number | null = null;
let wakeLockSentinel: WakeLockSentinel | null = null;
let activeFocusMode: 'tawaf' | 'sai' = 'tawaf';
const nusukObjectUrls: Partial<Record<'umrah' | 'rawdah', string>> = {};

function loadProfile(): void {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (saved) {
      profile = { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
    }
  } catch {
    profile = { ...DEFAULT_PROFILE };
  }

  const params = new URLSearchParams(window.location.search);
  const keysMap: Array<[string, keyof PilgrimProfile]> = [
    ['name', 'fullName'],
    ['passport', 'passportNumber'],
    ['trip', 'tripTitle'],
    ['code', 'tripCode'],
    ['hotel', 'hotelNameAr'],
    ['address', 'hotelAddressAr'],
    ['hotelPhone', 'hotelPhone'],
    ['room', 'roomNumber'],
    ['bus', 'busNumber'],
    ['supName', 'supervisorName'],
    ['supPhone', 'supervisorPhone'],
    ['meeting', 'meetingPoint'],
    ['med', 'medicalNote'],
  ];

  let updatedFromUrl = false;
  for (const [paramKey, field] of keysMap) {
    const val = params.get(paramKey);
    if (val && val.trim()) {
      (profile[field] as string) = val.trim();
      updatedFromUrl = true;
    }
  }
  const stageParam = params.get('stage') as TripStatus | null;
  if (stageParam && Object.values(TripStatus).includes(stageParam)) {
    profile.tripStage = stageParam;
    updatedFromUrl = true;
  }
  const hotelKeyParam = params.get('hotelKey');
  if (hotelKeyParam && HOTEL_PRESETS[hotelKeyParam]) {
    profile.hotelKey = hotelKeyParam;
    const preset = HOTEL_PRESETS[hotelKeyParam];
    if (!params.get('hotel')) profile.hotelNameAr = preset.nameAr;
    profile.hotelNameEn = preset.nameEn;
    if (!params.get('address')) profile.hotelAddressAr = preset.addressAr;
    if (!params.get('hotelPhone')) profile.hotelPhone = preset.phone;
    profile.hotelLat = preset.lat;
    profile.hotelLng = preset.lng;
  }

  if (profile.tripStage === TripStatus.IN_MADINAH) {
    activePrayerCity = CityLocation.MADINAH;
  }

  if (updatedFromUrl) {
    saveProfile();
    showToast(`✅ تم تحميل بيانات بطاقتك: ${profile.fullName}`);
  }
}

function saveProfile(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

function renderProfileUI(): void {
  const setText = (id: string, val: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText('badge-trip-code', `كود الفوج: ${profile.tripCode}`);
  setText('badge-pilgrim-name', profile.fullName);
  setText('badge-passport', `رقم الجواز: ${profile.passportNumber}`);
  setText('badge-hotel', profile.hotelNameAr);
  setText('badge-room', profile.roomNumber);
  setText('badge-bus', profile.busNumber);
  setText('badge-sup-phone', profile.supervisorPhone);
  setText('sos-meeting-point', profile.meetingPoint);
  setText('header-trip-subtitle', `${profile.tripTitle} • ${TRIP_STAGE_LABELS[profile.tripStage]}`);

  // Stage relevance strip
  const rel = STAGE_RELEVANCE[profile.tripStage] || STAGE_RELEVANCE[TripStatus.IN_MAKKAH];
  const stageBadge = document.getElementById('stage-banner-label');
  const stageHint = document.getElementById('stage-banner-hint');
  const stageCta = document.getElementById('stage-banner-cta') as HTMLButtonElement | null;
  if (stageBadge) stageBadge.textContent = TRIP_STAGE_LABELS[profile.tripStage];
  if (stageHint) stageHint.textContent = rel.hintAr;
  if (stageCta) {
    stageCta.textContent = rel.ctaAr;
    stageCta.dataset.jumpTab = rel.targetTab;
  }

  const callSupLink = document.getElementById('call-supervisor-link') as HTMLAnchorElement | null;
  if (callSupLink) {
    callSupLink.href = `tel:${profile.supervisorPhone.replace(/\s+/g, '')}`;
  }

  const hotelEnEl = document.getElementById('taxi-hotel-ar');
  if (hotelEnEl) {
    hotelEnEl.innerHTML = `${escapeHtml(profile.hotelNameAr)} <span dir="ltr" style="display:inline-block;">(${escapeHtml(profile.hotelNameEn)})</span>`;
  }
  setText('taxi-hotel-addr', profile.hotelAddressAr);
  setText('taxi-hotel-phone', profile.hotelPhone);
  setText('taxi-sup-phone', profile.supervisorPhone);
  setText('sec-pilgrim-name', profile.fullName);
  setText('sec-hotel-info', `${profile.hotelNameAr} — ${profile.hotelAddressAr}`);
  setText('sec-sup-info', `${profile.supervisorName} (${profile.supervisorPhone})`);
  setText('sec-med-note', profile.medicalNote);

  const qrContainer = document.getElementById('pilgrim-badge-qr');
  if (qrContainer) {
    const qrPayload = `MECCA HOTEL: ${profile.hotelNameEn} | TEL: ${profile.hotelPhone} | SUP: ${profile.supervisorPhone} | PILGRIM: ${profile.fullName}`;
    qrContainer.innerHTML = renderQrSvg(qrPayload, 'رمز QR لبيانات المعتمر والفندق');
  }

  setText('cert-pilgrim-name', profile.fullName);
  setText('cert-trip-title', profile.tripTitle);
  setText('cert-hijri-date', getMakkahHijriDate());
  setText('cert-supervisor-name', `مشرف الفوج: ${profile.supervisorName} ✍️`);
  setText('nusuk-owner-meta', `المعتمر: ${profile.fullName} | الجواز: ${profile.passportNumber}`);

  const gateSelect = document.getElementById('hotel-gate-selector') as HTMLSelectElement | null;
  if (gateSelect && HOTEL_PRESETS[profile.hotelKey]) {
    gateSelect.value = profile.hotelKey;
    renderGateWayfinder();
  }
}

function openProfileEditModal(): void {
  (document.getElementById('edit-name') as HTMLInputElement).value = profile.fullName;
  (document.getElementById('edit-passport') as HTMLInputElement).value = profile.passportNumber;
  (document.getElementById('edit-stage') as HTMLSelectElement).value = profile.tripStage;
  (document.getElementById('edit-hotel-preset') as HTMLSelectElement).value = profile.hotelKey;
  (document.getElementById('edit-room') as HTMLInputElement).value = profile.roomNumber;
  (document.getElementById('edit-bus') as HTMLInputElement).value = profile.busNumber;
  (document.getElementById('edit-sup-name') as HTMLInputElement).value = profile.supervisorName;
  (document.getElementById('edit-sup-phone') as HTMLInputElement).value = profile.supervisorPhone;
  (document.getElementById('edit-meeting') as HTMLInputElement).value = profile.meetingPoint;
  (document.getElementById('edit-med') as HTMLInputElement).value = profile.medicalNote;
  openDialogById('profile-modal');
}

function handleProfileSave(e: Event): void {
  e.preventDefault();
  const presetKey = (document.getElementById('edit-hotel-preset') as HTMLSelectElement).value;
  const preset = HOTEL_PRESETS[presetKey] || HOTEL_PRESETS.kiswah;
  const nextStage = (document.getElementById('edit-stage') as HTMLSelectElement).value as TripStatus;

  profile = {
    ...profile,
    fullName: (document.getElementById('edit-name') as HTMLInputElement).value.trim() || DEFAULT_PROFILE.fullName,
    passportNumber: (document.getElementById('edit-passport') as HTMLInputElement).value.trim() || DEFAULT_PROFILE.passportNumber,
    tripStage: nextStage || profile.tripStage,
    hotelKey: presetKey,
    hotelNameAr: preset.nameAr,
    hotelNameEn: preset.nameEn,
    hotelAddressAr: preset.addressAr,
    hotelPhone: preset.phone,
    hotelLat: preset.lat,
    hotelLng: preset.lng,
    roomNumber: (document.getElementById('edit-room') as HTMLInputElement).value.trim() || DEFAULT_PROFILE.roomNumber,
    busNumber: (document.getElementById('edit-bus') as HTMLInputElement).value.trim() || DEFAULT_PROFILE.busNumber,
    supervisorName: (document.getElementById('edit-sup-name') as HTMLInputElement).value.trim() || DEFAULT_PROFILE.supervisorName,
    supervisorPhone: (document.getElementById('edit-sup-phone') as HTMLInputElement).value.trim() || DEFAULT_PROFILE.supervisorPhone,
    meetingPoint: (document.getElementById('edit-meeting') as HTMLInputElement).value.trim() || DEFAULT_PROFILE.meetingPoint,
    medicalNote: (document.getElementById('edit-med') as HTMLInputElement).value.trim() || 'لا توجد حالات مزمنة مسجلة',
  };

  if (profile.tripStage === TripStatus.IN_MADINAH) {
    setPrayerCity(CityLocation.MADINAH, false);
  } else if (profile.tripStage === TripStatus.IN_MAKKAH) {
    setPrayerCity(CityLocation.MAKKAH, false);
  }

  saveProfile();
  renderProfileUI();
  closeDialogById('profile-modal');
  showToast('✅ تم حفظ بيانات بطاقتك وكارت الفندق على جهازك');
}

function setPrayerCity(city: CityLocation, notify: boolean = true): void {
  activePrayerCity = city;
  document.getElementById('btn-city-makkah')?.setAttribute('aria-pressed', String(city === CityLocation.MAKKAH));
  document.getElementById('btn-city-madinah')?.setAttribute('aria-pressed', String(city === CityLocation.MADINAH));
  updatePrayerUI();
  if (notify) {
    showToast(`تم التبديل لمواقيت ${city === CityLocation.MAKKAH ? 'مكة المكرمة' : 'المدينة المنورة'}`);
  }
}

function updatePrayerUI(): void {
  const now = new Date();
  const times = prayerEngine.getPrayerTimes(activePrayerCity, now);
  const next = prayerEngine.getNextPrayer(activePrayerCity, now);

  const cityTitle = document.getElementById('prayer-city-title');
  if (cityTitle) {
    cityTitle.textContent =
      activePrayerCity === CityLocation.MAKKAH
        ? 'مواقيت الصلاة في المسجد الحرام (مكة المكرمة)'
        : 'مواقيت الصلاة في المسجد النبوي (المدينة المنورة)';
  }

  const hijriEl = document.getElementById('prayer-hijri-date');
  if (hijriEl) {
    hijriEl.textContent = `${getMakkahHijriDate(now)} — ${times.source}`;
  }

  const map: Record<string, string> = {
    fajr: times.fajr,
    sunrise: times.sunrise,
    dhuhr: times.dhuhr,
    asr: times.asr,
    maghrib: times.maghrib,
    isha: times.isha,
  };

  document.querySelectorAll<HTMLElement>('.prayer-pill').forEach((pill) => {
    pill.classList.remove('active');
    const key = pill.dataset.prayer;
    if (key && map[key]) {
      const timeNode = pill.querySelector('.prayer-pill-time');
      if (timeNode) timeNode.textContent = map[key];
      const nameNode = pill.querySelector('.prayer-pill-name');
      const baseName = pill.dataset.nameAr || '';
      if (nameNode) {
        if (baseName === next.nameAr) {
          pill.classList.add('active');
          nameNode.textContent = `${baseName} ⏳`;
        } else {
          nameNode.textContent = baseName;
        }
      }
    }
  });

  const hrs = Math.floor(next.minutesRemaining / 60);
  const mins = next.minutesRemaining % 60;
  const countdownText =
    hrs > 0
      ? `متبقي على أذان ${next.nameAr} (${next.prayerTime} بتوقيت مكة): ${hrs} ساعة و ${mins} دقيقة`
      : `متبقي على أذان ${next.nameAr} (${next.prayerTime} بتوقيت مكة): ${mins} دقيقة`;

  const cdEl = document.getElementById('prayer-countdown-text');
  if (cdEl) cdEl.textContent = countdownText;

  const warningBanner = document.getElementById('mataf-warning-banner');
  if (warningBanner) {
    if (next.matafWarning) {
      warningBanner.textContent = `⚠️ ${next.matafWarning}`;
      warningBanner.style.display = 'block';
    } else {
      warningBanner.style.display = 'none';
    }
  }
}

function speakText(text: string): void {
  if (!('speechSynthesis' in window)) {
    showToast('⚠️ القراءة الصوتية غير مدعومة في هذا المتصفح — يمكنك القراءة من الشاشة');
    return;
  }
  const voices = window.speechSynthesis.getVoices();
  const arabicVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ar'));
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ar-SA';
  if (arabicVoice) utterance.voice = arabicVoice;
  utterance.rate = 0.85;
  utterance.onerror = () => {
    showToast('⚠️ تعذر تشغيل الصوت في وضع الأوفلاين على هذا الجهاز');
  };
  window.speechSynthesis.speak(utterance);
  showToast(arabicVoice ? '🔊 جاري قراءة الذكر بالصوت...' : '🔊 تشغيل القراءة الصوتية');
}

function playTalbiyahOnce(): void {
  if (!isTalbiyahPlaying) return;
  if (!('speechSynthesis' in window)) {
    stopTalbiyah();
    showToast('⚠️ القراءة الصوتية غير مدعومة على هذا المتصفح');
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(
    'لبيك اللهم لبيك، لبيك لا شريك لك لبيك، إن الحمد والنعمة لك والملك، لا شريك لك'
  );
  u.lang = 'ar-SA';
  u.rate = 0.85;
  u.onend = () => {
    if (isTalbiyahPlaying) {
      talbiyahTimer = window.setTimeout(playTalbiyahOnce, 1200);
    }
  };
  u.onerror = () => {
    stopTalbiyah();
  };
  window.speechSynthesis.speak(u);
}

function toggleTalbiyahLoop(): void {
  if (isTalbiyahPlaying) {
    stopTalbiyah();
  } else {
    isTalbiyahPlaying = true;
    const icon = document.getElementById('talbiyah-icon');
    const lbl = document.getElementById('talbiyah-btn-label');
    if (icon) icon.textContent = '⏸️';
    if (lbl) lbl.textContent = 'إيقاف التلبية النبوية';
    showToast('🔊 تم تشغيل التلبية النبوية بالتكرار المستمر');
    playTalbiyahOnce();
  }
}

function stopTalbiyah(): void {
  isTalbiyahPlaying = false;
  if (talbiyahTimer !== null) {
    window.clearTimeout(talbiyahTimer);
    talbiyahTimer = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  const icon = document.getElementById('talbiyah-icon');
  const lbl = document.getElementById('talbiyah-btn-label');
  if (icon) icon.textContent = '▶️';
  if (lbl) lbl.textContent = 'تشغيل التلبية بالتكرار التلقائي';
}

async function toggleWakeLock(): Promise<void> {
  if (!('wakeLock' in navigator)) {
    showToast('⚠️ المتصفح لا يدعم تثبيت إضاءة الشاشة تلقائياً');
    return;
  }
  const updateButtons = (active: boolean) => {
    document.querySelectorAll<HTMLElement>('[data-wake-toggle]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(active));
      btn.innerHTML = active
        ? '<span aria-hidden="true">🔆</span> <span>الشاشة مضاءة ✓</span>'
        : '<span aria-hidden="true">🔆</span> <span>منع إغلاق الشاشة</span>';
    });
  };
  if (wakeLockSentinel) {
    await wakeLockSentinel.release();
    wakeLockSentinel = null;
    updateButtons(false);
    showToast('تم إلغاء منع إغلاق الشاشة');
    return;
  }
  try {
    wakeLockSentinel = await navigator.wakeLock.request('screen');
    wakeLockSentinel.addEventListener('release', () => {
      wakeLockSentinel = null;
      updateButtons(false);
    });
    updateButtons(true);
    showToast('🔆 ستبقى الشاشة مضاءة أثناء الطواف والسعي');
  } catch {
    showToast('تعذر تفعيل منع إغلاق الشاشة');
  }
}

function toggleSeniorMode(): void {
  isSeniorMode = !isSeniorMode;
  document.body.classList.toggle('senior-mode', isSeniorMode);
  document.querySelectorAll<HTMLElement>('[data-senior-toggle]').forEach((btn) => {
    btn.classList.toggle('active', isSeniorMode);
    btn.setAttribute('aria-pressed', String(isSeniorMode));
    btn.innerHTML = isSeniorMode
      ? '<span aria-hidden="true">👵</span> <span>خط كبير: مُفعّل</span>'
      : '<span aria-hidden="true">👵</span> <span>وضع كبار السن</span>';
  });
  try {
    localStorage.setItem(STORAGE_KEYS.SENIOR, isSeniorMode ? '1' : '0');
  } catch {
    // ignore
  }
  showToast(isSeniorMode ? 'تم تفعيل وضع كبار السن (خط كبير)' : 'تم الرجوع للخط المعتاد');
}

function restoreCounters(): void {
  try {
    const savedTawaf = Number(localStorage.getItem(STORAGE_KEYS.TAWAF_LAP) || '1');
    if (savedTawaf >= 1 && savedTawaf <= 7) {
      while (tawafCounter.currentLap < savedTawaf) tawafCounter.completeCurrentLap();
    }
    const savedSai = Number(localStorage.getItem(STORAGE_KEYS.SAI_LAP) || '1');
    if (savedSai >= 1 && savedSai <= 7) {
      while (saiCounter.currentLap < savedSai) saiCounter.completeCurrentLap();
    }
  } catch {
    // ignore
  }
  renderTawafUI();
  renderSaiUI();
}

function saveCounterState(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TAWAF_LAP, String(tawafCounter.currentLap));
    localStorage.setItem(STORAGE_KEYS.SAI_LAP, String(saiCounter.currentLap));
  } catch {
    // ignore
  }
}

function renderTawafUI(): void {
  const info = tawafCounter.getCurrentLapInfo();
  const lapEl = document.getElementById('tawaf-lap-num');
  if (lapEl) lapEl.innerHTML = `${info.lapNumber} <span class="lap-total">/ 7</span>`;

  const set = (id: string, val: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  set('tawaf-dua-title', info.titleAr);
  set('tawaf-dua-ar', info.duaArabic);
  set('tawaf-dua-tr', info.duaTransliteration);
  set('tawaf-dua-src', `المصدر: ${info.sourceAr}`);
  set('tawaf-sunnah-note', info.sunnahNote);
  renderFocusModal();
}

function renderSaiUI(): void {
  const lapEl = document.getElementById('sai-lap-num');
  const dirEl = document.getElementById('sai-direction-text');
  if (lapEl) lapEl.innerHTML = `${saiCounter.currentLap} <span class="lap-total">/ 7</span>`;
  if (dirEl) {
    dirEl.textContent =
      saiCounter.currentLap % 2 === 1
        ? 'الاتجاه: من الصفا ⬅️ إلى المروة'
        : 'الاتجاه: من المروة ⬅️ إلى الصفا';
  }
  renderFocusModal();
}

function renderFocusModal(): void {
  const modal = document.getElementById('focus-ritual-modal') as HTMLDialogElement | null;
  if (!modal || !modal.open) return;
  const titleEl = document.getElementById('focus-ritual-title');
  const subEl = document.getElementById('focus-ritual-subtitle');
  const lapEl = document.getElementById('focus-ritual-lap');
  const duaTitleEl = document.getElementById('focus-dua-title');
  const duaArEl = document.getElementById('focus-dua-ar');
  const advBtn = document.getElementById('btn-focus-advance');

  if (activeFocusMode === 'tawaf') {
    const info = tawafCounter.getCurrentLapInfo();
    if (titleEl) titleEl.textContent = '🕋 وضع الطواف المركّز';
    if (subEl) subEl.textContent = 'الكعبة عن يسارك — من الحجر الأسود إلى الحجر الأسود';
    if (lapEl) lapEl.innerHTML = `${info.lapNumber} <span class="lap-total">/ 7</span>`;
    if (duaTitleEl) duaTitleEl.textContent = info.titleAr;
    if (duaArEl) duaArEl.textContent = info.duaArabic;
    if (advBtn) {
      advBtn.className = 'btn btn-primary focus-tap-btn';
      advBtn.textContent = info.lapNumber === 7 ? '🎉 إنهاء الشوط السابع' : '✅ أتممت الشوط — التالي';
    }
  } else {
    const lap = saiCounter.currentLap;
    const isOdd = lap % 2 === 1;
    if (titleEl) titleEl.textContent = '🚶‍♂️ وضع السعي المركّز';
    if (subEl) subEl.textContent = isOdd ? 'الاتجاه: من الصفا ⬅️ إلى المروة' : 'الاتجاه: من المروة ⬅️ إلى الصفا';
    if (lapEl) lapEl.innerHTML = `${lap} <span class="lap-total">/ 7</span>`;
    if (duaTitleEl) duaTitleEl.textContent = 'الذكر المأثور في السعي';
    if (duaArEl) duaArEl.textContent = 'رَبِّ اغْفِرْ وَارْحَمْ إِنَّكَ أَنْتَ الأَعَزُّ الأَكْرَمُ';
    if (advBtn) {
      advBtn.className = 'btn btn-gold focus-tap-btn';
      advBtn.textContent = lap === 7 ? '🎉 إنهاء الشوط السابع' : '✅ وصلت — الشوط التالي';
    }
  }
}

function openFocusRitual(mode: 'tawaf' | 'sai'): void {
  activeFocusMode = mode;
  openDialogById('focus-ritual-modal');
  renderFocusModal();
  if ('wakeLock' in navigator && !wakeLockSentinel) {
    void toggleWakeLock();
  }
}

function incrementTawaf(): void {
  const res = tawafCounter.completeCurrentLap();
  saveCounterState();
  renderTawafUI();
  if (res.hapticFeedbackPattern === 'VIBRATE_COMPLETE') {
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    const body = document.getElementById('completion-modal-body');
    const title = document.getElementById('completion-modal-title');
    if (title) title.textContent = '🎉 اكتمل الطواف بفضل الله (7 أشواط)';
    if (body) {
      body.innerHTML = `
        <p>${escapeHtml(res.nextActionPrompt || '')}</p>
        <ul style="margin:0.75rem 1.25rem;line-height:1.9;">
          <li>صلِّ ركعتين خفيفتين خلف مقام إبراهيم عليه السلام (سنة الطواف).</li>
          <li>اشرب من ماء زمزم وتضلع منه وادعُ الله بما تحب.</li>
          <li>توجّه إلى الصفا لبدء أشواط السعي السبعة.</li>
        </ul>
      `;
    }
    openDialogById('completion-modal');
    showToast('🎉 اكتمل الطواف (7 أشواط)');
  } else {
    if ('vibrate' in navigator) navigator.vibrate(100);
    showToast(`✅ بدأ الشوط رقم (${res.nextLap}) في الطواف`);
  }
}

function undoTawaf(): void {
  const lap = tawafCounter.undoLap();
  saveCounterState();
  renderTawafUI();
  showToast(`↩️ تم التراجع إلى الشوط رقم (${lap})`);
}

function resetTawaf(): void {
  tawafCounter.reset();
  saveCounterState();
  renderTawafUI();
  showToast('تمت إعادة ضبط عداد الطواف');
}

function incrementSai(): void {
  const res = saiCounter.completeCurrentLap();
  saveCounterState();
  renderSaiUI();
  if (res.isCompleted) {
    if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    const body = document.getElementById('completion-modal-body');
    const title = document.getElementById('completion-modal-title');
    if (title) title.textContent = '🎉 تقبل الله طاعتكم! اكتمل السعي (7 أشواط)';
    if (body) {
      body.innerHTML = `
        <p>${escapeHtml(res.nextActionPrompt || '')}</p>
        <div class="info-box-warn" style="margin-top:0.75rem;">
          <strong>⚠️ تنبيه عملي للتحلل:</strong><br>
          • <strong>للرجال:</strong> يُفضل التوجه إلى صالونات الحلاقة المرخصة بأبراج البيت أو جبل عمر أو الشبيكة والتأكد من شفرة معقمة جديدة.<br>
          • <strong>للنساء:</strong> تقص قدر أنملة (~1.5–2 سم) من أطراف الشعر <strong>في غرفتها بالفندق</strong> ولا يجوز كشف شعرها أمام الرجال عند المروة.
        </div>
      `;
    }
    openDialogById('completion-modal');
    showToast('🎉 اكتمل السعي (7 أشواط)');
  } else {
    if ('vibrate' in navigator) navigator.vibrate(100);
    showToast(`✅ بدأ الشوط رقم (${res.nextLap}) في السعي`);
  }
}

function undoSai(): void {
  const lap = saiCounter.undoLap();
  saveCounterState();
  renderSaiUI();
  showToast(`↩️ تم التراجع إلى الشوط رقم (${lap})`);
}

function resetSai(): void {
  saiCounter.reset();
  saveCounterState();
  renderSaiUI();
  showToast('تمت إعادة ضبط عداد السعي');
}

function showRuknYamani(): void {
  const dua = tawafCounter.getRuknYamaniDua();
  const title = document.getElementById('dhikr-modal-title');
  const body = document.getElementById('dhikr-modal-body');
  if (title) title.textContent = '📍 الذكر المسنون بين الركن اليماني والحجر الأسود';
  if (body) {
    body.innerHTML = `
      <div class="dua-arabic" style="font-size:1.35rem;font-weight:800;line-height:2;margin-bottom:0.75rem;">«${escapeHtml(dua.arabic)}»</div>
      <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.75rem;">${escapeHtml(dua.transliteration)}</div>
      <div style="font-size:0.85rem;color:var(--primary-ink);font-weight:700;">المصدر: ${escapeHtml(dua.sourceAr)}</div>
    `;
  }
  openDialogById('dhikr-modal');
  speakText(dua.arabic);
}

function showSafaMarwaDhikr(): void {
  const d = saiCounter.getSafaMarwaDhikr();
  const title = document.getElementById('dhikr-modal-title');
  const body = document.getElementById('dhikr-modal-body');
  if (title) title.textContent = '⛰️ ذكر الوقوف على الصفا والمروة';
  if (body) {
    body.innerHTML = `
      <div class="info-box-warn" style="margin-bottom:0.75rem;font-weight:700;">
        عند أول صعود للصفا: ${escapeHtml(d.verseOnFirstSafa)}
      </div>
      <div class="dua-arabic" style="font-size:1.2rem;font-weight:800;line-height:2;margin-bottom:0.75rem;">«${escapeHtml(d.hillDhikr)}»</div>
      <p style="font-size:0.86rem;color:var(--text-muted);line-height:1.7;">${escapeHtml(d.instructionAr)}</p>
    `;
  }
  openDialogById('dhikr-modal');
  speakText(d.hillDhikr);
}

async function triggerSOSAlert(): Promise<void> {
  openDialogById('sos-modal');
  const statusEl = document.getElementById('sos-gps-status');
  const actionsEl = document.getElementById('sos-action-links');
  if (statusEl) statusEl.textContent = '📡 جاري تحديد موقعك الجغرافي (GPS) ومستوى البطارية...';

  let batteryLevel = 100;
  try {
    const navWithBattery = navigator as Navigator & {
      getBattery?: () => Promise<{ level: number }>;
    };
    if (navWithBattery.getBattery) {
      const bat = await navWithBattery.getBattery();
      batteryLevel = Math.round(bat.level * 100);
    }
  } catch {
    // fallback 100
  }

  const hotelObj = new Hotel({
    id: profile.hotelKey,
    nameAr: profile.hotelNameAr,
    nameEn: profile.hotelNameEn,
    city: 'MAKKAH',
    addressAr: profile.hotelAddressAr,
    addressEn: profile.hotelAddressAr,
    phone: profile.hotelPhone,
    latitude: profile.hotelLat,
    longitude: profile.hotelLng,
  });
  const dispatcher = new EmergencySOSDispatcher(hotelObj);

  const finalizeAlert = (lat?: number, lng?: number, gpsError?: string) => {
    let waMessage = '';
    if (typeof lat === 'number' && typeof lng === 'number') {
      const alert = dispatcher.createSOSAlert({
        pilgrimId: profile.passportNumber,
        pilgrimName: profile.fullName,
        latitude: lat,
        longitude: lng,
        batteryLevel,
        notes: 'بلاغ معتمر تائه من تطبيق رفيق المعتمر',
      });
      const distKm = (alert.distanceToHotelMeters / 1000).toFixed(2);
      const mapsUrl = `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
      if (statusEl) {
        statusEl.innerHTML = `
          ✅ تم تحديد موقعك بدقة! المسافة إلى (${escapeHtml(profile.hotelNameAr)}): <strong>${distKm} كم</strong> | البطارية: <strong>${batteryLevel}%</strong><br>
          <a href="${mapsUrl}" target="_blank" rel="noopener" style="color:var(--primary-ink);font-weight:800;">📍 فتح موقعي على خرائط جوجل</a>
        `;
      }
      waMessage = [
        `🆘 *نداء طوارئ - معتمر تائه (${profile.tripCode})*`,
        `👤 الاسم: ${profile.fullName}`,
        `🏨 الفندق: ${profile.hotelNameAr} (غرفة ${profile.roomNumber})`,
        `📏 المسافة التقريبية للفندق: ${distKm} كم`,
        `🔋 شحن البطارية: ${batteryLevel}%`,
        `📍 موقعي الحالي (GPS): ${mapsUrl}`,
        `⚠️ أقف الآن عند أقرب باب أو عمود مميز بانتظار توجيهكم.`,
      ].join('\n');
    } else {
      if (statusEl) {
        statusEl.textContent = `⚠️ ${gpsError || 'لم يتم تفعيل GPS'} — يمكنك إرسال رسالة طوارئ فورية للمشرف مع ذكر رقم البوابة أو العمود الظاهر أمامك.`;
      }
      waMessage = [
        `🆘 *نداء طوارئ - معتمر تائه (${profile.tripCode})*`,
        `👤 الاسم: ${profile.fullName}`,
        `🏨 الفندق: ${profile.hotelNameAr} (غرفة ${profile.roomNumber})`,
        `🔋 البطارية: ${batteryLevel}%`,
        `📍 أقف الآن عند بوابة رقم: [ اكتب رقم البوابة ]`,
      ].join('\n');
    }

    const waUrl = buildWhatsAppUrl(waMessage, profile.supervisorPhone);
    if (actionsEl) {
      actionsEl.innerHTML = `
        <a href="${waUrl}" target="_blank" rel="noopener" class="btn btn-danger" style="text-decoration:none;flex:1;">
          📲 إرسال الموقع بالواتساب للمشرف الآن
        </a>
        <a href="tel:${escapeHtml(profile.supervisorPhone.replace(/\s+/g, ''))}" class="btn btn-primary" style="text-decoration:none;">
          📞 اتصال بالمشرف
        </a>
        <button type="button" class="btn btn-secondary" id="copy-sos-msg-btn">📋 نسخ الرسالة</button>
      `;
      document.getElementById('copy-sos-msg-btn')?.addEventListener('click', () => {
        void copyToClipboard(waMessage, '✅ تم نسخ رسالة الطوارئ مع رابط الخريطة');
      });
    }
  };

  if (!('geolocation' in navigator)) {
    finalizeAlert(undefined, undefined, 'المتصفح لا يدعم خدمة الموقع GPS');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => finalizeAlert(pos.coords.latitude, pos.coords.longitude),
    () => finalizeAlert(undefined, undefined, 'تعذر التقاط إشارة GPS (قد تكون داخل مبنى الحرم)'),
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
  );
}

function renderZiyaratAndFieldGuides(): void {
  const madinahContainer = document.getElementById('ziyarat-madinah-grid');
  const makkahContainer = document.getElementById('ziyarat-makkah-grid');
  const renderCard = (s: ReturnType<ZiyaratGuideCatalog['getAllSites']>[number]) => `
    <article class="card">
      <div class="card-header">
        <h3 class="card-title">${escapeHtml(s.nameAr)}</h3>
        <span class="badge badge-primary">${s.city === ZiyaratCity.MADINAH ? 'المدينة المنورة' : 'مكة المكرمة'}</span>
      </div>
      <p style="font-size:0.92rem;line-height:1.75;margin-bottom:0.75rem;">${escapeHtml(s.virtueAr)}</p>
      <div class="info-box-neutral" style="margin-bottom:0.5rem;">
        <strong>الآداب والهَدْي:</strong> ${escapeHtml(s.sunnahEtiquette)}
      </div>
      ${s.bidahWarnings ? `<div class="info-box-danger" style="margin-bottom:0.5rem;"><strong>⚠️ تحذيرات هامة:</strong> ${escapeHtml(s.bidahWarnings)}</div>` : ''}
      ${s.recommendedTimes ? `<div style="font-size:0.84rem;color:var(--gold-dark);font-weight:700;">⏰ ${escapeHtml(s.recommendedTimes)}</div>` : ''}
    </article>
  `;

  if (madinahContainer) {
    madinahContainer.innerHTML = ziyaratCatalog.getSitesByCity(ZiyaratCity.MADINAH).map(renderCard).join('');
  }
  if (makkahContainer) {
    makkahContainer.innerHTML = ziyaratCatalog.getSitesByCity(ZiyaratCity.MAKKAH).map(renderCard).join('');
  }

  const miqatContainer = document.getElementById('miqat-routes-grid');
  if (miqatContainer) {
    miqatContainer.innerHTML = MIQAT_ROUTE_GUIDES.map(
      (m) => `
      <div class="info-box-neutral">
        <div style="font-weight:800;color:var(--primary-ink);margin-bottom:0.25rem;">${escapeHtml(m.routeAr)}</div>
        <div style="font-size:0.86rem;font-weight:700;color:var(--gold-dark);margin-bottom:0.3rem;">الميقات: ${escapeHtml(m.miqatNameAr)}</div>
        <p style="font-size:0.86rem;line-height:1.65;">${escapeHtml(m.timingGuidanceAr)}</p>
      </div>
    `
    ).join('');
  }

  const fieldContainer = document.getElementById('haramain-field-guides');
  if (fieldContainer) {
    fieldContainer.innerHTML = haramainCatalog
      .getAllGuides()
      .map(
        (g) => `
      <div class="info-box-neutral">
        <div style="display:flex;justify-content:space-between;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.35rem;">
          <strong style="color:var(--primary-ink);">${escapeHtml(g.titleAr)}</strong>
          ${g.officialSource ? `<span class="badge badge-success">${escapeHtml(g.officialSource)}</span>` : ''}
        </div>
        <p style="font-size:0.88rem;line-height:1.7;">${escapeHtml(g.practicalAdvice)}</p>
      </div>
    `
      )
      .join('');
  }
}

function renderFiqhSection(): void {
  const list = document.getElementById('fiqh-rulings-list');
  if (!list) return;
  list.innerHTML = fiqhAssistant
    .getAllRulings()
    .map(
      (r) => `
    <details class="accordion-item">
      <summary class="accordion-header">${escapeHtml(r.titleAr)}</summary>
      <div class="accordion-body">
        <p><strong>السؤال:</strong> ${escapeHtml(r.questionAr)}</p>
        <p style="margin:0.4rem 0;"><strong>الحكم الشرعي:</strong> ${escapeHtml(r.rulingArabic)}</p>
        <p style="margin:0.4rem 0;"><strong>الإجراء المطلوب:</strong> ${escapeHtml(r.actionRequired)}</p>
        <div style="font-size:0.85rem;color:var(--text-muted);margin-top:0.5rem;">
          <em>الدليل والمرجع:</em> ${escapeHtml(r.evidenceSummary)}
        </div>
      </div>
    </details>
  `
    )
    .join('');
}

function renderWomenFiqhSection(): void {
  const list = document.getElementById('women-fiqh-list');
  if (!list) return;
  list.innerHTML = womenFiqhCatalog
    .getAllItems()
    .map(
      (item, idx) => `
    <details class="accordion-item women-topic" data-search="${escapeHtml(`${item.titleAr} ${item.questionAr} ${item.rulingAr} ${item.practicalGuidance}`)}">
      <summary class="accordion-header" style="color:var(--women-accent);">${idx + 1}. ${escapeHtml(item.titleAr)}</summary>
      <div class="accordion-body">
        <p><strong>السؤال:</strong> ${escapeHtml(item.questionAr)}</p>
        <div class="women-fatwa-box">
          <strong>الفتوى والبيان:</strong> ${escapeHtml(item.rulingAr)}
        </div>
        <p><strong>الإرشاد العملي:</strong> ${escapeHtml(item.practicalGuidance)}</p>
        ${item.sourceText ? `<div style="font-size:0.85rem;color:var(--text-muted);margin-top:0.5rem;"><em>الدليل والمرجع:</em> ${escapeHtml(item.sourceText)}</div>` : ''}
      </div>
    </details>
  `
    )
    .join('');
}

function renderPackingChecklist(): void {
  const categories: Array<{ key: ChecklistCategory; containerId: string }> = [
    { key: ChecklistCategory.TRAVEL_DOCUMENTS, containerId: 'pack-docs-list' },
    { key: ChecklistCategory.MENS_IHRAM, containerId: 'pack-men-list' },
    { key: ChecklistCategory.WOMENS_IHRAM, containerId: 'pack-women-list' },
    { key: ChecklistCategory.HEALTH_AND_HYGIENE, containerId: 'pack-health-list' },
    { key: ChecklistCategory.DAILY_HARAM_ESSENTIALS, containerId: 'pack-daily-list' },
  ];

  let saved: string[] = [];
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.PACKING) || '[]');
  } catch {
    saved = [];
  }

  for (const cat of categories) {
    const el = document.getElementById(cat.containerId);
    if (!el) continue;
    const items = packingCatalog.getItemsByCategory(cat.key);
    el.innerHTML = items
      .map(
        (item) => `
      <label class="pack-row" for="cb-${escapeHtml(item.id)}">
        <input type="checkbox" class="packing-cb" id="cb-${escapeHtml(item.id)}" value="${escapeHtml(item.id)}" ${saved.includes(item.id) ? 'checked' : ''}>
        <div>
          <strong>${escapeHtml(item.nameAr)}</strong>
          <div style="font-size:0.84rem;color:var(--text-muted);">${escapeHtml(item.descriptionAr)}</div>
        </div>
      </label>
    `
      )
      .join('');
  }

  document.querySelectorAll<HTMLInputElement>('.packing-cb').forEach((cb) => {
    cb.addEventListener('change', updatePackingProgress);
  });
  updatePackingProgress();
}

function updatePackingProgress(): void {
  const checkedIds = Array.from(document.querySelectorAll<HTMLInputElement>('.packing-cb:checked')).map(
    (cb) => cb.value
  );
  const readiness = packingCatalog.calculateReadiness(checkedIds);
  const pctEl = document.getElementById('packing-percentage-label');
  const barEl = document.getElementById('packing-progress-bar');
  const sumEl = document.getElementById('packing-status-summary');
  if (pctEl) pctEl.textContent = `${readiness.percentage}%`;
  if (barEl) barEl.style.width = `${readiness.percentage}%`;
  if (sumEl) sumEl.textContent = `تم تجهيز ${readiness.checked} من ${readiness.total} عنصراً ضرورياً`;

  try {
    localStorage.setItem(STORAGE_KEYS.PACKING, JSON.stringify(checkedIds));
  } catch {
    // ignore
  }
}

async function loadNusukWalletImages(): Promise<void> {
  const renderSlot = async (slot: 'umrah' | 'rawdah', storageKey: string) => {
    const preview = document.getElementById(`nusuk-preview-${slot}`) as HTMLImageElement | null;
    const empty = document.getElementById(`nusuk-empty-${slot}`);
    const clearBtn = document.getElementById(`nusuk-clear-${slot}`);

    let blob = await idbGetBlob(storageKey);
    // Migrate legacy localStorage dataUrl to IndexedDB Blob to free up synchronous storage
    if (!blob) {
      try {
        const legacyDataUrl = localStorage.getItem(storageKey);
        if (legacyDataUrl) {
          blob = dataUrlToBlob(legacyDataUrl);
          if (blob) {
            await idbSetBlob(storageKey, blob);
            localStorage.removeItem(storageKey);
          }
        }
      } catch {
        blob = null;
      }
    }

    if (nusukObjectUrls[slot]) {
      URL.revokeObjectURL(nusukObjectUrls[slot]!);
      delete nusukObjectUrls[slot];
    }

    if (preview && empty) {
      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        nusukObjectUrls[slot] = objectUrl;
        preview.src = objectUrl;
        preview.style.display = 'block';
        empty.style.display = 'none';
        if (clearBtn) clearBtn.style.display = 'inline-flex';
      } else {
        preview.removeAttribute('src');
        preview.style.display = 'none';
        empty.style.display = 'block';
        if (clearBtn) clearBtn.style.display = 'none';
      }
    }
  };

  await Promise.all([
    renderSlot('umrah', STORAGE_KEYS.NUSUK_UMRAH_IMG),
    renderSlot('rawdah', STORAGE_KEYS.NUSUK_RAWDAH_IMG),
  ]);
}

function handleNusukImageUpload(slot: 'umrah' | 'rawdah', file: File): void {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 900;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const storageKey = slot === 'umrah' ? STORAGE_KEYS.NUSUK_UMRAH_IMG : STORAGE_KEYS.NUSUK_RAWDAH_IMG;
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            showToast('⚠️ تعذر معالجة صورة التصريح');
            return;
          }
          void idbSetBlob(storageKey, blob).then((saved) => {
            if (saved) {
              void loadNusukWalletImages();
              showToast('✅ تم حفظ صورة التصريح في قاعدة البيانات المحلية (IndexedDB)');
            } else {
              showToast('⚠️ تعذر حفظ الصورة في المتصفح');
            }
          });
        },
        'image/jpeg',
        0.85
      );
    };
    img.src = String(reader.result);
  };
  reader.readAsDataURL(file);
}

function renderGateWayfinder(): void {
  const selector = document.getElementById('hotel-gate-selector') as HTMLSelectElement | null;
  const box = document.getElementById('gate-result-box');
  if (!selector || !box) return;

  const val = selector.value;
  let gates = [];
  if (val === 'kiswah') {
    gates = [gatesGuide.getGateByNumber(79), gatesGuide.getGateByNumber(100)].filter(Boolean);
  } else if (val === 'clock') {
    gates = [gatesGuide.getGateByNumber(1)].filter(Boolean);
  } else if (val === 'jabal-omar') {
    gates = [gatesGuide.getGateByNumber(62)].filter(Boolean);
  } else {
    gates = [gatesGuide.getGateByNumber(45), gatesGuide.getGateByNumber(100)].filter(Boolean);
  }

  box.innerHTML = gates
    .map(
      (g) => `
    <div style="margin-bottom:0.85rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.35rem;">
        <span style="font-size:1.05rem;font-weight:800;color:var(--primary-ink);">🚪 ${escapeHtml(g!.nameAr)} (بوابة ${g!.gateNumber})</span>
        <span class="badge badge-success">أقرب مخرج: ${escapeHtml(g!.nearestAreaAr)}</span>
      </div>
      <p style="font-size:0.93rem;line-height:1.75;margin-bottom:0.35rem;"><strong>طريقة الوصول للفندق:</strong> ${escapeHtml(g!.howToReachHotelAr)}</p>
      ${g!.avoidWarningAr ? `<div style="font-size:0.86rem;color:var(--danger);font-weight:700;">⚠️ ${escapeHtml(g!.avoidWarningAr)}</div>` : ''}
    </div>
  `
    )
    .join('<hr style="border:none;border-top:1px dashed var(--border);margin:0.75rem 0;">');
}

function renderCurrencyAndTaxi(): void {
  try {
    const savedRate = Number(localStorage.getItem(STORAGE_KEYS.RATES));
    if (savedRate > 0) currencyService.setRates({ SAR_TO_EGP: savedRate });
  } catch {
    // ignore
  }

  const rateInput = document.getElementById('rate-sar-egp') as HTMLInputElement | null;
  if (rateInput) rateInput.value = String(currencyService.getRates().SAR_TO_EGP);
  updateCurrencyCalculation();

  const taxiContainer = document.getElementById('taxi-routes-list');
  if (taxiContainer) {
    taxiContainer.innerHTML = currencyService
      .getAllTaxiRoutes()
      .map(
        (r) => `
      <div class="info-box-neutral">
        <div style="display:flex;justify-content:space-between;font-weight:800;color:var(--primary-ink);gap:0.5rem;">
          <span>${r.city === 'MAKKAH' ? '🕋' : '🕌'} ${escapeHtml(r.fromAr)} ← ${escapeHtml(r.toAr)}</span>
          <span style="color:var(--gold-dark);white-space:nowrap;">${r.fairPriceMinSAR} - ${r.fairPriceMaxSAR} ريال</span>
        </div>
        <div style="font-size:0.84rem;color:var(--text-muted);margin-top:0.25rem;">المسافة ~${r.distanceKm} كم • ${escapeHtml(r.adviceAr)}</div>
      </div>
    `
      )
      .join('');
  }

  const resContainer = document.getElementById('official-resources-grid');
  if (resContainer) {
    resContainer.innerHTML = OFFICIAL_SAUDI_RESOURCES.map(
      (res) => `
      <div class="info-box-neutral" style="display:flex;flex-direction:column;justify-content:space-between;gap:0.6rem;">
        <div>
          <div style="font-weight:800;color:var(--primary-ink);margin-bottom:0.25rem;">${escapeHtml(res.titleAr)}</div>
          <p style="font-size:0.86rem;color:var(--text-muted);line-height:1.6;">${escapeHtml(res.summaryAr)}</p>
        </div>
        <a href="${escapeHtml(res.urlOrTel)}" ${res.urlOrTel.startsWith('http') ? 'target="_blank" rel="noopener"' : ''} class="btn btn-secondary" style="text-decoration:none;font-size:0.86rem;">
          ${escapeHtml(res.actionLabelAr)}
        </a>
      </div>
    `
    ).join('');
  }
}

function updateCurrencyCalculation(): void {
  const sarInput = document.getElementById('calc-sar') as HTMLInputElement | null;
  const rateInput = document.getElementById('rate-sar-egp') as HTMLInputElement | null;
  const sar = Math.max(0, parseFloat(sarInput?.value || '0') || 0);
  const customRate = parseFloat(rateInput?.value || '');
  if (customRate > 0) {
    currencyService.setRates({ SAR_TO_EGP: customRate });
    try {
      localStorage.setItem(STORAGE_KEYS.RATES, String(customRate));
    } catch {
      // ignore
    }
  }
  const egp = currencyService.convertSARtoEGP(sar);
  const usd = currencyService.convertSARtoUSD(sar);
  const egpEl = document.getElementById('calc-egp');
  const usdEl = document.getElementById('calc-usd');
  if (egpEl) egpEl.textContent = `${egp.toLocaleString('ar-EG')} ج.م`;
  if (usdEl) usdEl.textContent = `$${usd.toLocaleString('en-US')}`;
}

function switchTab(tab: string): void {
  const tabs = ['rituals', 'ziyarat', 'fiqh', 'women-fiqh', 'packing', 'gates-taxi'];
  if (!tabs.includes(tab)) return;

  document.querySelectorAll<HTMLElement>('.tab-view').forEach((view) => {
    const isTarget = view.id === `tab-${tab}`;
    view.classList.toggle('active', isTarget);
    view.hidden = !isTarget;
  });

  document.querySelectorAll<HTMLButtonElement>('[data-tab-target]').forEach((btn) => {
    const active = btn.dataset.tabTarget === tab;
    btn.classList.toggle('active', active);
    if (active) {
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.removeAttribute('aria-current');
    }
  });

  // Close mobile/tablet More popover if open
  const morePop = document.getElementById('pilgrim-more-popover') as HTMLElement & { hidePopover?: () => void };
  if (morePop && morePop.matches(':popover-open') && morePop.hidePopover) {
    morePop.hidePopover();
  }

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}

window.addEventListener('DOMContentLoaded', () => {
  initThemeSync();
  setupDialogs();
  initStickyHeaders();
  registerServiceWorkerAndNetworkStatus();

  loadProfile();
  renderProfileUI();
  restoreCounters();
  renderZiyaratAndFieldGuides();
  renderFiqhSection();
  renderWomenFiqhSection();
  renderPackingChecklist();
  void loadNusukWalletImages();
  renderCurrencyAndTaxi();
  updatePrayerUI();
  window.setInterval(updatePrayerUI, 60000);

  try {
    if (localStorage.getItem(STORAGE_KEYS.SENIOR) === '1') {
      toggleSeniorMode();
    }
  } catch {
    // ignore
  }

  document.querySelectorAll<HTMLButtonElement>('[data-tab-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tabTarget) switchTab(btn.dataset.tabTarget);
    });
  });

  document.getElementById('stage-banner-cta')?.addEventListener('click', (e) => {
    const target = (e.currentTarget as HTMLElement).dataset.jumpTab;
    if (target) switchTab(target);
  });

  document.querySelectorAll<HTMLElement>('[data-senior-toggle]').forEach((btn) => {
    btn.addEventListener('click', toggleSeniorMode);
  });
  document.querySelectorAll<HTMLElement>('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', toggleColorScheme);
  });
  document.querySelectorAll<HTMLElement>('[data-wake-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      void toggleWakeLock();
    });
  });

  document.getElementById('btn-city-makkah')?.addEventListener('click', () => setPrayerCity(CityLocation.MAKKAH));
  document.getElementById('btn-city-madinah')?.addEventListener('click', () => setPrayerCity(CityLocation.MADINAH));

  document.getElementById('btn-edit-profile')?.addEventListener('click', openProfileEditModal);
  document.getElementById('profile-form')?.addEventListener('submit', handleProfileSave);
  document.getElementById('btn-open-taxi')?.addEventListener('click', () => openDialogById('taxi-modal'));
  document.getElementById('btn-badge-nusuk')?.addEventListener('click', () => {
    switchTab('packing');
    document.getElementById('nusuk-owner-meta')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  document.getElementById('btn-open-cert')?.addEventListener('click', () => openDialogById('certificate-modal'));
  document.getElementById('btn-trigger-sos')?.addEventListener('click', () => {
    void triggerSOSAlert();
  });
  document.getElementById('btn-header-sos')?.addEventListener('click', () => {
    void triggerSOSAlert();
  });

  document.getElementById('talbiyah-toggle-btn')?.addEventListener('click', toggleTalbiyahLoop);
  document.getElementById('talbiyah-stop-btn')?.addEventListener('click', stopTalbiyah);
  document.getElementById('play-tawaf-audio-btn')?.addEventListener('click', () => {
    speakText(document.getElementById('tawaf-dua-ar')?.textContent || '');
  });
  document.getElementById('play-herwala-audio-btn')?.addEventListener('click', () => {
    speakText('يُسن للرجال فقط الإسراع والمشي السريع بين العمودين الأخضرين، أما النساء فيمشين كالمعتاد');
  });

  document.getElementById('btn-tawaf-next')?.addEventListener('click', incrementTawaf);
  document.getElementById('btn-tawaf-undo')?.addEventListener('click', undoTawaf);
  document.getElementById('btn-tawaf-reset')?.addEventListener('click', resetTawaf);
  document.getElementById('btn-rukn-yamani')?.addEventListener('click', showRuknYamani);
  document.getElementById('btn-tawaf-doubt-jump')?.addEventListener('click', () => switchTab('fiqh'));
  document.getElementById('btn-focus-tawaf')?.addEventListener('click', () => openFocusRitual('tawaf'));

  document.getElementById('btn-sai-next')?.addEventListener('click', incrementSai);
  document.getElementById('btn-sai-undo')?.addEventListener('click', undoSai);
  document.getElementById('btn-sai-reset')?.addEventListener('click', resetSai);
  document.getElementById('btn-safa-dhikr')?.addEventListener('click', showSafaMarwaDhikr);
  document.getElementById('btn-focus-sai')?.addEventListener('click', () => openFocusRitual('sai'));

  document.getElementById('btn-focus-advance')?.addEventListener('click', () => {
    if (activeFocusMode === 'tawaf') incrementTawaf();
    else incrementSai();
  });
  document.getElementById('btn-focus-undo')?.addEventListener('click', () => {
    if (activeFocusMode === 'tawaf') undoTawaf();
    else undoSai();
  });
  document.getElementById('btn-focus-audio')?.addEventListener('click', () => {
    speakText(document.getElementById('focus-dua-ar')?.textContent || '');
  });
  document.getElementById('btn-focus-sos')?.addEventListener('click', () => {
    closeDialogById('focus-ritual-modal');
    void triggerSOSAlert();
  });

  document.getElementById('btn-calc-doubt')?.addEventListener('click', () => {
    const l1 = Number((document.getElementById('lap-doubt-1') as HTMLSelectElement).value);
    const l2 = Number((document.getElementById('lap-doubt-2') as HTMLSelectElement).value);
    const res = fiqhAssistant.resolveLapDoubt(l1, l2);
    const resDiv = document.getElementById('lap-doubt-result');
    if (resDiv) {
      resDiv.style.display = 'block';
      resDiv.innerHTML = `<strong>الفتوى الشرعية:</strong> ${escapeHtml(res.rulingArabic)}`;
    }
    showToast(`القاعدة: تعتبر نفسك في الشوط ${res.recommendedLap}`);
  });

  document.getElementById('women-search-input')?.addEventListener('input', (e) => {
    const query = (e.target as HTMLInputElement).value.toLowerCase().trim();
    document.querySelectorAll<HTMLElement>('.women-topic').forEach((item) => {
      const text = (item.textContent + ' ' + (item.dataset.search || '')).toLowerCase();
      item.style.display = text.includes(query) ? 'block' : 'none';
    });
  });

  document.getElementById('btn-reset-packing')?.addEventListener('click', () => {
    document.querySelectorAll<HTMLInputElement>('.packing-cb').forEach((cb) => {
      cb.checked = false;
    });
    try {
      localStorage.removeItem(STORAGE_KEYS.PACKING);
    } catch {
      // ignore
    }
    updatePackingProgress();
    showToast('تمت إعادة تعيين قائمة الحقيبة');
  });

  document.getElementById('input-nusuk-umrah')?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) handleNusukImageUpload('umrah', file);
  });
  document.getElementById('input-nusuk-rawdah')?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) handleNusukImageUpload('rawdah', file);
  });
  document.getElementById('nusuk-clear-umrah')?.addEventListener('click', () => {
    try { localStorage.removeItem(STORAGE_KEYS.NUSUK_UMRAH_IMG); } catch {}
    void idbDeleteBlob(STORAGE_KEYS.NUSUK_UMRAH_IMG).then(() => loadNusukWalletImages());
    showToast('تم مسح صورة تصريح العمرة');
  });
  document.getElementById('nusuk-clear-rawdah')?.addEventListener('click', () => {
    try { localStorage.removeItem(STORAGE_KEYS.NUSUK_RAWDAH_IMG); } catch {}
    void idbDeleteBlob(STORAGE_KEYS.NUSUK_RAWDAH_IMG).then(() => loadNusukWalletImages());
    showToast('تم مسح صورة تصريح الروضة');
  });

  document.getElementById('hotel-gate-selector')?.addEventListener('change', renderGateWayfinder);
  document.getElementById('calc-sar')?.addEventListener('input', updateCurrencyCalculation);
  document.getElementById('rate-sar-egp')?.addEventListener('input', updateCurrencyCalculation);

  document.querySelectorAll<HTMLElement>('[data-close-dialog]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.closeDialog;
      if (id) closeDialogById(id);
    });
  });
  document.getElementById('btn-print-cert')?.addEventListener('click', () => window.print());
});
