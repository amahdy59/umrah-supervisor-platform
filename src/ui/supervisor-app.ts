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
import { GameyaGroup, GameyaType, PaymentMethod, InstallmentStatus } from '../financial/gameya.js';
import { WhatsAppBroadcastManager, BroadcastPhase } from '../guidance/whatsapp-and-fiqh.js';
import { OFFICIAL_SAUDI_RESOURCES } from '../guidance/official-resources.js';
import {
  TRIP_STAGE_LABELS,
  escapeHtml,
  buildWhatsAppUrl,
  renderQrSvg,
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

interface PilgrimRecord {
  id: string;
  personId?: string;
  fullName: string;
  gender: Gender;
  passportNumber: string;
  phone: string;
  roomNumber: string;
  boarded: boolean;
  nusukReady: boolean;
}

interface RoomRecord {
  id: string;
  roomNumber: string;
  type: RoomType;
  capacity: number;
  isFamilyRoom: boolean;
  occupantIds: string[];
}

interface InstallmentPaymentLog {
  id: string;
  amount: number;
  method: PaymentMethod;
  ref?: string;
  dateIso: string;
}

interface GameyaRecord {
  id: string;
  name: string;
  phone: string;
  planType: GameyaType;
  turnMonth: number;
  totalTarget: number;
  downPayment: number;
  installmentCount: number;
  totalPaid: number;
  startDateIso: string;
  payments: InstallmentPaymentLog[];
}

interface LuggageRecord {
  id: string;
  tagCode: string;
  pilgrimName: string;
  roomNumber: string;
  bagType: BagType;
  status: LuggageStatus;
}

interface MedicalRecord {
  id: string;
  pilgrimName: string;
  roomNumber: string;
  conditions: ChronicCondition[];
  requiresWheelchair: boolean;
  requiresElectricCart: boolean;
  requiresInsulinRefrigeration: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
}

interface SOSRecord {
  id: string;
  pilgrimName: string;
  phone: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  notes: string;
  resolved: boolean;
  createdAt: string;
}

interface GroupSettings {
  tripTitle: string;
  tripCode: string;
  status: TripStatus;
  startDate: string;
  endDate: string;
  busNumber: string;
  hotelKey: string;
  hotelNameAr: string;
  hotelNameEn: string;
  hotelAddressAr: string;
  hotelPhone: string;
  hotelLat: number;
  hotelLng: number;
  supervisorName: string;
  supervisorPhone: string;
  gatheringTime: string;
  meetingPoint: string;
}

interface GroupWorkspace {
  id: string;
  settings: GroupSettings;
  pilgrims: PilgrimRecord[];
  rooms: RoomRecord[];
  gameya: GameyaRecord[];
  luggage: LuggageRecord[];
  medical: MedicalRecord[];
  sosAlerts: SOSRecord[];
}

interface MultiGroupRootState {
  activeGroupId: string;
  groups: GroupWorkspace[];
  people: PersonRecord[];
}

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
      supervisorName: 'أبو عبد الرحمن',
      supervisorPhone: '+966501234567',
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
      supervisorName: 'الشيخ عمر الفاروق',
      supervisorPhone: '+966509876543',
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
let activePaymentMemberId = '';

function getActiveGroup(): GroupWorkspace {
  return rootState.groups.find((g) => g.id === rootState.activeGroupId) || rootState.groups[0];
}

function loadState(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MultiGroupRootState>;
      const fallback = createInitialState();
      rootState = {
        activeGroupId: parsed.activeGroupId || fallback.activeGroupId,
        groups: Array.isArray(parsed.groups) && parsed.groups.length > 0 ? parsed.groups : fallback.groups,
        people: Array.isArray(parsed.people) ? parsed.people : fallback.people,
      };
    }
  } catch {
    rootState = createInitialState();
  }
}

function saveState(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rootState));
  } catch {
    // ignore storage errors
  }
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

