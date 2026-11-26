import { PrayerTimesEngine, CityLocation } from '../guidance/prayer-times.js';
import { TawafCounter, SaiCounter } from '../guidance/rituals-and-best-practices.js';
import { FiqhAssistant } from '../guidance/whatsapp-and-fiqh.js';
import { WomenFiqhCatalog } from '../guidance/women-fiqh.js';
import { PackingCatalog, ChecklistCategory } from '../guidance/packing-checklist.js';
import { CurrencyAndTaxiService } from '../financial/currency-and-taxi.js';
import { EmergencySOSDispatcher, Hotel, TripStatus } from '../operations/trip-logistics.js';
import { OFFICIAL_SAUDI_RESOURCES } from '../guidance/official-resources.js';
import {
  getTripStageLabel,
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
  updateThemeButtonLabel,
  initImageLightbox,
  updateNetworkStatusBadge,
  registerServiceWorkerAndNetworkStatus,
} from './shared.js';
import { dataUrlToBlob, idbDeleteBlob, idbGetBlob, idbSetBlob } from './storage.js';
import { getCurrentLanguage, initLanguage, t, toggleLanguage } from './i18n.js';
import { renderEditorialMethodologyHtml, renderReferencePillsHtml } from './references-ui.js';
import {
  FIQH_RULINGS_EN,
  OFFICIAL_RESOURCES_EN,
  PACKING_ITEMS_EN,
  TAXI_ROUTES_EN,
  WOMEN_FIQH_EN,
} from './guidance-en.js';
import {
  renderZiyaratAndFieldGuides,
  renderHaramAtlasSection,
  renderGateWayfinder,
  detectNearestHaramGate,
} from './pilgrim/atlas-view.js';
import {
  inspectPersonalInstallmentsFromStorageAndParams,
  setPersonalInstallmentData,
  openMyInstallmentsModal,
} from './pilgrim/installments-view.js';
import { postLiveSosToCloud, fetchBadgeFromCloud } from './cloud-sync.js';

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
  gender?: 'MALE' | 'FEMALE';
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
  gender: 'MALE',
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

const STAGE_RELEVANCE: Record<
  TripStatus,
  { hintAr: string; hintEn: string; targetTab: string; ctaAr: string; ctaEn: string }
> = {
  [TripStatus.DRAFT]: {
    hintAr: 'تحقق من جاهزية جواز السفر (صلاحية > 6 أشهر) وقائمة الحقيبة.',
    hintEn: 'Verify passport validity (> 6 months) and complete your packing checklist.',
    targetTab: 'wallet',
    ctaAr: '🧳 افتح حقيبتي ونُسك',
    ctaEn: '🧳 Open Trip Wallet',
  },
  [TripStatus.REGISTRATION_OPEN]: {
    hintAr: 'تأكد من تفعيل تطبيق نُسك وحفظ تصاريح العمرة والروضة.',
    hintEn: 'Ensure your Nusuk account is active and save screenshots of your Umrah & Rawdah permits.',
    targetTab: 'wallet',
    ctaAr: '📲 محفظة نُسك والحقيبة',
    ctaEn: '📲 Nusuk Wallet',
  },
  [TripStatus.PRE_DEPARTURE]: {
    hintAr: 'موعد التجهيز للسفر: راجع الحقيبة وتأكد من ارتداء الإحرام قبل صعود الطائرة.',
    hintEn: 'Pre-departure checklist: review essentials and wear Ihram garments before boarding if flying via Miqat.',
    targetTab: 'wallet',
    ctaAr: '✅ راجع جاهزية الحقيبة',
    ctaEn: '✅ Review Checklist',
  },
  [TripStatus.IN_TRANSIT]: {
    hintAr: 'أنت في طريقك للميقات: راجع مواضع الإحرام والتلبية ومحظورات الإحرام.',
    hintEn: 'En route to Miqat: review Ihram prohibitions, route guides, and Talbiyah.',
    targetTab: 'ziyarat',
    ctaAr: '🧭 دليل الميقات',
    ctaEn: '🧭 Miqat Guide',
  },
  [TripStatus.IN_MAKKAH]: {
    hintAr: 'أهلاً بك في مكة: استخدم عداد الطواف والسعي ودليل بوابات الحرم للعودة للفندق.',
    hintEn: 'Welcome to Makkah: use the Tawaf & Sa’i counters and Haram gate wayfinder to return safely.',
    targetTab: 'haram-atlas',
    ctaAr: '⛩️ بوابات الحرم والعودة للفندق',
    ctaEn: '⛩️ Gates & Wayfinder',
  },
  [TripStatus.IN_MADINAH]: {
    hintAr: 'أهلاً بك في المدينة المنورة: راجع مزارات قباء وأحد وتصاريح الروضة الشريفة.',
    hintEn: 'Welcome to Madinah: explore Quba & Uhud ziyarat guides and Rawdah Nusuk permit timing.',
    targetTab: 'ziyarat',
    ctaAr: '🌴 مزارات المدينة',
    ctaEn: '🌴 Madinah Ziyarat',
  },
  [TripStatus.RETURN_TRANSIT]: {
    hintAr: 'تذكير المغادرة: طواف الوداع، وضوابط عبوة زمزم (5 لتر) المغلفة بمطار جدة أو المدينة.',
    hintEn: 'Departure reminder: review airport 5L Zamzam wrapping rules at Jeddah & Madinah terminals.',
    targetTab: 'services',
    ctaAr: '🛫 ضوابط زمزم والمطار',
    ctaEn: '🛫 Zamzam Airport Rules',
  },
  [TripStatus.COMPLETED]: {
    hintAr: 'تقبل الله عمرتكم! يمكنك طباعة شهادة إتمام العمرة التذكارية من بطاقتك.',
    hintEn: 'May Allah accept your Umrah! View or print your commemorative completion certificate.',
    targetTab: 'rituals',
    ctaAr: '📜 عرض الشهادة',
    ctaEn: '📜 View Certificate',
  },
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
const fiqhAssistant = new FiqhAssistant();
const womenFiqhCatalog = new WomenFiqhCatalog();
const packingCatalog = new PackingCatalog();
const currencyService = new CurrencyAndTaxiService();

let profile: PilgrimProfile = { ...DEFAULT_PROFILE };
let activePrayerCity: CityLocation = CityLocation.MAKKAH;
let isSeniorMode = false;
let isTalbiyahPlaying = false;
let talbiyahTimer: number | null = null;
let talbiyahAudio: HTMLAudioElement | null = null;
let lapChimeAudio: HTMLAudioElement | null = null;
let wakeLockSentinel: WakeLockSentinel | null = null;
let activeFocusMode: 'tawaf' | 'sai' = 'tawaf';
let currentAtlasFilter = 'ALL';
let currentFiqhFilter = 'ALL';
let currentFiqhQuery = '';
const nusukObjectUrls: Partial<Record<'umrah' | 'rawdah', string>> = {};

function hasCustomProfileData(p: PilgrimProfile | null): boolean {
  if (!p) return false;
  return (
    p.fullName !== DEFAULT_PROFILE.fullName ||
    p.passportNumber !== DEFAULT_PROFILE.passportNumber ||
    p.tripCode !== DEFAULT_PROFILE.tripCode ||
    p.roomNumber !== DEFAULT_PROFILE.roomNumber ||
    p.supervisorPhone !== DEFAULT_PROFILE.supervisorPhone
  );
}

function loadProfile(): void {
  let existingSaved: PilgrimProfile | null = null;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<PilgrimProfile>;
      existingSaved = { ...DEFAULT_PROFILE, ...parsed };
      profile = { ...existingSaved };
    }
  } catch {
    profile = { ...DEFAULT_PROFILE };
  }

  const params = new URLSearchParams(window.location.search);
  const candidate: PilgrimProfile = { ...profile };
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
      (candidate[field] as string) = val.trim();
      updatedFromUrl = true;
    }
  }
  const stageParam = params.get('stage') as TripStatus | null;
  if (stageParam && Object.values(TripStatus).includes(stageParam)) {
    candidate.tripStage = stageParam;
    updatedFromUrl = true;
  }
  const genderParam = params.get('gender');
  if (genderParam === 'MALE' || genderParam === 'FEMALE') {
    candidate.gender = genderParam;
    updatedFromUrl = true;
  }
  const hotelKeyParam = params.get('hotelKey');
  if (hotelKeyParam && HOTEL_PRESETS[hotelKeyParam]) {
    candidate.hotelKey = hotelKeyParam;
    const preset = HOTEL_PRESETS[hotelKeyParam];
    if (!params.get('hotel')) candidate.hotelNameAr = preset.nameAr;
    candidate.hotelNameEn = preset.nameEn;
    if (!params.get('address')) candidate.hotelAddressAr = preset.addressAr;
    if (!params.get('hotelPhone')) candidate.hotelPhone = preset.phone;
    candidate.hotelLat = preset.lat;
    candidate.hotelLng = preset.lng;
    updatedFromUrl = true;
  }

  const installmentInspection = inspectPersonalInstallmentsFromStorageAndParams(params);
  const profileDiffersFromSaved =
    updatedFromUrl &&
    existingSaved !== null &&
    JSON.stringify(candidate) !== JSON.stringify(existingSaved);

  const needsOverwriteGuard =
    (hasCustomProfileData(existingSaved) && profileDiffersFromSaved) ||
    installmentInspection.wouldOverwriteSavedPlan;

  const isEn = getCurrentLanguage() === 'en';
  if (needsOverwriteGuard) {
    // Keep existing saved data untouched in state & storage until confirmed by user
    const displayName = updatedFromUrl ? candidate.fullName : installmentInspection.candidate?.memberName || profile.fullName;
    showSharedLinkOverwriteConfirm(displayName, () => {
      if (updatedFromUrl) {
        profile = candidate;
        if (profile.tripStage === TripStatus.IN_MADINAH) {
          activePrayerCity = CityLocation.MADINAH;
        }
        saveProfile();
      }
      if (installmentInspection.candidate) {
        setPersonalInstallmentData(installmentInspection.candidate);
      }
      renderProfileUI();
      updatePrayerUI();
      showToast(
        isEn ? `✅ Updated card data: ${profile.fullName}` : `✅ تم تحديث بيانات بطاقتك: ${profile.fullName}`
      );
    });
    return;
  }

  if (updatedFromUrl) {
    profile = candidate;
    saveProfile();
    showToast(isEn ? `✅ Loaded card data: ${profile.fullName}` : `✅ تم تحميل بيانات بطاقتك: ${profile.fullName}`);
  }
  if (profile.tripStage === TripStatus.IN_MADINAH) {
    activePrayerCity = CityLocation.MADINAH;
  }
}

