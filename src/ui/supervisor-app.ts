import {
  Gender,
  RoomType,
  Room,
  Hotel,
  TripStatus,
  RoomingEngine,
  EmergencySOSDispatcher,
} from '../operations/trip-logistics.js';
import { LuggageStatus, BagType } from '../operations/luggage-tracker.js';
import { ChronicCondition } from '../operations/medical-profile.js';
import { PeopleDirectory, PersonRecord } from '../operations/people-directory.js';
import { UmrahGroupRegistry } from '../operations/multi-group-manager.js';
import { Money } from '../financial/money.js';
import {
  GameyaGroup,
  GameyaType,
  PaymentMethod,
  InstallmentStatus,
  previewInstallmentPlan,
} from '../financial/gameya.js';
import { WhatsAppBroadcastManager, BroadcastPhase } from '../guidance/whatsapp-and-fiqh.js';
import { OFFICIAL_SAUDI_RESOURCES } from '../guidance/official-resources.js';
import {
  BRAND_SOCIAL_LINKS,
  MARKETING_BROADCAST_TEMPLATES,
  SHEIKH_BRAND,
  buildMostafaDirectWhatsAppUrl,
} from '../brand/sheikh-brand.js';
import { renderSharedBrandFooter } from './pilgrim/brand-view.js';
import {
  TRIP_STAGE_LABELS,
  getTripStageLabel,
  escapeHtml,
  buildWhatsAppUrl,
  renderQrSvg,
  showToast,
  showUndoToast,
  handleTwoStepDelete,
  copyToClipboard,
  setupDialogs,
  openDialogById,
  closeDialogById,
  initAccessibleFormValidation,
  initStickyHeaders,
  initThemeSync,
  toggleColorScheme,
  updateThemeButtonLabel,
  initImageLightbox,
  updateNetworkStatusBadge,
  registerServiceWorkerAndNetworkStatus,
} from './shared.js';
import { createSyncChannel, idbGetJson, idbSetJson } from './storage.js';
import { getCurrentLanguage, initLanguage, t, toggleLanguage } from './i18n.js';
import { renderReferencePillsHtml } from './references-ui.js';
import {
  pushGroupWorkspaceToCloud,
  pullGroupWorkspaceFromCloud,
  flushSyncOutbox,
  getSyncAuthToken,
  setSyncAuthToken,
  writeBadgeToCloud,
  fetchCloudSosEvents,
  resolveCloudSosEvent,
} from './cloud-sync.js';
import { OFFICIAL_RESOURCES_EN } from './guidance-en.js';
import { enforcePrivacyLockIfConfigured, wirePrivacyLockHandlers } from './supervisor/privacy-lock.js';
import type {
  PilgrimRecord,
  GameyaRecord,
  GroupWorkspace,
  MultiGroupRootState,
} from './supervisor/types.js';

const STORAGE_KEY = 'umrah_supervisor_multi_v3';
const broadcastManager = new WhatsAppBroadcastManager();
const roomingEngine = new RoomingEngine();

const PLAN_LABELS: Record<GameyaType, string> = {
  [GameyaType.ROTATING_ROSCA]: 'جمعية دورية بالأدوار',
  [GameyaType.DIRECT_INSTALLMENT]: 'تقسيط شهري مباشر',
  [GameyaType.DEPOSIT_PLUS_MONTHLY]: 'مقدم حجز + أقساط شهرية',
  [GameyaType.DEPOSIT_PLUS_FINAL]: 'مقدم + سداد الباقي قبل السفر',
  [GameyaType.BIWEEKLY_INSTALLMENT]: 'تقسيط كل أسبوعين',
  [GameyaType.FULL_CASH]: 'سداد نقدي كامل',
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'نقدي (كاش)',
  [PaymentMethod.INSTAPAY]: 'إنستاباي (InstaPay)',
  [PaymentMethod.VODAFONE_CASH]: 'محفظة إلكترونية',
  [PaymentMethod.BANK_TRANSFER]: 'تحويل بنكي',
  [PaymentMethod.CARD]: 'بطاقة بنكية',
};

const PLAN_LABELS_EN: Record<GameyaType, string> = {
  [GameyaType.ROTATING_ROSCA]: 'Rotating ROSCA (Turns)',
  [GameyaType.DIRECT_INSTALLMENT]: 'Monthly Installments',
  [GameyaType.DEPOSIT_PLUS_MONTHLY]: 'Deposit + Monthly',
  [GameyaType.DEPOSIT_PLUS_FINAL]: 'Deposit + Pre-Trip Balance',
  [GameyaType.BIWEEKLY_INSTALLMENT]: 'Biweekly Installments',
  [GameyaType.FULL_CASH]: 'Full Cash Settlement',
};

const PAYMENT_METHOD_LABELS_EN: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.INSTAPAY]: 'InstaPay',
  [PaymentMethod.VODAFONE_CASH]: 'Mobile Wallet',
  [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
  [PaymentMethod.CARD]: 'Bank Card',
};

function getPlanLabel(type: GameyaType): string {
  return getCurrentLanguage() === 'en' ? PLAN_LABELS_EN[type] : PLAN_LABELS[type];
}

function getMethodLabel(method: PaymentMethod): string {
  return getCurrentLanguage() === 'en' ? PAYMENT_METHOD_LABELS_EN[method] : PAYMENT_METHOD_LABELS[method];
}

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
    addressAr: 'أجياد، أمام بوابة الملك عبد العزيز (1)',
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

function createInitialState(): MultiGroupRootState {
  const peopleDir = new PeopleDirectory();
  const initialPeople: Array<Omit<PersonRecord, 'updatedAt'>> = [
    {
      id: 'per-1',
      fullName: 'أحمد محمود الشريف',
      gender: Gender.MALE,
      nationalId: '29001011234567',
      passportNumber: 'A12345678',
      passportExpiryDate: '2028-05-15',
      phone: '+201000000001',
      emergencyContactName: 'محمود الشريف',
      emergencyContactPhone: '+201099999999',
      conditions: [ChronicCondition.NONE],
      requiresWheelchair: false,
      requiresInsulinRefrigeration: false,
      pastTrips: ['عمرة رجب 1446', 'فوج شعبان المبارك (أ)'],
      notes: 'ملتزم بالمواعيد — غرفة هادئة',
    },
    {
      id: 'per-2',
      fullName: 'محمود حسن علي',
      gender: Gender.MALE,
      nationalId: '28505121234567',
      passportNumber: 'A23456789',
      passportExpiryDate: '2027-11-20',
      phone: '+201022222222',
      emergencyContactName: 'حسن علي',
      emergencyContactPhone: '+201033333333',
      conditions: [ChronicCondition.NONE],
      requiresWheelchair: false,
      requiresInsulinRefrigeration: false,
      pastTrips: ['فوج شعبان المبارك (أ)'],
    },
    {
      id: 'per-3',
      fullName: 'سعيد إبراهيم خليل',
      gender: Gender.MALE,
      nationalId: '27808091234567',
      passportNumber: 'A34567890',
      passportExpiryDate: '2026-06-15',
      phone: '+201200000000',
      emergencyContactName: 'الحاج إبراهيم خليل',
      emergencyContactPhone: '+201200000001',
      conditions: [ChronicCondition.DIABETES],
      requiresWheelchair: true,
      requiresInsulinRefrigeration: true,
      pastTrips: ['فوج شعبان المبارك (أ)'],
      notes: 'مرافق لوالده الحاج إبراهيم (يحتاج كرسي + ثلاجة إنسولين)',
    },
    {
      id: 'per-4',
      fullName: 'فاطمة إبراهيم مصطفى',
      gender: Gender.FEMALE,
      nationalId: '28203041234567',
      passportNumber: 'A45678901',
      passportExpiryDate: '2028-02-10',
      phone: '+201087654321',
      emergencyContactName: 'خديجة مصطفى',
      emergencyContactPhone: '+201087654322',
      conditions: [ChronicCondition.HYPERTENSION],
      requiresWheelchair: false,
      requiresInsulinRefrigeration: false,
      pastTrips: ['فوج شعبان المبارك (أ)'],
      notes: 'مرافقة لوالدتها الحاجة خديجة (عربة غولف كهربائية)',
    },
    {
      id: 'per-5',
      fullName: 'خالد عبد الله المنصور',
      gender: Gender.MALE,
      nationalId: '28812121234567',
      passportNumber: 'B55443322',
      passportExpiryDate: '2029-01-01',
      phone: '+201111111111',
      emergencyContactName: 'عبد الله المنصور',
      emergencyContactPhone: '+201122222222',
      conditions: [ChronicCondition.NONE],
      requiresWheelchair: false,
      requiresInsulinRefrigeration: false,
      pastTrips: ['فوج رمضان الأوائل'],
    },
  ];
  initialPeople.forEach((p) => peopleDir.upsertPerson(p));

  const group1: GroupWorkspace = {
    id: 'grp-shaban-a',
    settings: {
      tripTitle: 'فوج شعبان المبارك (المجموعة أ)',
      tripCode: '#SHB-A',
      status: TripStatus.IN_MAKKAH,
      startDate: '2026-02-10',
      endDate: '2026-02-20',
      busNumber: 'باص رقم (1)',
      hotelKey: 'kiswah',
      hotelNameAr: 'فندق أبراج الكسوة',
      hotelNameEn: 'Al Kiswah Towers Hotel',
      hotelAddressAr: 'التيسير، جرول، مكة المكرمة',
      hotelPhone: '+966125300000',
      hotelLat: 21.4312,
      hotelLng: 39.8165,
      supervisorName: 'الشيخ مصطفى فليفل (أبو رضوى)',
      supervisorPhone: '+201040414659',
      gatheringTime: 'بعد صلاة العصر بنصف ساعة',
      meetingPoint: 'بوابة الملك عبد العزيز (بوابة 1)',
    },
    pilgrims: [
      { id: 'p-1', personId: 'per-1', fullName: 'أحمد محمود الشريف', gender: Gender.MALE, passportNumber: 'A12345678', phone: '+201000000001', roomNumber: '502', boarded: true, nusukReady: true },
      { id: 'p-2', personId: 'per-2', fullName: 'محمود حسن علي', gender: Gender.MALE, passportNumber: 'A23456789', phone: '+201022222222', roomNumber: '502', boarded: true, nusukReady: true },
      { id: 'p-3', personId: 'per-3', fullName: 'سعيد إبراهيم خليل', gender: Gender.MALE, passportNumber: 'A34567890', phone: '+201200000000', roomNumber: '504', boarded: false, nusukReady: true },
      { id: 'p-4', personId: 'per-4', fullName: 'فاطمة إبراهيم مصطفى', gender: Gender.FEMALE, passportNumber: 'A45678901', phone: '+201087654321', roomNumber: '601', boarded: false, nusukReady: true },
    ],
    rooms: [
      { id: 'r-502', roomNumber: '502', type: RoomType.DOUBLE, capacity: 2, isFamilyRoom: false, occupantIds: ['p-1', 'p-2'] },
      { id: 'r-504', roomNumber: '504', type: RoomType.TRIPLE, capacity: 3, isFamilyRoom: false, occupantIds: ['p-3'] },
      { id: 'r-601', roomNumber: '601', type: RoomType.DOUBLE, capacity: 2, isFamilyRoom: true, occupantIds: ['p-4'] },
    ],
    gameya: [
      {
        id: 'g-1',
        name: 'خالد عبد الله المنصور',
        phone: '+201111111111',
        planType: GameyaType.FULL_CASH,
        turnMonth: 1,
        totalTarget: 40000,
        downPayment: 40000,
        installmentCount: 1,
        totalPaid: 40000,
        startDateIso: '2026-01-01',
        payments: [{ id: 'pay-1', amount: 40000, method: PaymentMethod.BANK_TRANSFER, ref: 'BNK-1041', dateIso: '2026-01-02' }],
      },
      {
        id: 'g-2',
        name: 'سعيد إبراهيم خليل',
        phone: '+201200000000',
        planType: GameyaType.DEPOSIT_PLUS_MONTHLY,
        turnMonth: 3,
        totalTarget: 40000,
        downPayment: 10000,
        installmentCount: 6,
        totalPaid: 20000,
        startDateIso: '2026-01-01',
        payments: [
          { id: 'pay-2', amount: 10000, method: PaymentMethod.INSTAPAY, ref: 'IPN-2211', dateIso: '2026-01-03' },
          { id: 'pay-3', amount: 10000, method: PaymentMethod.CASH, dateIso: '2026-02-01' },
        ],
      },
      {
        id: 'g-3',
        name: 'أحمد محمود الشريف',
        phone: '+201000000001',
        planType: GameyaType.ROTATING_ROSCA,
        turnMonth: 5,
        totalTarget: 40000,
        downPayment: 0,
        installmentCount: 10,
        totalPaid: 16000,
        startDateIso: '2026-01-01',
        payments: [{ id: 'pay-4', amount: 16000, method: PaymentMethod.VODAFONE_CASH, ref: 'VFC-881', dateIso: '2026-01-15' }],
      },
    ],
    luggage: [
      { id: 'l-1', tagCode: 'BAG-502-01', pilgrimName: 'أحمد محمود الشريف', roomNumber: '502', bagType: 'SUITCASE', status: LuggageStatus.DELIVERED_TO_ROOM },
      { id: 'l-2', tagCode: 'BAG-502-02', pilgrimName: 'محمود حسن علي', roomNumber: '502', bagType: 'SUITCASE', status: LuggageStatus.HOTEL_LOBBY },
      { id: 'l-3', tagCode: 'BAG-504-01', pilgrimName: 'سعيد إبراهيم خليل', roomNumber: '504', bagType: 'SUITCASE', status: LuggageStatus.ON_BUS },
      { id: 'l-4', tagCode: 'BAG-601-01', pilgrimName: 'فاطمة إبراهيم مصطفى', roomNumber: '601', bagType: 'SUITCASE', status: LuggageStatus.HOTEL_LOBBY },
    ],
    medical: [
      {
        id: 'm-1',
        pilgrimName: 'الحاج إبراهيم خليل',
        roomNumber: '504',
        conditions: [ChronicCondition.DIABETES, ChronicCondition.MOBILITY_IMPAIRED],
        requiresWheelchair: true,
        requiresElectricCart: false,
        requiresInsulinRefrigeration: true,
        emergencyContactName: 'سعيد إبراهيم',
        emergencyContactPhone: '+201200000000',
        notes: 'يحتاج كرسياً متحركاً بالدور العلوي وحفظ حقن الإنسولين بثلاجة الفندق.',
      },
      {
        id: 'm-2',
        pilgrimName: 'الحاجة خديجة مصطفى',
        roomNumber: '601',
        conditions: [ChronicCondition.HYPERTENSION],
        requiresWheelchair: false,
        requiresElectricCart: true,
        requiresInsulinRefrigeration: false,
        emergencyContactName: 'فاطمة إبراهيم',
        emergencyContactPhone: '+201087654321',
        notes: 'تحتاج حجز عربة غولف كهربائية عبر تطبيق نُسك.',
      },
    ],
    sosAlerts: [],
  };

  const group2: GroupWorkspace = {
    id: 'grp-ramadan-1',
    settings: {
      tripTitle: 'فوج رمضان الأوائل (المجموعة ب)',
      tripCode: '#RMD-B',
      status: TripStatus.PRE_DEPARTURE,
      startDate: '2026-03-01',
      endDate: '2026-03-11',
      busNumber: 'باص رقم (2)',
      hotelKey: 'clock',
      hotelNameAr: 'وقف الملك عبد العزيز (أبراج البيت)',
      hotelNameEn: 'Abraj Al Bait / Clock Tower',
      hotelAddressAr: 'أجياد، أمام بوابة الملك عبد العزيز (1)',
      hotelPhone: '+966125718888',
      hotelLat: 21.4189,
      hotelLng: 39.8257,
      supervisorName: 'الشيخ مصطفى فليفل (أبو رضوى)',
      supervisorPhone: '+201040414659',
      gatheringTime: 'قبل الإقلاع بـ 4 ساعات',
      meetingPoint: 'صالة السفر الدولية / ثم باب الملك عبد العزيز (1)',
    },
    pilgrims: [
      { id: 'p2-1', personId: 'per-5', fullName: 'خالد عبد الله المنصور', gender: Gender.MALE, passportNumber: 'B55443322', phone: '+201111111111', roomNumber: '1204', boarded: false, nusukReady: true },
    ],
    rooms: [
      { id: 'r2-1204', roomNumber: '1204', type: RoomType.DOUBLE, capacity: 2, isFamilyRoom: false, occupantIds: ['p2-1'] },
    ],
    gameya: [
      {
        id: 'g2-1',
        name: 'خالد عبد الله المنصور',
        phone: '+201111111111',
        planType: GameyaType.DEPOSIT_PLUS_FINAL,
        turnMonth: 1,
        totalTarget: 55000,
        downPayment: 20000,
        installmentCount: 2,
        totalPaid: 20000,
        startDateIso: '2026-02-01',
        payments: [{ id: 'pay-21', amount: 20000, method: PaymentMethod.INSTAPAY, ref: 'IPN-770', dateIso: '2026-02-01' }],
      },
    ],
    luggage: [],
    medical: [],
    sosAlerts: [],
  };

  return {
    activeGroupId: group1.id,
    groups: [group1, group2],
    people: peopleDir.getAllPeople(),
  };
}

let rootState: MultiGroupRootState = createInitialState();
let manifestFilter = '';
let peopleFilter = '';
let gameyaFilter: 'ALL' | 'OVERDUE' | 'ACTIVE' | 'PAID' | 'ROSCA' = 'ALL';
let gameyaSearch = '';
let activePaymentMemberId = '';

function getActiveGroup(): GroupWorkspace {
  return rootState.groups.find((g) => g.id === rootState.activeGroupId) || rootState.groups[0];
}

const syncChannel = createSyncChannel((scope) => {
  if (scope === 'supervisor') {
    void hydrateFromIndexedDb();
  }
});

function normalizeRootState(parsed: Partial<MultiGroupRootState>): MultiGroupRootState {
  const fallback = createInitialState();
  return {
    activeGroupId: parsed.activeGroupId || fallback.activeGroupId,
    groups: Array.isArray(parsed.groups) && parsed.groups.length > 0 ? parsed.groups : fallback.groups,
    people: Array.isArray(parsed.people) ? parsed.people : fallback.people,
  };
}

function loadState(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      rootState = normalizeRootState(JSON.parse(raw) as Partial<MultiGroupRootState>);
    }
  } catch {
    rootState = createInitialState();
  }
}

async function hydrateFromIndexedDb(): Promise<void> {
  const stored = await idbGetJson<MultiGroupRootState>(STORAGE_KEY);
  if (stored && Array.isArray(stored.groups) && stored.groups.length > 0) {
    rootState = normalizeRootState(stored);
    renderAll();
  } else {
    // Migrate initial/localStorage workspace into IndexedDB on first load
    await idbSetJson(STORAGE_KEY, rootState);
  }
}

function saveState(broadcast: boolean = true): void {
  let localOk = false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rootState));
    localOk = true;
  } catch {
    localOk = false;
  }
  void idbSetJson(STORAGE_KEY, rootState).then((idbOk) => {
    if (!idbOk && !localOk) {
      showToast('⚠️ تعذر حفظ التغييرات محلياً — يرجى تنزيل نسخة احتياطية JSON', true);
    } else if (broadcast) {
      syncChannel.notify('supervisor');
    }
  });
}

function buildRegistryFromState(): UmrahGroupRegistry {
  const reg = new UmrahGroupRegistry();
  for (const g of rootState.groups) {
    reg.addGroup({
      id: g.id,
      tripTitle: g.settings.tripTitle,
      tripCode: g.settings.tripCode,
      status: g.settings.status,
      startDate: g.settings.startDate,
      endDate: g.settings.endDate,
      hotelNameAr: g.settings.hotelNameAr,
      busNumber: g.settings.busNumber,
      supervisorName: g.settings.supervisorName,
      totalPilgrims: g.pilgrims.length,
      boardedCount: g.pilgrims.filter((p) => p.boarded).length,
      activeSosCount: g.sosAlerts.filter((a) => !a.resolved).length,
      totalCollectedMinor: g.gameya.reduce((s, m) => s + m.totalPaid * 100, 0),
      totalTargetMinor: g.gameya.reduce((s, m) => s + m.totalTarget * 100, 0),
    });
  }
  return reg;
}

function buildPeopleDirectoryFromState(): PeopleDirectory {
  const dir = new PeopleDirectory();
  for (const p of rootState.people) {
    dir.upsertPerson(p);
  }
  return dir;
}