function renderAll(): void {
  renderGroupSwitcher();
  renderTopMetrics();
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

function renderGroupSwitcher(): void {
  const switcher = document.getElementById('active-group-switcher') as HTMLSelectElement | null;
  if (switcher) {
    switcher.innerHTML = rootState.groups
      .map(
        (g) =>
          `<option value="${escapeHtml(g.id)}" ${g.id === rootState.activeGroupId ? 'selected' : ''}>${escapeHtml(g.settings.tripTitle)} (${escapeHtml(TRIP_STAGE_LABELS[g.settings.status])})</option>`
      )
      .join('');
  }
  const active = getActiveGroup();
  const stageBadge = document.getElementById('header-active-stage');
  if (stageBadge) {
    stageBadge.textContent = `${active.settings.tripCode} • ${TRIP_STAGE_LABELS[active.settings.status]}`;
  }
}

function renderTopMetrics(): void {
  const active = getActiveGroup();
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
  set('metric-trip-stage', TRIP_STAGE_LABELS[active.settings.status]);
  set('metric-pilgrim-count', `${totalP} معتمر (الكل: ${agg.totalActivePilgrims})`);
  set('metric-bus-summary', `${active.settings.busNumber}: ${boardedP} صعدوا / ${remainingP} متبقين`);
  set('metric-gameya-total', `${totalCollected.toLocaleString('ar-EG')} ج.م`);
  set('metric-gameya-pct', `التحصيل: ${pct}% • (${agg.activeGroupsCount} أفواج نشطة)`);
  set('sup-sos-count', `${activeSos} (كل الأفواج: ${agg.totalActiveSos})`);

  const sosSub = document.getElementById('sup-sos-sub');
  const sosCountEl = document.getElementById('sup-sos-count');
  if (sosSub && sosCountEl) {
    if (agg.totalActiveSos > 0) {
      sosCountEl.style.color = 'var(--danger)';
      sosSub.textContent = '⚠️ يوجد بلاغات تائهين تتطلب متابعة!';
      sosSub.style.color = 'var(--danger)';
    } else {
      sosCountEl.style.color = 'var(--success)';
      sosSub.textContent = 'جميع الأفواج في نطاق الأمان';
      sosSub.style.color = 'var(--success)';
    }
  }

  set('manifest-count-badge', `${boardedP} صعدوا / ${remainingP} متبقين`);
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
          ${isCurrent ? '<span class="badge badge-warning">الفوج المحدد الآن ✓</span>' : `<button type="button" class="btn btn-primary" style="min-height:36px;padding:0.25rem 0.65rem;font-size:0.8rem;" data-select-group="${escapeHtml(g.id)}">فتح وإدارة الفوج</button>`}
          ${allowedNext.map((ns) => `<button type="button" class="btn btn-secondary" style="min-height:36px;padding:0.25rem 0.6rem;font-size:0.78rem;" data-advance-group="${escapeHtml(g.id)}" data-next-stage="${ns}">⏭️ نقل إلى: ${escapeHtml(TRIP_STAGE_LABELS[ns])}</button>`).join('')}
          <button type="button" class="btn btn-secondary" style="min-height:36px;padding:0.25rem 0.6rem;font-size:0.78rem;" data-clone-group="${escapeHtml(g.id)}">📋 استنساخ للفوج التالي</button>
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
function buildPilgrimShareUrl(p: PilgrimRecord): string {
  const s = getActiveGroup().settings;
  const base = `${window.location.origin}/`;
  const qs = new URLSearchParams({
    name: p.fullName,
    passport: p.passportNumber,
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
  return `${base}?${qs.toString()}`;
}

function renderManifestTable(): void {
  const active = getActiveGroup();
  const tbody = document.getElementById('manifest-tbody');
  if (!tbody) return;
  const q = manifestFilter.toLowerCase().trim();
  const filtered = active.pilgrims.filter(
    (p) =>
      !q ||
      p.fullName.toLowerCase().includes(q) ||
      p.passportNumber.toLowerCase().includes(q) ||
      p.roomNumber.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:1.25rem;color:var(--text-muted);">لا يوجد معتمرون في هذا الفوج بعد — أضف معتمراً أو أدرجه من سجل الأشخاص الدائم.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((p) => {
      const alertText = `السلام عليكم ورحمة الله وبركاته يا ${p.fullName}، ${active.settings.busNumber} لفوج (${active.settings.tripTitle}) يستعد للانطلاق الآن عند ${active.settings.meetingPoint}.`;
      const waLink = buildWhatsAppUrl(alertText, p.phone);
      return `
      <tr class="${p.boarded ? '' : 'row-pending'}">
        <th scope="row">${escapeHtml(p.fullName)}</th>
        <td>${escapeHtml(p.passportNumber)}</td>
        <td>${escapeHtml(p.roomNumber || 'غير مسكن')}</td>
        <td><span class="badge ${p.nusukReady ? 'badge-success' : 'badge-warning'}">${p.nusukReady ? 'نُسك جاهز ✓' : 'معلق'}</span></td>
        <td>
          <button type="button" class="badge ${p.boarded ? 'badge-success' : 'badge-warning'}" style="border:none;cursor:pointer;min-height:36px;" data-toggle-board="${escapeHtml(p.id)}">
            ${p.boarded ? 'صعد الباص ✅' : 'لم يصعد بعد ⏳'}
          </button>
        </td>
        <td>
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
            <a href="${waLink}" target="_blank" rel="noopener" class="btn btn-secondary" style="min-height:36px;padding:0.25rem 0.55rem;font-size:0.78rem;text-decoration:none;">📲 واتساب</a>
            <button type="button" class="btn btn-primary" style="min-height:36px;padding:0.25rem 0.55rem;font-size:0.78rem;" data-share-pilgrim="${escapeHtml(p.id)}">🔗 QR البطاقة</button>
            <button type="button" class="btn btn-secondary" style="min-height:36px;padding:0.25rem 0.55rem;font-size:0.78rem;color:var(--danger);" data-delete-pilgrim="${escapeHtml(p.id)}" aria-label="إزالة ${escapeHtml(p.fullName)}">🗑️</button>
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
      const url = buildPilgrimShareUrl(p);
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

  tbody.querySelectorAll<HTMLElement>('[data-delete-pilgrim]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.deletePilgrim!;
      active.pilgrims = active.pilgrims.filter((x) => x.id !== id);
      active.rooms.forEach((r) => {
        r.occupantIds = r.occupantIds.filter((oid) => oid !== id);
      });
      saveState();
      renderAll();
      showToast('تمت إزالة المعتمر من هذا الفوج (بياناته محفوظة في سجل الأشخاص الدائم)');
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
  const dir = buildPeopleDirectoryFromState();
  const tripStart = new Date(active.settings.startDate || Date.now());
  const results = dir.searchPeople(peopleFilter);

  const countBadge = document.getElementById('people-count-badge');
  const expiringCount = dir.getExpiringPassports(tripStart, 6).length;
  if (countBadge) {
    countBadge.textContent = `${rootState.people.length} شخص مسجل${expiringCount > 0 ? ` • ⚠️ ${expiringCount} جواز قارب على الانتهاء` : ''}`;
  }

  const tbody = document.getElementById('people-tbody');
  if (!tbody) return;
  if (results.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:1.25rem;color:var(--text-muted);">لا توجد سجلات مطابقة</td></tr>`;
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
        <td>
          <div>${escapeHtml(p.passportNumber)}</div>
          <div style="font-size:0.78rem;color:${passportValid ? 'var(--text-muted)' : 'var(--danger)'};font-weight:${passportValid ? '500' : '700'};">
            ${p.passportExpiryDate ? `ينتهي: ${escapeHtml(p.passportExpiryDate)}` : 'بدون تاريخ انتهاء'}
            ${passportValid ? '' : ' ⚠️ أقل من 6 أشهر!'}
          </div>
        </td>
        <td dir="ltr">${escapeHtml(p.phone)}</td>
        <td>
          ${p.requiresWheelchair ? '<span class="badge badge-danger">كرسي</span> ' : ''}
          ${p.requiresInsulinRefrigeration ? '<span class="badge badge-danger">إنسولين</span> ' : ''}
          ${!p.requiresWheelchair && !p.requiresInsulinRefrigeration ? '<span class="badge badge-success">سليم</span>' : ''}
        </td>
        <td>
          <div style="font-size:0.82rem;">${p.pastTrips.length > 0 ? escapeHtml(p.pastTrips.join('، ')) : 'أول رحلة'}</div>
        </td>
        <td>
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
            ${
              alreadyInActive
                ? '<span class="badge badge-primary">مدرج بالفوج ✓</span>'
                : `<button type="button" class="btn btn-primary" style="min-height:36px;padding:0.25rem 0.6rem;font-size:0.78rem;" data-enroll-person="${escapeHtml(p.id)}">➕ إدراج بالفوج النشط</button>`
            }
            <button type="button" class="btn btn-secondary" style="min-height:36px;padding:0.25rem 0.55rem;font-size:0.78rem;color:var(--danger);" data-del-person="${escapeHtml(p.id)}" aria-label="حذف سجل ${escapeHtml(p.fullName)}">🗑️</button>
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
      showToast(`✅ تم إدراج ${person.fullName} في "${active.settings.tripTitle}"`);
    });
  });

  tbody.querySelectorAll<HTMLElement>('[data-del-person]').forEach((btn) => {
    btn.addEventListener('click', () => {
      rootState.people = rootState.people.filter((x) => x.id !== btn.dataset.delPerson);
      saveState();
      renderPeopleDirectory();
      showToast('تم حذف السجل من دفتر الأشخاص');
    });
  });
}

// =========================================================================
// TAB 2: WHATSAPP BROADCASTS (SYNCED TO ACTIVE GROUP)
// =========================================================================
function renderWhatsAppHub(): void {
  const s = getActiveGroup().settings;
  const container = document.getElementById('whatsapp-posts-container');
  if (!container) return;

  const params = {
    tripTitle: s.tripTitle,
    supervisorName: s.supervisorName,
    hotelName: s.hotelNameAr,
    gatheringTime: s.gatheringTime,
    meetingPoint: s.meetingPoint,
  };

  container.innerHTML = broadcastManager
    .getAllPhases()
    .map((phase: BroadcastPhase, idx: number) => {
      const post = broadcastManager.getFormattedPost(phase, params);
      const textareaId = `wa-post-text-${idx}`;
      return `
      <div class="card" style="margin-bottom:1.25rem;">
        <div class="card-header">
          <h3 class="card-title">${escapeHtml(post.title)}</h3>
          <span class="badge badge-primary">${escapeHtml(post.badge)}</span>
        </div>
        <label for="${textareaId}" class="field-label">نص الرسالة (قابل للتعديل قبل الإرسال):</label>
        <textarea id="${textareaId}" class="whatsapp-textarea" rows="8">${escapeHtml(post.messageBody)}</textarea>
        <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.75rem;">
          <button type="button" class="btn btn-primary" data-copy-textarea="${textareaId}">📋 نسخ للواتساب</button>
          <button type="button" class="btn btn-gold" data-open-wa-textarea="${textareaId}">📲 فتح في واتساب</button>
        </div>
      </div>
    `;
    })
    .join('');

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
  if (m.totalPaid > 0) {
    group.recordFlexiblePayment({
      memberId: m.id,
      amount: Money.fromDecimal(Math.min(m.totalPaid, m.totalTarget), 'EGP'),
      method: PaymentMethod.CASH,
      supervisorId: 'sup',
    });
  }
  const summary = group.getMemberSummary(m.id);
  return { items, summary };
}

function renderGameyaTable(): void {
  const active = getActiveGroup();
  const tbody = document.getElementById('gameya-tbody');
  if (!tbody) return;

  if (active.gameya.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:1.25rem;color:var(--text-muted);">لا يوجد مشتركون في خطة أقساط لهذا الفوج بعد.</td></tr>`;
    return;
  }

  tbody.innerHTML = active.gameya
    .map((m) => {
      const { summary } = buildScheduleSummaryForMember(m, active.settings.endDate);
      const remaining = Math.max(0, m.totalTarget - m.totalPaid);
      const nextDueAmount = summary.nextDueItem ? summary.nextDueItem.remainingBalance.toDecimal() : 0;
      const nextDueLabel = summary.nextDueItem
        ? `${nextDueAmount.toLocaleString('ar-EG')} ج.م (${summary.nextDueItem.labelAr || 'قسط'})`
        : '0 ج.م';

      const receiptText = [
        `📋 *إيصال سداد معتمد - ${active.settings.tripTitle}* 🕋`,
        `التاريخ: ${new Date().toLocaleDateString('ar-EG')}`,
        `المشترك: *${m.name}*`,
        `خطة السداد: *${PLAN_LABELS[m.planType]}*`,
        `إجمالي المسدد: *${m.totalPaid.toLocaleString('ar-EG')} ج.م*`,
        `المتبقي: *${remaining.toLocaleString('ar-EG')} ج.م*`,
        `الحالة: *${remaining === 0 ? 'مكتمل السداد 🎉' : 'قيد السداد المنتظم ✅'}*`,
        `_${active.settings.supervisorName}_`,
      ].join('\n');

      const reminderText = `السلام عليكم ورحمة الله وبركاته يا ${m.name}، نود تذكيركم بموعد الدفعة القادمة لرحلة (${active.settings.tripTitle}) ضمن خطة (${PLAN_LABELS[m.planType]}) بمبلغ ${nextDueAmount.toLocaleString('ar-EG')} ج.م. تقبل الله طاعتكم.`;

      return `
      <tr>
        <th scope="row">${escapeHtml(m.name)}</th>
        <td>
          <div><span class="badge badge-primary">${escapeHtml(PLAN_LABELS[m.planType])}</span></div>
          ${m.planType === GameyaType.ROTATING_ROSCA ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.2rem;">الدور: شهر ${m.turnMonth}</div>` : ''}
        </td>
        <td>${m.totalTarget.toLocaleString('ar-EG')} ج.م</td>
        <td>${m.totalPaid.toLocaleString('ar-EG')} ج.م</td>
        <td>${escapeHtml(nextDueLabel)}</td>
        <td>
          <span class="badge ${remaining === 0 ? 'badge-success' : summary.overdueCount > 0 ? 'badge-danger' : 'badge-warning'}">
            ${remaining === 0 ? 'مكتمل السداد 🎉' : summary.overdueCount > 0 ? `متأخر (${summary.overdueCount})` : 'قيد السداد'}
          </span>
        </td>
        <td>
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
            ${remaining > 0 ? `<button type="button" class="btn btn-primary" style="min-height:36px;padding:0.25rem 0.6rem;font-size:0.78rem;" data-open-pay="${escapeHtml(m.id)}">💳 تسجيل دفعة</button>` : ''}
            <button type="button" class="btn btn-secondary" style="min-height:36px;padding:0.25rem 0.55rem;font-size:0.78rem;" data-view-schedule="${escapeHtml(m.id)}">📅 الجدول</button>
            <a href="${buildWhatsAppUrl(remaining === 0 ? receiptText : reminderText, m.phone)}" target="_blank" rel="noopener" class="btn btn-gold" style="min-height:36px;padding:0.25rem 0.55rem;font-size:0.78rem;text-decoration:none;">📲 واتساب</a>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');

  tbody.querySelectorAll<HTMLElement>('[data-open-pay]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const m = active.gameya.find((x) => x.id === btn.dataset.openPay);
      if (!m) return;
      activePaymentMemberId = m.id;
      const { summary } = buildScheduleSummaryForMember(m, active.settings.endDate);
      const rem = Math.max(0, m.totalTarget - m.totalPaid);
      const suggested = summary.nextDueItem ? summary.nextDueItem.remainingBalance.toDecimal() : rem;
      (document.getElementById('pay-modal-member') as HTMLElement).textContent = `${m.name} (المتبقي: ${rem.toLocaleString('ar-EG')} ج.م)`;
      (document.getElementById('pay-amount') as HTMLInputElement).value = String(suggested);
      (document.getElementById('pay-amount') as HTMLInputElement).max = String(rem);
      (document.getElementById('pay-ref') as HTMLInputElement).value = '';
      openDialogById('payment-modal');
    });
  });

  tbody.querySelectorAll<HTMLElement>('[data-view-schedule]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const m = active.gameya.find((x) => x.id === btn.dataset.viewSchedule);
      if (!m) return;
      const { items } = buildScheduleSummaryForMember(m, active.settings.endDate);
      const title = document.getElementById('schedule-modal-title');
      const body = document.getElementById('schedule-modal-body');
      if (title) title.textContent = `📅 جدول دفعات: ${m.name} (${PLAN_LABELS[m.planType]})`;
      if (body) {
        const rowsHtml = items
          .map(
            (it) => `
          <tr>
            <th scope="row">${escapeHtml(it.labelAr || `قسط ${it.installmentNumber}`)}</th>
            <td>${it.dueDate.toLocaleDateString('ar-EG')}</td>
            <td>${it.amountDue.toDecimal().toLocaleString('ar-EG')} ج.م</td>
            <td>${it.amountPaid.toDecimal().toLocaleString('ar-EG')} ج.م</td>
            <td><span class="badge ${it.status === InstallmentStatus.PAID ? 'badge-success' : it.status === InstallmentStatus.PARTIALLY_PAID ? 'badge-warning' : 'badge-primary'}">${it.status === InstallmentStatus.PAID ? 'مسدد ✅' : it.status === InstallmentStatus.PARTIALLY_PAID ? 'جزئي' : 'معلق'}</span></td>
          </tr>
        `
          )
          .join('');
        const logHtml =
          m.payments.length > 0
            ? `<h2 style="font-size:0.98rem;margin:1rem 0 0.5rem;">سجل المدفوعات الموثق</h2>
               <ul style="margin-right:1.25rem;font-size:0.86rem;line-height:1.8;">
                 ${m.payments.map((p) => `<li>${p.amount.toLocaleString('ar-EG')} ج.م — ${escapeHtml(PAYMENT_METHOD_LABELS[p.method])} ${p.ref ? `(مرجع: ${escapeHtml(p.ref)})` : ''} — ${escapeHtml(p.dateIso)}</li>`).join('')}
               </ul>`
            : '';
        body.innerHTML = `
          <div class="table-wrapper" tabindex="0" role="region" aria-label="تفاصيل الأقساط">
            <table><thead><tr><th>البند</th><th>الاستحقاق</th><th>المطلوب</th><th>المسدد</th><th>الحالة</th></tr></thead><tbody>${rowsHtml}</tbody></table>
          </div>
          ${logHtml}
        `;
      }
      openDialogById('schedule-modal');
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
        <a href="https://maps.google.com/?q=${a.latitude},${a.longitude}" target="_blank" rel="noopener" class="btn btn-secondary" style="min-height:36px;font-size:0.8rem;text-decoration:none;">📍 الخريطة</a>
        ${!a.resolved ? `<button type="button" class="btn btn-primary" style="min-height:36px;font-size:0.8rem;" data-resolve-sos="${escapeHtml(a.id)}">✅ تم العثور عليه</button>` : ''}
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
      showToast(`✅ تم إغلاق بلاغ ${alert.pilgrimName}`);
    });
  });
}