function saveProfile(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

/**
 * Show a confirmation dialog before overwriting an existing saved pilgrim profile
 * or installment schedule from a shared URL link.
 */
function showSharedLinkOverwriteConfirm(newName: string, onConfirm: () => void): void {
  const existingModal = document.getElementById('shared-link-overwrite-modal');
  if (existingModal) existingModal.remove();

  const isEn = getCurrentLanguage() === 'en';
  const modal = document.createElement('dialog');
  modal.id = 'shared-link-overwrite-modal';
  modal.setAttribute('aria-labelledby', 'overwrite-modal-title');
  modal.setAttribute('aria-modal', 'true');
  modal.style.maxWidth = 'min(92vw, 440px)';

  modal.innerHTML = `
    <div class="dialog-header">
      <h2 id="overwrite-modal-title" style="font-size:1.1rem;color:var(--primary-ink);">
        ${isEn ? '⚠️ Update Saved Card Data?' : '⚠️ تحديث بيانات البطاقة المحفوظة'}
      </h2>
      <button type="button" id="overwrite-close-x" class="dialog-close-btn" aria-label="${isEn ? 'Close' : 'إغلاق'}">&times;</button>
    </div>
    <p style="margin:0 0 1.25rem;font-size:0.94rem;line-height:1.75;color:var(--text);">
      ${
        isEn
          ? `This shared link contains data for (<strong>${escapeHtml(newName)}</strong>). Replace your existing saved profile/installments on this device?`
          : `يحتوي الرابط المشترك على بيانات جديدة تخص (<strong>${escapeHtml(newName)}</strong>). هل تريد استبدال بياناتك المحفوظة حالياً بهذه البيانات؟`
      }
    </p>
    <div style="display:flex;gap:0.75rem;justify-content:flex-end;flex-wrap:wrap;">
      <button type="button" id="overwrite-cancel-btn" class="btn btn-secondary" style="flex:1;min-width:8rem;" autofocus>
        ${isEn ? 'Keep Existing Data' : '❌ لا، احتفظ ببياناتي'}
      </button>
      <button type="button" id="overwrite-confirm-btn" class="btn btn-primary" style="flex:1;min-width:8rem;">
        ${isEn ? '✅ Update Data' : '✅ نعم، حدّث البيانات'}
      </button>
    </div>
  `;

  document.body.appendChild(modal);
  modal.showModal();

  const cleanup = () => {
    if (modal.isConnected) modal.remove();
  };

  modal.querySelector('#overwrite-close-x')?.addEventListener('click', cleanup);
  modal.querySelector('#overwrite-cancel-btn')?.addEventListener('click', () => {
    cleanup();
    showToast(isEn ? 'ℹ️ Kept your existing saved profile.' : 'ℹ️ تم الاحتفاظ ببياناتك المحفوظة دون تغيير');
  });
  modal.querySelector('#overwrite-confirm-btn')?.addEventListener('click', () => {
    cleanup();
    onConfirm();
  });
  modal.addEventListener('cancel', cleanup);
}

function renderProfileUI(): void {
  const isEn = getCurrentLanguage() === 'en';
  const setText = (id: string, val: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText('badge-trip-code', isEn ? `Group Code: ${profile.tripCode}` : `كود الفوج: ${profile.tripCode}`);
  setText('badge-pilgrim-name', profile.fullName);
  setText('badge-passport', isEn ? `Passport: ${profile.passportNumber}` : `رقم الجواز: ${profile.passportNumber}`);
  setText('badge-hotel', isEn ? profile.hotelNameEn : profile.hotelNameAr);
  setText('badge-room', profile.roomNumber);
  setText('badge-bus', profile.busNumber);
  setText('badge-sup-phone', profile.supervisorPhone);
  setText('sos-meeting-point', profile.meetingPoint);
  setText('header-trip-subtitle', `${profile.tripTitle} • ${getTripStageLabel(profile.tripStage)}`);

  // Stage relevance strip
  const rel = STAGE_RELEVANCE[profile.tripStage] || STAGE_RELEVANCE[TripStatus.IN_MAKKAH];
  const stageBadge = document.getElementById('stage-banner-label');
  const stageHint = document.getElementById('stage-banner-hint');
  const stageCta = document.getElementById('stage-banner-cta') as HTMLButtonElement | null;
  if (stageBadge) stageBadge.textContent = getTripStageLabel(profile.tripStage);
  if (stageHint) stageHint.textContent = isEn ? rel.hintEn : rel.hintAr;
  if (stageCta) {
    stageCta.textContent = isEn ? rel.ctaEn : rel.ctaAr;
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
  setText('sec-hotel-info', `${isEn ? profile.hotelNameEn : profile.hotelNameAr} — ${profile.hotelAddressAr}`);
  setText('sec-sup-info', `${profile.supervisorName} (${profile.supervisorPhone})`);
  setText('sec-med-note', profile.medicalNote);

  const qrContainer = document.getElementById('pilgrim-badge-qr');
  if (qrContainer) {
    const qrPayload = `MECCA HOTEL: ${profile.hotelNameEn} | TEL: ${profile.hotelPhone} | SUP: ${profile.supervisorPhone} | PILGRIM: ${profile.fullName}`;
    qrContainer.innerHTML = renderQrSvg(qrPayload, isEn ? 'Pilgrim & Hotel QR Code' : 'رمز QR لبيانات المعتمر والفندق');
  }

  setText('cert-pilgrim-name', profile.fullName);
  setText('cert-trip-title', profile.tripTitle);
  setText('cert-hijri-date', getMakkahHijriDate());
  setText(
    'cert-supervisor-name',
    isEn ? `Group Supervisor: ${profile.supervisorName} ✍️` : `مشرف الفوج: ${profile.supervisorName} ✍️`
  );
  setText(
    'nusuk-owner-meta',
    isEn
      ? `Pilgrim: ${profile.fullName} | Passport: ${profile.passportNumber}`
      : `المعتمر: ${profile.fullName} | الجواز: ${profile.passportNumber}`
  );

  const gateSelect = document.getElementById('hotel-gate-selector') as HTMLSelectElement | null;
  if (gateSelect && HOTEL_PRESETS[profile.hotelKey]) {
    gateSelect.value = profile.hotelKey;
    renderGateWayfinder();
  }

  renderStagePriorityCard();
}

function renderStagePriorityCard(): void {
  const container = document.getElementById('stage-priority-card');
  if (!container) return;
  const isEn = getCurrentLanguage() === 'en';
  const isFemale = profile.gender === 'FEMALE';

  let badge = getTripStageLabel(profile.tripStage);
  let title = '';
  let body = '';
  let primaryBtnHtml = '';

  if (
    profile.tripStage === TripStatus.DRAFT ||
    profile.tripStage === TripStatus.REGISTRATION_OPEN ||
    profile.tripStage === TripStatus.PRE_DEPARTURE
  ) {
    title = isEn ? '🧳 Focus Now: Pre-Departure & Nusuk Readiness' : '🧳 الأولوية الآن: جاهزية السفر وتصاريح نُسك';
    body = isEn
      ? 'Review your passport validity (> 6 months), fragrance-free hygiene pack, and upload your Nusuk barcode screenshots offline before flying.'
      : 'تأكد من صلاحية الجواز (> 6 أشهر)، وتجهيز أدوات النظافة الخالية من العطور، ورفع لقطات باركود تصريح «نُسك» لتعمل دون إنترنت.';
    primaryBtnHtml = `<button type="button" class="btn btn-primary" data-jump-to-tab="wallet">${isEn ? '🧳 Go to Packing & Nusuk Wallet' : '🧳 مراجعة الحقيبة ومحفظة نُسك'}</button>`;
  } else if (profile.tripStage === TripStatus.IN_TRANSIT) {
    title = isEn ? '✈️ Focus Now: Miqat Crossing & Talbiyah' : '✈️ الأولوية الآن: الإحرام عند الميقات والتلبية';
    body = isEn
      ? `Follow pilot/train announcements before crossing the Miqat.${isFemale ? ' For women: remain in modest clothes without tailored niqab or gloves, and drape headscarf cleanly.' : ''}`
      : `انتبه لإعلان الطيار أو مسار قطار الحرمين عند محاذاة الميقات.${isFemale ? ' للمعتمرة: تحرم في لباسها الساتر بلا نقاب ولا قفازين (ويكفي سدل الخمار عند الرجال)، وتُحرم ولو كانت حائضاً.' : ''}`;
    primaryBtnHtml = `<button type="button" class="btn btn-gold" data-jump-to-tab="ziyarat">${isEn ? '🧭 Open Miqat Route Guide' : '🧭 دليل الميقات حسب مسارك'}</button>`;
  } else if (profile.tripStage === TripStatus.IN_MADINAH) {
    title = isEn ? '🌴 Focus Now: Masjid an-Nabawi & Al-Rawdah' : '🌴 الأولوية الآن: المسجد النبوي والروضة الشريفة';
    body = isEn
      ? isFemale
        ? 'Women’s Rawdah staging follows scheduled Nusuk slots (typically Gate 25 / Northern-Eastern plazas 24–26, 32/37). Visit Masjid Quba with wudu from your hotel for 2 rak’ahs = Umrah reward.'
        : 'Men enter for Salam calmly via Bab Al-Salam (Gate 1). Remember: ablution at hotel + 2 rak’ahs at Masjid Quba equals an Umrah reward (Ibn Majah #1412).'
      : isFemale
        ? 'تنظيم دخول الأخوات للروضة الشريفة عبر تصريح «نُسك» (غالباً بوابة عثمان 25 وممرات 32/37). وتذكري زيارة مسجد قباء بوضوء الفندق ففيه أجر عمرة.'
        : 'دخول الرجال للسلام عبر باب السلام (بوابة 1) بأدب وخفض صوت. ولا تفتك صلاة ركعتين بقباء على طهارة من الفندق فأجرها كعمرة.';
    primaryBtnHtml = `<button type="button" class="btn btn-primary" data-jump-madinah-atlas>${isEn ? '🌴 Madinah Gates & Quba Photos' : '🌴 بوابات المدينة ومسجد قباء بالصور'}</button>`;
  } else if (profile.tripStage === TripStatus.RETURN_TRANSIT || profile.tripStage === TripStatus.COMPLETED) {
    title = isEn ? '🛫 Focus Now: Farewell Tawaf & GACA 5L Zamzam Rule' : '🛫 الأولوية الآن: طواف الوداع وضوابط زمزم بالمطار';
    body = isEn
      ? 'Perform Tawaf al-Wada (exempt for menstruating women) before departing Makkah. GACA permits one factory-sealed 5L Zamzam bottle (~12 SAR) checked separately at Jeddah/Madinah airports.'
      : 'أدِّ طواف الوداع قبل مغادرة مكة (وتُعفى الحائض والنفساء). وبالمطار يُسمح بعبوة واحدة (5 لتر) مغلفة رسمياً (~12 ريالاً) عبر السير المخصص ولا تُوضع داخل الحقائب.';
    primaryBtnHtml = `<button type="button" class="btn btn-gold" data-jump-to-tab="services">${isEn ? '🛫 View GACA Zamzam Rules' : '🛫 استعراض ضوابط المطار الرسمية'}</button>`;
  } else {
    // IN_MAKKAH
    title = isEn
      ? `🕋 In Makkah: Calm Tawaf & Sa’i (${isFemale ? 'Women’s Mode' : 'Men’s Mode'})`
      : `🕋 في رحاب الحرم المكي: (${isFemale ? 'إرشاد المعتمرة' : 'إرشاد المعتمر'})`;
    body = isEn
      ? isFemale
        ? 'Walk calmly in Tawaf and Sa’i (no Ramal or Herwala for women). Keep to shaded edges away from heavy pushing, and follow Gate 79/62/45 signs back to your hotel.'
        : 'ابدأ الطواف بمحاذة الحجر الأسود (والكعبة عن يسارك) دون مزاحمة لتقبيل الحجر؛ تكفي الإشارة باليد اليمنى والتكبير (البخاري 1613).'
      : isFemale
        ? 'المشي بسكينة ووقار في جميع الأشواط (لا رمل ولا هرولة للنساء)، وتجنبي الزحام عند الحجر الأسود بالوقوف في الأطراف والعودة عبر بوابة فندقك المعتمدة.'
        : 'ابدأ بمحاذاة الحجر الأسود (والكعبة عن يسارك) واكتفِ بالإشارة والتكبير عن بعد دون مزاحمة (صحيح البخاري 1613)، واتجه لبوابة فندقك الموصى بها بعد السعي.';
    primaryBtnHtml = `<button type="button" class="btn btn-primary" data-jump-to-tab="haram-atlas">${isEn ? '🚪 Haram Gates & Hotel Wayfinder' : '🚪 بوابات الحرم والعودة للفندق'}</button>`;
  }

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.45rem;">
      <strong style="color:var(--primary-ink);font-size:0.98rem;">${escapeHtml(title)}</strong>
      <span class="badge badge-primary">${escapeHtml(badge)}${isFemale ? (isEn ? ' • Women Profile' : ' • ملف معتمرة') : ''}</span>
    </div>
    <p style="font-size:0.88rem;line-height:1.7;color:var(--text-muted);margin-bottom:0.65rem;">${escapeHtml(body)}</p>
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
      ${primaryBtnHtml}
    </div>
  `;

  container.querySelector('[data-jump-to-tab]')?.addEventListener('click', (e) => {
    const target = (e.currentTarget as HTMLElement).getAttribute('data-jump-to-tab');
    if (target) switchTab(target);
  });
  container.querySelector('[data-jump-madinah-atlas]')?.addEventListener('click', () => {
    currentAtlasFilter = 'MADINAH_ALL';
    switchTab('haram-atlas');
    document.querySelectorAll<HTMLButtonElement>('[data-atlas-filter]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.atlasFilter === 'MADINAH_ALL'));
    });
    renderHaramAtlasSection('MADINAH_ALL');
  });
}

function openQuickSituationModal(kind: 'wudu' | 'miqat' | 'cart'): void {
  const isEn = getCurrentLanguage() === 'en';
  const titleEl = document.getElementById('quick-ruling-title');
  const bodyEl = document.getElementById('quick-ruling-body');
  if (!titleEl || !bodyEl) return;

  if (kind === 'cart') {
    titleEl.textContent = isEn
      ? '♿ Official Electric Carts & Free Wheelchairs (Masjid al-Haram)'
      : '♿ حجز العربات الكهربائية والكراسي المجانية بالحرم';
    bodyEl.innerHTML = `
      <div class="info-box-warn" style="margin-bottom:0.75rem;">
        <strong>${isEn ? 'Avoid unlicensed middlemen:' : 'احذر الوسطاء غير المرخصين:'}</strong>
        <p style="margin-top:0.35rem;font-size:0.9rem;line-height:1.75;">
          ${
            isEn
              ? '1) Book electric golf carts officially inside the Nusuk app (Services → Transport → Haramain Carts).\n2) Borrow complimentary manual wheelchairs with ID from official kiosks at Gate 1 (King Abdulaziz), Gate 62 (Umrah), Gate 79 (King Fahd), or Marwah Mezzanine.'
              : '1) تُحجز العربات الكهربائية رسمياً من تطبيق «نُسك» (الخدمات ← النقل ← عربات الحرمين).\n2) تتوفر كراسي متحركة يدوية مجاناً بالهوية عند المكاتب الرسمية ببوابات 1 و62 و79 والمروة (الأدوار العليا والسطح).'
          }
        </p>
      </div>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
        <a href="https://www.nusuk.sa/" target="_blank" rel="noopener" class="btn btn-primary" style="text-decoration:none;flex:1;">${isEn ? 'Open Nusuk Official Site ↗' : 'فتح موقع نُسك الرسمي ↗'}</a>
        <button type="button" id="btn-quick-to-services" class="btn btn-secondary">${isEn ? 'View All Haram Services' : 'كل خدمات الحرم بالأطلس'}</button>
      </div>
    `;
    openDialogById('quick-ruling-modal');
    document.getElementById('btn-quick-to-services')?.addEventListener('click', () => {
      closeDialogById('quick-ruling-modal');
      switchTab('services');
    });
    return;
  }

  const rulingId =
    kind === 'wudu'
      ? ('WUDU_BREAK_DURING_TAWAF' as const)
      : ('PASSING_MIQAT_WITHOUT_IHRAM' as const);
  const ruling = fiqhAssistant.getAllRulings().find((r) => r.id === rulingId);
  if (!ruling) return;

  const en = FIQH_RULINGS_EN[ruling.id];
  titleEl.textContent = isEn && en ? en.titleEn : ruling.titleAr;
  bodyEl.innerHTML = `
    <p style="font-size:0.92rem;line-height:1.7;margin-bottom:0.65rem;">
      <strong>${isEn ? 'Scholarly Ruling:' : 'الحكم الشرعي:'}</strong>
      ${escapeHtml(isEn && en ? en.rulingEn : ruling.rulingArabic)}
    </p>
    <div class="info-box-neutral" style="margin-bottom:0.65rem;">
      <strong>${isEn ? 'What To Do Now:' : 'الإجراء العملي الآن:'}</strong>
      <p style="margin-top:0.25rem;font-size:0.9rem;line-height:1.7;">${escapeHtml(isEn && en ? en.actionEn : ruling.actionRequired)}</p>
    </div>
    ${
      ruling.madhhabNoteAr
        ? `<div class="info-box-warn" style="font-size:0.86rem;line-height:1.65;"><strong>${isEn ? 'Madhhab Perspective:' : 'بيان الخلاف المعتبر:'}</strong> ${escapeHtml(isEn && ruling.madhhabNoteEn ? ruling.madhhabNoteEn : ruling.madhhabNoteAr)}</div>`
        : ''
    }
    ${renderReferencePillsHtml(ruling.references, isEn)}
  `;
  openDialogById('quick-ruling-modal');
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
  (document.getElementById('edit-gender') as HTMLSelectElement).value = profile.gender || 'MALE';
  (document.getElementById('edit-meeting') as HTMLInputElement).value = profile.meetingPoint;
  (document.getElementById('edit-med') as HTMLInputElement).value = profile.medicalNote;
  openDialogById('profile-modal');
}

function handleProfileSave(e: Event): void {
  e.preventDefault();
  const presetKey = (document.getElementById('edit-hotel-preset') as HTMLSelectElement).value;
  const preset = HOTEL_PRESETS[presetKey] || HOTEL_PRESETS.kiswah;
  const nextStage = (document.getElementById('edit-stage') as HTMLSelectElement).value as TripStatus;
  const nextGender = ((document.getElementById('edit-gender') as HTMLSelectElement)?.value || 'MALE') as 'MALE' | 'FEMALE';

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
    gender: nextGender,
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
    const isEn = getCurrentLanguage() === 'en';
    showToast(
      isEn
        ? `Switched prayer times to ${city === CityLocation.MAKKAH ? 'Makkah' : 'Madinah'}`
        : `تم التبديل لمواقيت ${city === CityLocation.MAKKAH ? 'مكة المكرمة' : 'المدينة المنورة'}`
    );
  }
}

function formatCompactRemaining(totalMinutes: number, isEn: boolean): string {
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const DurationFormatCtor = (
    Intl as {
      DurationFormat?: new (
        locale: string,
        opts: { style: 'long' | 'short' | 'narrow' | 'digital' }
      ) => { format(d: { hours?: number; minutes?: number }): string };
    }
  ).DurationFormat;

  if (DurationFormatCtor) {
    try {
      const df = new DurationFormatCtor(isEn ? 'en' : 'ar-SA', { style: 'narrow' });
      const formatted = df.format({
        ...(hrs > 0 ? { hours: hrs } : {}),
        minutes: mins,
      });
      if (formatted) return formatted;
    } catch {
      // fall through
    }
  }
  if (isEn) return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  return hrs > 0 ? `${hrs}س ${mins}د` : `${mins}د`;
}

function updatePrayerUI(): void {
  const isEn = getCurrentLanguage() === 'en';
  const now = new Date();
  const schedule = prayerEngine.getPrayerScheduleState(activePrayerCity, now);
  const { times, next, cards } = schedule;

  const cityTitle = document.getElementById('prayer-city-title');
  if (cityTitle) {
    if (isEn) {
      cityTitle.textContent =
        activePrayerCity === CityLocation.MAKKAH
          ? 'Prayer Times at Masjid al-Haram (Makkah)'
          : 'Prayer Times at Al-Masjid an-Nabawi (Madinah)';
    } else {
      cityTitle.textContent =
        activePrayerCity === CityLocation.MAKKAH
          ? 'مواقيت الصلاة في المسجد الحرام (مكة المكرمة)'
          : 'مواقيت الصلاة في المسجد النبوي (المدينة المنورة)';
    }
  }

  const hijriEl = document.getElementById('prayer-hijri-date');
  if (hijriEl) {
    if (isEn) {
      let hijriEn = '';
      try {
        hijriEn = new Intl.DateTimeFormat('en-SA-u-ca-islamic-umalqura', {
          timeZone: 'Asia/Riyadh',
          weekday: 'short',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(now);
      } catch {
        hijriEn = getMakkahHijriDate(now);
      }
      hijriEl.textContent = `${hijriEn} — Umm Al-Qura Time (UTC+3)`;
    } else {
      hijriEl.textContent = `${getMakkahHijriDate(now)} — ${times.source}`;
    }
  }

  const heroLabel = document.getElementById('prayer-hero-label');
  if (heroLabel) {
    const baseLabel = next.key === 'sunrise' ? t('prayer.nextSunrise') : t('prayer.nextLabel');
    heroLabel.textContent = next.isTomorrow
      ? isEn
        ? `${baseLabel} (Tomorrow)`
        : `${baseLabel} (غداً)`
      : baseLabel;
  }

  const heroName = document.getElementById('prayer-hero-name');
  if (heroName) {
    const iconMap: Record<string, string> = {
      fajr: '🌅',
      sunrise: '🌄',
      dhuhr: '☀️',
      asr: '🌤️',
      maghrib: '🌇',
      isha: '🌙',
    };
    const nextTitle = isEn ? next.nameEn : next.nameAr;
    heroName.textContent = `${iconMap[next.key] || '🕌'} ${nextTitle} — ${next.prayerTime}`;
  }

  const heroCountdown = document.getElementById('prayer-hero-countdown');
  if (heroCountdown) {
    const hrs = Math.floor(next.secondsRemaining / 3600);
    const mins = Math.floor((next.secondsRemaining % 3600) / 60);
    const secs = next.secondsRemaining % 60;
    const pad2 = (n: number) => String(n).padStart(2, '0');
    heroCountdown.textContent = `${pad2(hrs)}:${pad2(mins)}:${pad2(secs)}`;
  }

  const heroProgress = document.getElementById('prayer-hero-progress') as HTMLProgressElement | null;
  if (heroProgress) {
    heroProgress.value = next.progressPercent;
  }

  const heroSub = document.getElementById('prayer-hero-sub');
  if (heroSub) {
    const cityLabel =
      activePrayerCity === CityLocation.MAKKAH
        ? isEn
          ? 'Makkah time'
          : 'بتوقيت مكة'
        : isEn
          ? 'Madinah time'
          : 'بتوقيت المدينة';
    const nextLabel = isEn ? next.nameEn : next.nameAr;
    heroSub.textContent = isEn
      ? `${nextLabel} at ${next.prayerTime} (${cityLabel}) • ${next.progressPercent}% of interval elapsed`
      : `أذان ${nextLabel} الساعة ${next.prayerTime} (${cityLabel}) • انقضى ${next.progressPercent}% من الفترة`;
  }

  const cardsGrid = document.getElementById('prayer-cards-grid');
  if (cardsGrid) {
    cardsGrid.setAttribute('aria-label', t('prayer.gridLabel'));
  }

  const cardByKey = new Map(cards.map((c) => [c.key, c]));
  document.querySelectorAll<HTMLElement>('.prayer-card').forEach((cardEl) => {
    const key = cardEl.dataset.prayer as (typeof cards)[number]['key'] | undefined;
    const state = key ? cardByKey.get(key) : undefined;
    if (!state) return;

    cardEl.classList.toggle('active', state.status === 'active');
    cardEl.classList.toggle('passed', state.status === 'passed');

    const nameNode = cardEl.querySelector('.prayer-card-name');
    if (nameNode) {
      nameNode.textContent = isEn ? state.nameEn : state.nameAr;
    }

    const timeNode = cardEl.querySelector('.prayer-card-time');
    if (timeNode) {
      timeNode.textContent = state.timeStr;
    }

    const badgeNode = cardEl.querySelector('.prayer-card-badge');
    if (badgeNode) {
      if (state.status === 'passed') {
        badgeNode.textContent = t('prayer.passed');
      } else if (state.status === 'active') {
        const remShort = formatCompactRemaining(state.minutesUntil, isEn);
        badgeNode.textContent = state.isTomorrow
          ? `${t('prayer.tomorrow')} • ${remShort}`
          : `${t('prayer.nextBadge')} • ${remShort}`;
      } else {
        badgeNode.textContent = t('prayer.upcoming');
      }
    }

    const barNode = cardEl.querySelector<HTMLElement>('.prayer-card-progress-bar');
    if (barNode) {
      barNode.style.width = `${state.progressPercent}%`;
    }
  });

  const warningBanner = document.getElementById('mataf-warning-banner');
  if (warningBanner) {
    if (next.matafWarning) {
      warningBanner.textContent = isEn
        ? `⚠️ Crowd Alert: ${next.minutesRemaining} min until ${next.nameEn} Adhan (Makkah). Haram security begins clearing the Mataf courtyard for prayer.`
        : `⚠️ ${next.matafWarning}`;
      warningBanner.style.display = 'block';
    } else {
      warningBanner.style.display = 'none';
    }
  }
}

function speakText(text: string): void {
  const isEn = getCurrentLanguage() === 'en';
  if (!('speechSynthesis' in window)) {
    showToast(
      isEn
        ? '⚠️ Speech synthesis not supported in this browser — read text on screen.'
        : '⚠️ القراءة الصوتية غير مدعومة في هذا المتصفح — يمكنك القراءة من الشاشة'
    );
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
    showToast(
      isEn
        ? '⚠️ Offline voice pack unavailable on this device.'
        : '⚠️ تعذر تشغيل الصوت في وضع الأوفلاين على هذا الجهاز'
    );
  };
  window.speechSynthesis.speak(utterance);
  showToast(
    isEn ? '🔊 Playing audio recitation...' : arabicVoice ? '🔊 جاري قراءة الذكر بالصوت...' : '🔊 تشغيل القراءة الصوتية'
  );
}

function speakTalbiyahSpeechFallback(): void {
  if (!isTalbiyahPlaying) return;
  if (!('speechSynthesis' in window)) {
    stopTalbiyah();
    showToast('⚠️ تعذر تشغيل صوت التلبية على هذا المتصفح');
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

function playTalbiyahOnce(): void {
  if (!isTalbiyahPlaying) return;
  try {
    if (!talbiyahAudio) {
      talbiyahAudio = new Audio('/audio/talbiyah.mp3');
      talbiyahAudio.addEventListener('ended', () => {
        if (isTalbiyahPlaying) {
          talbiyahTimer = window.setTimeout(playTalbiyahOnce, 1200);
        }
      });
      talbiyahAudio.addEventListener('error', () => {
        speakTalbiyahSpeechFallback();
      });
    }
    talbiyahAudio.currentTime = 0;
    void talbiyahAudio.play().catch(() => {
      speakTalbiyahSpeechFallback();
    });
  } catch {
    speakTalbiyahSpeechFallback();
  }
}

function updateTalbiyahButtonUi(): void {
  const icon = document.getElementById('talbiyah-icon');
  const lbl = document.getElementById('talbiyah-btn-label');
  if (icon) icon.textContent = isTalbiyahPlaying ? '⏸️' : '▶️';
  if (lbl) lbl.textContent = isTalbiyahPlaying ? t('talbiyah.pauseBtn') : t('talbiyah.playBtn');
}

function toggleTalbiyahLoop(): void {
  const isEn = getCurrentLanguage() === 'en';
  if (isTalbiyahPlaying) {
    stopTalbiyah();
  } else {
    isTalbiyahPlaying = true;
    updateTalbiyahButtonUi();
    showToast(isEn ? '🔊 Playing offline Talbiyah loop' : '🔊 تم تشغيل التلبية النبوية بالتكرار المستمر');
    playTalbiyahOnce();
  }
}

function stopTalbiyah(): void {
  isTalbiyahPlaying = false;
  if (talbiyahTimer !== null) {
    window.clearTimeout(talbiyahTimer);
    talbiyahTimer = null;
  }
  if (talbiyahAudio) {
    try {
      talbiyahAudio.pause();
      talbiyahAudio.currentTime = 0;
    } catch {
      // ignore
    }
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  updateTalbiyahButtonUi();
}

function updateWakeButtonLabel(): void {
  const active = Boolean(wakeLockSentinel);
  const label = active ? t('tools.wakeActive') : t('tools.wake');
  document.querySelectorAll<HTMLElement>('[data-wake-toggle]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(active));
    btn.innerHTML = `<span aria-hidden="true">🔆</span> <span>${escapeHtml(label)}</span>`;
  });
}

async function toggleWakeLock(): Promise<void> {
  const isEn = getCurrentLanguage() === 'en';
  if (!('wakeLock' in navigator)) {
    showToast(isEn ? '⚠️ Screen wake lock is unsupported here.' : '⚠️ المتصفح لا يدعم تثبيت إضاءة الشاشة تلقائياً');
    return;
  }
  if (wakeLockSentinel) {
    await wakeLockSentinel.release();
    wakeLockSentinel = null;
    updateWakeButtonLabel();
    showToast(isEn ? 'Screen wake lock released' : 'تم إلغاء منع إغلاق الشاشة');
    return;
  }
  try {
    wakeLockSentinel = await navigator.wakeLock.request('screen');
    wakeLockSentinel.addEventListener('release', () => {
      wakeLockSentinel = null;
      updateWakeButtonLabel();
    });
    updateWakeButtonLabel();
    showToast(isEn ? '🔆 Screen will stay awake during Tawaf & Sa’i' : '🔆 ستبقى الشاشة مضاءة أثناء الطواف والسعي');
  } catch {
    showToast(isEn ? 'Could not activate wake lock' : 'تعذر تفعيل منع إغلاق الشاشة');
  }
}

function updateSeniorButtonLabel(): void {
  const label = isSeniorMode ? t('tools.seniorActive') : t('tools.senior');
  document.querySelectorAll<HTMLElement>('[data-senior-toggle]').forEach((btn) => {
    btn.classList.toggle('active', isSeniorMode);
    btn.setAttribute('aria-pressed', String(isSeniorMode));
    btn.innerHTML = `<span aria-hidden="true">👵</span> <span>${escapeHtml(label)}</span>`;
  });
}

function toggleSeniorMode(): void {
  const isEn = getCurrentLanguage() === 'en';
  isSeniorMode = !isSeniorMode;
  document.body.classList.toggle('senior-mode', isSeniorMode);
  updateSeniorButtonLabel();
  try {
    localStorage.setItem(STORAGE_KEYS.SENIOR, isSeniorMode ? '1' : '0');
  } catch {
    // ignore
  }
  showToast(
    isSeniorMode
      ? isEn
        ? 'Senior Mode (Large Text) Enabled'
        : 'تم تفعيل وضع كبار السن (خط كبير)'
      : isEn
        ? 'Returned to standard text size'
        : 'تم الرجوع للخط المعتاد'
  );
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
  const isEn = getCurrentLanguage() === 'en';
  const info = tawafCounter.getCurrentLapInfo();
  const lapEl = document.getElementById('tawaf-lap-num');
  if (lapEl) lapEl.innerHTML = `${info.lapNumber} <span class="lap-total">/ 7</span>`;

  const set = (id: string, val: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  set('tawaf-dua-title', isEn ? `Lap ${info.lapNumber} Suggested Supplication` : info.titleAr);
  set('tawaf-dua-ar', info.duaArabic);
  set('tawaf-dua-tr', isEn ? `${info.duaTransliteration} — "${info.meaningEn}"` : info.duaTransliteration);
  set('tawaf-dua-src', isEn ? `Source: ${info.sourceAr}` : `المصدر: ${info.sourceAr}`);
  set(
    'tawaf-sunnah-note',
    isEn
      ? 'Fiqh Note: No specific dua per lap is mandated in Sunnah; make any sincere Quranic, Prophetic, or personal supplication.'
      : info.sunnahNote
  );
  renderFocusModal();
}

function renderSaiUI(): void {
  const isEn = getCurrentLanguage() === 'en';
  const lapEl = document.getElementById('sai-lap-num');
  const dirEl = document.getElementById('sai-direction-text');
  if (lapEl) lapEl.innerHTML = `${saiCounter.currentLap} <span class="lap-total">/ 7</span>`;
  if (dirEl) {
    dirEl.textContent = isEn
      ? saiCounter.currentLap % 2 === 1
        ? 'Direction: Safa ➡️ Marwah'
        : 'Direction: Marwah ➡️ Safa'
      : saiCounter.currentLap % 2 === 1
        ? 'الاتجاه: من الصفا ⬅️ إلى المروة'
        : 'الاتجاه: من المروة ⬅️ إلى الصفا';
  }
  renderFocusModal();
}

function renderFocusModal(): void {
  const isEn = getCurrentLanguage() === 'en';
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
    if (titleEl) titleEl.textContent = isEn ? '🕋 Tawaf Focus Mode' : '🕋 وضع الطواف المركّز';
    if (subEl)
      subEl.textContent = isEn
        ? 'Kaaba on your left — Black Stone to Black Stone'
        : 'الكعبة عن يسارك — من الحجر الأسود إلى الحجر الأسود';
    if (lapEl) lapEl.innerHTML = `${info.lapNumber} <span class="lap-total">/ 7</span>`;
    if (duaTitleEl) duaTitleEl.textContent = isEn ? info.meaningEn : info.titleAr;
    if (duaArEl) duaArEl.textContent = info.duaArabic;
    if (advBtn) {
      advBtn.className = 'btn btn-primary focus-tap-btn';
      advBtn.textContent =
        info.lapNumber === 7
          ? isEn
            ? '🎉 Finish 7th Lap'
            : '🎉 إنهاء الشوط السابع'
          : isEn
            ? '✅ Completed Lap — Next'
            : '✅ أتممت الشوط — التالي';
    }
  } else {
    const lap = saiCounter.currentLap;
    const isOdd = lap % 2 === 1;
    if (titleEl) titleEl.textContent = isEn ? "🚶‍♂️ Sa'i Focus Mode" : '🚶‍♂️ وضع السعي المركّز';
    if (subEl)
      subEl.textContent = isEn
        ? isOdd
          ? 'Direction: Safa ➡️ Marwah'
          : 'Direction: Marwah ➡️ Safa'
        : isOdd
          ? 'الاتجاه: من الصفا ⬅️ إلى المروة'
          : 'الاتجاه: من المروة ⬅️ إلى الصفا';
    if (lapEl) lapEl.innerHTML = `${lap} <span class="lap-total">/ 7</span>`;
    if (duaTitleEl) duaTitleEl.textContent = isEn ? "Authentic Sa'i Supplication" : 'الذكر المأثور في السعي';
    if (duaArEl) duaArEl.textContent = 'رَبِّ اغْفِرْ وَارْحَمْ إِنَّكَ أَنْتَ الأَعَزُّ الأَكْرَمُ';
    if (advBtn) {
      advBtn.className = 'btn btn-gold focus-tap-btn';
      advBtn.textContent =
        lap === 7
          ? isEn
            ? '🎉 Finish 7th Lap'
            : '🎉 إنهاء الشوط السابع'
          : isEn
            ? '✅ Reached Hill — Next Lap'
            : '✅ وصلت — الشوط التالي';
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

/** Play the persistent offline lap-chime audio as haptic-free auditory confirmation. */
function playLapChime(): void {
  try {
    if (!lapChimeAudio) {
      lapChimeAudio = new Audio('/audio/lap-chime.wav');
      lapChimeAudio.volume = 0.6;
    }
    lapChimeAudio.currentTime = 0;
    void lapChimeAudio.play().catch(() => {/* silently ignore autoplay policy blocks */});
  } catch {
    // ignore in environments without Audio support
  }
}

function incrementTawaf(): void {
  const res = tawafCounter.completeCurrentLap();
  saveCounterState();
  renderTawafUI();
  playLapChime();
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
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.5rem;">
          <button type="button" id="btn-tawaf-done-zamzam" class="btn btn-secondary" style="flex:1;">📸 صورة مقام إبراهيم وزمزم بالأطلس</button>
          <button type="button" id="btn-tawaf-done-start-sai" class="btn btn-gold" style="flex:1;">🎯 بدء السعي المركز الآن</button>
        </div>
      `;
    }
    openDialogById('completion-modal');
    document.getElementById('btn-tawaf-done-zamzam')?.addEventListener('click', () => {
      closeDialogById('completion-modal');
      switchTab('kaaba-core');
    });
    document.getElementById('btn-tawaf-done-start-sai')?.addEventListener('click', () => {
      closeDialogById('completion-modal');
      openFocusRitual('sai');
    });
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
  playLapChime();
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
        <button type="button" id="btn-sai-done-gate45" class="btn btn-primary" style="width:100%;margin-top:0.65rem;">🚪 عرض مخرج المروة وباب الفتح (بوابة 45) والفنادق</button>
      `;
    }
    openDialogById('completion-modal');
    document.getElementById('btn-sai-done-gate45')?.addEventListener('click', () => {
      closeDialogById('completion-modal');
      switchTab('haram-atlas');
    });
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

const clipAudioCache: Partial<Record<string, HTMLAudioElement>> = {};

function playOfflineClipOrSpeak(clipUrl: string, fallbackText: string): void {
  try {
    let audio = clipAudioCache[clipUrl];
    if (!audio) {
      audio = new Audio(clipUrl);
      clipAudioCache[clipUrl] = audio;
    }
    audio.currentTime = 0;
    void audio.play().catch(() => speakText(fallbackText));
  } catch {
    speakText(fallbackText);
  }
}

function showRuknYamani(): void {
  const isEn = getCurrentLanguage() === 'en';
  const dua = tawafCounter.getRuknYamaniDua();
  const title = document.getElementById('dhikr-modal-title');
  const body = document.getElementById('dhikr-modal-body');
  if (title) {
    title.textContent = isEn
      ? '📍 Authentic Dua: Yamani Corner to Black Stone'
      : '📍 الذكر المسنون بين الركن اليماني والحجر الأسود';
  }
  if (body) {
    body.innerHTML = `
      <div class="dua-arabic" style="font-size:1.35rem;font-weight:800;line-height:2;margin-bottom:0.75rem;">«${escapeHtml(dua.arabic)}»</div>
      <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.75rem;">${escapeHtml(dua.transliteration)}</div>
      <div style="font-size:0.85rem;color:var(--primary-ink);font-weight:700;">${isEn ? 'Source:' : 'المصدر:'} ${escapeHtml(dua.sourceAr)}</div>
    `;
  }
  openDialogById('dhikr-modal');
  playOfflineClipOrSpeak('/audio/rukn-yamani.mp3', dua.arabic);
}

function showSafaMarwaDhikr(): void {
  const isEn = getCurrentLanguage() === 'en';
  const d = saiCounter.getSafaMarwaDhikr();
  const title = document.getElementById('dhikr-modal-title');
  const body = document.getElementById('dhikr-modal-body');
  if (title) title.textContent = isEn ? '⛰️ Dhikr on Mount Safa & Marwah' : '⛰️ ذكر الوقوف على الصفا والمروة';
  if (body) {
    body.innerHTML = `
      <div class="info-box-warn" style="margin-bottom:0.75rem;font-weight:700;">
        ${isEn ? 'Upon ascending Safa the first time:' : 'عند أول صعود للصفا:'} ${escapeHtml(d.verseOnFirstSafa)}
      </div>
      <div class="dua-arabic" style="font-size:1.2rem;font-weight:800;line-height:2;margin-bottom:0.75rem;">«${escapeHtml(d.hillDhikr)}»</div>
      <p style="font-size:0.86rem;color:var(--text-muted);line-height:1.7;">${escapeHtml(
        isEn
          ? 'Face the Qiblah on Safa & Marwah, recite Allahu Akbar 3×, pronounce this Sunnah dhikr, and make personal dua (repeating 3×). (Sahih Muslim 1218)'
          : d.instructionAr
      )}</p>
    `;
  }
  openDialogById('dhikr-modal');
  playOfflineClipOrSpeak('/audio/safa-marwah.mp3', d.hillDhikr);
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
      void postLiveSosToCloud({
        tripCode: profile.tripCode,
        pilgrimName: profile.fullName,
        latitude: lat,
        longitude: lng,
        notes: `Distance to hotel: ${distKm} km`,
      });
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

function renderFiqhSection(): void {
  const isEn = getCurrentLanguage() === 'en';
  const list = document.getElementById('fiqh-rulings-list');
  const methBox = document.getElementById('editorial-methodology-box');
  if (methBox) {
    methBox.innerHTML = renderEditorialMethodologyHtml(isEn);
  }
  if (!list) return;

  const q = currentFiqhQuery.toLowerCase().trim();
  const generalCards = fiqhAssistant
    .getAllRulings()
    .map((r) => {
      const en = FIQH_RULINGS_EN[r.id];
      return {
        filterGroup: r.category,
        badgeAr: r.category === 'IHRAM_MIQAT' ? 'إحرام وميقات' : r.category === 'TAWAF_SAI' ? 'طواف وسعي' : 'المرأة والطوارئ',
        badgeEn: r.category === 'IHRAM_MIQAT' ? 'Ihram & Miqat' : r.category === 'TAWAF_SAI' ? 'Tawaf & Sa’i' : 'Women & Care',
        isWomen: r.category === 'WOMEN_HARDSHIP',
        title: isEn && en ? en.titleEn : r.titleAr,
        question: isEn && en ? en.questionEn : r.questionAr,
        ruling: isEn && en ? en.rulingEn : r.rulingArabic,
        action: isEn && en ? en.actionEn : r.actionRequired,
        madhhab: r.madhhabNoteAr ? (isEn && r.madhhabNoteEn ? r.madhhabNoteEn : r.madhhabNoteAr) : '',
        evidence: isEn && en ? en.evidenceEn : r.evidenceSummary,
        references: r.references,
      };
    });

  const womenCards = womenFiqhCatalog.getAllItems().map((item, idx) => {
    const en = WOMEN_FIQH_EN[item.id];
    return {
      filterGroup: 'WOMEN',
      badgeAr: 'فقه المرأة',
      badgeEn: 'Women’s Fiqh',
      isWomen: true,
      title: `${idx + 1}. ${isEn && en ? en.titleEn : item.titleAr}`,
      question: isEn && en ? en.questionEn : item.questionAr,
      ruling: isEn && en ? en.rulingEn : item.rulingAr,
      action: isEn && en ? en.guidanceEn : item.practicalGuidance,
      madhhab: item.madhhabNoteAr ? (isEn && item.madhhabNoteEn ? item.madhhabNoteEn : item.madhhabNoteAr) : '',
      evidence: item.sourceText ? (isEn && en?.sourceEn ? en.sourceEn : item.sourceText) : '',
      references: item.references,
    };
  });

  const allItems = [...generalCards, ...womenCards].filter((entry) => {
    const matchesCategory =
      currentFiqhFilter === 'ALL' ||
      (currentFiqhFilter === 'WOMEN' && (entry.isWomen || entry.filterGroup === 'WOMEN')) ||
      entry.filterGroup === currentFiqhFilter;
    if (!matchesCategory) return false;
    if (!q) return true;
    const hay = `${entry.title} ${entry.question} ${entry.ruling} ${entry.action} ${entry.madhhab} ${entry.evidence}`.toLowerCase();
    return hay.includes(q);
  });

  if (allItems.length === 0) {
    list.innerHTML = `<div class="info-box-neutral">${isEn ? 'No matching fiqh rulings found. Clear filters to view all rulings.' : 'لا توجد مسائل مطابقة للبحث — يمكنك إزالة نص البحث أو اختيار "الكل".'}</div>`;
    return;
  }

  list.innerHTML = allItems
    .map(
      (entry) => `
    <details class="accordion-item ${entry.isWomen ? 'women-topic' : ''}">
      <summary class="accordion-header" style="${entry.isWomen ? 'color:var(--women-accent);' : ''}">
        <span>${escapeHtml(entry.title)}</span>
        <span class="badge ${entry.isWomen ? 'badge-warning' : 'badge-primary'}" style="margin-inline-start:0.5rem;">${escapeHtml(isEn ? entry.badgeEn : entry.badgeAr)}</span>
      </summary>
      <div class="accordion-body">
        <p><strong>${isEn ? 'Question:' : 'السؤال:'}</strong> ${escapeHtml(entry.question)}</p>
        <div class="${entry.isWomen ? 'women-fatwa-box' : 'info-box-neutral'}" style="margin:0.5rem 0;">
          <strong>${isEn ? 'Primary Scholarly Ruling:' : 'الحكم المختار:'}</strong> ${escapeHtml(entry.ruling)}
        </div>
        <p style="margin:0.4rem 0;"><strong>${isEn ? 'Practical Action:' : 'الإجراء العملي:'}</strong> ${escapeHtml(entry.action)}</p>
        ${entry.madhhab ? `<div class="info-box-warn" style="margin:0.45rem 0;font-size:0.84rem;"><strong>⚖️ ${isEn ? 'Recognized Madhhab View:' : 'تنبيه الخلاف المعتبر:'}</strong> ${escapeHtml(entry.madhhab)}</div>` : ''}
        ${entry.evidence ? `<div style="font-size:0.84rem;color:var(--text-muted);margin-top:0.4rem;"><em>${isEn ? 'Summary:' : 'ملخص الدليل:'}</em> ${escapeHtml(entry.evidence)}</div>` : ''}
        ${renderReferencePillsHtml(entry.references, isEn)}
      </div>
    </details>
  `
    )
    .join('');
}

function renderWomenFiqhSection(): void {
  renderFiqhSection();
}

function renderPackingChecklist(): void {
  const isEn = getCurrentLanguage() === 'en';
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
      .map((item) => {
        const en = PACKING_ITEMS_EN[item.id];
        return `
      <label class="pack-row" for="cb-${escapeHtml(item.id)}">
        <input type="checkbox" class="packing-cb" id="cb-${escapeHtml(item.id)}" value="${escapeHtml(item.id)}" ${saved.includes(item.id) ? 'checked' : ''}>
        <div>
          <strong>${escapeHtml(isEn && en ? en.nameEn : item.nameAr)}</strong>
          <div style="font-size:0.84rem;color:var(--text-muted);">${escapeHtml(isEn && en ? en.descEn : item.descriptionAr)}</div>
        </div>
      </label>
    `;
      })
      .join('');
  }

  document.querySelectorAll<HTMLInputElement>('.packing-cb').forEach((cb) => {
    cb.addEventListener('change', updatePackingProgress);
  });
  updatePackingProgress();
}

function updatePackingProgress(): void {
  const isEn = getCurrentLanguage() === 'en';
  const checkedIds = Array.from(document.querySelectorAll<HTMLInputElement>('.packing-cb:checked')).map(
    (cb) => cb.value
  );
  const readiness = packingCatalog.calculateReadiness(checkedIds);
  const pctEl = document.getElementById('packing-percentage-label');
  const barEl = document.getElementById('packing-progress-bar');
  const sumEl = document.getElementById('packing-status-summary');
  if (pctEl) pctEl.textContent = `${readiness.percentage}%`;
  if (barEl) barEl.style.width = `${readiness.percentage}%`;
  if (sumEl) {
    sumEl.textContent = isEn
      ? `Prepared ${readiness.checked} of ${readiness.total} essential items`
      : `تم تجهيز ${readiness.checked} من ${readiness.total} عنصراً ضرورياً`;
  }

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

  const isEn = getCurrentLanguage() === 'en';
  const taxiContainer = document.getElementById('taxi-routes-list');
  if (taxiContainer) {
    taxiContainer.innerHTML = currencyService
      .getAllTaxiRoutes()
      .map((r) => {
        const en = TAXI_ROUTES_EN[r.id];
        return `
      <div class="info-box-neutral">
        <div style="display:flex;justify-content:space-between;font-weight:800;color:var(--primary-ink);gap:0.5rem;">
          <span>${r.city === 'MAKKAH' ? '🕋' : '🕌'} ${escapeHtml(isEn && en ? `${en.fromEn} → ${en.toEn}` : `${r.fromAr} ← ${r.toAr}`)}</span>
          <span style="color:var(--gold-dark);white-space:nowrap;">${r.fairPriceMinSAR}–${r.fairPriceMaxSAR} ${isEn ? 'SAR' : 'ريال'}</span>
        </div>
        <div style="font-size:0.84rem;color:var(--text-muted);margin-top:0.25rem;">${isEn ? `~${r.distanceKm} km` : `المسافة ~${r.distanceKm} كم`} • ${escapeHtml(isEn && en ? en.adviceEn : r.adviceAr)}</div>
        ${renderReferencePillsHtml(r.references, isEn)}
      </div>
    `;
      })
      .join('');
  }

  const resContainer = document.getElementById('official-resources-grid');
  if (resContainer) {
    const isEn = getCurrentLanguage() === 'en';
    resContainer.innerHTML = OFFICIAL_SAUDI_RESOURCES.map((res) => {
      const en = OFFICIAL_RESOURCES_EN[res.id];
      return `
      <div class="info-box-neutral" style="display:flex;flex-direction:column;justify-content:space-between;gap:0.6rem;">
        <div>
          <div style="display:flex;justify-content:space-between;gap:0.4rem;flex-wrap:wrap;margin-bottom:0.25rem;">
            <strong style="color:var(--primary-ink);">${escapeHtml(isEn && en ? en.titleEn : res.titleAr)}</strong>
            <span class="badge badge-primary">${escapeHtml(res.lastVerified)}</span>
          </div>
          <p style="font-size:0.86rem;color:var(--text-muted);line-height:1.6;">${escapeHtml(isEn && en ? en.summaryEn : res.summaryAr)}</p>
        </div>
        <a href="${escapeHtml(res.urlOrTel)}" ${res.urlOrTel.startsWith('http') ? 'target="_blank" rel="noopener"' : ''} class="btn btn-secondary" style="text-decoration:none;font-size:0.86rem;">
          ${escapeHtml(isEn && en ? en.actionEn : res.actionLabelAr)}
        </a>
      </div>
    `;
    }).join('');
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

function switchTab(rawTab: string): void {
  // Support consolidated 4-pillar IA while preserving legacy deep links and contextual aliases
  let tab = rawTab;
  let atlasFilterOverride: string | null = null;
  let fiqhFilterOverride: string | null = null;

  if (rawTab === 'packing' || rawTab === 'gates-taxi') {
    tab = rawTab === 'gates-taxi' ? 'wallet' : 'wallet';
  } else if (rawTab === 'ziyarat') {
    tab = 'haram-atlas';
    atlasFilterOverride = 'ZIYARAT';
  } else if (rawTab === 'services') {
    tab = 'haram-atlas';
    atlasFilterOverride = 'SERVICES';
  } else if (rawTab === 'kaaba-core') {
    tab = 'haram-atlas';
    atlasFilterOverride = 'KAABA_CORE';
  } else if (rawTab === 'women-fiqh') {
    tab = 'fiqh';
    fiqhFilterOverride = 'WOMEN';
  }

  const tabs = ['rituals', 'haram-atlas', 'fiqh', 'wallet'];
  if (!tabs.includes(tab)) return;

  if (atlasFilterOverride) {
    currentAtlasFilter = atlasFilterOverride;
    document.querySelectorAll<HTMLButtonElement>('[data-atlas-filter]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.atlasFilter === atlasFilterOverride));
    });
    renderHaramAtlasSection(atlasFilterOverride);
  }
  if (fiqhFilterOverride) {
    currentFiqhFilter = fiqhFilterOverride;
    document.querySelectorAll<HTMLButtonElement>('[data-fiqh-filter]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.fiqhFilter === fiqhFilterOverride));
    });
    renderFiqhSection();
  }

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
  const wasInPopover = Boolean(morePop && document.activeElement && morePop.contains(document.activeElement));
  if (morePop && morePop.matches(':popover-open') && morePop.hidePopover) {
    morePop.hidePopover();
  }
  if (wasInPopover) {
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}

window.addEventListener('DOMContentLoaded', () => {
  initThemeSync();
  initLanguage();
  updateThemeButtonLabel();
  setupDialogs();
  initImageLightbox();
  initStickyHeaders();
  registerServiceWorkerAndNetworkStatus();

  loadProfile();
  const initialTab = new URLSearchParams(window.location.search).get('tab');
  const badgeToken = new URLSearchParams(window.location.search).get('token');
  if (badgeToken) {
    void fetchBadgeFromCloud(badgeToken).then((cloudBadge) => {
      if (!cloudBadge || typeof cloudBadge.fullName !== 'string') return;
      const merged: PilgrimProfile = {
        ...profile,
        fullName: cloudBadge.fullName,
        passportNumber: typeof cloudBadge.passportNumber === 'string' ? cloudBadge.passportNumber : profile.passportNumber,
        tripCode: typeof cloudBadge.tripCode === 'string' ? cloudBadge.tripCode : profile.tripCode,
        tripTitle: typeof cloudBadge.tripTitle === 'string' ? cloudBadge.tripTitle : profile.tripTitle,
        hotelNameAr: typeof cloudBadge.hotelNameAr === 'string' ? cloudBadge.hotelNameAr : profile.hotelNameAr,
        hotelNameEn: typeof cloudBadge.hotelNameEn === 'string' ? cloudBadge.hotelNameEn : profile.hotelNameEn,
        hotelAddressAr: typeof cloudBadge.hotelAddressAr === 'string' ? cloudBadge.hotelAddressAr : profile.hotelAddressAr,
        hotelPhone: typeof cloudBadge.hotelPhone === 'string' ? cloudBadge.hotelPhone : profile.hotelPhone,
        roomNumber: typeof cloudBadge.roomNumber === 'string' ? cloudBadge.roomNumber : profile.roomNumber,
        busNumber: typeof cloudBadge.busNumber === 'string' ? cloudBadge.busNumber : profile.busNumber,
        supervisorName: typeof cloudBadge.supervisorName === 'string' ? cloudBadge.supervisorName : profile.supervisorName,
        supervisorPhone: typeof cloudBadge.supervisorPhone === 'string' ? cloudBadge.supervisorPhone : profile.supervisorPhone,
        meetingPoint: typeof cloudBadge.meetingPoint === 'string' ? cloudBadge.meetingPoint : profile.meetingPoint,
      };
      if (hasCustomProfileData(profile) && profile.fullName !== merged.fullName) {
        showSharedLinkOverwriteConfirm(merged.fullName, () => {
          profile = merged;
          saveProfile();
          renderProfileUI();
          showToast(`☁️ تم تحديث بيانات البطاقة من السحابة: ${profile.fullName}`);
        });
      } else {
        profile = merged;
        saveProfile();
        renderProfileUI();
        showToast(`☁️ تم تحديث بيانات البطاقة من السحابة: ${profile.fullName}`);
      }
    });
  }
  renderProfileUI();
  restoreCounters();
  renderZiyaratAndFieldGuides();
  renderFiqhSection();
  renderWomenFiqhSection();
  renderPackingChecklist();
  void loadNusukWalletImages();
  renderHaramAtlasSection(currentAtlasFilter);
  renderCurrencyAndTaxi();
  updatePrayerUI();
  updateNetworkStatusBadge();
  updateSeniorButtonLabel();
  updateWakeButtonLabel();
  updateTalbiyahButtonUi();
  window.setInterval(updatePrayerUI, 1000);
  const prayerDisclosure = document.getElementById('prayer-cards-disclosure') as HTMLDetailsElement | null;
  if (prayerDisclosure && window.innerWidth < 768) {
    prayerDisclosure.open = false;
  }
  if (initialTab) switchTab(initialTab);

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
  document.querySelectorAll<HTMLElement>('[data-lang-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = toggleLanguage();
      updateThemeButtonLabel();
      updateSeniorButtonLabel();
      updateWakeButtonLabel();
      updateTalbiyahButtonUi();
      updateNetworkStatusBadge();
      renderProfileUI();
      updatePrayerUI();
      renderTawafUI();
      renderSaiUI();
      renderZiyaratAndFieldGuides();
      renderFiqhSection();
      renderWomenFiqhSection();
      renderPackingChecklist();
      renderHaramAtlasSection(currentAtlasFilter);
      renderGateWayfinder();
      renderCurrencyAndTaxi();
      showToast(next === 'en' ? '🌐 Switched interface to English' : '🌐 تم التبديل للغة العربية');
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
  document.getElementById('btn-my-installments')?.addEventListener('click', openMyInstallmentsModal);
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
  document.getElementById('btn-quick-lost')?.addEventListener('click', () => {
    switchTab('haram-atlas');
    detectNearestHaramGate({
      hotelKey: profile.hotelKey,
      hotelNameAr: profile.hotelNameAr,
      hotelNameEn: profile.hotelNameEn,
      hotelLat: profile.hotelLat,
      hotelLng: profile.hotelLng,
      city: activePrayerCity === CityLocation.MADINAH ? 'MADINAH' : 'MAKKAH',
    });
  });
  document.getElementById('btn-quick-wudu')?.addEventListener('click', () => openQuickSituationModal('wudu'));
  document.getElementById('btn-quick-miqat')?.addEventListener('click', () => openQuickSituationModal('miqat'));
  document.getElementById('btn-quick-cart')?.addEventListener('click', () => openQuickSituationModal('cart'));

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
    const isEn = getCurrentLanguage() === 'en';
    const l1 = Number((document.getElementById('lap-doubt-1') as HTMLSelectElement).value);
    const l2 = Number((document.getElementById('lap-doubt-2') as HTMLSelectElement).value);
    const res = fiqhAssistant.resolveLapDoubt(l1, l2);
    const resDiv = document.getElementById('lap-doubt-result');
    if (resDiv) {
      resDiv.style.display = 'block';
      resDiv.innerHTML = isEn
        ? `<strong>Scholarly Ruling:</strong> Build on certainty (the lesser count): consider yourself in lap <strong>${res.recommendedLap}</strong> and continue to 7.`
        : `<strong>الفتوى الشرعية:</strong> ${escapeHtml(res.rulingArabic)}`;
    }
    showToast(
      isEn
        ? `Rule: Count yourself at Lap ${res.recommendedLap}`
        : `القاعدة: تعتبر نفسك في الشوط ${res.recommendedLap}`
    );
  });

  document.querySelectorAll<HTMLButtonElement>('[data-fiqh-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.fiqhFilter || 'ALL';
      currentFiqhFilter = f;
      document.querySelectorAll<HTMLButtonElement>('[data-fiqh-filter]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      renderFiqhSection();
    });
  });

  document.getElementById('fiqh-search-input')?.addEventListener('input', (e) => {
    currentFiqhQuery = (e.target as HTMLInputElement).value;
    renderFiqhSection();
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

  document.querySelectorAll<HTMLButtonElement>('[data-atlas-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.atlasFilter || 'ALL';
      currentAtlasFilter = f;
      document.querySelectorAll<HTMLButtonElement>('[data-atlas-filter]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      renderHaramAtlasSection(f);
    });
  });

  document.getElementById('btn-find-nearest-gate')?.addEventListener('click', () =>
    detectNearestHaramGate({
      hotelKey: profile.hotelKey,
      hotelNameAr: profile.hotelNameAr,
      hotelNameEn: profile.hotelNameEn,
      hotelLat: profile.hotelLat,
      hotelLng: profile.hotelLng,
      city: activePrayerCity === CityLocation.MADINAH ? 'MADINAH' : 'MAKKAH',
    })
  );
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