function syncPilgrimsDatalist(): void {
  const list = document.getElementById('pilgrims-directory-datalist');
  if (!list) return;
  const active = getActiveGroup();
  const seen = new Set<string>();
  const names: string[] = [];
  for (const p of [...active.pilgrims, ...rootState.people]) {
    if (!seen.has(p.fullName)) {
      seen.add(p.fullName);
      names.push(p.fullName);
    }
  }
  list.innerHTML = names.map((name) => `<option value="${escapeHtml(name)}"></option>`).join('');
}

function renderAll(): void {
  renderGroupSwitcher();
  syncPilgrimsDatalist();
  renderTopMetrics();
  renderAttentionQueueStrip();
  renderGroupsOverviewBoard();
  renderManifestTable();
  renderRoomsBoard();
  renderPeopleDirectory();
  renderWhatsAppHub();
  renderGameyaTable();
  renderPrintSelectors();
  renderSOSTab();
  renderOfficialResourcesInSup();
  renderWomenGuidanceSynced();
  renderLuggageSection();
  renderMedicalSection();
}

function renderAttentionQueueStrip(): void {
  const strip = document.getElementById('sup-attention-strip');
  if (!strip) return;
  const active = getActiveGroup();
  const isEn = getCurrentLanguage() === 'en';
  const dir = buildPeopleDirectoryFromState();
  const tripStart = new Date(active.settings.startDate || Date.now());

  const unroomedCount = active.pilgrims.filter((p) => !p.roomNumber || p.roomNumber.trim() === '').length;
  const expiringPassports = dir.getExpiringPassports(tripStart, 6).length;
  const overdueInstallments = active.gameya.filter(
    (m) => buildScheduleSummaryForMember(m, active.settings.endDate).summary.overdueCount > 0
  ).length;
  const activeSos = active.sosAlerts.filter((a) => !a.resolved).length;
  const mobilityCount = active.medical.filter(
    (m) => m.requiresWheelchair || m.requiresElectricCart || m.requiresInsulinRefrigeration
  ).length;

  const chips: Array<{ tab: string; badgeCls: string; label: string }> = [];
  if (activeSos > 0) {
    chips.push({
      tab: 'sos',
      badgeCls: 'attention-chip-danger',
      label: isEn ? `🚨 ${activeSos} Active SOS` : `🚨 ${activeSos} بلاغ طوارئ نشط`,
    });
  }
  if (expiringPassports > 0) {
    chips.push({
      tab: 'people',
      badgeCls: 'attention-chip-warning',
      label: isEn ? `⚠️ ${expiringPassports} Passport < 6 Mo` : `⚠️ ${expiringPassports} جواز أقل من 6 أشهر`,
    });
  }
  if (unroomedCount > 0) {
    chips.push({
      tab: 'manifest',
      badgeCls: 'attention-chip-neutral',
      label: isEn ? `🏨 ${unroomedCount} Unassigned Rooms` : `🏨 ${unroomedCount} معتمر بلا غرفة`,
    });
  }
  if (overdueInstallments > 0) {
    chips.push({
      tab: 'gameya',
      badgeCls: 'attention-chip-warning',
      label: isEn ? `💰 ${overdueInstallments} Overdue Plan(s)` : `💰 ${overdueInstallments} اشتراك متأخر`,
    });
  }
  if (mobilityCount > 0) {
    chips.push({
      tab: 'logistics-health',
      badgeCls: 'attention-chip-neutral',
      label: isEn ? `♿ ${mobilityCount} Mobility / Insulin Care` : `♿ ${mobilityCount} رعاية كرسي/إنسولين`,
    });
  }

  if (chips.length === 0) {
    strip.innerHTML = `<span class="badge badge-success">✅ ${isEn ? 'All active group checklists and accommodations are up to date' : 'جميع تسكين وجوازات وطوارئ الفوج النشط مكتملة ✅'}</span>`;
    return;
  }

  strip.innerHTML = chips
    .map(
      (c) =>
        `<button type="button" class="attention-chip ${c.badgeCls}" data-attention-jump="${c.tab}">${escapeHtml(c.label)}</button>`
    )
    .join('');

  strip.querySelectorAll<HTMLElement>('[data-attention-jump]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.attentionJump;
      if (target) switchTab(target);
    });
  });
}

function renderGroupSwitcher(): void {
  const switcher = document.getElementById('active-group-switcher') as HTMLSelectElement | null;
  if (switcher) {
    switcher.innerHTML = rootState.groups
      .map(
        (g) =>
          `<option value="${escapeHtml(g.id)}" ${g.id === rootState.activeGroupId ? 'selected' : ''}>${escapeHtml(g.settings.tripTitle)} (${escapeHtml(getTripStageLabel(g.settings.status))})</option>`
      )
      .join('');
  }
  const active = getActiveGroup();
  const stageBadge = document.getElementById('header-active-stage');
  if (stageBadge) {
    stageBadge.textContent = `${active.settings.tripCode} • ${getTripStageLabel(active.settings.status)}`;
  }
}

function renderTopMetrics(): void {
  const active = getActiveGroup();
  const isEn = getCurrentLanguage() === 'en';
  const loc = isEn ? 'en-US' : 'ar-EG';
  const curr = isEn ? 'EGP' : 'ج.م';
  const reg = buildRegistryFromState();
  const agg = reg.getAggregateActiveMetrics();

  const totalP = active.pilgrims.length;
  const boardedP = active.pilgrims.filter((p) => p.boarded).length;
  const remainingP = totalP - boardedP;

  const totalCollected = active.gameya.reduce((s, m) => s + m.totalPaid, 0);
  const totalTarget = active.gameya.reduce((s, m) => s + m.totalTarget, 0);
  const pct = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

  const activeSos = active.sosAlerts.filter((a) => !a.resolved).length;

  const set = (id: string, txt: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };

  set('metric-trip-title', active.settings.tripTitle);
  set('metric-trip-stage', getTripStageLabel(active.settings.status));
  set(
    'metric-pilgrim-count',
    isEn ? `${totalP} Pilgrims (Total: ${agg.totalActivePilgrims})` : `${totalP} معتمر (الكل: ${agg.totalActivePilgrims})`
  );
  set(
    'metric-bus-summary',
    isEn
      ? `${active.settings.busNumber}: ${boardedP} Boarded / ${remainingP} Pending`
      : `${active.settings.busNumber}: ${boardedP} صعدوا / ${remainingP} متبقين`
  );
  set('metric-gameya-total', `${totalCollected.toLocaleString(loc)} ${curr}`);
  set(
    'metric-gameya-pct',
    isEn
      ? `Collected: ${pct}% • (${agg.activeGroupsCount} Active Groups)`
      : `التحصيل: ${pct}% • (${agg.activeGroupsCount} أفواج نشطة)`
  );
  set('sup-sos-count', isEn ? `${activeSos} (All Groups: ${agg.totalActiveSos})` : `${activeSos} (كل الأفواج: ${agg.totalActiveSos})`);

  const sosSub = document.getElementById('sup-sos-sub');
  const sosCountEl = document.getElementById('sup-sos-count');
  if (sosSub && sosCountEl) {
    if (agg.totalActiveSos > 0) {
      sosCountEl.style.color = 'var(--danger)';
      sosSub.textContent = isEn ? '⚠️ Active lost-pilgrim SOS alerts require follow-up!' : '⚠️ يوجد بلاغات تائهين تتطلب متابعة!';
      sosSub.style.color = 'var(--danger)';
    } else {
      sosCountEl.style.color = 'var(--success)';
      sosSub.textContent = isEn ? 'All groups safe with zero open SOS' : 'جميع الأفواج في نطاق الأمان';
      sosSub.style.color = 'var(--success)';
    }
  }

  set('manifest-count-badge', isEn ? `${boardedP} Boarded / ${remainingP} Pending` : `${boardedP} صعدوا / ${remainingP} متبقين`);
}

// =========================================================================
// MULTI-GROUP BOARD (Concurrent + Sequential Lifecycle)
// =========================================================================
function renderGroupsOverviewBoard(): void {
  const grid = document.getElementById('multi-groups-board');
  if (!grid) return;

  const reg = buildRegistryFromState();
  grid.innerHTML = rootState.groups
    .map((g) => {
      const isCurrent = g.id === rootState.activeGroupId;
      const allowedNext = reg.getAllowedNextStages(g.settings.status);
      const boarded = g.pilgrims.filter((p) => p.boarded).length;
      const paid = g.gameya.reduce((s, m) => s + m.totalPaid, 0);
      const target = g.gameya.reduce((s, m) => s + m.totalTarget, 0);
      const pct = target > 0 ? Math.round((paid / target) * 100) : 0;

      return `
      <article class="info-box-neutral" style="${isCurrent ? 'border:2px solid var(--primary);' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.4rem;">
          <strong>${escapeHtml(g.settings.tripTitle)}</strong>
          <span class="badge ${g.settings.status === TripStatus.COMPLETED ? 'badge-primary' : 'badge-success'}">${escapeHtml(TRIP_STAGE_LABELS[g.settings.status])}</span>
        </div>
        <div style="font-size:0.84rem;color:var(--text-muted);margin-bottom:0.55rem;">
          📅 ${escapeHtml(g.settings.startDate)} ← ${escapeHtml(g.settings.endDate)} • 🏨 ${escapeHtml(g.settings.hotelNameAr)}<br>
          👥 ${g.pilgrims.length} معتمر (${boarded} بالباص) • 💰 التحصيل: ${pct}%
        </div>
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
          ${isCurrent ? '<span class="badge badge-warning">الفوج المحدد الآن ✓</span>' : `<button type="button" class="btn btn-primary btn-compact" data-select-group="${escapeHtml(g.id)}">فتح وإدارة الفوج</button>`}
          ${allowedNext.map((ns) => `<button type="button" class="btn btn-secondary btn-compact" data-advance-group="${escapeHtml(g.id)}" data-next-stage="${ns}">⏭️ نقل إلى: ${escapeHtml(TRIP_STAGE_LABELS[ns])}</button>`).join('')}
          <button type="button" class="btn btn-secondary btn-compact" data-clone-group="${escapeHtml(g.id)}">📋 استنساخ للفوج التالي</button>
        </div>
      </article>
    `;
    })
    .join('');

  grid.querySelectorAll<HTMLElement>('[data-select-group]').forEach((btn) => {
    btn.addEventListener('click', () => {
      rootState.activeGroupId = btn.dataset.selectGroup!;
      saveState();
      renderAll();
      showToast(`✅ تم التبديل إلى: ${getActiveGroup().settings.tripTitle}`);
    });
  });

  grid.querySelectorAll<HTMLElement>('[data-advance-group]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const grp = rootState.groups.find((g) => g.id === btn.dataset.advanceGroup);
      const next = btn.dataset.nextStage as TripStatus;
      if (!grp || !next) return;
      grp.settings.status = next;
      saveState();
      renderAll();
      showToast(`⏭️ انتقل "${grp.settings.tripTitle}" إلى: ${TRIP_STAGE_LABELS[next]}`);
    });
  });

  grid.querySelectorAll<HTMLElement>('[data-clone-group]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const src = rootState.groups.find((g) => g.id === btn.dataset.cloneGroup);
      if (!src) return;
      const num = rootState.groups.length + 1;
      const newGrp: GroupWorkspace = {
        id: `grp-${Date.now()}`,
        settings: {
          ...src.settings,
          tripTitle: `${src.settings.tripTitle} (دفعة تالية #${num})`,
          tripCode: `#UMR-${num}`,
          status: TripStatus.REGISTRATION_OPEN,
          startDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 40 * 86400000).toISOString().slice(0, 10),
        },
        pilgrims: [],
        rooms: [],
        gameya: [],
        luggage: [],
        medical: [],
        sosAlerts: [],
      };
      rootState.groups.push(newGrp);
      rootState.activeGroupId = newGrp.id;
      saveState();
      renderAll();
      showToast(`✅ تم إنشاء الفوج التالي "${newGrp.settings.tripTitle}" وتحديده كفوج نشط`);
    });
  });
}

// =========================================================================
// TAB 1: MANIFEST, ROOMING & QR SHARE LINK
// =========================================================================
function buildBadgeToken(groupId: string, pilgrimId: string): string {
  return `${groupId}-${pilgrimId}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
}

function buildPilgrimShareUrl(p: PilgrimRecord, badgeToken?: string): string {
  const active = getActiveGroup();
  const s = active.settings;
  const base = `${window.location.origin}/`;
  const matchGameya = active.gameya.find(
    (g) => g.name.trim() === p.fullName.trim() || (p.phone && g.phone === p.phone)
  );
  const qs = new URLSearchParams({
    name: p.fullName,
    passport: p.passportNumber,
    gender: p.gender,
    room: p.roomNumber || 'بدون غرفة',
    bus: s.busNumber,
    hotelKey: s.hotelKey,
    hotel: s.hotelNameAr,
    address: s.hotelAddressAr,
    hotelPhone: s.hotelPhone,
    supName: s.supervisorName,
    supPhone: s.supervisorPhone,
    trip: s.tripTitle,
    code: s.tripCode,
    stage: s.status,
    meeting: s.meetingPoint,
  });
  if (badgeToken) {
    qs.set('token', badgeToken);
  }
  if (matchGameya) {
    qs.set('payPlan', matchGameya.planType);
    qs.set('payTarget', String(matchGameya.totalTarget));
    qs.set('payPaid', String(matchGameya.totalPaid));
    qs.set('payDown', String(matchGameya.downPayment));
    qs.set('payCount', String(matchGameya.installmentCount));
    qs.set('payStart', matchGameya.startDateIso);
  }
  return `${base}?${qs.toString()}`;
}

function openPilgrimModal(p?: PilgrimRecord): void {
  const isEn = getCurrentLanguage() === 'en';
  const titleEl = document.getElementById('add-pilgrim-modal-title');
  const submitBtn = document.getElementById('btn-save-pilgrim-submit');
  const editIdEl = document.getElementById('pilgrim-edit-id') as HTMLInputElement | null;
  const nameEl = document.getElementById('new-pilgrim-name') as HTMLInputElement | null;
  const passEl = document.getElementById('new-pilgrim-passport') as HTMLInputElement | null;
  const phoneEl = document.getElementById('new-pilgrim-phone') as HTMLInputElement | null;
  const genderEl = document.getElementById('new-pilgrim-gender') as HTMLSelectElement | null;
  const nusukEl = document.getElementById('new-pilgrim-nusuk') as HTMLInputElement | null;

  if (p) {
    if (titleEl) titleEl.textContent = isEn ? `✏️ Edit Pilgrim: ${p.fullName}` : `✏️ تعديل بيانات المعتمر: ${p.fullName}`;
    if (submitBtn) submitBtn.textContent = isEn ? '💾 Save Pilgrim Updates' : '💾 حفظ تعديلات المعتمر';
    if (editIdEl) editIdEl.value = p.id;
    if (nameEl) nameEl.value = p.fullName;
    if (passEl) passEl.value = p.passportNumber;
    if (phoneEl) phoneEl.value = p.phone;
    if (genderEl) genderEl.value = p.gender;
    if (nusukEl) nusukEl.checked = p.nusukReady;
  } else {
    if (titleEl) titleEl.textContent = isEn ? '➕ Add Pilgrim to Active Group' : '➕ إضافة معتمر للفوج النشط';
    if (submitBtn) submitBtn.textContent = isEn ? '✅ Save & Add to Group + CRM' : '✅ حفظ وإضافة للفوج والسجل';
    (document.getElementById('add-pilgrim-form') as HTMLFormElement | null)?.reset();
    if (editIdEl) editIdEl.value = '';
    if (nusukEl) nusukEl.checked = true;
  }
  openDialogById('add-pilgrim-modal');
  window.requestAnimationFrame(() => nameEl?.focus());
}

function openPersonModal(person?: PersonRecord): void {
  const isEn = getCurrentLanguage() === 'en';
  const titleEl = document.getElementById('add-person-modal-title');
  const submitBtn = document.getElementById('btn-save-person-submit');
  const editIdEl = document.getElementById('crm-edit-id') as HTMLInputElement | null;
  const nameEl = document.getElementById('crm-name') as HTMLInputElement | null;
  const passEl = document.getElementById('crm-passport') as HTMLInputElement | null;
  const expEl = document.getElementById('crm-expiry') as HTMLInputElement | null;
  const phoneEl = document.getElementById('crm-phone') as HTMLInputElement | null;
  const genderEl = document.getElementById('crm-gender') as HTMLSelectElement | null;
  const ecEl = document.getElementById('crm-ec-phone') as HTMLInputElement | null;
  const notesEl = document.getElementById('crm-notes') as HTMLInputElement | null;
  const wcEl = document.getElementById('crm-wheelchair') as HTMLInputElement | null;
  const insEl = document.getElementById('crm-insulin') as HTMLInputElement | null;

  if (person) {
    if (titleEl) titleEl.textContent = isEn ? `✏️ Edit CRM Profile: ${person.fullName}` : `✏️ تعديل سجل الشخص: ${person.fullName}`;
    if (submitBtn) submitBtn.textContent = isEn ? '💾 Save CRM Changes' : '💾 حفظ التعديلات بالسجل';
    if (editIdEl) editIdEl.value = person.id;
    if (nameEl) nameEl.value = person.fullName;
    if (passEl) passEl.value = person.passportNumber;
    if (expEl) expEl.value = person.passportExpiryDate || '';
    if (phoneEl) phoneEl.value = person.phone;
    if (genderEl) genderEl.value = person.gender;
    if (ecEl) ecEl.value = person.emergencyContactPhone || '';
    if (notesEl) notesEl.value = person.notes || '';
    if (wcEl) wcEl.checked = person.requiresWheelchair;
    if (insEl) insEl.checked = person.requiresInsulinRefrigeration;
  } else {
    if (titleEl) titleEl.textContent = isEn ? '👥 Add Persistent Person Record (CRM)' : '👥 إضافة سجل شخص دائم (CRM)';
    if (submitBtn) submitBtn.textContent = isEn ? '💾 Save to Persistent CRM' : '💾 حفظ بالسجل الدائم';
    (document.getElementById('add-person-form') as HTMLFormElement | null)?.reset();
    if (editIdEl) editIdEl.value = '';
  }
  openDialogById('add-person-modal');
  window.requestAnimationFrame(() => nameEl?.focus());
}

function renderManifestTable(): void {
  const active = getActiveGroup();
  const tbody = document.getElementById('manifest-tbody');
  if (!tbody) return;
  const isEn = getCurrentLanguage() === 'en';
  const q = manifestFilter.toLowerCase().trim();
  const filtered = active.pilgrims.filter(
    (p) =>
      !q ||
      p.fullName.toLowerCase().includes(q) ||
      p.passportNumber.toLowerCase().includes(q) ||
      p.roomNumber.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:1.25rem;color:var(--text-muted);">${
      isEn
        ? 'No pilgrims in this group yet — add a pilgrim or enroll from People CRM.'
        : 'لا يوجد معتمرون في هذا الفوج بعد — أضف معتمراً أو أدرجه من سجل الأشخاص الدائم.'
    }</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((p) => {
      const alertText = `السلام عليكم ورحمة الله وبركاته يا ${p.fullName}، ${active.settings.busNumber} لفوج (${active.settings.tripTitle}) يستعد للانطلاق الآن عند ${active.settings.meetingPoint}.`;
      const waLink = buildWhatsAppUrl(alertText, p.phone);
      const unroomedLabel = isEn ? 'Unassigned' : 'غير مسكن';
      const nusukOk = isEn ? 'Nusuk Ready ✓' : 'نُسك جاهز ✓';
      const nusukWait = isEn ? 'Pending' : 'معلق';
      const busYes = isEn ? 'Boarded ✅' : 'صعد الباص ✅';
      const busNo = isEn ? 'Pending ⏳' : 'لم يصعد بعد ⏳';
      const waLabel = isEn ? '📲 WhatsApp' : '📲 واتساب';
      const qrLabel = isEn ? '🔗 QR Card' : '🔗 QR البطاقة';
      const editLabel = isEn ? '✏️ Edit' : '✏️ تعديل';
      return `
      <tr class="${p.boarded ? '' : 'row-pending'}">
        <th scope="row">${escapeHtml(p.fullName)}</th>
        <td data-label="${escapeHtml(t('sup.col.passport'))}">${escapeHtml(p.passportNumber)}</td>
        <td data-label="${escapeHtml(t('sup.col.room'))}">${escapeHtml(p.roomNumber || unroomedLabel)}</td>
        <td data-label="${escapeHtml(t('sup.col.nusuk'))}"><span class="badge ${p.nusukReady ? 'badge-success' : 'badge-warning'}">${p.nusukReady ? nusukOk : nusukWait}</span></td>
        <td data-label="${escapeHtml(t('sup.col.bus'))}">
          <button type="button" class="badge btn-compact ${p.boarded ? 'badge-success' : 'badge-warning'}" style="border:none;cursor:pointer;" data-toggle-board="${escapeHtml(p.id)}">
            ${p.boarded ? busYes : busNo}
          </button>
        </td>
        <td class="table-actions-cell">
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
            <a href="${waLink}" target="_blank" rel="noopener" class="btn btn-secondary btn-compact" style="text-decoration:none;">${waLabel}</a>
            <button type="button" class="btn btn-primary btn-compact" data-share-pilgrim="${escapeHtml(p.id)}">${qrLabel}</button>
            <button type="button" class="btn btn-secondary btn-compact" data-edit-pilgrim="${escapeHtml(p.id)}" aria-label="${isEn ? `Edit ${escapeHtml(p.fullName)}` : `تعديل ${escapeHtml(p.fullName)}`}">${editLabel}</button>
            <button type="button" class="btn btn-secondary btn-compact" style="color:var(--danger);" data-delete-pilgrim="${escapeHtml(p.id)}" aria-label="${isEn ? `Remove ${escapeHtml(p.fullName)}` : `إزالة ${escapeHtml(p.fullName)}`}">🗑️</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');

  tbody.querySelectorAll<HTMLElement>('[data-toggle-board]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = active.pilgrims.find((x) => x.id === btn.dataset.toggleBoard);
      if (!p) return;
      p.boarded = !p.boarded;
      saveState();
      renderTopMetrics();
      renderGroupsOverviewBoard();
      renderManifestTable();
      showToast(p.boarded ? `✅ تم تسجيل صعود ${p.fullName}` : `⏳ تم تحويل ${p.fullName} إلى غير صاعد`);
    });
  });

  tbody.querySelectorAll<HTMLElement>('[data-share-pilgrim]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = active.pilgrims.find((x) => x.id === btn.dataset.sharePilgrim);
      if (!p) return;
      const badgeToken = buildBadgeToken(active.id, p.id);
      const url = buildPilgrimShareUrl(p, badgeToken);
      const s = active.settings;
      void writeBadgeToCloud({
        groupId: active.id,
        pilgrimId: p.id,
        badgeToken,
        badgeData: {
          fullName: p.fullName,
          passportNumber: p.passportNumber,
          roomNumber: p.roomNumber || '---',
          busNumber: s.busNumber,
          hotelKey: s.hotelKey,
          hotelNameAr: s.hotelNameAr,
          hotelNameEn: s.hotelNameEn,
          hotelAddressAr: s.hotelAddressAr,
          hotelPhone: s.hotelPhone,
          supervisorName: s.supervisorName,
          supervisorPhone: s.supervisorPhone,
          tripTitle: s.tripTitle,
          tripCode: s.tripCode,
          tripStage: s.status,
          meetingPoint: s.meetingPoint,
        },
      });
      const qrBox = document.getElementById('share-pilgrim-qr');
      const linkBox = document.getElementById('share-pilgrim-url') as HTMLInputElement | null;
      const titleBox = document.getElementById('share-pilgrim-name');
      const waBtn = document.getElementById('share-pilgrim-wa') as HTMLAnchorElement | null;
      if (titleBox) titleBox.textContent = p.fullName;
      if (qrBox) qrBox.innerHTML = renderQrSvg(url, `رابط بطاقة ${p.fullName}`);
      if (linkBox) linkBox.value = url;
      if (waBtn) {
        waBtn.href = buildWhatsAppUrl(
          `السلام عليكم ${p.fullName}، هذا رابط بطاقتك الذكية لفوج (${active.settings.tripTitle}):\n${url}`,
          p.phone
        );
      }
      openDialogById('share-pilgrim-modal');
    });
  });

  tbody.querySelectorAll<HTMLElement>('[data-edit-pilgrim]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = active.pilgrims.find((x) => x.id === btn.dataset.editPilgrim);
      if (p) openPilgrimModal(p);
    });
  });

  tbody.querySelectorAll<HTMLElement>('[data-delete-pilgrim]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.deletePilgrim!;
      const isEn = getCurrentLanguage() === 'en';
      handleTwoStepDelete(btn, isEn ? 'Confirm Delete' : 'تأكيد الحذف؟', () => {
        const idx = active.pilgrims.findIndex((x) => x.id === id);
        if (idx === -1) return;
        const removed = active.pilgrims[idx];
        const prevRoomIds = active.rooms.filter((r) => r.occupantIds.includes(id)).map((r) => r.id);
        active.pilgrims.splice(idx, 1);
        active.rooms.forEach((r) => {
          r.occupantIds = r.occupantIds.filter((oid) => oid !== id);
        });
        saveState();
        renderAll();
        showUndoToast(
          isEn ? `Removed ${removed.fullName} from group` : `تمت إزالة ${removed.fullName} من الفوج`,
          isEn ? '↩️ Undo' : '↩️ تراجع',
          () => {
            active.pilgrims.splice(Math.min(idx, active.pilgrims.length), 0, removed);
            prevRoomIds.forEach((rid) => {
              const room = active.rooms.find((r) => r.id === rid);
              if (room && !room.occupantIds.includes(removed.id)) room.occupantIds.push(removed.id);
            });
            saveState();
            renderAll();
            showToast(isEn ? `Restored ${removed.fullName}` : `✅ تمت استعادة ${removed.fullName}`);
          }
        );
      });
    });
  });
}