function renderOfficialResourcesInSup(): void {
  const container = document.getElementById('sup-official-resources');
  if (!container) return;
  container.innerHTML = OFFICIAL_SAUDI_RESOURCES.map(
    (r) => `
    <a href="${escapeHtml(r.urlOrTel)}" ${r.urlOrTel.startsWith('http') ? 'target="_blank" rel="noopener"' : ''} class="btn btn-secondary" style="justify-content:flex-start;text-decoration:none;text-align:right;">
      <div>
        <div style="font-size:0.86rem;font-weight:800;">${escapeHtml(r.titleAr)}</div>
        <div style="font-size:0.76rem;color:var(--text-muted);font-weight:500;">${escapeHtml(r.actionLabelAr)}</div>
      </div>
    </a>
  `
  ).join('');
}

// =========================================================================
// TAB 6: WOMEN'S GUIDANCE (DYNAMICALLY SYNCED TO ACTIVE GROUP)
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
}

// =========================================================================
// TAB 7: LUGGAGE & MEDICAL
// =========================================================================
function renderLuggageSection(): void {
  const active = getActiveGroup();
  const onBus = active.luggage.filter((b) => b.status === LuggageStatus.ON_BUS).length;
  const lobby = active.luggage.filter((b) => b.status === LuggageStatus.HOTEL_LOBBY).length;
  const delivered = active.luggage.filter((b) => b.status === LuggageStatus.DELIVERED_TO_ROOM).length;

  const set = (id: string, txt: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };
  set('count-lug-total', `${active.luggage.length} حقائب`);
  set('count-lug-bus', `${onBus} بالحافلة`);
  set('count-lug-lobby', `${lobby} بالبهو`);
  set('count-lug-room', `${delivered} بالغرف`);

  const tbody = document.getElementById('luggage-tbody');
  if (!tbody) return;
  const statusMap: Record<LuggageStatus, { label: string; cls: string }> = {
    [LuggageStatus.ON_BUS]: { label: 'بالحافلة 🚌', cls: 'badge-warning' },
    [LuggageStatus.HOTEL_LOBBY]: { label: 'ببهو الاستقبال 🏨', cls: 'badge-primary' },
    [LuggageStatus.DELIVERED_TO_ROOM]: { label: 'سُلّمت للغرفة ✅', cls: 'badge-success' },
    [LuggageStatus.LOST]: { label: 'مفقودة / بحث 🔍', cls: 'badge-danger' },
  };

  tbody.innerHTML =
    active.luggage.length === 0
      ? `<tr><td colspan="5" style="text-align:center;padding:1rem;color:var(--text-muted);">لا توجد حقائب مسجلة لهذا الفوج بعد.</td></tr>`
      : active.luggage
          .map((bag) => {
            const st = statusMap[bag.status];
            return `
            <tr>
              <th scope="row" style="font-family:monospace;">${escapeHtml(bag.tagCode)}</th>
              <td>${escapeHtml(bag.pilgrimName)}</td>
              <td>${escapeHtml(bag.roomNumber)}</td>
              <td><span class="badge ${st.cls}">${st.label}</span></td>
              <td>
                <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
                  <button type="button" class="btn btn-secondary" style="min-height:36px;padding:0.25rem 0.6rem;font-size:0.78rem;" data-cycle-bag="${escapeHtml(bag.id)}">تغيير الحالة 🔁</button>
                  <button type="button" class="btn btn-secondary" style="min-height:36px;padding:0.25rem 0.55rem;font-size:0.78rem;color:var(--danger);" data-del-bag="${escapeHtml(bag.id)}">🗑️</button>
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
      showToast(`تم تحديث حالة ${bag.tagCode}`);
    });
  });

  tbody.querySelectorAll<HTMLElement>('[data-del-bag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      active.luggage = active.luggage.filter((x) => x.id !== btn.dataset.delBag);
      saveState();
      renderLuggageSection();
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
  const list = document.getElementById('medical-cards-list');
  const badge = document.getElementById('medical-count-badge');
  if (badge) badge.textContent = `${active.medical.length} حالات مسجلة`;
  if (!list) return;

  list.innerHTML =
    active.medical.length === 0
      ? '<div class="info-box-neutral">لا توجد حالات طبية مسجلة لهذا الفوج.</div>'
      : active.medical
          .map(
            (m) => `
          <div class="info-box-neutral">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.35rem;">
              <strong>${escapeHtml(m.pilgrimName)} (غرفة ${escapeHtml(m.roomNumber)})</strong>
              <div style="display:flex;gap:0.3rem;flex-wrap:wrap;">
                ${m.requiresWheelchair ? '<span class="badge badge-danger">كرسي متحرك</span>' : ''}
                ${m.requiresElectricCart ? '<span class="badge badge-warning">عربة غولف نُسك</span>' : ''}
                ${m.requiresInsulinRefrigeration ? '<span class="badge badge-danger">ثلاجة إنسولين</span>' : ''}
              </div>
            </div>
            <p style="font-size:0.86rem;color:var(--text-muted);margin-bottom:0.35rem;">${escapeHtml(m.notes)}</p>
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;font-size:0.85rem;">
              <span>مرافق الطوارئ: <strong>${escapeHtml(m.emergencyContactName)}</strong> (<span dir="ltr">${escapeHtml(m.emergencyContactPhone)}</span>)</span>
              <button type="button" class="btn btn-secondary" style="min-height:34px;padding:0.2rem 0.55rem;font-size:0.78rem;color:var(--danger);" data-del-med="${escapeHtml(m.id)}">حذف</button>
            </div>
          </div>
        `
          )
          .join('');

  list.querySelectorAll<HTMLElement>('[data-del-med]').forEach((btn) => {
    btn.addEventListener('click', () => {
      active.medical = active.medical.filter((x) => x.id !== btn.dataset.delMed);
      saveState();
      renderMedicalSection();
    });
  });
}

// =========================================================================
// TAB SWITCHING & CSV EXPORT
// =========================================================================
function switchTab(tab: string): void {
  const tabs = ['manifest', 'people', 'gameya', 'whatsapp', 'print', 'sos', 'women-guide', 'logistics-health'];
  if (!tabs.includes(tab)) return;
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
  if (morePop && morePop.matches(':popover-open') && morePop.hidePopover) {
    morePop.hidePopover();
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
window.addEventListener('DOMContentLoaded', () => {
  initThemeSync();
  setupDialogs();
  initStickyHeaders();
  registerServiceWorkerAndNetworkStatus();

  loadState();
  renderAll();

  document.querySelectorAll<HTMLButtonElement>('[data-tab-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tabTarget) switchTab(btn.dataset.tabTarget);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', toggleColorScheme);
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
    const supPhone = (document.getElementById('ng-sup-phone') as HTMLInputElement).value.trim() || '+966501234567';
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
      openDialogById('settings-modal');
    });
  });

  document.getElementById('settings-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
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
  document.getElementById('add-pilgrim-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const active = getActiveGroup();
    const fullName = (document.getElementById('new-pilgrim-name') as HTMLInputElement).value.trim();
    const passportNumber = (document.getElementById('new-pilgrim-passport') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('new-pilgrim-phone') as HTMLInputElement).value.trim();
    const gender = (document.getElementById('new-pilgrim-gender') as HTMLSelectElement).value as Gender;
    if (!fullName || !passportNumber) return;

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
      nusukReady: true,
    });
    saveState();
    renderAll();
    (e.target as HTMLFormElement).reset();
    showToast(`✅ تمت إضافة ${fullName} للفوج وحفظه في سجل الأشخاص الدائم`);
  });

  document.getElementById('manifest-search')?.addEventListener('input', (e) => {
    manifestFilter = (e.target as HTMLInputElement).value;
    renderManifestTable();
  });
  document.getElementById('btn-export-csv')?.addEventListener('click', exportManifestCSV);

  // Add Person to CRM directly
  document.getElementById('add-person-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
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

    rootState.people.unshift({
      id: `per-${Date.now()}`,
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
      pastTrips: [],
      notes: notes || undefined,
      updatedAt: new Date().toISOString(),
    });
    saveState();
    renderPeopleDirectory();
    (e.target as HTMLFormElement).reset();
    showToast(`✅ تم حفظ سجل "${fullName}" في قاعدة الأشخاص الدائمة`);
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
    showToast(`✅ تمت إضافة غرفة ${num}`);
  });
  document.getElementById('btn-assign-room')?.addEventListener('click', handleAssignRoom);

  // Gam'eya Enhanced Plan Form + Flexible Payment Modal
  document.getElementById('add-gameya-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const active = getActiveGroup();
    const name = (document.getElementById('new-gam-name') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('new-gam-phone') as HTMLInputElement).value.trim();
    const planType = (document.getElementById('new-gam-plan') as HTMLSelectElement).value as GameyaType;
    const target = Number((document.getElementById('new-gam-target') as HTMLInputElement).value) || 40000;
    const downPayment = Number((document.getElementById('new-gam-down') as HTMLInputElement).value) || 0;
    const count = Number((document.getElementById('new-gam-count') as HTMLInputElement).value) || 6;
    const turnMonth = Number((document.getElementById('new-gam-turn') as HTMLInputElement).value) || 1;
    if (!name) return;

    active.gameya.push({
      id: `g-${Date.now()}`,
      name,
      phone,
      planType,
      turnMonth,
      totalTarget: target,
      downPayment: planType === GameyaType.FULL_CASH ? target : downPayment,
      installmentCount: planType === GameyaType.FULL_CASH ? 1 : count,
      totalPaid: 0,
      startDateIso: new Date().toISOString().slice(0, 10),
      payments: [],
    });
    saveState();
    renderAll();
    (e.target as HTMLFormElement).reset();
    showToast(`✅ تم إضافة ${name} بخطة (${PLAN_LABELS[planType]})`);
  });

  document.getElementById('payment-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const active = getActiveGroup();
    const m = active.gameya.find((x) => x.id === activePaymentMemberId);
    if (!m) return;
    const amount = Number((document.getElementById('pay-amount') as HTMLInputElement).value) || 0;
    const method = (document.getElementById('pay-method') as HTMLSelectElement).value as PaymentMethod;
    const ref = (document.getElementById('pay-ref') as HTMLInputElement).value.trim();
    if (amount <= 0) return;

    m.totalPaid = Math.min(m.totalTarget, m.totalPaid + amount);
    m.payments.push({
      id: `pay-${Date.now()}`,
      amount,
      method,
      ref: ref || undefined,
      dateIso: new Date().toISOString().slice(0, 10),
    });
    saveState();
    renderAll();
    closeDialogById('payment-modal');
    showToast(`✅ تم تسجيل دفعة ${amount.toLocaleString('ar-EG')} ج.م (${PAYMENT_METHOD_LABELS[method]})`);
  });

  // Print Center
  document.getElementById('btn-open-wristband')?.addEventListener('click', openWristbandPreview);
  document.getElementById('btn-open-agreement')?.addEventListener('click', openAgreementPreview);
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
    showToast(`✅ تمت إضافة الملف الصحي لـ ${name}`);
  });

  document.querySelectorAll<HTMLElement>('[data-close-dialog]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.closeDialog;
      if (id) closeDialogById(id);
    });
  });

  document.querySelectorAll<HTMLElement>('[data-reset-demo]').forEach((btn) => {
    btn.addEventListener('click', () => {
      rootState = createInitialState();
      saveState();
      renderAll();
      showToast('🔄 تمت استعادة البيانات الافتراضية لكافة الأفواج');
    });
  });
});