function renderRoomsBoard(): void {
  const active = getActiveGroup();
  const roomSelect = document.getElementById('assign-room-select') as HTMLSelectElement | null;
  const pilgrimSelect = document.getElementById('assign-pilgrim-select') as HTMLSelectElement | null;
  const roomsGrid = document.getElementById('rooms-grid');

  if (roomSelect) {
    roomSelect.innerHTML = active.rooms
      .map(
        (r) =>
          `<option value="${escapeHtml(r.id)}">غرفة ${escapeHtml(r.roomNumber)} (${r.occupantIds.length}/${r.capacity}) ${r.isFamilyRoom ? '👨‍👩‍👧 عائلية' : ''}</option>`
      )
      .join('');
  }

  if (pilgrimSelect) {
    pilgrimSelect.innerHTML = active.pilgrims
      .map(
        (p) =>
          `<option value="${escapeHtml(p.id)}">${escapeHtml(p.fullName)} (${p.gender === Gender.MALE ? 'ذكر' : 'أنثى'})</option>`
      )
      .join('');
  }

  if (roomsGrid) {
    roomsGrid.innerHTML =
      active.rooms.length === 0
        ? '<div class="info-box-neutral">لا توجد غرف مسجلة لهذا الفوج بعد — افتح غرفة من النموذج أعلاه.</div>'
        : active.rooms
            .map((r) => {
              const occupants = r.occupantIds
                .map((oid) => active.pilgrims.find((p) => p.id === oid))
                .filter(Boolean) as PilgrimRecord[];
              return `
              <div class="info-box-neutral">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
                  <strong>🚪 غرفة ${escapeHtml(r.roomNumber)} (${escapeHtml(r.type)})</strong>
                  <span class="badge ${occupants.length >= r.capacity ? 'badge-warning' : 'badge-success'}">
                    ${occupants.length} / ${r.capacity} ${r.isFamilyRoom ? '• عائلية' : ''}
                  </span>
                </div>
                ${
                  occupants.length === 0
                    ? '<div style="font-size:0.84rem;color:var(--text-muted);">الغرفة شاغرة</div>'
                    : `<ul style="margin-right:1.2rem;font-size:0.86rem;line-height:1.85;">
                        ${occupants
                          .map(
                            (o) =>
                              `<li>${escapeHtml(o.fullName)} (${o.gender === Gender.MALE ? 'رجل' : 'امرأة'}) <button type="button" data-unassign-room="${escapeHtml(r.id)}" data-unassign-pilgrim="${escapeHtml(o.id)}" style="background:none;border:none;color:var(--danger);cursor:pointer;font-weight:700;">[إخراج]</button></li>`
                          )
                          .join('')}
                      </ul>`
                }
              </div>
            `;
            })
            .join('');

    roomsGrid.querySelectorAll<HTMLElement>('[data-unassign-room]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const room = active.rooms.find((r) => r.id === btn.dataset.unassignRoom);
        const pid = btn.dataset.unassignPilgrim;
        if (!room || !pid) return;
        room.occupantIds = room.occupantIds.filter((x) => x !== pid);
        const p = active.pilgrims.find((x) => x.id === pid);
        if (p) p.roomNumber = '';
        saveState();
        renderAll();
        showToast('تم إخراج المعتمر من الغرفة');
      });
    });
  }
}

function handleAssignRoom(): void {
  const active = getActiveGroup();
  const roomId = (document.getElementById('assign-room-select') as HTMLSelectElement).value;
  const pilgrimId = (document.getElementById('assign-pilgrim-select') as HTMLSelectElement).value;
  const roomRec = active.rooms.find((r) => r.id === roomId);
  const pilgrimRec = active.pilgrims.find((p) => p.id === pilgrimId);
  if (!roomRec || !pilgrimRec) {
    showToast('يرجى إضافة غرفة ومعتمر أولاً', true);
    return;
  }

  if (roomRec.occupantIds.includes(pilgrimRec.id)) {
    showToast('المعتمر مسكّن بالفعل في هذه الغرفة');
    return;
  }

  const roomEntity = new Room({
    id: roomRec.id,
    roomNumber: roomRec.roomNumber,
    hotelId: active.settings.hotelKey,
    floor: 1,
    type: roomRec.type,
    capacity: roomRec.capacity,
    isFamilyRoom: roomRec.isFamilyRoom,
  });

  for (const existingId of roomRec.occupantIds) {
    const occ = active.pilgrims.find((p) => p.id === existingId);
    if (occ) {
      roomEntity.occupants.push({
        id: occ.id,
        fullName: occ.fullName,
        gender: occ.gender,
        phone: occ.phone,
        passportNumber: occ.passportNumber,
      });
    }
  }

  try {
    roomingEngine.assignPilgrimToRoom(roomEntity, {
      id: pilgrimRec.id,
      fullName: pilgrimRec.fullName,
      gender: pilgrimRec.gender,
      phone: pilgrimRec.phone,
      passportNumber: pilgrimRec.passportNumber,
    });

    active.rooms.forEach((r) => {
      r.occupantIds = r.occupantIds.filter((id) => id !== pilgrimRec.id);
    });
    roomRec.occupantIds.push(pilgrimRec.id);
    pilgrimRec.roomNumber = roomRec.roomNumber;
    saveState();
    renderAll();
    closeDialogById('assign-room-modal');
    showToast(`✅ تم تسكين ${pilgrimRec.fullName} في غرفة ${roomRec.roomNumber}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('Gender separation')) {
      showToast('⛔ مخالفة تسكين: لا يمكن دمج الرجال والنساء في غرفة غير عائلية!', true);
    } else if (msg.includes('capacity')) {
      showToast(`⛔ الغرفة ${roomRec.roomNumber} ممتلئة بالكامل (${roomRec.capacity} أسرّة)`, true);
    } else {
      showToast(`⚠️ تعذر التسكين: ${msg}`, true);
    }
  }
}

// =========================================================================
// PEOPLE DIRECTORY CRM (Persistent Across Trips + Passport Expiry Check)
// =========================================================================
function renderPeopleDirectory(): void {
  const active = getActiveGroup();
  const isEn = getCurrentLanguage() === 'en';
  const dir = buildPeopleDirectoryFromState();
  const tripStart = new Date(active.settings.startDate || Date.now());
  const results = dir.searchPeople(peopleFilter);

  const countBadge = document.getElementById('people-count-badge');
  const expiringCount = dir.getExpiringPassports(tripStart, 6).length;
  if (countBadge) {
    countBadge.textContent = isEn
      ? `${rootState.people.length} Saved${expiringCount > 0 ? ` • ⚠️ ${expiringCount} Expiring < 6 mo` : ''}`
      : `${rootState.people.length} شخص مسجل${expiringCount > 0 ? ` • ⚠️ ${expiringCount} جواز قارب على الانتهاء` : ''}`;
  }

  const tbody = document.getElementById('people-tbody');
  if (!tbody) return;
  if (results.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:1.25rem;color:var(--text-muted);">${
      isEn ? 'No matching CRM records' : 'لا توجد سجلات مطابقة'
    }</td></tr>`;
    return;
  }

  tbody.innerHTML = results
    .map((p) => {
      const passportValid = dir.isPassportValidForTrip(p, tripStart, 6);
      const alreadyInActive = active.pilgrims.some(
        (m) => m.personId === p.id || m.passportNumber === p.passportNumber
      );
      return `
      <tr class="${passportValid ? '' : 'row-pending'}">
        <th scope="row">${escapeHtml(p.fullName)}</th>
        <td data-label="${escapeHtml(t('sup.col.passport'))}">
          <div>${escapeHtml(p.passportNumber)}</div>
          <div style="font-size:0.78rem;color:${passportValid ? 'var(--text-muted)' : 'var(--danger)'};font-weight:${passportValid ? '500' : '700'};">
            ${p.passportExpiryDate ? (isEn ? `Expires: ${escapeHtml(p.passportExpiryDate)}` : `ينتهي: ${escapeHtml(p.passportExpiryDate)}`) : isEn ? 'No expiry set' : 'بدون تاريخ انتهاء'}
            ${passportValid ? '' : isEn ? ' ⚠️ < 6 months!' : ' ⚠️ أقل من 6 أشهر!'}
          </div>
        </td>
        <td data-label="${escapeHtml(t('sup.col.phone'))}" dir="ltr">${escapeHtml(p.phone)}</td>
        <td data-label="${escapeHtml(t('sup.col.health'))}">
          ${p.requiresWheelchair ? `<span class="badge badge-danger">${isEn ? 'Wheelchair' : 'كرسي'}</span> ` : ''}
          ${p.requiresInsulinRefrigeration ? `<span class="badge badge-danger">${isEn ? 'Insulin' : 'إنسولين'}</span> ` : ''}
          ${!p.requiresWheelchair && !p.requiresInsulinRefrigeration ? `<span class="badge badge-success">${isEn ? 'Clear' : 'سليم'}</span>` : ''}
        </td>
        <td data-label="${escapeHtml(t('sup.col.trips'))}">
          <div style="font-size:0.82rem;">${p.pastTrips.length > 0 ? escapeHtml(p.pastTrips.join('، ')) : isEn ? 'First Trip' : 'أول رحلة'}</div>
        </td>
        <td class="table-actions-cell">
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
            ${
              alreadyInActive
                ? `<span class="badge badge-primary">${isEn ? 'Enrolled ✓' : 'مدرج بالفوج ✓'}</span>`
                : `<button type="button" class="btn btn-primary btn-compact" data-enroll-person="${escapeHtml(p.id)}">${isEn ? '➕ Enroll' : '➕ إدراج بالفوج النشط'}</button>`
            }
            <button type="button" class="btn btn-secondary btn-compact" data-edit-person="${escapeHtml(p.id)}" aria-label="${isEn ? `Edit ${escapeHtml(p.fullName)}` : `تعديل ${escapeHtml(p.fullName)}`}">${isEn ? '✏️ Edit' : '✏️ تعديل'}</button>
            <button type="button" class="btn btn-secondary btn-compact" style="color:var(--danger);" data-del-person="${escapeHtml(p.id)}" aria-label="${isEn ? `Delete ${escapeHtml(p.fullName)}` : `حذف سجل ${escapeHtml(p.fullName)}`}">🗑️</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');

  tbody.querySelectorAll<HTMLElement>('[data-enroll-person]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const person = rootState.people.find((x) => x.id === btn.dataset.enrollPerson);
      if (!person) return;
      active.pilgrims.push({
        id: `p-${Date.now()}`,
        personId: person.id,
        fullName: person.fullName,
        gender: person.gender,
        passportNumber: person.passportNumber,
        phone: person.phone,
        roomNumber: '',
        boarded: false,
        nusukReady: true,
      });
      if (!person.pastTrips.includes(active.settings.tripTitle)) {
        person.pastTrips.push(active.settings.tripTitle);
      }
      if (person.requiresWheelchair || person.requiresInsulinRefrigeration) {
        active.medical.push({
          id: `m-${Date.now()}`,
          pilgrimName: person.fullName,
          roomNumber: '---',
          conditions: person.conditions,
          requiresWheelchair: person.requiresWheelchair,
          requiresElectricCart: false,
          requiresInsulinRefrigeration: person.requiresInsulinRefrigeration,
          emergencyContactName: person.emergencyContactName,
          emergencyContactPhone: person.emergencyContactPhone,
          notes: person.notes || 'تم الجلب تلقائياً من سجل الأشخاص الدائم',
        });
      }
      saveState();
      renderAll();
      showToast(isEn ? `✅ Enrolled ${person.fullName} into "${active.settings.tripTitle}"` : `✅ تم إدراج ${person.fullName} في "${active.settings.tripTitle}"`);
    });
  });

  tbody.querySelectorAll<HTMLElement>('[data-edit-person]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const person = rootState.people.find((x) => x.id === btn.dataset.editPerson);
      if (person) openPersonModal(person);
    });
  });

  tbody.querySelectorAll<HTMLElement>('[data-del-person]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delPerson!;
      handleTwoStepDelete(btn, isEn ? 'Confirm Delete' : 'تأكيد الحذف؟', () => {
        const idx = rootState.people.findIndex((x) => x.id === id);
        if (idx === -1) return;
        const removed = rootState.people[idx];
        rootState.people.splice(idx, 1);
        saveState();
        renderAll();
        showUndoToast(
          isEn ? `Deleted ${removed.fullName} from CRM` : `تم حذف ${removed.fullName} من دفتر الأشخاص`,
          isEn ? '↩️ Undo' : '↩️ تراجع',
          () => {
            rootState.people.splice(Math.min(idx, rootState.people.length), 0, removed);
            saveState();
            renderAll();
            showToast(isEn ? `Restored ${removed.fullName}` : `✅ تمت استعادة ${removed.fullName}`);
          }
        );
      });
    });
  });
}

// =========================================================================
// TAB 2: WHATSAPP BROADCASTS (SYNCED TO ACTIVE GROUP)
// =========================================================================
function renderWhatsAppHub(): void {
  const s = getActiveGroup().settings;
  const isEn = getCurrentLanguage() === 'en';
  const container = document.getElementById('whatsapp-posts-container');
  if (!container) return;

  const params = {
    tripTitle: s.tripTitle,
    supervisorName: s.supervisorName,
    hotelName: s.hotelNameAr,
    gatheringTime: s.gatheringTime,
    meetingPoint: s.meetingPoint,
  };

  const stagePostsHtml = broadcastManager
    .getOrderedPhasesForStage(s.status)
    .map((phase: BroadcastPhase, idx: number) => {
      const post = broadcastManager.getFormattedPost(phase, params);
      const isRecommended = post.recommendedStages.includes(s.status);
      const textareaId = `wa-post-text-${idx}`;
      return `
      <div class="card" style="margin-bottom:1.25rem;${isRecommended ? 'border:2px solid var(--gold);' : ''}">
        <div class="card-header">
          <h3 class="card-title">${escapeHtml(isEn ? post.titleEn : post.title)}</h3>
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap;align-items:center;">
            ${isRecommended ? `<span class="badge badge-warning">⭐ ${isEn ? 'Recommended Now' : 'موصى به لمرحلة الفوج الحالية'}</span>` : ''}
            <span class="badge badge-primary">${escapeHtml(isEn ? post.badgeEn : post.badge)}</span>
          </div>
        </div>
        <label for="${textareaId}" class="field-label">${isEn ? 'Message Text (editable before sending):' : 'نص الرسالة (قابل للتعديل قبل الإرسال):'}</label>
        <textarea id="${textareaId}" class="whatsapp-textarea" rows="8">${escapeHtml(post.messageBody)}</textarea>
        ${renderReferencePillsHtml(post.references, isEn)}
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.75rem;">
          <button type="button" class="btn btn-primary" data-copy-textarea="${textareaId}">📋 ${isEn ? 'Copy for WhatsApp' : 'نسخ للواتساب'}</button>
          <button type="button" class="btn btn-gold" data-open-wa-textarea="${textareaId}">📲 ${isEn ? 'Open in WhatsApp' : 'فتح في واتساب'}</button>
        </div>
      </div>
    `;
    })
    .join('');

  const brandPostsHtml = MARKETING_BROADCAST_TEMPLATES.map((tpl, idx) => {
    const textareaId = `wa-brand-post-${idx}`;
    const title = isEn ? tpl.title.en : tpl.title.ar;
    const audience = isEn ? tpl.audience.en : tpl.audience.ar;
    const message = isEn ? tpl.message.en : tpl.message.ar;
    return `
      <div class="card surface-tint-card" style="margin-bottom:1.25rem;">
        <div class="card-header">
          <h3 class="card-title">${escapeHtml(title)}</h3>
          <span class="badge badge-accent">✨ ${escapeHtml(isEn ? 'Abshirou • Granada #1094' : 'أبشروا • غرناطة ترخيص 1094')}</span>
        </div>
        <p style="font-size:0.84rem;color:var(--text-muted);margin:0 0 0.65rem;">${escapeHtml(audience)}</p>
        <label for="${textareaId}" class="field-label">${isEn ? 'Marketing / Invitation Text (editable before sending):' : 'نص التسويق والدعوة (قابل للتعديل قبل الإرسال):'}</label>
        <textarea id="${textareaId}" class="whatsapp-textarea" rows="9">${escapeHtml(message)}</textarea>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.75rem;">
          <button type="button" class="btn btn-primary" data-copy-textarea="${textareaId}">📋 ${isEn ? 'Copy Marketing Message' : 'نسخ رسالة التسويق'}</button>
          <button type="button" class="btn btn-gold" data-open-wa-textarea="${textareaId}">📲 ${isEn ? 'Share via WhatsApp' : 'مشاركة عبر واتساب'}</button>
        </div>
      </div>
    `;
  }).join('');

  const directCommsCardHtml = `
      <section class="card brand-spotlight-card" style="margin-bottom:1.25rem;" aria-labelledby="sup-direct-mostafa-title">
        <div class="brand-spotlight-identity">
          <div class="brand-spotlight-copy">
            <div class="brand-badge-row" style="margin-block-end:0.35rem;">
              <span class="brand-pill-hero-verified">✓ ${escapeHtml(isEn ? 'Abshirou Official Network' : 'شبكة أبشروا الرسمية')}</span>
              <span class="brand-pill-hero-license">🏢 ${escapeHtml(isEn ? 'Granada Tourism • License #1094' : 'غرناطة للسياحة • ترخيص 1094')}</span>
            </div>
            <h3 id="sup-direct-mostafa-title" class="brand-spotlight-heading" style="font-size:1.05rem;">
              ${escapeHtml(isEn ? 'Direct Channels & WhatsApp to Sheikh Mostafa Flefel' : 'التواصل المباشر وقنوات الشيخ مصطفى فليفل')}
            </h3>
            <p class="brand-spotlight-sub">
              ${escapeHtml(isEn ? 'Quick access to Sheikh WhatsApp, Official Umrah Community Group, and verified Abshirou social channels.' : 'روابط مباشرة لواتساب الشيخ مصطفى، جروب العمرة الرسمي، وحسابات أبشروا الموثقة لتسهيل التواصل والرد على المعتمرين.')}
            </p>
          </div>
        </div>
        <div class="brand-spotlight-actions">
          <a href="${escapeHtml(buildMostafaDirectWhatsAppUrl(isEn ? `Coordination from Supervisor Portal for (${s.tripTitle})` : `تنسيق عبر غرفة المشرف بخصوص (${s.tripTitle})`))}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp" style="text-decoration:none;">
            💬 ${escapeHtml(isEn ? `WhatsApp Mostafa (${SHEIKH_BRAND.contact.umrahWhatsappDisplay})` : `واتساب مصطفى (${SHEIKH_BRAND.contact.umrahWhatsappDisplay})`)}
          </a>
          <a href="${escapeHtml(SHEIKH_BRAND.contact.whatsappGroupUrl)}" target="_blank" rel="noopener noreferrer" class="btn brand-glass-btn" style="text-decoration:none;">
            👥 ${escapeHtml(isEn ? 'Umrah WA Group' : 'جروب العمرة')}
          </a>
          <a href="tel:${escapeHtml(SHEIKH_BRAND.contact.agencyPhoneIntl)}" class="btn brand-glass-btn" style="text-decoration:none;">
            📞 ${escapeHtml(SHEIKH_BRAND.contact.agencyPhoneDisplay)}
          </a>
          ${BRAND_SOCIAL_LINKS.filter((c) => c.id !== 'whatsapp-group')
            .map(
              (c) =>
                `<a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer" class="btn brand-glass-btn btn-compact" style="text-decoration:none;">${c.icon} ${escapeHtml(c.handle)}</a>`
            )
            .join('')}
        </div>
      </section>
  `;

  container.innerHTML = directCommsCardHtml + stagePostsHtml + brandPostsHtml;
  renderSharedBrandFooter('supervisor');

  container.querySelectorAll<HTMLElement>('[data-copy-textarea]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ta = document.getElementById(btn.dataset.copyTextarea!) as HTMLTextAreaElement | null;
      if (ta) void copyToClipboard(ta.value, '✅ تم نسخ منشور الواتساب بالكامل');
    });
  });

  container.querySelectorAll<HTMLElement>('[data-open-wa-textarea]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ta = document.getElementById(btn.dataset.openWaTextarea!) as HTMLTextAreaElement | null;
      if (ta) window.open(buildWhatsAppUrl(ta.value), '_blank', 'noopener');
    });
  });
}

function setCommsSubTab(sub: 'BROADCASTS' | 'WOMEN'): void {
  const bPanel = document.getElementById('sup-comms-broadcasts-panel');
  const wPanel = document.getElementById('sup-comms-women-panel');
  if (bPanel) bPanel.hidden = sub !== 'BROADCASTS';
  if (wPanel) wPanel.hidden = sub !== 'WOMEN';

  document.querySelectorAll<HTMLButtonElement>('[data-comms-subtab]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.commsSubtab === sub));
  });
}

// =========================================================================
// TAB 3: ENHANCED INSTALLMENT PLANS & FLEXIBLE PAYMENTS
// =========================================================================
function buildScheduleSummaryForMember(m: GameyaRecord, departureDateStr: string) {
  const group = new GameyaGroup({
    id: m.id,
    name: getActiveGroup().settings.tripTitle,
    type: m.planType,
    targetAmountPerMember: Money.fromDecimal(m.totalTarget, 'EGP'),
    downPayment: m.downPayment > 0 ? Money.fromDecimal(m.downPayment, 'EGP') : undefined,
    durationMonths: Math.max(1, m.installmentCount),
    startDate: new Date(m.startDateIso || Date.now()),
    departureDate: departureDateStr ? new Date(departureDateStr) : undefined,
    currency: 'EGP',
  });
  group.registerMember({
    id: m.id,
    pilgrimId: m.id,
    fullName: m.name,
    phone: m.phone,
    turnNumber: m.turnMonth,
    customPlanType: m.planType,
    downPayment: m.downPayment > 0 ? Money.fromDecimal(m.downPayment, 'EGP') : undefined,
  });
  const items = group.generateMemberSchedule(m.id, {
    planType: m.planType,
    installmentCount: Math.max(1, m.installmentCount),
  });
  if (m.payments.length > 0) {
    for (const p of m.payments) {
      if (p.amount > 0) {
        group.recordFlexiblePayment({
          memberId: m.id,
          amount: Money.fromDecimal(p.amount, 'EGP'),
          method: p.method,
          supervisorId: 'sup',
          transactionRef: p.ref,
        });
      }
    }
  } else if (m.totalPaid > 0) {
    group.recordFlexiblePayment({
      memberId: m.id,
      amount: Money.fromDecimal(Math.min(m.totalPaid, m.totalTarget), 'EGP'),
      method: PaymentMethod.CASH,
      supervisorId: 'sup',
    });
  }
  const summary = group.getMemberSummary(m.id);
  return { group, items, summary };
}

function buildReceiptMessage(tripTitle: string, supervisorName: string, m: GameyaRecord, amountPaid?: number): string {
  const remaining = Math.max(0, m.totalTarget - m.totalPaid);
  return [
    `📋 *إيصال سداد معتمد - ${tripTitle}* 🕋`,
    `التاريخ: ${new Date().toLocaleDateString('ar-EG')}`,
    `المشترك: *${m.name}*`,
    `خطة السداد: *${PLAN_LABELS[m.planType]}*`,
    ...(amountPaid ? [`قيمة الدفعة المستلمة: *${amountPaid.toLocaleString('ar-EG')} ج.م*`] : []),
    `إجمالي المسدد: *${m.totalPaid.toLocaleString('ar-EG')} ج.م*`,
    `المتبقي: *${remaining.toLocaleString('ar-EG')} ج.م*`,
    `الحالة: *${remaining === 0 ? 'مكتمل السداد 🎉' : 'قيد السداد المنتظم ✅'}*`,
    `_${supervisorName}_`,
  ].join('\n');
}

function updatePaymentProjectionPreview(m: GameyaRecord, amountVal: number): void {
  const box = document.getElementById('pay-projection-preview');
  if (!box) return;
  const currentRemaining = Math.max(0, m.totalTarget - m.totalPaid);
  const clamped = Math.max(0, Math.min(amountVal || 0, currentRemaining));
  const projectedRemaining = Math.max(0, currentRemaining - clamped);
  const pct = Math.min(100, Math.round(((m.totalPaid + clamped) / Math.max(1, m.totalTarget)) * 100));
  box.innerHTML =
    clamped <= 0
      ? 'أدخل قيمة الدفعة لمعاينة الرصيد المتبقي بعد التحصيل.'
      : `💡 بعد تسجيل <strong>${clamped.toLocaleString('ar-EG')} ج.م</strong> يصبح إجمالي السداد <strong>${pct}%</strong> والمتبقي <strong>${projectedRemaining.toLocaleString('ar-EG')} ج.م</strong>${projectedRemaining === 0 ? ' 🎉 (إغلاق كامل)' : ''}.`;
}

function openPaymentModalForMember(m: GameyaRecord): void {
  const active = getActiveGroup();
  activePaymentMemberId = m.id;
  const { items, summary } = buildScheduleSummaryForMember(m, active.settings.endDate);
  const rem = Math.max(0, m.totalTarget - m.totalPaid);
  const nextDue = summary.nextDueItem ? summary.nextDueItem.remainingBalance.toDecimal() : rem;
  const nowMs = Date.now();
  const overdueSum = items
    .filter((it) => it.status !== InstallmentStatus.PAID && it.dueDate.getTime() < nowMs)
    .reduce((acc, it) => acc + it.remainingBalance.toDecimal(), 0);

  const memberBox = document.getElementById('pay-modal-member');
  if (memberBox) {
    memberBox.textContent = `${m.name} — الإجمالي: ${m.totalTarget.toLocaleString('ar-EG')} ج.م • المسدد: ${m.totalPaid.toLocaleString('ar-EG')} ج.م • المتبقي: ${rem.toLocaleString('ar-EG')} ج.م`;
  }

  const amountEl = document.getElementById('pay-amount') as HTMLInputElement | null;
  const dateEl = document.getElementById('pay-date') as HTMLInputElement | null;
  const refEl = document.getElementById('pay-ref') as HTMLInputElement | null;
  if (amountEl) {
    amountEl.value = String(nextDue);
    amountEl.max = String(rem);
  }
  if (dateEl) dateEl.value = new Date().toISOString().slice(0, 10);
  if (refEl) refEl.value = '';

  const presetsEl = document.getElementById('pay-quick-presets');
  if (presetsEl) {
    const presets: Array<{ label: string; value: number }> = [];
    if (nextDue > 0 && nextDue < rem) {
      presets.push({ label: `القسط القادم (${nextDue.toLocaleString('ar-EG')})`, value: nextDue });
    }
    if (overdueSum > 0 && overdueSum !== nextDue && overdueSum <= rem) {
      presets.push({ label: `تصفية المتأخرات (${overdueSum.toLocaleString('ar-EG')})`, value: overdueSum });
    }
    const halfRem = Math.round(rem / 2);
    if (halfRem > 0 && halfRem !== nextDue && halfRem !== overdueSum) {
      presets.push({ label: `نصف المتبقي (${halfRem.toLocaleString('ar-EG')})`, value: halfRem });
    }
    presets.push({ label: `كامل المتبقي (${rem.toLocaleString('ar-EG')})`, value: rem });

    presetsEl.innerHTML = presets
      .map(
        (p) =>
          `<button type="button" class="quick-preset-chip" data-pay-preset="${p.value}">${escapeHtml(p.label)}</button>`
      )
      .join('');
    presetsEl.querySelectorAll<HTMLElement>('[data-pay-preset]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const val = Number(chip.dataset.payPreset) || 0;
        if (amountEl) amountEl.value = String(val);
        updatePaymentProjectionPreview(m, val);
      });
    });
  }

  updatePaymentProjectionPreview(m, nextDue);
  openDialogById('payment-modal');
}

function openScheduleModalForMember(m: GameyaRecord): void {
  const active = getActiveGroup();
  const { items, summary } = buildScheduleSummaryForMember(m, active.settings.endDate);
  const title = document.getElementById('schedule-modal-title');
  const body = document.getElementById('schedule-modal-body');
  if (title) title.textContent = `📅 جدول ودفعات: ${m.name} (${PLAN_LABELS[m.planType]})`;
  if (!body) return;

  const pct = Math.min(100, Math.round((m.totalPaid / Math.max(1, m.totalTarget)) * 100));
  const rem = Math.max(0, m.totalTarget - m.totalPaid);
  const nowMs = Date.now();

  const rowsHtml = items
    .map((it) => {
      const isOverdue = it.status !== InstallmentStatus.PAID && it.dueDate.getTime() < nowMs;
      const badgeCls =
        it.status === InstallmentStatus.PAID
          ? 'badge-success'
          : isOverdue
            ? 'badge-danger'
            : it.status === InstallmentStatus.PARTIALLY_PAID
              ? 'badge-warning'
              : 'badge-primary';
      const badgeText =
        it.status === InstallmentStatus.PAID
          ? 'مسدد ✅'
          : isOverdue
            ? 'متأخر ⚠️'
            : it.status === InstallmentStatus.PARTIALLY_PAID
              ? 'جزئي'
              : 'مستحق';
      return `
      <tr>
        <th scope="row">${escapeHtml(it.labelAr || `قسط ${it.installmentNumber}`)}</th>
        <td data-label="${escapeHtml(t('sup.col.dueDate'))}">${it.dueDate.toLocaleDateString('ar-EG')}</td>
        <td data-label="${escapeHtml(t('sup.col.dueAmount'))}">${it.amountDue.toDecimal().toLocaleString('ar-EG')} ج.م</td>
        <td data-label="${escapeHtml(t('sup.col.paidAmount'))}">${it.amountPaid.toDecimal().toLocaleString('ar-EG')} ج.م</td>
        <td data-label="${escapeHtml(t('sup.col.status'))}"><span class="badge ${badgeCls}">${badgeText}</span></td>
      </tr>
    `;
    })
    .join('');

  const logHtml =
    m.payments.length > 0
      ? `<h3 style="font-size:0.95rem;margin:1rem 0 0.5rem;color:var(--primary-ink);">سجل المدفوعات الموثق (${m.payments.length})</h3>
         <div style="display:flex;flex-direction:column;gap:0.45rem;">
           ${m.payments
             .map(
               (p) => `
             <div class="info-box-neutral" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.45rem;padding:0.55rem 0.75rem;font-size:0.84rem;">
               <div>
                 <strong>${p.amount.toLocaleString(getCurrentLanguage() === 'en' ? 'en-US' : 'ar-EG')} ${getCurrentLanguage() === 'en' ? 'EGP' : 'ج.م'}</strong> — ${escapeHtml(getMethodLabel(p.method))}
                 ${p.ref ? ` (مرجع: ${escapeHtml(p.ref)})` : ''}
                 <span style="color:var(--text-muted);"> • ${escapeHtml(p.dateIso)}</span>
               </div>
               <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
                 <button type="button" class="btn btn-secondary btn-compact" data-copy-receipt="${escapeHtml(p.id)}">📋 نسخ إيصال</button>
                 <button type="button" class="btn btn-secondary btn-compact" style="color:var(--danger);" data-void-payment="${escapeHtml(p.id)}">↩️ تراجع</button>
               </div>
             </div>
           `
             )
             .join('')}
         </div>`
      : `<div class="info-box-neutral" style="margin-top:0.85rem;font-size:0.86rem;color:var(--text-muted);">لم تُسجّل دفعات حتى الآن لهذا المشترك.</div>`;

  body.innerHTML = `
    <div class="info-box-neutral" style="margin-bottom:0.85rem;">
      <progress class="umrah-progress" max="100" value="${pct}" aria-label="نسبة السداد ${pct}%" style="margin-bottom:0.55rem;"></progress>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0.5rem;text-align:center;">
        <div style="background:var(--card-bg);padding:0.45rem;border-radius:8px;border:1px solid var(--border);"><div style="font-size:0.74rem;color:var(--text-muted);">الإجمالي</div><strong>${m.totalTarget.toLocaleString('ar-EG')} ج.م</strong></div>
        <div style="background:var(--card-bg);padding:0.45rem;border-radius:8px;border:1px solid var(--border);"><div style="font-size:0.74rem;color:var(--text-muted);">المسدد (${pct}%)</div><strong style="color:var(--success);">${m.totalPaid.toLocaleString('ar-EG')} ج.م</strong></div>
        <div style="background:var(--card-bg);padding:0.45rem;border-radius:8px;border:1px solid var(--border);"><div style="font-size:0.74rem;color:var(--text-muted);">المتبقي (${summary.overdueCount} متأخر)</div><strong style="color:var(--gold-dark);">${rem.toLocaleString('ar-EG')} ج.م</strong></div>
      </div>
    </div>
    <div class="table-wrapper" tabindex="0" role="region" aria-label="تفاصيل الأقساط">
      <table class="schedule-table"><thead><tr><th>البند</th><th>الاستحقاق</th><th>المطلوب</th><th>المسدد</th><th>الحالة</th></tr></thead><tbody>${rowsHtml}</tbody></table>
    </div>
    ${logHtml}
    <details class="ref-disclosure" style="margin-top:0.95rem;">
      <summary><span>⚙️ تعديل الخطة أو إزالة المشترك</span><span aria-hidden="true">▾</span></summary>
      <form id="edit-gam-member-form" style="margin-top:0.65rem;">
        <div class="form-inline-grid" style="margin-bottom:0.65rem;">
          <div>
            <label for="edit-gam-plan" class="field-label">نظام السداد:</label>
            <select id="edit-gam-plan" class="field-input">
              ${Object.values(GameyaType)
                .map((gt) => `<option value="${gt}" ${gt === m.planType ? 'selected' : ''}>${escapeHtml(PLAN_LABELS[gt])}</option>`)
                .join('')}
            </select>
          </div>
          <div><label for="edit-gam-target" class="field-label">الإجمالي (ج.م):</label><input id="edit-gam-target" type="number" min="100" value="${m.totalTarget}" class="field-input" required></div>
          <div><label for="edit-gam-down" class="field-label">المقدم (ج.م):</label><input id="edit-gam-down" type="number" min="0" value="${m.downPayment}" class="field-input"></div>
          <div><label for="edit-gam-count" class="field-label">عدد الدفعات:</label><input id="edit-gam-count" type="number" min="1" max="48" value="${m.installmentCount}" class="field-input"></div>
          <div><label for="edit-gam-start" class="field-label">تاريخ البدء:</label><input id="edit-gam-start" type="date" value="${escapeHtml(m.startDateIso)}" class="field-input"></div>
          <div><label for="edit-gam-turn" class="field-label">الدور (للجمعية):</label><input id="edit-gam-turn" type="number" min="1" max="48" value="${m.turnMonth}" class="field-input"></div>
        </div>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button type="submit" class="btn btn-primary" style="flex:1;">💾 حفظ تعديل الخطة</button>
          <button type="button" id="btn-delete-gam-member" class="btn btn-danger" data-confirm-step="0">🗑️ حذف المشترك</button>
        </div>
      </form>
    </details>
  `;

  body.querySelectorAll<HTMLElement>('[data-copy-receipt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = m.payments.find((x) => x.id === btn.dataset.copyReceipt);
      if (!p) return;
      void copyToClipboard(
        buildReceiptMessage(active.settings.tripTitle, active.settings.supervisorName, m, p.amount),
        '✅ تم نسخ إيصال الدفعة للواتساب'
      );
    });
  });

  body.querySelectorAll<HTMLElement>('[data-void-payment]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = m.payments.findIndex((x) => x.id === btn.dataset.voidPayment);
      if (idx === -1) return;
      const removed = m.payments.splice(idx, 1)[0];
      m.totalPaid = m.payments.reduce((acc, x) => acc + x.amount, 0);
      saveState();
      renderAll();
      openScheduleModalForMember(m);
      showToast(`↩️ تم التراجع عن دفعة ${removed.amount.toLocaleString('ar-EG')} ج.م`);
    });
  });

  body.querySelector('#edit-gam-member-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const newPlan = (body.querySelector('#edit-gam-plan') as HTMLSelectElement).value as GameyaType;
    const newTarget = Number((body.querySelector('#edit-gam-target') as HTMLInputElement).value) || m.totalTarget;
    const rawDown = Number((body.querySelector('#edit-gam-down') as HTMLInputElement).value) || 0;
    const rawCount = Number((body.querySelector('#edit-gam-count') as HTMLInputElement).value) || m.installmentCount;
    const newStart = (body.querySelector('#edit-gam-start') as HTMLInputElement).value || m.startDateIso;
    const newTurn = Number((body.querySelector('#edit-gam-turn') as HTMLInputElement).value) || m.turnMonth;

    if (
      (newPlan === GameyaType.DEPOSIT_PLUS_MONTHLY || newPlan === GameyaType.DEPOSIT_PLUS_FINAL) &&
      rawDown >= newTarget
    ) {
      showToast('⚠️ قيمة المقدم يجب أن تكون أقل من الإجمالي', true);
      return;
    }

    m.planType = newPlan;
    m.totalTarget = newTarget;
    m.downPayment =
      newPlan === GameyaType.FULL_CASH
        ? newTarget
        : newPlan === GameyaType.DEPOSIT_PLUS_MONTHLY || newPlan === GameyaType.DEPOSIT_PLUS_FINAL
          ? Math.max(0, rawDown)
          : 0;
    m.installmentCount =
      newPlan === GameyaType.FULL_CASH ? 1 : newPlan === GameyaType.DEPOSIT_PLUS_FINAL ? 2 : Math.max(1, rawCount);
    m.startDateIso = newStart;
    m.turnMonth = Math.max(1, newTurn);
    saveState();
    renderAll();
    openScheduleModalForMember(m);
    showToast(`✅ تم تحديث خطة سداد ${m.name}`);
  });

  const delBtn = body.querySelector<HTMLButtonElement>('#btn-delete-gam-member');
  delBtn?.addEventListener('click', () => {
    if (delBtn.dataset.confirmStep !== '1') {
      delBtn.dataset.confirmStep = '1';
      delBtn.textContent = '⚠️ اضغط مجدداً لتأكيد الحذف';
      return;
    }
    active.gameya = active.gameya.filter((x) => x.id !== m.id);
    saveState();
    renderAll();
    closeDialogById('schedule-modal');
    showToast(`🗑️ تم حذف اشتراك ${m.name}`);
  });

  openDialogById('schedule-modal');
}

function renderGameyaSummaryAndRosca(
  enriched: Array<{ member: GameyaRecord; overdueCount: number; remaining: number }>
): void {
  const isEn = getCurrentLanguage() === 'en';
  const loc = isEn ? 'en-US' : 'ar-EG';
  const curr = isEn ? 'EGP' : 'ج.م';
  const summaryStrip = document.getElementById('gameya-summary-strip');
  if (summaryStrip) {
    const totalExpected = enriched.reduce((s, e) => s + e.member.totalTarget, 0);
    const totalPaid = enriched.reduce((s, e) => s + e.member.totalPaid, 0);
    const totalRemaining = Math.max(0, totalExpected - totalPaid);
    const overdueSubs = enriched.filter((e) => e.remaining > 0 && e.overdueCount > 0).length;
    const pct = totalExpected > 0 ? Math.min(100, Math.round((totalPaid / totalExpected) * 100)) : 0;

    summaryStrip.innerHTML = `
      <div class="gam-metric-tile">
        <div style="font-size:0.78rem;color:var(--text-muted);">${isEn ? `Total Plans (${enriched.length})` : `إجمالي باقات المشتركين (${enriched.length})`}</div>
        <strong style="font-size:1.15rem;color:var(--primary-ink);">${totalExpected.toLocaleString(loc)} ${curr}</strong>
      </div>
      <div class="gam-metric-tile">
        <div style="font-size:0.78rem;color:var(--text-muted);">${isEn ? `Collected (${pct}%)` : `المحصّل الفعلي (${pct}%)`}</div>
        <strong style="font-size:1.15rem;color:var(--success);display:block;margin-bottom:0.3rem;">${totalPaid.toLocaleString(loc)} ${curr}</strong>
        <progress class="umrah-progress" max="100" value="${pct}" aria-label="${pct}%"></progress>
      </div>
      <div class="gam-metric-tile">
        <div style="font-size:0.78rem;color:var(--text-muted);">${isEn ? 'Remaining Balance' : 'المتبقي قيد التحصيل'}</div>
        <strong style="font-size:1.15rem;color:var(--gold-dark);">${totalRemaining.toLocaleString(loc)} ${curr}</strong>
      </div>
      <button type="button" class="gam-metric-tile gam-metric-tile-btn" id="btn-filter-overdue-shortcut" aria-label="${isEn ? 'Filter Overdue Accounts' : 'تصفية الاشتراكات المتأخرة'}">
        <div style="font-size:0.78rem;color:var(--text-muted);">${isEn ? 'Overdue Accounts' : 'متأخرون عن الموعد'}</div>
        <strong style="font-size:1.15rem;color:${overdueSubs > 0 ? 'var(--danger)' : 'var(--success)'};">
          ${overdueSubs > 0 ? (isEn ? `⚠️ ${overdueSubs} Overdue` : `⚠️ ${overdueSubs} مشترك`) : isEn ? '0 Overdue ✅' : '0 متأخرين ✅'}
        </strong>
      </button>
    `;
    document.getElementById('btn-filter-overdue-shortcut')?.addEventListener('click', () => {
      gameyaFilter = gameyaFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE';
      document.querySelectorAll<HTMLButtonElement>('[data-gameya-filter]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.gameyaFilter === gameyaFilter));
      });
      renderGameyaTable();
    });
  }

  const roscaBoard = document.getElementById('gameya-rosca-board');
  if (roscaBoard) {
    const roscaMembers = enriched.map((e) => e.member).filter((m) => m.planType === GameyaType.ROTATING_ROSCA);
    if (roscaMembers.length === 0) {
      roscaBoard.hidden = true;
      roscaBoard.innerHTML = '';
    } else {
      roscaBoard.hidden = false;
      const avgTarget = Math.round(roscaMembers.reduce((s, m) => s + m.totalTarget, 0) / roscaMembers.length);
      const roscaGroup = new GameyaGroup({
        id: 'rosca-overview',
        name: getActiveGroup().settings.tripTitle,
        type: GameyaType.ROTATING_ROSCA,
        targetAmountPerMember: Money.fromDecimal(avgTarget, 'EGP'),
        durationMonths: Math.max(...roscaMembers.map((m) => m.installmentCount), roscaMembers.length),
        startDate: new Date(roscaMembers[0].startDateIso || Date.now()),
        currency: 'EGP',
      });
      roscaMembers.forEach((m) => {
        roscaGroup.registerMember({
          id: m.id,
          pilgrimId: m.id,
          fullName: m.name,
          phone: m.phone,
          turnNumber: m.turnMonth,
        });
      });
      const plan = roscaGroup.getTurnPayoutPlan();
      roscaBoard.innerHTML = `
        <div class="info-box-neutral">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.65rem;">
            <strong style="color:var(--primary-ink);">🔄 جدول استلام أدوار الجمعية الشهرية (${plan.length})</strong>
            <span class="badge badge-primary">مرتب تلقائياً حسب الشهر</span>
          </div>
          <div class="grid-2" style="margin-bottom:0;">
            ${plan
              .map((slot) => {
                const mem = roscaMembers.find((x) => x.id === slot.memberId)!;
                const rem = Math.max(0, mem.totalTarget - mem.totalPaid);
                return `
                <div style="background:var(--card-bg);border:1px solid var(--border);border-radius:10px;padding:0.65rem 0.8rem;display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">
                  <div>
                    <span class="badge badge-warning">الدور #${slot.turnNumber}</span>
                    <strong style="margin-inline-start:0.35rem;">${escapeHtml(mem.name)}</strong>
                    <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.2rem;">موعد الاستحقاق: ${slot.payoutMonth.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}</div>
                  </div>
                  <div style="text-align:end;font-size:0.82rem;">
                    <strong>${mem.totalTarget.toLocaleString('ar-EG')} ج.م</strong>
                    <div style="color:${rem === 0 ? 'var(--success)' : 'var(--gold-dark)'};font-weight:700;">${rem === 0 ? 'مكتمل ✅' : `متبقي ${rem.toLocaleString('ar-EG')}`}</div>
                  </div>
                </div>
              `;
              })
              .join('')}
          </div>
        </div>
      `;
    }
  }
}

function exportGameyaCSV(): void {
  const active = getActiveGroup();
  const rows = [
    ['الفوج', 'المشترك', 'الهاتف', 'نظام السداد', 'الإجمالي', 'المسدد', 'المتبقي', 'عدد الدفعات المسجلة', 'الحالة'],
    ...active.gameya.map((m) => {
      const { summary } = buildScheduleSummaryForMember(m, active.settings.endDate);
      const rem = Math.max(0, m.totalTarget - m.totalPaid);
      const status = rem === 0 ? 'مكتمل السداد' : summary.overdueCount > 0 ? `متأخر (${summary.overdueCount})` : 'قيد السداد';
      return [
        active.settings.tripTitle,
        m.name,
        m.phone,
        PLAN_LABELS[m.planType],
        String(m.totalTarget),
        String(m.totalPaid),
        String(rem),
        String(m.payments.length),
        status,
      ];
    }),
  ];
  let csv = '\uFEFF';
  rows.forEach((r) => {
    csv += r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\r\n';
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `umrah_installments_${active.settings.tripCode.replace('#', '')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📥 تم تنزيل كشف الأقساط (CSV / Excel)');
}

function renderGameyaTable(): void {
  const active = getActiveGroup();
  const isEn = getCurrentLanguage() === 'en';
  const loc = isEn ? 'en-US' : 'ar-EG';
  const curr = isEn ? 'EGP' : 'ج.م';
  const tbody = document.getElementById('gameya-tbody');
  if (!tbody) return;

  const enriched = active.gameya.map((m) => {
    const { summary } = buildScheduleSummaryForMember(m, active.settings.endDate);
    const remaining = Math.max(0, m.totalTarget - m.totalPaid);
    return { member: m, summary, overdueCount: summary.overdueCount, remaining };
  });

  renderGameyaSummaryAndRosca(enriched);

  const q = gameyaSearch.toLowerCase().trim();
  const visible = enriched.filter(({ member, overdueCount, remaining }) => {
    const matchesSearch =
      !q || member.name.toLowerCase().includes(q) || member.phone.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (gameyaFilter === 'OVERDUE') return remaining > 0 && overdueCount > 0;
    if (gameyaFilter === 'ACTIVE') return remaining > 0;
    if (gameyaFilter === 'PAID') return remaining === 0;
    if (gameyaFilter === 'ROSCA') return member.planType === GameyaType.ROTATING_ROSCA;
    return true;
  });

  if (visible.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:1.25rem;color:var(--text-muted);">${
      active.gameya.length === 0
        ? isEn
          ? 'No installment subscribers registered for this group yet.'
          : 'لا يوجد مشتركون في خطة أقساط لهذا الفوج بعد.'
        : isEn
          ? 'No subscribers match your current filter or search.'
          : 'لا توجد نتائج مطابقة للتصفية أو البحث الحالي.'
    }</td></tr>`;
    return;
  }

  tbody.innerHTML = visible
    .map(({ member: m, summary, remaining }) => {
      const pct = Math.min(100, Math.round((m.totalPaid / Math.max(1, m.totalTarget)) * 100));
      const nextDueAmount = summary.nextDueItem ? summary.nextDueItem.remainingBalance.toDecimal() : 0;
      const nextDueDateStr = summary.nextDueItem ? summary.nextDueItem.dueDate.toLocaleDateString(loc) : '';
      const nextDueLabel = summary.nextDueItem
        ? `${nextDueAmount.toLocaleString(loc)} ${curr}${isEn ? '' : ` (${summary.nextDueItem.labelAr || 'قسط'})`}`
        : `0 ${curr}`;

      const receiptText = buildReceiptMessage(active.settings.tripTitle, active.settings.supervisorName, m);
      const reminderText = `السلام عليكم ورحمة الله وبركاته يا ${m.name}، نود تذكيركم بموعد الدفعة القادمة لرحلة (${active.settings.tripTitle}) ضمن خطة (${PLAN_LABELS[m.planType]}) بمبلغ ${nextDueAmount.toLocaleString('ar-EG')} ج.م (تستحق ${summary.nextDueItem ? summary.nextDueItem.dueDate.toLocaleDateString('ar-EG') : ''}). تقبل الله طاعتكم.`;

      return `
      <tr>
        <th scope="row">
          <div>${escapeHtml(m.name)}</div>
          ${m.phone ? `<div style="font-size:0.78rem;color:var(--text-muted);font-weight:500;" dir="ltr">${escapeHtml(m.phone)}</div>` : ''}
        </th>
        <td data-label="${escapeHtml(t('sup.col.plan'))}">
          <div><span class="badge badge-primary">${escapeHtml(getPlanLabel(m.planType))}</span></div>
          ${m.planType === GameyaType.ROTATING_ROSCA ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.2rem;">${isEn ? `Turn: Month ${m.turnMonth}` : `الدور: شهر ${m.turnMonth}`}</div>` : ''}
        </td>
        <td data-label="${escapeHtml(t('sup.col.total'))}">
          <div style="font-weight:700;margin-bottom:0.25rem;">${m.totalTarget.toLocaleString(loc)} ${curr} <span style="font-size:0.78rem;color:var(--primary-ink);">(${pct}%)</span></div>
          <progress class="umrah-progress" max="100" value="${pct}" aria-label="${pct}%"></progress>
        </td>
        <td data-label="${escapeHtml(t('sup.col.paidRemaining'))}">
          <div style="font-weight:700;color:var(--success);">${m.totalPaid.toLocaleString(loc)} ${curr}</div>
          <div style="font-size:0.78rem;color:var(--gold-dark);font-weight:600;">${isEn ? `Left: ${remaining.toLocaleString(loc)} ${curr}` : `متبقي: ${remaining.toLocaleString(loc)} ${curr}`}</div>
        </td>
        <td data-label="${escapeHtml(t('sup.col.nextDue'))}">
          <div>${escapeHtml(nextDueLabel)}</div>
          ${nextDueDateStr ? `<div style="font-size:0.78rem;color:var(--text-muted);">${escapeHtml(nextDueDateStr)}</div>` : ''}
        </td>
        <td data-label="${escapeHtml(t('sup.col.status'))}">
          <span class="badge ${remaining === 0 ? 'badge-success' : summary.overdueCount > 0 ? 'badge-danger' : 'badge-warning'}">
            ${remaining === 0 ? (isEn ? 'Paid in Full 🎉' : 'مكتمل السداد 🎉') : summary.overdueCount > 0 ? (isEn ? `Overdue (${summary.overdueCount}) ⚠️` : `متأخر (${summary.overdueCount}) ⚠️`) : isEn ? 'Active' : 'قيد السداد'}
          </span>
        </td>
        <td class="table-actions-cell">
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
            ${remaining > 0 ? `<button type="button" class="btn btn-primary btn-compact" data-open-pay="${escapeHtml(m.id)}">${isEn ? '💳 Pay' : '💳 دفعة'}</button>` : ''}
            <button type="button" class="btn btn-secondary btn-compact" data-view-schedule="${escapeHtml(m.id)}">${isEn ? '📅 Ledger' : '📅 الجدول'}</button>
            <a href="${buildWhatsAppUrl(remaining === 0 ? receiptText : reminderText, m.phone)}" target="_blank" rel="noopener" class="btn btn-gold btn-compact" style="text-decoration:none;">${isEn ? '📲 WhatsApp' : '📲 واتساب'}</a>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');

  tbody.querySelectorAll<HTMLElement>('[data-open-pay]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const m = active.gameya.find((x) => x.id === btn.dataset.openPay);
      if (m) openPaymentModalForMember(m);
    });
  });

  tbody.querySelectorAll<HTMLElement>('[data-view-schedule]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const m = active.gameya.find((x) => x.id === btn.dataset.viewSchedule);
      if (m) openScheduleModalForMember(m);
    });
  });
}

// =========================================================================
// TAB 4: PRINT CENTER
// =========================================================================
function renderPrintSelectors(): void {
  const active = getActiveGroup();
  const wbSelect = document.getElementById('print-wristband-pilgrim') as HTMLSelectElement | null;
  if (wbSelect) {
    wbSelect.innerHTML =
      active.pilgrims.length === 0
        ? '<option value="">لا يوجد معتمرون بالفوج</option>'
        : active.pilgrims
            .map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.fullName)} (${escapeHtml(p.passportNumber)})</option>`)
            .join('');
  }
  const agSelect = document.getElementById('print-agreement-member') as HTMLSelectElement | null;
  if (agSelect) {
    agSelect.innerHTML =
      active.gameya.length === 0
        ? '<option value="">لا يوجد مشتركون</option>'
        : active.gameya.map((m) => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)}</option>`).join('');
  }
}

function openWristbandPreview(): void {
  const active = getActiveGroup();
  const id = (document.getElementById('print-wristband-pilgrim') as HTMLSelectElement).value;
  const p = active.pilgrims.find((x) => x.id === id) || active.pilgrims[0];
  const container = document.getElementById('wristband-print-content');
  if (!p || !container) {
    showToast('أضف معتمراً للفوج أولاً');
    return;
  }

  const qrPayload = `UMRAH ${active.settings.tripCode}\nNAME: ${p.fullName}\nPP: ${p.passportNumber}\nHOTEL: ${active.settings.hotelNameEn}\nSUPERVISOR: ${active.settings.supervisorPhone}`;
  container.innerHTML = `
    <div style="border:2px solid #064e3b;border-radius:12px;padding:1.25rem;background:#ecfdf5;color:#022c22;text-align:center;">
      <div style="font-size:0.78rem;font-weight:800;color:#065f46;margin-bottom:0.2rem;">أبشروا — شركة غرناطة للسياحة (ترخيص 1094)</div>
      <div style="font-size:1.15rem;font-weight:800;">${escapeHtml(active.settings.tripTitle)} 🕋 ${escapeHtml(active.settings.tripCode)}</div>
      <div style="font-size:1.1rem;font-weight:800;margin:0.4rem 0;">${escapeHtml(p.fullName)} (${escapeHtml(p.passportNumber)})</div>
      <div style="font-size:0.88rem;">${escapeHtml(active.settings.hotelNameAr)} — غرفة ${escapeHtml(p.roomNumber || '---')}</div>
      <div style="font-size:0.95rem;font-weight:800;margin:0.4rem 0;" dir="ltr">SOS: ${escapeHtml(active.settings.supervisorPhone)}</div>
      <div style="margin:0.75rem auto;background:white;display:inline-block;padding:0.5rem;border-radius:10px;">
        ${renderQrSvg(qrPayload, `QR معصم ${p.fullName}`)}
      </div>
      <div style="font-size:0.78rem;color:#334155;">امسح الكود بكاميرا الجوال لإظهار بيانات الفندق وهاتف المشرف</div>
    </div>
  `;
  openDialogById('wristband-modal');
}

function openAgreementPreview(): void {
  const active = getActiveGroup();
  const id = (document.getElementById('print-agreement-member') as HTMLSelectElement).value;
  const m = active.gameya.find((x) => x.id === id) || active.gameya[0];
  const container = document.getElementById('agreement-print-content');
  if (!m || !container) {
    showToast('أضف مشتركاً بخطة السداد أولاً');
    return;
  }

  container.innerHTML = `
    <div style="border:1px solid #cbd5e1;border-radius:12px;padding:1.25rem;line-height:1.95;background:#f8fafc;color:#0f172a;">
      <div style="text-align:center;font-size:0.82rem;font-weight:800;color:#047857;margin-bottom:0.25rem;">أبشروا — شركة غرناطة للسياحة (ترخيص 1094)</div>
      <h2 style="text-align:center;color:#064e3b;margin-bottom:0.75rem;font-size:1.15rem;">إقرار والتزام بسداد رحلة العمرة</h2>
      أقر أنا المشترك / المعتمر: <strong>${escapeHtml(m.name)}</strong><br>
      رقم الهاتف: <strong dir="ltr">${escapeHtml(m.phone)}</strong><br>
      بأنني انضممت لـ (<strong>${escapeHtml(active.settings.tripTitle)}</strong>) بإشراف المشرف (<strong>${escapeHtml(active.settings.supervisorName)}</strong>)، وفق خطة السداد: <strong>${escapeHtml(PLAN_LABELS[m.planType])}</strong>، لإجمالي تكلفة <strong>${m.totalTarget.toLocaleString('ar-EG')} ج.م</strong> (المقدم: <strong>${m.downPayment.toLocaleString('ar-EG')} ج.م</strong> • المسدد حتى تاريخه: <strong>${m.totalPaid.toLocaleString('ar-EG')} ج.م</strong>).
      <div style="margin-top:1.5rem;border-top:1px dashed #94a3b8;padding-top:0.85rem;display:flex;justify-content:space-between;">
        <div>توقيع المشترك: ......................</div>
        <div>اعتماد المشرف: ${escapeHtml(active.settings.supervisorName)}</div>
      </div>
    </div>
  `;
  openDialogById('agreement-modal');
}

// =========================================================================
// TAB 5: SOS & OFFICIAL RESOURCES
// =========================================================================
function renderSOSTab(): void {
  const active = getActiveGroup();
  const container = document.getElementById('sos-alerts-list');
  const taxiSummary = document.getElementById('sup-taxi-hotel-box');
  if (taxiSummary) {
    taxiSummary.innerHTML = `
      🏨 <strong>${escapeHtml(active.settings.hotelNameAr)}</strong> — ${escapeHtml(active.settings.hotelAddressAr)}<br>
      📞 الاستقبال: <span dir="ltr">${escapeHtml(active.settings.hotelPhone)}</span> | 📱 المشرف: <span dir="ltr">${escapeHtml(active.settings.supervisorPhone)}</span>
    `;
  }

  if (!container) return;
  if (active.sosAlerts.length === 0) {
    container.innerHTML = `
      <div class="info-box-neutral" style="text-align:center;">
        <div style="font-size:2.2rem;margin-bottom:0.3rem;" aria-hidden="true">🟢</div>
        <strong>لا توجد بلاغات تائهين مسجلة لهذا الفوج</strong>
        <p style="font-size:0.86rem;color:var(--text-muted);margin-top:0.3rem;">سجّل أي بلاغ وارد عبر الواتساب لحساب المسافة حتى (${escapeHtml(active.settings.hotelNameAr)}) فوراً.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = active.sosAlerts
    .map(
      (a) => `
    <div class="${a.resolved ? 'info-box-neutral' : 'info-box-danger'}" style="margin-bottom:0.75rem;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.35rem;">
        <strong>🆘 ${escapeHtml(a.pilgrimName)}</strong>
        <span class="badge ${a.resolved ? 'badge-success' : 'badge-danger'}">${a.resolved ? 'تم الوصول للفوج ✅' : `نشط • يبعد ${(a.distanceMeters / 1000).toFixed(2)} كم`}</span>
      </div>
      <div style="font-size:0.85rem;margin-bottom:0.45rem;">${escapeHtml(a.notes)} • ${escapeHtml(a.createdAt)}</div>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
        <a href="https://maps.google.com/?q=${a.latitude},${a.longitude}" target="_blank" rel="noopener" class="btn btn-secondary btn-compact" style="text-decoration:none;">📍 الخريطة</a>
        ${!a.resolved ? `<button type="button" class="btn btn-primary btn-compact" data-resolve-sos="${escapeHtml(a.id)}">✅ تم العثور عليه</button>` : ''}
      </div>
    </div>
  `
    )
    .join('');

  container.querySelectorAll<HTMLElement>('[data-resolve-sos]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const alert = active.sosAlerts.find((x) => x.id === btn.dataset.resolveSos);
      if (!alert) return;
      alert.resolved = true;
      saveState();
      renderAll();
      void resolveCloudSosEvent(alert.id);
      showToast(`✅ تم إغلاق بلاغ ${alert.pilgrimName}`);
    });
  });
}

function renderOfficialResourcesInSup(): void {
  const isEn = getCurrentLanguage() === 'en';
  const container = document.getElementById('sup-official-resources');
  if (!container) return;
  const fieldEmergencyResources = OFFICIAL_SAUDI_RESOURCES.filter(
    (r) => r.category === 'EMERGENCY' || r.id === 'nusuk-app'
  );
  container.innerHTML = fieldEmergencyResources.map((r) => {
    const en = OFFICIAL_RESOURCES_EN[r.id];
    return `
    <a href="${escapeHtml(r.urlOrTel)}" ${r.urlOrTel.startsWith('http') ? 'target="_blank" rel="noopener"' : ''} class="btn btn-secondary" style="justify-content:flex-start;text-decoration:none;text-align:${isEn ? 'left' : 'right'};">
      <div>
        <div style="font-size:0.86rem;font-weight:800;">${escapeHtml(isEn && en ? en.titleEn : r.titleAr)}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);font-weight:500;">${escapeHtml(isEn && en ? en.actionEn : r.actionLabelAr)}</div>
      </div>
    </a>
  `;
  }).join('');
}

// =========================================================================
// TAB 6: WOMEN'S MESSAGING & QUICK REPLIES (DYNAMICALLY SYNCED TO GROUP)
// =========================================================================
function renderWomenGuidanceSynced(): void {
  const s = getActiveGroup().settings;
  const ihramBox = document.getElementById('post-women-ihram');
  const rawdahBox = document.getElementById('post-women-rawdah');

  if (ihramBox) {
    ihramBox.textContent = `السلام عليكم ورحمة الله وبركاته أخواتي معتمرات (${s.tripTitle}) 🌸
تذكير سريع بأحكام إحرام المرأة:
1. احرمي في عباءتك الساترة المعتادة (لا يخصص ثوب أبيض أو أخضر).
2. يحرم النقاب المفصل والقفازان فقط، وتسدلين خمارك عند مرور الرجال.
3. يجوز لبس الجوارب والأحذية المخيطة، وتُمنع العطور بعد النية.
مع تحيات مشرف الفوج: ${s.supervisorName} (${s.supervisorPhone})`;
  }

  if (rawdahBox) {
    rawdahBox.textContent = `السلام عليكم أخواتنا الكريمات في (${s.tripTitle}) 🌸
موعد تجمع زيارة الروضة الشريفة للأخوات (بتصاريح نُسك):
⏰ التجمع ببهو فندق (${s.hotelNameAr}) قبل الموعد بـ 45 دقيقة.
📍 الاتجاه لبوابة عثمان بن عفان (بوابة 25) أو المسار المحدد ميدانياً (32 / 37).
📱 تجهيز تصريح نُسك والهوية الأصلية ورفع سطوع الشاشة.
للتنسيق: ${s.supervisorName} (${s.supervisorPhone})`;
  }

  const quickRepliesGrid = document.getElementById('women-quick-replies-grid');
  if (quickRepliesGrid) {
    const replies = [
      {
        id: 'qr-haid-miqat',
        title: 'حاضت عند الميقات',
        text: `أختنا الكريمة في (${s.tripTitle})، إذا نزل الحيض عند الميقات أو قبله: تعقدين نية العمرة وتلبّين وتلتزمين بمحظورات الإحرام، ثم تنتظرين بمكة حتى الطهر والاغتسال، بعدها تطوفين وتسعين وتقصرين وعمرتك صحيحة (البخاري 1650 / مسلم 1211).`,
      },
      {
        id: 'qr-haid-sai',
        title: 'حاضت بعد الطواف وقبل السعي',
        text: `أختنا الكريمة في (${s.tripTitle})، من طافت طاهرة ثم حاضت قبل السعي: السعي لا يُشترط له الطهارة من الحيض، فتكملين السعي بين الصفا والمروة وتقصرين وتتحللين من إحرامك (دليل المعتمر).`,
      },
      {
        id: 'qr-istihadah',
        title: 'دم الاستحاضة (غير الحيض)',
        text: `أختنا الكريمة، دم الاستحاضة لا يمنع الصلاة ولا الطواف ولا قراءة القرآن؛ تتحفظين وتتوضئين لكل صلاة أو طواف (صحيح البخاري 306).`,
      },
      {
        id: 'qr-rawdah-entry',
        title: 'ضوابط دخول الروضة (نُسك)',
        text: `تذكير دخول الروضة الشريفة للأخوات: الحضور قبل الموعد بـ 20 دقيقة عند بوابة عثمان (رقم 25) أو المسارات المحددة (32/37)، مع إبقاء تطبيق نُسك مفتوحاً ولقطة QR جاهزة أوفلاين.`,
      },
    ];
    quickRepliesGrid.innerHTML = replies
      .map(
        (r) => `
      <div class="info-box-neutral" style="border-inline-start:4px solid var(--women-border);display:flex;flex-direction:column;justify-content:space-between;gap:0.55rem;">
        <div>
          <strong style="color:var(--women-accent);display:block;margin-bottom:0.25rem;">${escapeHtml(r.title)}</strong>
          <p id="${escapeHtml(r.id)}" style="font-size:0.86rem;line-height:1.65;">${escapeHtml(r.text)}</p>
        </div>
        <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
          <button type="button" class="btn btn-secondary btn-compact" data-copy-box="${escapeHtml(r.id)}">📋 نسخ الرد</button>
          <a href="${buildWhatsAppUrl(r.text)}" target="_blank" rel="noopener" class="btn btn-gold btn-compact" style="text-decoration:none;">📲 إرسال بالواتساب</a>
        </div>
      </div>
    `
      )
      .join('');

    quickRepliesGrid.querySelectorAll<HTMLElement>('[data-copy-box]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const el = document.getElementById(btn.dataset.copyBox!);
        if (el) void copyToClipboard(el.textContent || '', '✅ تم نسخ الرد الجاهز');
      });
    });
  }
}

// =========================================================================
// TAB 7: LUGGAGE & MEDICAL
// =========================================================================
function renderLuggageSection(): void {
  const active = getActiveGroup();
  const isEn = getCurrentLanguage() === 'en';
  const onBus = active.luggage.filter((b) => b.status === LuggageStatus.ON_BUS).length;
  const lobby = active.luggage.filter((b) => b.status === LuggageStatus.HOTEL_LOBBY).length;
  const delivered = active.luggage.filter((b) => b.status === LuggageStatus.DELIVERED_TO_ROOM).length;

  const set = (id: string, txt: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };
  set('count-lug-total', isEn ? `${active.luggage.length}` : `${active.luggage.length} حقائب`);
  set('count-lug-bus', isEn ? `${onBus}` : `${onBus} بالحافلة`);
  set('count-lug-lobby', isEn ? `${lobby}` : `${lobby} بالبهو`);
  set('count-lug-room', isEn ? `${delivered}` : `${delivered} بالغرف`);

  const tbody = document.getElementById('luggage-tbody');
  if (!tbody) return;
  const statusMap: Record<LuggageStatus, { label: string; cls: string }> = {
    [LuggageStatus.ON_BUS]: { label: isEn ? 'On Bus 🚌' : 'بالحافلة 🚌', cls: 'badge-warning' },
    [LuggageStatus.HOTEL_LOBBY]: { label: isEn ? 'Hotel Lobby 🏨' : 'ببهو الاستقبال 🏨', cls: 'badge-primary' },
    [LuggageStatus.DELIVERED_TO_ROOM]: { label: isEn ? 'Delivered ✅' : 'سُلّمت للغرفة ✅', cls: 'badge-success' },
    [LuggageStatus.LOST]: { label: isEn ? 'Missing 🔍' : 'مفقودة / بحث 🔍', cls: 'badge-danger' },
  };

  tbody.innerHTML =
    active.luggage.length === 0
      ? `<tr><td colspan="5" style="text-align:center;padding:1rem;color:var(--text-muted);">${isEn ? 'No luggage bags registered for this group yet.' : 'لا توجد حقائب مسجلة لهذا الفوج بعد.'}</td></tr>`
      : active.luggage
          .map((bag) => {
            const st = statusMap[bag.status];
            return `
            <tr>
              <th scope="row" style="font-family:monospace;">${escapeHtml(bag.tagCode)}</th>
              <td data-label="${escapeHtml(t('sup.col.pilgrim'))}">${escapeHtml(bag.pilgrimName)}</td>
              <td data-label="${escapeHtml(t('sup.col.room'))}">${escapeHtml(bag.roomNumber)}</td>
              <td data-label="${escapeHtml(t('sup.col.status'))}"><span class="badge ${st.cls}">${st.label}</span></td>
              <td class="table-actions-cell">
                <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
                  <button type="button" class="btn btn-secondary btn-compact" data-cycle-bag="${escapeHtml(bag.id)}">${isEn ? 'Next Status 🔁' : 'تغيير الحالة 🔁'}</button>
                  <button type="button" class="btn btn-secondary btn-compact" style="color:var(--danger);" data-del-bag="${escapeHtml(bag.id)}" aria-label="${isEn ? `Delete ${escapeHtml(bag.tagCode)}` : `حذف ${escapeHtml(bag.tagCode)}`}">🗑️</button>
                </div>
              </td>
            </tr>
          `;
          })
          .join('');

  tbody.querySelectorAll<HTMLElement>('[data-cycle-bag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const bag = active.luggage.find((x) => x.id === btn.dataset.cycleBag);
      if (!bag) return;
      const order = [LuggageStatus.ON_BUS, LuggageStatus.HOTEL_LOBBY, LuggageStatus.DELIVERED_TO_ROOM, LuggageStatus.LOST];
      bag.status = order[(order.indexOf(bag.status) + 1) % order.length];
      saveState();
      renderLuggageSection();
      showToast(isEn ? `Updated status for ${bag.tagCode}` : `تم تحديث حالة ${bag.tagCode}`);
    });
  });

  tbody.querySelectorAll<HTMLElement>('[data-del-bag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delBag!;
      handleTwoStepDelete(btn, isEn ? 'Confirm?' : 'تأكيد؟', () => {
        const idx = active.luggage.findIndex((x) => x.id === id);
        if (idx === -1) return;
        const removed = active.luggage[idx];
        active.luggage.splice(idx, 1);
        saveState();
        renderLuggageSection();
        showUndoToast(
          isEn ? `Removed bag ${removed.tagCode}` : `تم حذف الحقيبة ${removed.tagCode}`,
          isEn ? '↩️ Undo' : '↩️ تراجع',
          () => {
            active.luggage.splice(Math.min(idx, active.luggage.length), 0, removed);
            saveState();
            renderLuggageSection();
          }
        );
      });
    });
  });
}

function openLuggagePrintModal(): void {
  const active = getActiveGroup();
  const grid = document.getElementById('luggage-tags-print-grid');
  if (!grid) return;
  if (active.luggage.length === 0) {
    showToast('أضف حقيبة أولاً لطباعة البطاقات');
    return;
  }
  grid.innerHTML = active.luggage
    .map((bag) => {
      const qrText = `${bag.tagCode} | ROOM: ${bag.roomNumber} | ${bag.pilgrimName} | ${active.settings.hotelNameEn} | TEL: ${active.settings.supervisorPhone}`;
      return `
      <div style="border:2px dashed #064e3b;border-radius:10px;padding:0.85rem;background:#f0fdf4;color:#022c22;text-align:center;">
        <div style="font-weight:800;font-size:0.9rem;">${escapeHtml(active.settings.tripTitle)} 🕋</div>
        <div style="font-size:1.15rem;font-weight:900;color:#b45309;margin:0.25rem 0;">غرفة [ ${escapeHtml(bag.roomNumber)} ]</div>
        <div style="font-size:0.86rem;font-weight:700;">${escapeHtml(bag.pilgrimName)}</div>
        <div style="font-size:0.75rem;">${escapeHtml(active.settings.hotelNameAr)}</div>
        <div style="margin:0.5rem auto;background:white;display:inline-block;padding:0.35rem;border-radius:8px;">
          ${renderQrSvg(qrText, `QR ${bag.tagCode}`)}
        </div>
        <div style="font-family:monospace;font-size:0.82rem;font-weight:800;">${escapeHtml(bag.tagCode)}</div>
      </div>
    `;
    })
    .join('');
  openDialogById('luggage-modal');
}

function renderMedicalSection(): void {
  const active = getActiveGroup();
  const isEn = getCurrentLanguage() === 'en';
  const list = document.getElementById('medical-cards-list');
  const badge = document.getElementById('medical-count-badge');
  if (badge) badge.textContent = isEn ? `${active.medical.length} Cases` : `${active.medical.length} حالات مسجلة`;
  if (!list) return;

  list.innerHTML =
    active.medical.length === 0
      ? `<div class="info-box-neutral">${isEn ? 'No medical care profiles recorded for this group.' : 'لا توجد حالات طبية مسجلة لهذا الفوج.'}</div>`
      : active.medical
          .map(
            (m) => `
          <div class="info-box-neutral">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.35rem;">
              <strong>${escapeHtml(m.pilgrimName)} (${isEn ? `Room ${escapeHtml(m.roomNumber)}` : `غرفة ${escapeHtml(m.roomNumber)}`})</strong>
              <div style="display:flex;gap:0.3rem;flex-wrap:wrap;">
                ${m.requiresWheelchair ? `<span class="badge badge-danger">${isEn ? 'Wheelchair' : 'كرسي متحرك'}</span>` : ''}
                ${m.requiresElectricCart ? `<span class="badge badge-warning">${isEn ? 'Nusuk Electric Cart' : 'عربة غولف نُسك'}</span>` : ''}
                ${m.requiresInsulinRefrigeration ? `<span class="badge badge-danger">${isEn ? 'Insulin Cooling' : 'ثلاجة إنسولين'}</span>` : ''}
              </div>
            </div>
            <p style="font-size:0.86rem;color:var(--text-muted);margin-bottom:0.35rem;">${escapeHtml(m.notes)}</p>
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;font-size:0.85rem;">
              <span>${isEn ? 'Emergency Companion:' : 'مرافق الطوارئ:'} <strong>${escapeHtml(m.emergencyContactName)}</strong> (<span dir="ltr">${escapeHtml(m.emergencyContactPhone)}</span>)</span>
              <button type="button" class="btn btn-secondary btn-compact" style="color:var(--danger);" data-del-med="${escapeHtml(m.id)}">${isEn ? 'Delete' : 'حذف'}</button>
            </div>
          </div>
        `
          )
          .join('');

  list.querySelectorAll<HTMLElement>('[data-del-med]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delMed!;
      handleTwoStepDelete(btn, isEn ? 'Confirm Delete?' : 'تأكيد الحذف؟', () => {
        const idx = active.medical.findIndex((x) => x.id === id);
        if (idx === -1) return;
        const removed = active.medical[idx];
        active.medical.splice(idx, 1);
        saveState();
        renderMedicalSection();
        showUndoToast(
          isEn ? `Removed medical profile for ${removed.pilgrimName}` : `تم حذف الملف الطبي لـ ${removed.pilgrimName}`,
          isEn ? '↩️ Undo' : '↩️ تراجع',
          () => {
            active.medical.splice(Math.min(idx, active.medical.length), 0, removed);
            saveState();
            renderMedicalSection();
          }
        );
      });
    });
  });
}

// =========================================================================
// TAB SWITCHING & CSV EXPORT
// =========================================================================
function switchTab(rawTab: string): void {
  let tab = rawTab;
  let commsSub: 'BROADCASTS' | 'WOMEN' | null = null;
  if (rawTab === 'women-guide') {
    tab = 'whatsapp';
    commsSub = 'WOMEN';
  } else if (rawTab === 'haram-atlas') {
    window.open('/?tab=haram-atlas', '_blank', 'noopener');
    return;
  } else if (rawTab === 'print') {
    tab = 'logistics-health';
  }

  const tabs = ['manifest', 'people', 'gameya', 'whatsapp', 'sos', 'logistics-health'];
  if (!tabs.includes(tab)) return;
  if (commsSub) {
    setCommsSubTab(commsSub);
  }
  document.querySelectorAll<HTMLElement>('.tab-view').forEach((v) => {
    const active = v.id === `tab-${tab}`;
    v.classList.toggle('active', active);
    v.hidden = !active;
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

  const morePop = document.getElementById('sup-more-popover') as HTMLElement & { hidePopover?: () => void };
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

function exportManifestCSV(): void {
  const active = getActiveGroup();
  const rows = [
    ['الفوج', 'اسم المعتمر', 'النوع', 'رقم الجواز', 'الهاتف', 'الغرفة', 'حالة الباص', 'نُسك'],
    ...active.pilgrims.map((p) => [
      active.settings.tripTitle,
      p.fullName,
      p.gender === Gender.MALE ? 'رجل' : 'امرأة',
      p.passportNumber,
      p.phone,
      p.roomNumber || 'غير مسكن',
      p.boarded ? 'صعد الباص' : 'لم يصعد بعد',
      p.nusukReady ? 'جاهز' : 'معلق',
    ]),
  ];

  let csv = '\uFEFF';
  rows.forEach((r) => {
    csv += r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\r\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `umrah_manifest_${active.settings.tripCode.replace('#', '')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📥 تم تنزيل كشف الفوج (CSV / Excel)');
}

// =========================================================================
// BOOTSTRAP
// =========================================================================
function updateGameyaPlanPreview(validateOnBlurOrSubmit: boolean = false): boolean {
  const plan = ((document.getElementById('new-gam-plan') as HTMLSelectElement | null)?.value ||
    GameyaType.DEPOSIT_PLUS_MONTHLY) as GameyaType;
  const target = Number((document.getElementById('new-gam-target') as HTMLInputElement | null)?.value) || 0;
  const downInput = document.getElementById('new-gam-down') as HTMLInputElement | null;
  const rawDown = downInput && !downInput.disabled ? Number(downInput.value) || 0 : 0;
  const rawCount = Number((document.getElementById('new-gam-count') as HTMLInputElement | null)?.value) || 6;

  const preview = previewInstallmentPlan({
    planType: plan,
    totalTarget: target,
    downPayment: rawDown,
    installmentCount: rawCount,
  });

  if (downInput) {
    const showInvalid = !preview.valid && (validateOnBlurOrSubmit || downInput.dataset.interacted === '1');
    downInput.setAttribute('aria-invalid', showInvalid ? 'true' : 'false');
    if (showInvalid) {
      downInput.setAttribute('aria-describedby', 'new-gam-down-error');
    } else {
      downInput.removeAttribute('aria-describedby');
    }
  }

  const box = document.getElementById('gameya-plan-preview');
  if (box) {
    box.className = preview.valid ? 'info-box-neutral' : 'info-box-warn';
    box.innerHTML = preview.valid
      ? `💡 <strong>معاينة الخطة:</strong> ${escapeHtml(preview.summaryAr)}`
      : `⚠️ ${escapeHtml(preview.errorAr || preview.summaryAr)}`;
  }
  return preview.valid;
}

function updateGameyaFormFields(): void {
  const plan = ((document.getElementById('new-gam-plan') as HTMLSelectElement | null)?.value ||
    GameyaType.DEPOSIT_PLUS_MONTHLY) as GameyaType;

  const setFieldState = (wrapId: string, inputId: string, visible: boolean) => {
    const wrap = document.getElementById(wrapId);
    const input = document.getElementById(inputId) as HTMLInputElement | null;
    if (wrap) wrap.hidden = !visible;
    if (input) input.disabled = !visible;
  };

  const showDown = plan === GameyaType.DEPOSIT_PLUS_MONTHLY || plan === GameyaType.DEPOSIT_PLUS_FINAL;
  const showCount =
    plan === GameyaType.DEPOSIT_PLUS_MONTHLY ||
    plan === GameyaType.DIRECT_INSTALLMENT ||
    plan === GameyaType.ROTATING_ROSCA ||
    plan === GameyaType.BIWEEKLY_INSTALLMENT;
  const showTurn = plan === GameyaType.ROTATING_ROSCA;
  const showMarkPaid = showDown || plan === GameyaType.FULL_CASH;

  setFieldState('gam-down-wrap', 'new-gam-down', showDown);
  setFieldState('gam-count-wrap', 'new-gam-count', showCount);
  setFieldState('gam-turn-wrap', 'new-gam-turn', showTurn);
  setFieldState('gam-mark-paid-wrap', 'new-gam-mark-paid', showMarkPaid);

  const startEl = document.getElementById('new-gam-start') as HTMLInputElement | null;
  if (startEl && !startEl.value) {
    startEl.value = new Date().toISOString().slice(0, 10);
  }
  updateGameyaPlanPreview(false);
}

async function pullCloudSosAlerts(notifyUser: boolean): Promise<void> {
  const active = getActiveGroup();
  const res = await fetchCloudSosEvents(active.settings.tripCode);
  if (res.mode === 'unauthorized') {
    if (notifyUser) showToast('🔐 يرجى إدخال رمز مصادقة المزامنة (SYNC_SECRET) في إعدادات الفوج', true);
    return;
  }
  if (res.mode === 'local-only') {
    if (notifyUser) showToast('💾 وضع الحفظ المحلي نشط — اربط D1 لاستقبال بلاغات الطوارئ الحية');
    return;
  }

  const dispatcher = new EmergencySOSDispatcher(
    new Hotel({
      id: active.settings.hotelKey,
      nameAr: active.settings.hotelNameAr,
      nameEn: active.settings.hotelNameEn,
      city: 'MAKKAH',
      addressAr: active.settings.hotelAddressAr,
      addressEn: active.settings.hotelAddressAr,
      phone: active.settings.hotelPhone,
      latitude: active.settings.hotelLat,
      longitude: active.settings.hotelLng,
    })
  );

  let added = 0;
  for (const ev of res.events) {
    if (active.sosAlerts.some((x) => x.id === ev.id)) continue;
    const calc = dispatcher.createSOSAlert({
      pilgrimId: ev.id,
      pilgrimName: ev.pilgrim_name,
      latitude: ev.latitude,
      longitude: ev.longitude,
      batteryLevel: 100,
      notes: ev.notes || 'بلاغ معتمر من السحابة',
    });
    active.sosAlerts.unshift({
      id: ev.id,
      pilgrimName: ev.pilgrim_name,
      phone: '',
      latitude: ev.latitude,
      longitude: ev.longitude,
      distanceMeters: calc.distanceToHotelMeters,
      notes: ev.notes || 'بلاغ طوارئ D1',
      resolved: ev.resolved === 1,
      createdAt: ev.created_at,
    });
    added += 1;
  }
  if (added > 0) {
    saveState();
    renderAll();
    showToast(`🚨 تم استلام (${added}) بلاغ طوارئ جديد من Cloudflare D1`, true);
  } else if (notifyUser) {
    showToast('🟢 لا توجد بلاغات طوارئ سحابية جديدة');
  }
}

async function pullActiveGroupFromCloud(): Promise<void> {
  const active = getActiveGroup();
  const res = await pullGroupWorkspaceFromCloud(active.id);
  if (res.mode === 'unauthorized') {
    showToast('🔐 رُفض السحب (401) — أدخل رمز SYNC_SECRET في إعدادات الفوج', true);
    return;
  }
  if (res.mode === 'local-only') {
    showToast('💾 وضع الحفظ المحلي نشط — اربط قاعدة D1 لسحب بيانات السحابة');
    return;
  }
  if (!res.found || !res.workspace || typeof res.workspace !== 'object') {
    showToast('☁️ لا توجد نسخة سحابية محفوظة لهذا الفوج حتى الآن (ارفع بالضغط على مزامنة أولاً)');
    return;
  }

  const candidate = res.workspace as Partial<GroupWorkspace>;
  const existingModal = document.getElementById('confirm-cloud-pull-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('dialog');
  modal.id = 'confirm-cloud-pull-modal';
  modal.setAttribute('aria-labelledby', 'cloud-pull-title');
  modal.setAttribute('closedby', 'any');
  modal.innerHTML = `
    <div class="dialog-header">
      <h2 id="cloud-pull-title" style="font-size:1.1rem;color:var(--primary-ink);">☁️ استيراد نسخة الفوج من السحابة</h2>
      <button type="button" class="dialog-close-btn" data-pull-cancel aria-label="إغلاق">&times;</button>
    </div>
    <p style="font-size:0.92rem;line-height:1.7;margin-bottom:1rem;">
      تم العثور على نسخة محفوظة في D1 للفوج <strong>${escapeHtml(candidate.settings?.tripTitle || active.settings.tripTitle)}</strong>
      (آخر تحديث: <span dir="ltr">${escapeHtml(res.updatedAt || '---')}</span>).<br>
      هل تريد استبدال بيانات هذا الفوج محلياً بالنسخة السحابية؟
    </p>
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
      <button type="button" id="btn-pull-confirm-yes" class="btn btn-primary" style="flex:1;">✅ نعم، تحديث من السحابة</button>
      <button type="button" class="btn btn-secondary" data-pull-cancel style="flex:1;" autofocus>إلغاء</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.showModal();

  const cleanup = () => {
    if (modal.isConnected) modal.remove();
  };

  modal.querySelectorAll('[data-pull-cancel]').forEach((el) => el.addEventListener('click', cleanup));
  modal.addEventListener('cancel', cleanup);
  modal.querySelector('#btn-pull-confirm-yes')?.addEventListener('click', () => {
    const mergedGroup: GroupWorkspace = {
      ...active,
      ...candidate,
      id: active.id,
      settings: { ...active.settings, ...(candidate.settings || {}) },
      pilgrims: Array.isArray(candidate.pilgrims) ? candidate.pilgrims : active.pilgrims,
      rooms: Array.isArray(candidate.rooms) ? candidate.rooms : active.rooms,
      gameya: Array.isArray(candidate.gameya) ? candidate.gameya : active.gameya,
      luggage: Array.isArray(candidate.luggage) ? candidate.luggage : active.luggage,
      medical: Array.isArray(candidate.medical) ? candidate.medical : active.medical,
      sosAlerts: Array.isArray(candidate.sosAlerts) ? candidate.sosAlerts : active.sosAlerts,
    };
    rootState.groups = rootState.groups.map((g) => (g.id === active.id ? mergedGroup : g));
    saveState();
    renderAll();
    cleanup();
    showToast(`✅ تم تحديث بيانات "${mergedGroup.settings.tripTitle}" من السحابة`);
  });
}

async function syncActiveGroupToCloud(notifyUser: boolean): Promise<void> {
  const active = getActiveGroup();
  const res = await pushGroupWorkspaceToCloud(active.id, active);
  if (res.mode === 'd1') {
    await pullCloudSosAlerts(false);
  }
  if (!notifyUser) return;
  if (res.mode === 'd1') {
    showToast('☁️ تمت المزامنة السحابية مع قاعدة Cloudflare D1 بنجاح');
  } else if (res.mode === 'unauthorized') {
    showToast('🔐 رُفضت المزامنة (401) — أدخل رمز SYNC_SECRET في إعدادات الفوج', true);
  } else if (res.mode === 'offline-queued') {
    showToast(`📴 التغييرات محفوظة محلياً ومجدولة للمزامنة (${res.pendingCount})`);
  } else {
    showToast('💾 الحفظ المحلي (IndexedDB) نشط — اربط قاعدة D1 للتزامن السحابي الحي');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  initThemeSync();
  initLanguage();
  updateThemeButtonLabel();
  setupDialogs();
  initAccessibleFormValidation();
  initImageLightbox();
  initStickyHeaders();
  registerServiceWorkerAndNetworkStatus();

  loadState();
  renderAll();
  updateGameyaFormFields();
  enforcePrivacyLockIfConfigured();
  wirePrivacyLockHandlers();
  void hydrateFromIndexedDb();

  window.addEventListener('online', () => {
    void flushSyncOutbox();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-tab-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tabTarget) switchTab(btn.dataset.tabTarget);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', toggleColorScheme);
  });

  document.querySelectorAll<HTMLElement>('[data-lang-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = toggleLanguage();
      updateThemeButtonLabel();
      updateNetworkStatusBadge();
      renderAll();
      showToast(next === 'en' ? '🌐 Switched interface to English' : '🌐 تم التبديل للغة العربية');
    });
  });

  document.getElementById('btn-cloud-sync-now')?.addEventListener('click', () => {
    void syncActiveGroupToCloud(true);
  });
  document.getElementById('btn-cloud-sync-popover')?.addEventListener('click', () => {
    void syncActiveGroupToCloud(true);
  });
  document.getElementById('btn-pull-cloud-group')?.addEventListener('click', () => {
    void pullActiveGroupFromCloud();
  });
  document.getElementById('btn-pull-cloud-popover')?.addEventListener('click', () => {
    void pullActiveGroupFromCloud();
  });
  document.getElementById('btn-pull-cloud-sos')?.addEventListener('click', () => {
    void pullCloudSosAlerts(true);
  });

  document.getElementById('active-group-switcher')?.addEventListener('change', (e) => {
    rootState.activeGroupId = (e.target as HTMLSelectElement).value;
    saveState();
    renderAll();
    showToast(`✅ الفوج النشط الآن: ${getActiveGroup().settings.tripTitle}`);
  });

  // New Group Modal
  document.getElementById('btn-new-group')?.addEventListener('click', () => openDialogById('new-group-modal'));
  document.getElementById('new-group-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = (document.getElementById('ng-title') as HTMLInputElement).value.trim();
    const code = (document.getElementById('ng-code') as HTMLInputElement).value.trim() || `#GRP-${rootState.groups.length + 1}`;
    const startDate = (document.getElementById('ng-start') as HTMLInputElement).value || new Date().toISOString().slice(0, 10);
    const endDate = (document.getElementById('ng-end') as HTMLInputElement).value || startDate;
    const hotelKey = (document.getElementById('ng-hotel') as HTMLSelectElement).value;
    const supName = (document.getElementById('ng-sup-name') as HTMLInputElement).value.trim() || 'مشرف الفوج';
    const supPhone = (document.getElementById('ng-sup-phone') as HTMLInputElement).value.trim() || '+201040414659';
    if (!title) return;
    const preset = HOTEL_PRESETS[hotelKey] || HOTEL_PRESETS.kiswah;
    const newGrp: GroupWorkspace = {
      id: `grp-${Date.now()}`,
      settings: {
        tripTitle: title,
        tripCode: code,
        status: TripStatus.REGISTRATION_OPEN,
        startDate,
        endDate,
        busNumber: `باص رقم (${rootState.groups.length + 1})`,
        hotelKey,
        hotelNameAr: preset.nameAr,
        hotelNameEn: preset.nameEn,
        hotelAddressAr: preset.addressAr,
        hotelPhone: preset.phone,
        hotelLat: preset.lat,
        hotelLng: preset.lng,
        supervisorName: supName,
        supervisorPhone: supPhone,
        gatheringTime: 'قبل الإقلاع بـ 4 ساعات',
        meetingPoint: 'بوابة الملك عبد العزيز (بوابة 1)',
      },
      pilgrims: [],
      rooms: [],
      gameya: [],
      luggage: [],
      medical: [],
      sosAlerts: [],
    };
    rootState.groups.push(newGrp);
    rootState.activeGroupId = newGrp.id;
    saveState();
    renderAll();
    closeDialogById('new-group-modal');
    (e.target as HTMLFormElement).reset();
    showToast(`✅ تم إنشاء فوج "${title}" وتحديده كفوج نشط`);
  });

  // Settings Modal (for active group)
  document.querySelectorAll<HTMLElement>('[data-open-settings]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const s = getActiveGroup().settings;
      (document.getElementById('set-trip-title') as HTMLInputElement).value = s.tripTitle;
      (document.getElementById('set-trip-code') as HTMLInputElement).value = s.tripCode;
      (document.getElementById('set-trip-stage') as HTMLSelectElement).value = s.status;
      (document.getElementById('set-bus-num') as HTMLInputElement).value = s.busNumber;
      (document.getElementById('set-hotel-key') as HTMLSelectElement).value = s.hotelKey;
      (document.getElementById('set-sup-name') as HTMLInputElement).value = s.supervisorName;
      (document.getElementById('set-sup-phone') as HTMLInputElement).value = s.supervisorPhone;
      (document.getElementById('set-meeting') as HTMLInputElement).value = s.meetingPoint;
      const syncInput = document.getElementById('set-sync-token') as HTMLInputElement | null;
      if (syncInput) syncInput.value = getSyncAuthToken();
      openDialogById('settings-modal');
    });
  });

  document.getElementById('settings-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const syncInput = document.getElementById('set-sync-token') as HTMLInputElement | null;
    if (syncInput) setSyncAuthToken(syncInput.value);
    const active = getActiveGroup();
    const key = (document.getElementById('set-hotel-key') as HTMLSelectElement).value;
    const preset = HOTEL_PRESETS[key] || HOTEL_PRESETS.kiswah;
    active.settings = {
      ...active.settings,
      tripTitle: (document.getElementById('set-trip-title') as HTMLInputElement).value.trim() || active.settings.tripTitle,
      tripCode: (document.getElementById('set-trip-code') as HTMLInputElement).value.trim() || active.settings.tripCode,
      status: (document.getElementById('set-trip-stage') as HTMLSelectElement).value as TripStatus,
      busNumber: (document.getElementById('set-bus-num') as HTMLInputElement).value.trim() || active.settings.busNumber,
      hotelKey: key,
      hotelNameAr: preset.nameAr,
      hotelNameEn: preset.nameEn,
      hotelAddressAr: preset.addressAr,
      hotelPhone: preset.phone,
      hotelLat: preset.lat,
      hotelLng: preset.lng,
      supervisorName: (document.getElementById('set-sup-name') as HTMLInputElement).value.trim() || active.settings.supervisorName,
      supervisorPhone: (document.getElementById('set-sup-phone') as HTMLInputElement).value.trim() || active.settings.supervisorPhone,
      meetingPoint: (document.getElementById('set-meeting') as HTMLInputElement).value.trim() || active.settings.meetingPoint,
    };
    saveState();
    renderAll();
    closeDialogById('settings-modal');
    showToast('✅ تم تحديث إعدادات الفوج النشط في كافة التبويبات');
  });

  // Add Pilgrim Form (also upserts into persistent People Directory!)
  // Modal Triggers for Clean Form Separation
  const bindModalOpen = (btnId: string, modalId: string, focusId?: string, beforeOpen?: () => void) => {
    document.getElementById(btnId)?.addEventListener('click', () => {
      beforeOpen?.();
      openDialogById(modalId);
      if (focusId) {
        window.requestAnimationFrame(() => (document.getElementById(focusId) as HTMLElement | null)?.focus());
      }
    });
  };
  document.getElementById('btn-open-add-pilgrim')?.addEventListener('click', () => openPilgrimModal());
  bindModalOpen('btn-open-add-room', 'add-room-modal', 'new-room-num');
  bindModalOpen('btn-open-assign-room', 'assign-room-modal', 'assign-pilgrim-select', renderRoomsBoard);
  document.getElementById('btn-open-add-person')?.addEventListener('click', () => openPersonModal());
  bindModalOpen('btn-open-add-gameya', 'add-gameya-modal', 'new-gam-name', updateGameyaFormFields);
  bindModalOpen('btn-open-add-sos', 'add-sos-modal', 'sos-pilgrim-name');
  bindModalOpen('btn-open-add-bag', 'add-bag-modal', 'new-bag-name');
  bindModalOpen('btn-open-add-med', 'add-med-modal', 'new-med-name');

  document.getElementById('add-pilgrim-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const active = getActiveGroup();
    const isEn = getCurrentLanguage() === 'en';
    const editId = (document.getElementById('pilgrim-edit-id') as HTMLInputElement | null)?.value.trim() || '';
    const fullName = (document.getElementById('new-pilgrim-name') as HTMLInputElement).value.trim();
    const passportNumber = (document.getElementById('new-pilgrim-passport') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('new-pilgrim-phone') as HTMLInputElement).value.trim();
    const gender = (document.getElementById('new-pilgrim-gender') as HTMLSelectElement).value as Gender;
    const nusukReady = (document.getElementById('new-pilgrim-nusuk') as HTMLInputElement | null)?.checked ?? true;
    if (!fullName || !passportNumber) return;

    if (editId) {
      const target = active.pilgrims.find((x) => x.id === editId);
      if (target) {
        target.fullName = fullName;
        target.passportNumber = passportNumber;
        target.phone = phone;
        target.gender = gender;
        target.nusukReady = nusukReady;
        if (target.personId) {
          const linked = rootState.people.find((x) => x.id === target.personId);
          if (linked) {
            linked.fullName = fullName;
            linked.passportNumber = passportNumber;
            linked.phone = phone;
            linked.gender = gender;
            linked.updatedAt = new Date().toISOString();
          }
        }
        saveState();
        renderAll();
        (e.target as HTMLFormElement).reset();
        closeDialogById('add-pilgrim-modal');
        showToast(isEn ? `✅ Updated ${fullName}` : `✅ تم تحديث بيانات المعتمر ${fullName}`);
        return;
      }
    }

    const existingPerson = rootState.people.find((x) => x.passportNumber === passportNumber);
    let personId = existingPerson?.id;
    if (!existingPerson) {
      personId = `per-${Date.now()}`;
      rootState.people.push({
        id: personId,
        fullName,
        gender,
        passportNumber,
        phone,
        emergencyContactName: active.settings.supervisorName,
        emergencyContactPhone: active.settings.supervisorPhone,
        conditions: [ChronicCondition.NONE],
        requiresWheelchair: false,
        requiresInsulinRefrigeration: false,
        pastTrips: [active.settings.tripTitle],
        updatedAt: new Date().toISOString(),
      });
    } else if (!existingPerson.pastTrips.includes(active.settings.tripTitle)) {
      existingPerson.pastTrips.push(active.settings.tripTitle);
    }

    active.pilgrims.push({
      id: `p-${Date.now()}`,
      personId,
      fullName,
      gender,
      passportNumber,
      phone,
      roomNumber: '',
      boarded: false,
      nusukReady,
    });
    saveState();
    renderAll();
    (e.target as HTMLFormElement).reset();
    closeDialogById('add-pilgrim-modal');
    showToast(
      isEn
        ? `✅ Added ${fullName} to active group & CRM`
        : `✅ تمت إضافة ${fullName} للفوج وحفظه في سجل الأشخاص الدائم`
    );
  });

  document.getElementById('manifest-search')?.addEventListener('input', (e) => {
    manifestFilter = (e.target as HTMLInputElement).value;
    renderManifestTable();
  });
  document.getElementById('btn-board-all')?.addEventListener('click', () => {
    const active = getActiveGroup();
    if (active.pilgrims.length === 0) return;
    active.pilgrims.forEach((p) => {
      p.boarded = true;
    });
    saveState();
    renderAll();
    showToast(`✅ تم تأكيد صعود جميع معتمرى الفوج (${active.pilgrims.length}) للباص`);
  });
  document.getElementById('btn-export-csv')?.addEventListener('click', exportManifestCSV);

  // Add or Edit Person in Persistent CRM
  document.getElementById('add-person-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const active = getActiveGroup();
    const isEn = getCurrentLanguage() === 'en';
    const editId = (document.getElementById('crm-edit-id') as HTMLInputElement | null)?.value.trim() || '';
    const fullName = (document.getElementById('crm-name') as HTMLInputElement).value.trim();
    const passportNumber = (document.getElementById('crm-passport') as HTMLInputElement).value.trim();
    const passportExpiryDate = (document.getElementById('crm-expiry') as HTMLInputElement).value;
    const phone = (document.getElementById('crm-phone') as HTMLInputElement).value.trim();
    const gender = (document.getElementById('crm-gender') as HTMLSelectElement).value as Gender;
    const ecPhone = (document.getElementById('crm-ec-phone') as HTMLInputElement).value.trim();
    const wheelchair = (document.getElementById('crm-wheelchair') as HTMLInputElement).checked;
    const insulin = (document.getElementById('crm-insulin') as HTMLInputElement).checked;
    const notes = (document.getElementById('crm-notes') as HTMLInputElement).value.trim();
    if (!fullName || !passportNumber) return;

    const dir = buildPeopleDirectoryFromState();
    const tripStart = new Date(active.settings.startDate || Date.now());
    const savedId = editId || `per-${Date.now()}`;
    const record: PersonRecord = {
      id: savedId,
      fullName,
      gender,
      passportNumber,
      passportExpiryDate: passportExpiryDate || undefined,
      phone,
      emergencyContactName: 'مرافق / طوارئ',
      emergencyContactPhone: ecPhone || phone,
      conditions: [ChronicCondition.NONE],
      requiresWheelchair: wheelchair,
      requiresInsulinRefrigeration: insulin,
      pastTrips: editId ? rootState.people.find((x) => x.id === editId)?.pastTrips || [] : [],
      notes: notes || undefined,
      updatedAt: new Date().toISOString(),
    };

    if (editId) {
      const idx = rootState.people.findIndex((x) => x.id === editId);
      if (idx !== -1) {
        rootState.people[idx] = record;
      } else {
        rootState.people.unshift(record);
      }
      active.pilgrims.forEach((p) => {
        if (p.personId === editId) {
          p.fullName = fullName;
          p.passportNumber = passportNumber;
          p.phone = phone;
          p.gender = gender;
        }
      });
    } else {
      rootState.people.unshift(record);
    }

    const expiryWarn = !dir.isPassportValidForTrip(record, tripStart, 6);
    saveState();
    renderAll();
    (e.target as HTMLFormElement).reset();
    closeDialogById('add-person-modal');
    showToast(
      expiryWarn
        ? isEn
          ? `⚠️ Saved ${fullName} (Note: passport validity < 6 months)`
          : `⚠️ تم حفظ "${fullName}" (تنبيه: صلاحية الجواز أقل من 6 أشهر!)`
        : isEn
          ? `✅ Saved CRM profile for "${fullName}"`
          : `✅ تم حفظ سجل "${fullName}" في قاعدة الأشخاص الدائمة`,
      expiryWarn
    );
  });

  document.getElementById('people-search')?.addEventListener('input', (e) => {
    peopleFilter = (e.target as HTMLInputElement).value;
    renderPeopleDirectory();
  });

  // Add Room + Assign Room
  document.getElementById('add-room-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const active = getActiveGroup();
    const num = (document.getElementById('new-room-num') as HTMLInputElement).value.trim();
    const type = (document.getElementById('new-room-type') as HTMLSelectElement).value as RoomType;
    const isFamily = (document.getElementById('new-room-family') as HTMLInputElement).checked;
    if (!num) return;
    const capMap: Record<RoomType, number> = {
      [RoomType.DOUBLE]: 2,
      [RoomType.TRIPLE]: 3,
      [RoomType.QUAD]: 4,
      [RoomType.SUITE]: 4,
    };
    active.rooms.push({
      id: `r-${Date.now()}`,
      roomNumber: num,
      type,
      capacity: capMap[type],
      isFamilyRoom: isFamily,
      occupantIds: [],
    });
    saveState();
    renderRoomsBoard();
    (e.target as HTMLFormElement).reset();
    closeDialogById('add-room-modal');
    showToast(`✅ تمت إضافة غرفة ${num}`);
  });
  document.getElementById('btn-assign-room')?.addEventListener('click', handleAssignRoom);

  // Gam'eya Enhanced Plan Form + Progressive Disclosure + Live Calculator + Filter + Payment Modal
  document.getElementById('new-gam-plan')?.addEventListener('change', updateGameyaFormFields);
  ['new-gam-target', 'new-gam-down', 'new-gam-count'].forEach((id) => {
    const input = document.getElementById(id) as HTMLInputElement | null;
    input?.addEventListener('input', () => updateGameyaPlanPreview(false));
    input?.addEventListener('blur', () => {
      input.dataset.interacted = '1';
      updateGameyaPlanPreview(true);
    });
  });

  document.getElementById('new-gam-name')?.addEventListener('change', (e) => {
    const picked = (e.target as HTMLInputElement).value.trim();
    const active = getActiveGroup();
    const match =
      active.pilgrims.find((p) => p.fullName === picked) || rootState.people.find((p) => p.fullName === picked);
    const phoneEl = document.getElementById('new-gam-phone') as HTMLInputElement | null;
    if (match?.phone && phoneEl && !phoneEl.value.trim()) {
      phoneEl.value = match.phone;
    }
  });

  document.querySelectorAll<HTMLButtonElement>('[data-gameya-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      gameyaFilter = (btn.dataset.gameyaFilter || 'ALL') as typeof gameyaFilter;
      document.querySelectorAll<HTMLButtonElement>('[data-gameya-filter]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      renderGameyaTable();
    });
  });

  document.getElementById('gameya-search')?.addEventListener('input', (e) => {
    gameyaSearch = (e.target as HTMLInputElement).value;
    renderGameyaTable();
  });

  document.getElementById('btn-export-gameya-csv')?.addEventListener('click', exportGameyaCSV);

  document.getElementById('pay-amount')?.addEventListener('input', (e) => {
    const active = getActiveGroup();
    const m = active.gameya.find((x) => x.id === activePaymentMemberId);
    if (m) updatePaymentProjectionPreview(m, Number((e.target as HTMLInputElement).value) || 0);
  });

  document.getElementById('add-gameya-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!updateGameyaPlanPreview(true)) {
      const downEl = document.getElementById('new-gam-down') as HTMLInputElement | null;
      downEl?.focus();
      showToast('⚠️ يرجى تصحيح قيمة المقدم مقارنة بإجمالي الباقة أولاً', true);
      return;
    }
    const active = getActiveGroup();
    const name = (document.getElementById('new-gam-name') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('new-gam-phone') as HTMLInputElement).value.trim();
    const planType = (document.getElementById('new-gam-plan') as HTMLSelectElement).value as GameyaType;
    const target = Number((document.getElementById('new-gam-target') as HTMLInputElement).value) || 40000;
    const rawDown = Number((document.getElementById('new-gam-down') as HTMLInputElement).value) || 0;
    const rawCount = Number((document.getElementById('new-gam-count') as HTMLInputElement).value) || 6;
    const turnMonth = Number((document.getElementById('new-gam-turn') as HTMLInputElement).value) || 1;
    const startDateIso =
      (document.getElementById('new-gam-start') as HTMLInputElement | null)?.value ||
      new Date().toISOString().slice(0, 10);
    const markPaidEl = document.getElementById('new-gam-mark-paid') as HTMLInputElement | null;
    if (!name) return;

    const downPayment =
      planType === GameyaType.FULL_CASH
        ? target
        : planType === GameyaType.DEPOSIT_PLUS_MONTHLY || planType === GameyaType.DEPOSIT_PLUS_FINAL
          ? rawDown
          : 0;
    const installmentCount =
      planType === GameyaType.FULL_CASH ? 1 : planType === GameyaType.DEPOSIT_PLUS_FINAL ? 2 : rawCount;

    const initialPaid = markPaidEl && !markPaidEl.disabled && markPaidEl.checked && downPayment > 0 ? downPayment : 0;
    const initialPayments: GameyaRecord['payments'] =
      initialPaid > 0
        ? [
            {
              id: `pay-${Date.now()}`,
              amount: initialPaid,
              method: PaymentMethod.CASH,
              ref: 'ENROLL-DEP',
              dateIso: startDateIso,
            },
          ]
        : [];

    active.gameya.push({
      id: `g-${Date.now()}`,
      name,
      phone,
      planType,
      turnMonth,
      totalTarget: target,
      downPayment,
      installmentCount,
      totalPaid: initialPaid,
      startDateIso,
      payments: initialPayments,
    });
    saveState();
    renderAll();
    (e.target as HTMLFormElement).reset();
    const downEl = document.getElementById('new-gam-down') as HTMLInputElement | null;
    if (downEl) {
      delete downEl.dataset.interacted;
      downEl.setAttribute('aria-invalid', 'false');
    }
    updateGameyaFormFields();
    closeDialogById('add-gameya-modal');
    showToast(
      initialPaid > 0
        ? `✅ تم تسجيل ${name} وتحصيل ${initialPaid.toLocaleString('ar-EG')} ج.م`
        : `✅ تم إضافة ${name} بخطة (${PLAN_LABELS[planType]})`
    );
  });

  document.getElementById('payment-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const active = getActiveGroup();
    const m = active.gameya.find((x) => x.id === activePaymentMemberId);
    if (!m) return;
    const amount = Number((document.getElementById('pay-amount') as HTMLInputElement).value) || 0;
    const method = (document.getElementById('pay-method') as HTMLSelectElement).value as PaymentMethod;
    const dateIso =
      (document.getElementById('pay-date') as HTMLInputElement | null)?.value ||
      new Date().toISOString().slice(0, 10);
    const ref = (document.getElementById('pay-ref') as HTMLInputElement).value.trim();
    if (amount <= 0) return;

    const { group } = buildScheduleSummaryForMember(m, active.settings.endDate);
    const prevSummary = group.getMemberSummary(m.id);
    const remainingDecimal = prevSummary.totalRemaining.toDecimal();
    const effectiveAmount = Math.min(amount, remainingDecimal);
    if (effectiveAmount <= 0) {
      showToast('✅ المشترك أتم السداد بالكامل مسبقاً');
      closeDialogById('payment-modal');
      return;
    }

    group.recordFlexiblePayment({
      memberId: m.id,
      amount: Money.fromDecimal(effectiveAmount, 'EGP'),
      method,
      supervisorId: active.settings.supervisorName,
      transactionRef: ref || undefined,
    });
    const nextSummary = group.getMemberSummary(m.id);
    m.totalPaid = nextSummary.totalPaid.toDecimal();
    m.payments.push({
      id: `pay-${Date.now()}`,
      amount: effectiveAmount,
      method,
      ref: ref || undefined,
      dateIso,
    });
    saveState();
    renderAll();
    closeDialogById('payment-modal');
    showToast(`✅ تم تسجيل دفعة ${effectiveAmount.toLocaleString('ar-EG')} ج.م (${PAYMENT_METHOD_LABELS[method]})`);
  });

  // Print Center & Direct Entity Print Triggers
  document.getElementById('btn-open-wristband')?.addEventListener('click', openWristbandPreview);
  document.getElementById('btn-open-agreement')?.addEventListener('click', openAgreementPreview);
  document.getElementById('btn-gameya-print-agreement')?.addEventListener('click', openAgreementPreview);
  document.getElementById('btn-open-luggage-print')?.addEventListener('click', openLuggagePrintModal);
  document.querySelectorAll<HTMLElement>('.btn-print-active').forEach((b) => {
    b.addEventListener('click', () => window.print());
  });
  document.getElementById('btn-copy-share-url')?.addEventListener('click', () => {
    const val = (document.getElementById('share-pilgrim-url') as HTMLInputElement).value;
    void copyToClipboard(val, '✅ تم نسخ رابط بطاقة المعتمر');
  });

  // SOS Alert Entry
  document.getElementById('add-sos-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const active = getActiveGroup();
    const name = (document.getElementById('sos-pilgrim-name') as HTMLInputElement).value.trim();
    const coordsRaw = (document.getElementById('sos-coords') as HTMLInputElement).value.trim();
    const notes = (document.getElementById('sos-notes') as HTMLInputElement).value.trim() || 'بلاغ تائه';
    const [latStr, lngStr] = coordsRaw.split(',').map((s) => s.trim());
    const lat = Number(latStr) || 21.4195;
    const lng = Number(lngStr) || 39.8236;

    const dispatcher = new EmergencySOSDispatcher(
      new Hotel({
        id: active.settings.hotelKey,
        nameAr: active.settings.hotelNameAr,
        nameEn: active.settings.hotelNameEn,
        city: 'MAKKAH',
        addressAr: active.settings.hotelAddressAr,
        addressEn: active.settings.hotelAddressAr,
        phone: active.settings.hotelPhone,
        latitude: active.settings.hotelLat,
        longitude: active.settings.hotelLng,
      })
    );
    const alert = dispatcher.createSOSAlert({
      pilgrimId: `sos-${Date.now()}`,
      pilgrimName: name || 'معتمر بالفوج',
      latitude: lat,
      longitude: lng,
      batteryLevel: 100,
      notes,
    });

    active.sosAlerts.unshift({
      id: alert.alertId,
      pilgrimName: alert.pilgrimName,
      phone: '',
      latitude: lat,
      longitude: lng,
      distanceMeters: alert.distanceToHotelMeters,
      notes,
      resolved: false,
      createdAt: new Date().toLocaleTimeString('ar-SA', { timeZone: 'Asia/Riyadh' }),
    });
    saveState();
    renderAll();
    (e.target as HTMLFormElement).reset();
    closeDialogById('add-sos-modal');
    showToast(`🚨 تم تسجيل بلاغ ${alert.pilgrimName} وحساب المسافة للفندق`, true);
  });

  // Women WhatsApp Copy & Send
  document.querySelectorAll<HTMLElement>('[data-copy-box]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const box = document.getElementById(btn.dataset.copyBox!);
      if (box) void copyToClipboard(box.textContent || '', '✅ تم نسخ الرسالة');
    });
  });

  // Luggage Add
  document.getElementById('add-bag-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const active = getActiveGroup();
    const name = (document.getElementById('new-bag-name') as HTMLInputElement).value.trim();
    const room = (document.getElementById('new-bag-room') as HTMLInputElement).value.trim();
    const type = (document.getElementById('new-bag-type') as HTMLSelectElement).value as BagType;
    if (!name || !room) return;
    const count = active.luggage.filter((b) => b.roomNumber === room).length + 1;
    active.luggage.push({
      id: `l-${Date.now()}`,
      tagCode: `BAG-${room}-${String(count).padStart(2, '0')}`,
      pilgrimName: name,
      roomNumber: room,
      bagType: type,
      status: LuggageStatus.ON_BUS,
    });
    saveState();
    renderLuggageSection();
    (e.target as HTMLFormElement).reset();
    closeDialogById('add-bag-modal');
    showToast('✅ تمت إضافة الحقيبة وتوليد الكود');
  });

  // Medical Add
  document.getElementById('add-med-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const active = getActiveGroup();
    const name = (document.getElementById('new-med-name') as HTMLInputElement).value.trim();
    const room = (document.getElementById('new-med-room') as HTMLInputElement).value.trim();
    const ecName = (document.getElementById('new-med-ec-name') as HTMLInputElement).value.trim();
    const ecPhone = (document.getElementById('new-med-ec-phone') as HTMLInputElement).value.trim();
    const notes = (document.getElementById('new-med-notes') as HTMLInputElement).value.trim();
    const wheelchair = (document.getElementById('new-med-wheelchair') as HTMLInputElement).checked;
    const cart = (document.getElementById('new-med-cart') as HTMLInputElement).checked;
    const insulin = (document.getElementById('new-med-insulin') as HTMLInputElement).checked;
    if (!name) return;

    active.medical.push({
      id: `m-${Date.now()}`,
      pilgrimName: name,
      roomNumber: room || '---',
      conditions: [ChronicCondition.NONE],
      requiresWheelchair: wheelchair,
      requiresElectricCart: cart,
      requiresInsulinRefrigeration: insulin,
      emergencyContactName: ecName || active.settings.supervisorName,
      emergencyContactPhone: ecPhone || active.settings.supervisorPhone,
      notes: notes || 'متابعة رعاية خاصة',
    });
    saveState();
    renderMedicalSection();
    (e.target as HTMLFormElement).reset();
    closeDialogById('add-med-modal');
    showToast(`✅ تمت إضافة الملف الصحي لـ ${name}`);
  });

  document.querySelectorAll<HTMLButtonElement>('[data-comms-subtab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sub = (btn.dataset.commsSubtab === 'WOMEN' ? 'WOMEN' : 'BROADCASTS') as 'BROADCASTS' | 'WOMEN';
      setCommsSubTab(sub);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-close-dialog]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.closeDialog;
      if (id) closeDialogById(id);
    });
  });

  let resetConfirmDialog: HTMLDialogElement | null = null;
  const openResetConfirmDialog = () => {
    if (!resetConfirmDialog) {
      resetConfirmDialog = document.createElement('dialog');
      resetConfirmDialog.id = 'confirm-reset-modal';
      resetConfirmDialog.setAttribute('closedby', 'any');
      resetConfirmDialog.setAttribute('aria-labelledby', 'confirm-reset-title');
      resetConfirmDialog.innerHTML = `
        <div class="dialog-header">
          <h2 id="confirm-reset-title" style="font-size:1.1rem;color:var(--danger);">⚠️ تأكيد استعادة البيانات الافتراضية</h2>
          <button type="button" class="dialog-close-btn" data-cancel-reset aria-label="إغلاق">&times;</button>
        </div>
        <p style="font-size:0.92rem;line-height:1.7;margin-bottom:1rem;">
          سيؤدي هذا الإجراء إلى استبدال جميع بيانات الأفواج والمعتمرين والأقساط الحالية بالبيانات التجريبية الافتراضية. يُنصح بتنزيل نسخة احتياطية (JSON) أولاً.
        </p>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
          <button type="button" id="btn-confirm-reset-yes" class="btn btn-danger" style="flex:1;">نعم، استعادة الافتراضي</button>
          <button type="button" class="btn btn-secondary" data-cancel-reset style="flex:1;">إلغاء</button>
        </div>
      `;
      document.body.appendChild(resetConfirmDialog);
      resetConfirmDialog.querySelectorAll('[data-cancel-reset]').forEach((el) => {
        el.addEventListener('click', () => resetConfirmDialog?.close());
      });
      resetConfirmDialog.querySelector('#btn-confirm-reset-yes')?.addEventListener('click', () => {
        rootState = createInitialState();
        saveState();
        renderAll();
        resetConfirmDialog?.close();
        showToast('🔄 تمت استعادة البيانات الافتراضية لكافة الأفواج');
      });
    }
    if (!resetConfirmDialog.open) resetConfirmDialog.showModal();
  };

  document.querySelectorAll<HTMLElement>('[data-reset-demo]').forEach((btn) => {
    btn.addEventListener('click', openResetConfirmDialog);
  });

  document.getElementById('btn-export-backup-json')?.addEventListener('click', () => {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), version: 2, data: rootState }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `umrah-supervisor-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('💾 تم تنزيل النسخة الاحتياطية بنجاح');
  });

  document.getElementById('input-restore-backup-json')?.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as { data?: Partial<MultiGroupRootState> } & Partial<MultiGroupRootState>;
        const candidate = parsed.data || parsed;
        if (!Array.isArray(candidate.groups) || candidate.groups.length === 0) {
          throw new Error('Invalid backup structure');
        }
        rootState = normalizeRootState(candidate);
        saveState();
        renderAll();
        showToast('✅ تم استعادة النسخة الاحتياطية بنجاح');
      } catch {
        showToast('⚠️ ملف النسخة الاحتياطية غير صالح', true);
      } finally {
        input.value = '';
      }
    };
    reader.readAsText(file);
  });
});
