import {
  Gender,
  RoomType,
  Room,
  Hotel,
  RoomingEngine,
  EmergencySOSDispatcher,
} from '../operations/trip-logistics.js';
import { LuggageStatus, BagType } from '../operations/luggage-tracker.js';
import { ChronicCondition } from '../operations/medical-profile.js';
import { WhatsAppBroadcastManager, BroadcastPhase } from '../guidance/whatsapp-and-fiqh.js';
import { OFFICIAL_SAUDI_RESOURCES } from '../guidance/official-resources.js';
import {
  escapeHtml,
  buildWhatsAppUrl,
  renderQrSvg,
  showToast,
  copyToClipboard,
  setupDialogs,
  openDialogById,
  closeDialogById,
  initThemeSync,
  toggleColorScheme,
  registerServiceWorkerAndNetworkStatus,
} from './shared.js';

interface PilgrimRecord {
  id: string;
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

interface GameyaRecord {
  id: string;
  name: string;
  phone: string;
  turnMonth: number;
  totalTarget: number;
  monthlyInstallment: number;
  totalPaid: number;
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

interface TripSettings {
  tripTitle: string;
  tripCode: string;
  stageLabel: string;
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

interface SupervisorState {
  settings: TripSettings;
  pilgrims: PilgrimRecord[];
  rooms: RoomRecord[];
  gameya: GameyaRecord[];
  luggage: LuggageRecord[];
  medical: MedicalRecord[];
  sosAlerts: SOSRecord[];
}

const STORAGE_KEY = 'umrah_supervisor_state_v2';
const broadcastManager = new WhatsAppBroadcastManager();
const roomingEngine = new RoomingEngine();

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

function createInitialState(): SupervisorState {
  return {
    settings: {
      tripTitle: 'عمرة شعبان 1447هـ',
      tripCode: '#UMR-1447',
      stageLabel: 'مكة المكرمة (IN_MAKKAH)',
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
      { id: 'p-1', fullName: 'أحمد محمود الشريف', gender: Gender.MALE, passportNumber: 'A12345678', phone: '+201000000001', roomNumber: '502', boarded: true, nusukReady: true },
      { id: 'p-2', fullName: 'محمود حسن علي', gender: Gender.MALE, passportNumber: 'A23456789', phone: '+201022222222', roomNumber: '502', boarded: true, nusukReady: true },
      { id: 'p-3', fullName: 'سعيد إبراهيم خليل', gender: Gender.MALE, passportNumber: 'A34567890', phone: '+201200000000', roomNumber: '504', boarded: false, nusukReady: true },
      { id: 'p-4', fullName: 'فاطمة إبراهيم مصطفى', gender: Gender.FEMALE, passportNumber: 'A45678901', phone: '+201087654321', roomNumber: '601', boarded: false, nusukReady: true },
    ],
    rooms: [
      { id: 'r-502', roomNumber: '502', type: RoomType.DOUBLE, capacity: 2, isFamilyRoom: false, occupantIds: ['p-1', 'p-2'] },
      { id: 'r-504', roomNumber: '504', type: RoomType.TRIPLE, capacity: 3, isFamilyRoom: false, occupantIds: ['p-3'] },
      { id: 'r-601', roomNumber: '601', type: RoomType.DOUBLE, capacity: 2, isFamilyRoom: true, occupantIds: ['p-4'] },
    ],
    gameya: [
      { id: 'g-1', name: 'خالد عبد الله', phone: '+201111111111', turnMonth: 1, totalTarget: 40000, monthlyInstallment: 4000, totalPaid: 40000 },
      { id: 'g-2', name: 'سعيد إبراهيم خليل', phone: '+201200000000', turnMonth: 3, totalTarget: 40000, monthlyInstallment: 4000, totalPaid: 20000 },
      { id: 'g-3', name: 'أحمد محمود الشريف', phone: '+201000000001', turnMonth: 5, totalTarget: 40000, monthlyInstallment: 4000, totalPaid: 16000 },
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
}

let state: SupervisorState = createInitialState();
let manifestFilter = '';

function loadState(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SupervisorState>;
      const base = createInitialState();
      state = {
        settings: { ...base.settings, ...(parsed.settings || {}) },
        pilgrims: Array.isArray(parsed.pilgrims) ? parsed.pilgrims : base.pilgrims,
        rooms: Array.isArray(parsed.rooms) ? parsed.rooms : base.rooms,
        gameya: Array.isArray(parsed.gameya) ? parsed.gameya : base.gameya,
        luggage: Array.isArray(parsed.luggage) ? parsed.luggage : base.luggage,
        medical: Array.isArray(parsed.medical) ? parsed.medical : base.medical,
        sosAlerts: Array.isArray(parsed.sosAlerts) ? parsed.sosAlerts : base.sosAlerts,
      };
    }
  } catch {
    state = createInitialState();
  }
}

function saveState(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota issues
  }
}

function renderAll(): void {
  renderTopMetrics();
  renderManifestTable();
  renderRoomsBoard();
  renderWhatsAppHub();
  renderGameyaTable();
  renderPrintSelectors();
  renderSOSTab();
  renderOfficialResourcesInSup();
  renderLuggageSection();
  renderMedicalSection();
}

function renderTopMetrics(): void {
  const totalP = state.pilgrims.length;
  const boardedP = state.pilgrims.filter((p) => p.boarded).length;
  const remainingP = totalP - boardedP;

  const totalCollected = state.gameya.reduce((s, m) => s + m.totalPaid, 0);
  const totalTarget = state.gameya.reduce((s, m) => s + m.totalTarget, 0);
  const pct = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

  const activeSos = state.sosAlerts.filter((a) => !a.resolved).length;

  const set = (id: string, txt: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };

  set('metric-trip-title', state.settings.tripTitle);
  set('metric-trip-stage', state.settings.stageLabel);
  set('metric-pilgrim-count', `${totalP} معتمر`);
  set('metric-bus-summary', `${state.settings.busNumber}: ${boardedP} صعدوا / ${remainingP} متبقين`);
  set('metric-gameya-total', `${totalCollected.toLocaleString('ar-EG')} ج.م`);
  set('metric-gameya-pct', `نسبة التحصيل: ${pct}%`);
  set('sup-sos-count', `${activeSos} بلاغات`);

  const sosSub = document.getElementById('sup-sos-sub');
  const sosCountEl = document.getElementById('sup-sos-count');
  if (sosSub && sosCountEl) {
    if (activeSos > 0) {
      sosCountEl.style.color = 'var(--danger)';
      sosSub.textContent = '⚠️ يوجد بلاغات تائهين قيد المتابعة!';
      sosSub.style.color = 'var(--danger)';
    } else {
      sosCountEl.style.color = 'var(--success)';
      sosSub.textContent = 'جميع المعتمرين في نطاق الأمان';
      sosSub.style.color = 'var(--success)';
    }
  }

  set('manifest-count-badge', `${boardedP} صعدوا / ${remainingP} متبقين`);
}

// =========================================================================
// TAB 1: MANIFEST, ROOMING ENGINE & PERSONALIZED PILGRIM QR LINKS
// =========================================================================
function buildPilgrimShareUrl(p: PilgrimRecord): string {
  const base = `${window.location.origin}/`;
  const qs = new URLSearchParams({
    name: p.fullName,
    passport: p.passportNumber,
    room: p.roomNumber || 'بدون غرفة',
    bus: state.settings.busNumber,
    hotelKey: state.settings.hotelKey,
    hotel: state.settings.hotelNameAr,
    address: state.settings.hotelAddressAr,
    hotelPhone: state.settings.hotelPhone,
    supName: state.settings.supervisorName,
    supPhone: state.settings.supervisorPhone,
    trip: state.settings.tripTitle,
    code: state.settings.tripCode,
    meeting: state.settings.meetingPoint,
  });
  return `${base}?${qs.toString()}`;
}

function renderManifestTable(): void {
  const tbody = document.getElementById('manifest-tbody');
  if (!tbody) return;
  const q = manifestFilter.toLowerCase().trim();
  const filtered = state.pilgrims.filter(
    (p) =>
      !q ||
      p.fullName.toLowerCase().includes(q) ||
      p.passportNumber.toLowerCase().includes(q) ||
      p.roomNumber.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:1.25rem;color:var(--text-muted);">لا يوجد معتمرون مطابقون للبحث</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((p) => {
      const alertText = `السلام عليكم ورحمة الله وبركاته يا ${p.fullName}، ${state.settings.busNumber} يستعد للانطلاق الآن عند ${state.settings.meetingPoint}. نرجو الصعود سريعاً.`;
      const waLink = buildWhatsAppUrl(alertText, p.phone);
      return `
      <tr class="${p.boarded ? '' : 'row-pending'}">
        <th>${escapeHtml(p.fullName)}</th>
        <td>${escapeHtml(p.passportNumber)}</td>
        <td>${escapeHtml(p.roomNumber || 'غير مسكن')}</td>
        <td>
          <span class="badge ${p.nusukReady ? 'badge-success' : 'badge-warning'}">${p.nusukReady ? 'نُسك جاهز ✓' : 'نُسك معلق'}</span>
        </td>
        <td>
          <button type="button" class="badge ${p.boarded ? 'badge-success' : 'badge-warning'}" style="border:none;cursor:pointer;" data-toggle-board="${escapeHtml(p.id)}">
            ${p.boarded ? 'صعد الباص ✅' : 'لم يصعد بعد ⏳'}
          </button>
        </td>
        <td>
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
            <a href="${waLink}" target="_blank" rel="noopener" class="btn btn-secondary" style="min-height:34px;padding:0.25rem 0.55rem;font-size:0.78rem;text-decoration:none;">📲 واتساب</a>
            <button type="button" class="btn btn-primary" style="min-height:34px;padding:0.25rem 0.55rem;font-size:0.78rem;" data-share-pilgrim="${escapeHtml(p.id)}">🔗 QR البطاقة</button>
            <button type="button" class="btn btn-secondary" style="min-height:34px;padding:0.25rem 0.55rem;font-size:0.78rem;color:var(--danger);" data-delete-pilgrim="${escapeHtml(p.id)}" aria-label="حذف ${escapeHtml(p.fullName)}">🗑️</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');

  tbody.querySelectorAll<HTMLElement>('[data-toggle-board]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = state.pilgrims.find((x) => x.id === btn.dataset.toggleBoard);
      if (!p) return;
      p.boarded = !p.boarded;
      saveState();
      renderTopMetrics();
      renderManifestTable();
      showToast(p.boarded ? `✅ تم تسجيل صعود ${p.fullName}` : `⏳ تم تحويل ${p.fullName} إلى غير صاعد`);
    });
  });

  tbody.querySelectorAll<HTMLElement>('[data-share-pilgrim]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = state.pilgrims.find((x) => x.id === btn.dataset.sharePilgrim);
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
          `السلام عليكم ${p.fullName}، هذا رابط بطاقتك الذكية في تطبيق رفيق المعتمر:\n${url}`,
          p.phone
        );
      }
      openDialogById('share-pilgrim-modal');
    });
  });

  tbody.querySelectorAll<HTMLElement>('[data-delete-pilgrim]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.deletePilgrim!;
      state.pilgrims = state.pilgrims.filter((x) => x.id !== id);
      state.rooms.forEach((r) => {
        r.occupantIds = r.occupantIds.filter((oid) => oid !== id);
      });
      saveState();
      renderAll();
      showToast('تم حذف المعتمر من الكشف');
    });
  });
}

function renderRoomsBoard(): void {
  const roomSelect = document.getElementById('assign-room-select') as HTMLSelectElement | null;
  const pilgrimSelect = document.getElementById('assign-pilgrim-select') as HTMLSelectElement | null;
  const roomsGrid = document.getElementById('rooms-grid');

  if (roomSelect) {
    roomSelect.innerHTML = state.rooms
      .map(
        (r) =>
          `<option value="${escapeHtml(r.id)}">غرفة ${escapeHtml(r.roomNumber)} (${r.occupantIds.length}/${r.capacity}) ${r.isFamilyRoom ? '👨‍👩‍👧 عائلية' : ''}</option>`
      )
      .join('');
  }

  if (pilgrimSelect) {
    pilgrimSelect.innerHTML = state.pilgrims
      .map(
        (p) =>
          `<option value="${escapeHtml(p.id)}">${escapeHtml(p.fullName)} (${p.gender === Gender.MALE ? 'ذكر' : 'أنثى'})</option>`
      )
      .join('');
  }

  if (roomsGrid) {
    roomsGrid.innerHTML = state.rooms
      .map((r) => {
        const occupants = r.occupantIds
          .map((oid) => state.pilgrims.find((p) => p.id === oid))
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
              ? '<div style="font-size:0.82rem;color:var(--text-muted);">الغرفة شاغرة</div>'
              : `<ul style="margin-right:1.2rem;font-size:0.85rem;line-height:1.8;">
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
        const room = state.rooms.find((r) => r.id === btn.dataset.unassignRoom);
        const pid = btn.dataset.unassignPilgrim;
        if (!room || !pid) return;
        room.occupantIds = room.occupantIds.filter((x) => x !== pid);
        const p = state.pilgrims.find((x) => x.id === pid);
        if (p) p.roomNumber = '';
        saveState();
        renderAll();
        showToast('تم إخراج المعتمر من الغرفة');
      });
    });
  }
}

function handleAssignRoom(): void {
  const roomId = (document.getElementById('assign-room-select') as HTMLSelectElement).value;
  const pilgrimId = (document.getElementById('assign-pilgrim-select') as HTMLSelectElement).value;
  const roomRec = state.rooms.find((r) => r.id === roomId);
  const pilgrimRec = state.pilgrims.find((p) => p.id === pilgrimId);
  if (!roomRec || !pilgrimRec) return;

  if (roomRec.occupantIds.includes(pilgrimRec.id)) {
    showToast('المعتمر مسكّن بالفعل في هذه الغرفة');
    return;
  }

  // Validate using RoomingEngine from src/operations/trip-logistics.ts
  const roomEntity = new Room({
    id: roomRec.id,
    roomNumber: roomRec.roomNumber,
    hotelId: state.settings.hotelKey,
    floor: 1,
    type: roomRec.type,
    capacity: roomRec.capacity,
    isFamilyRoom: roomRec.isFamilyRoom,
  });

  for (const existingId of roomRec.occupantIds) {
    const occ = state.pilgrims.find((p) => p.id === existingId);
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

    // Remove from any previous room first
    state.rooms.forEach((r) => {
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
      showToast('⛔ مخالفة تسكين: لا يمكن دمج الرجال والنساء في غرفة غير عائلية!');
    } else if (msg.includes('capacity')) {
      showToast(`⛔ الغرفة ${roomRec.roomNumber} ممتلئة بالكامل (${roomRec.capacity} أسرّة)`);
    } else {
      showToast(`⚠️ تعذر التسكين: ${msg}`);
    }
  }
}

// =========================================================================
// TAB 2: ALL 7 WHATSAPP BROADCASTS (DYNAMIC + EDITABLE + WA.ME)
// =========================================================================
function renderWhatsAppHub(): void {
  const container = document.getElementById('whatsapp-posts-container');
  if (!container) return;

  const params = {
    tripTitle: state.settings.tripTitle,
    supervisorName: state.settings.supervisorName,
    hotelName: state.settings.hotelNameAr,
    gatheringTime: state.settings.gatheringTime,
    meetingPoint: state.settings.meetingPoint,
  };

  container.innerHTML = broadcastManager
    .getAllPhases()
    .map((phase: BroadcastPhase, idx: number) => {
      const post = broadcastManager.getFormattedPost(phase, params);
      const textareaId = `wa-post-text-${idx}`;
      return `
      <div class="card" style="margin-bottom:1.25rem;">
        <div class="card-header">
          <div class="card-title">${escapeHtml(post.title)}</div>
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
// TAB 3: INTERACTIVE GAM'EYA LEDGER
// =========================================================================
function renderGameyaTable(): void {
  const tbody = document.getElementById('gameya-tbody');
  if (!tbody) return;

  tbody.innerHTML = state.gameya
    .map((m) => {
      const remaining = Math.max(0, m.totalTarget - m.totalPaid);
      const nextInstallment = remaining === 0 ? 0 : Math.min(m.monthlyInstallment, remaining);
      const receiptText = [
        `📋 *إيصال سداد معتمد - جمعية تقسيط العمرة* 🕋`,
        `التاريخ: ${new Date().toLocaleDateString('ar-EG')}`,
        `المشترك: *${m.name}*`,
        `إجمالي المسدد: *${m.totalPaid.toLocaleString('ar-EG')} ج.م*`,
        `المتبقي: *${remaining.toLocaleString('ar-EG')} ج.م*`,
        `الحالة: *${remaining === 0 ? 'مكتمل السداد 🎉' : 'قيد السداد المنتظم ✅'}*`,
        `_${state.settings.tripTitle} — ${state.settings.supervisorName}_`,
      ].join('\n');

      const reminderText = `السلام عليكم ورحمة الله وبركاته يا ${m.name}، نود تذكيركم بموعد قسط جمعية العمرة (${state.settings.tripTitle}) بمبلغ ${nextInstallment.toLocaleString('ar-EG')} ج.م. تقبل الله طاعتكم.`;

      return `
      <tr>
        <th>${escapeHtml(m.name)}</th>
        <td dir="ltr">${escapeHtml(m.phone)}</td>
        <td>شهر ${m.turnMonth}</td>
        <td>${m.totalPaid.toLocaleString('ar-EG')} ج.م</td>
        <td>${nextInstallment.toLocaleString('ar-EG')} ج.م</td>
        <td>
          <span class="badge ${remaining === 0 ? 'badge-success' : 'badge-warning'}">
            ${remaining === 0 ? 'مكتمل السداد 🎉' : 'قيد السداد'}
          </span>
        </td>
        <td>
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
            ${remaining > 0 ? `<button type="button" class="btn btn-primary" style="min-height:34px;padding:0.25rem 0.6rem;font-size:0.78rem;" data-pay-gameya="${escapeHtml(m.id)}">+ سداد قسط</button>` : ''}
            <button type="button" class="btn btn-secondary" style="min-height:34px;padding:0.25rem 0.55rem;font-size:0.78rem;" data-copy-receipt="${escapeHtml(m.id)}">📄 نسخ إيصال</button>
            <a href="${buildWhatsAppUrl(remaining === 0 ? receiptText : reminderText, m.phone)}" target="_blank" rel="noopener" class="btn btn-gold" style="min-height:34px;padding:0.25rem 0.55rem;font-size:0.78rem;text-decoration:none;">📲 واتساب</a>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');

  tbody.querySelectorAll<HTMLElement>('[data-pay-gameya]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const m = state.gameya.find((x) => x.id === btn.dataset.payGameya);
      if (!m) return;
      m.totalPaid = Math.min(m.totalTarget, m.totalPaid + m.monthlyInstallment);
      saveState();
      renderTopMetrics();
      renderGameyaTable();
      showToast(`✅ تم تسجيل قسط ${m.monthlyInstallment.toLocaleString('ar-EG')} ج.م لـ ${m.name}`);
    });
  });

  tbody.querySelectorAll<HTMLElement>('[data-copy-receipt]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const m = state.gameya.find((x) => x.id === btn.dataset.copyReceipt);
      if (!m) return;
      const remaining = Math.max(0, m.totalTarget - m.totalPaid);
      const receipt = [
        `📋 *إيصال سداد معتمد - جمعية تقسيط العمرة* 🕋`,
        `المشترك: *${m.name}*`,
        `إجمالي المسدد: *${m.totalPaid.toLocaleString('ar-EG')} ج.م*`,
        `المتبقي: *${remaining.toLocaleString('ar-EG')} ج.م*`,
        `_${state.settings.tripTitle} — ${state.settings.supervisorName}_`,
      ].join('\n');
      void copyToClipboard(receipt, `✅ تم نسخ إيصال (${m.name})`);
    });
  });
}

// =========================================================================
// TAB 4: PRINT CENTER (REAL QR + CLEAN @media print)
// =========================================================================
function renderPrintSelectors(): void {
  const wbSelect = document.getElementById('print-wristband-pilgrim') as HTMLSelectElement | null;
  if (wbSelect) {
    wbSelect.innerHTML = state.pilgrims
      .map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.fullName)} (${escapeHtml(p.passportNumber)})</option>`)
      .join('');
  }
  const agSelect = document.getElementById('print-agreement-member') as HTMLSelectElement | null;
  if (agSelect) {
    agSelect.innerHTML = state.gameya
      .map((m) => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)}</option>`)
      .join('');
  }
}

function openWristbandPreview(): void {
  const id = (document.getElementById('print-wristband-pilgrim') as HTMLSelectElement).value;
  const p = state.pilgrims.find((x) => x.id === id) || state.pilgrims[0];
  const container = document.getElementById('wristband-print-content');
  if (!p || !container) return;

  const qrPayload = `UMRAH ${state.settings.tripCode}\nNAME: ${p.fullName}\nPP: ${p.passportNumber}\nHOTEL: ${state.settings.hotelNameEn}\nSUPERVISOR: ${state.settings.supervisorPhone}`;
  container.innerHTML = `
    <div style="border:2px solid #064e3b;border-radius:12px;padding:1.25rem;background:#ecfdf5;color:#022c22;text-align:center;">
      <div style="font-size:1.15rem;font-weight:800;">${escapeHtml(state.settings.tripTitle)} 🕋 ${escapeHtml(state.settings.tripCode)}</div>
      <div style="font-size:1.1rem;font-weight:800;margin:0.4rem 0;">${escapeHtml(p.fullName)} (${escapeHtml(p.passportNumber)})</div>
      <div style="font-size:0.88rem;">${escapeHtml(state.settings.hotelNameAr)} — غرفة ${escapeHtml(p.roomNumber || '---')}</div>
      <div style="font-size:0.95rem;font-weight:800;margin:0.4rem 0;" dir="ltr">SOS: ${escapeHtml(state.settings.supervisorPhone)}</div>
      <div style="margin:0.75rem auto;background:white;display:inline-block;padding:0.5rem;border-radius:10px;">
        ${renderQrSvg(qrPayload, `QR معصم ${p.fullName}`)}
      </div>
      <div style="font-size:0.75rem;color:#334155;">امسح الكود بكاميرا الجوال لإظهار بيانات الفندق وهاتف المشرف</div>
    </div>
  `;
  openDialogById('wristband-modal');
}

function openAgreementPreview(): void {
  const id = (document.getElementById('print-agreement-member') as HTMLSelectElement).value;
  const m = state.gameya.find((x) => x.id === id) || state.gameya[0];
  const container = document.getElementById('agreement-print-content');
  if (!m || !container) return;

  container.innerHTML = `
    <div style="border:1px solid #cbd5e1;border-radius:12px;padding:1.25rem;line-height:1.95;background:#f8fafc;color:#0f172a;">
      <h2 style="text-align:center;color:#064e3b;margin-bottom:0.75rem;font-size:1.15rem;">إقرار والتزام بسداد أقساط رحلة العمرة</h2>
      أقر أنا المشترك / المعتمر: <strong>${escapeHtml(m.name)}</strong><br>
      رقم الهاتف: <strong dir="ltr">${escapeHtml(m.phone)}</strong><br>
      بأنني انضممت لجمعية (<strong>${escapeHtml(state.settings.tripTitle)}</strong>) بإشراف المشرف (<strong>${escapeHtml(state.settings.supervisorName)}</strong>)، وملتزم بسداد القسط الشهري وقدره <strong>${m.monthlyInstallment.toLocaleString('ar-EG')} ج.م</strong> حتى استكمال كامل التكلفة المقدرة بـ <strong>${m.totalTarget.toLocaleString('ar-EG')} ج.م</strong> (المسدد حتى تاريخه: <strong>${m.totalPaid.toLocaleString('ar-EG')} ج.م</strong>).
      <div style="margin-top:1.5rem;border-top:1px dashed #94a3b8;padding-top:0.85rem;display:flex;justify-content:space-between;">
        <div>توقيع المشترك: ......................</div>
        <div>اعتماد المشرف: ${escapeHtml(state.settings.supervisorName)}</div>
      </div>
    </div>
  `;
  openDialogById('agreement-modal');
}

// =========================================================================
// TAB 5: REAL SOS LOG & OFFICIAL SAUDI RESOURCES
// =========================================================================
function renderSOSTab(): void {
  const container = document.getElementById('sos-alerts-list');
  const taxiSummary = document.getElementById('sup-taxi-hotel-box');
  if (taxiSummary) {
    taxiSummary.innerHTML = `
      🏨 <strong>${escapeHtml(state.settings.hotelNameAr)}</strong> — ${escapeHtml(state.settings.hotelAddressAr)}<br>
      📞 الاستقبال: <span dir="ltr">${escapeHtml(state.settings.hotelPhone)}</span> | 📱 المشرف: <span dir="ltr">${escapeHtml(state.settings.supervisorPhone)}</span>
    `;
  }

  if (!container) return;
  if (state.sosAlerts.length === 0) {
    container.innerHTML = `
      <div class="info-box-neutral" style="text-align:center;">
        <div style="font-size:2.4rem;margin-bottom:0.35rem;">🟢</div>
        <strong>لا توجد بلاغات تائهين مسجلة حالياً</strong>
        <p style="font-size:0.86rem;color:var(--text-muted);margin-top:0.35rem;">يمكنك تسجيل أي بلاغ وارد عبر الواتساب بإدخال الإحداثيات لحساب المسافة للفندق فوراً.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.sosAlerts
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
        ${a.phone ? `<a href="tel:${escapeHtml(a.phone)}" class="btn btn-secondary" style="min-height:36px;font-size:0.8rem;text-decoration:none;">📞 اتصال</a>` : ''}
        ${!a.resolved ? `<button type="button" class="btn btn-primary" style="min-height:36px;font-size:0.8rem;" data-resolve-sos="${escapeHtml(a.id)}">✅ تم العثور عليه</button>` : ''}
      </div>
    </div>
  `
    )
    .join('');

  container.querySelectorAll<HTMLElement>('[data-resolve-sos]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const alert = state.sosAlerts.find((x) => x.id === btn.dataset.resolveSos);
      if (!alert) return;
      alert.resolved = true;
      saveState();
      renderTopMetrics();
      renderSOSTab();
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
        <div style="font-size:0.85rem;font-weight:800;">${escapeHtml(r.titleAr)}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);font-weight:500;">${escapeHtml(r.actionLabelAr)}</div>
      </div>
    </a>
  `
  ).join('');
}

// =========================================================================
// TAB 7: LUGGAGE & MEDICAL REGISTRY (SYNCED COUNTERS + QR TAGS)
// =========================================================================
function renderLuggageSection(): void {
  const onBus = state.luggage.filter((b) => b.status === LuggageStatus.ON_BUS).length;
  const lobby = state.luggage.filter((b) => b.status === LuggageStatus.HOTEL_LOBBY).length;
  const delivered = state.luggage.filter((b) => b.status === LuggageStatus.DELIVERED_TO_ROOM).length;

  const set = (id: string, txt: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };
  set('count-lug-total', `${state.luggage.length} حقائب`);
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

  tbody.innerHTML = state.luggage
    .map((bag) => {
      const st = statusMap[bag.status];
      return `
      <tr>
        <th style="font-family:monospace;">${escapeHtml(bag.tagCode)}</th>
        <td>${escapeHtml(bag.pilgrimName)}</td>
        <td>${escapeHtml(bag.roomNumber)}</td>
        <td><span class="badge ${st.cls}">${st.label}</span></td>
        <td>
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
            <button type="button" class="btn btn-secondary" style="min-height:34px;padding:0.25rem 0.6rem;font-size:0.78rem;" data-cycle-bag="${escapeHtml(bag.id)}">تغيير الحالة 🔁</button>
            <button type="button" class="btn btn-secondary" style="min-height:34px;padding:0.25rem 0.55rem;font-size:0.78rem;color:var(--danger);" data-del-bag="${escapeHtml(bag.id)}">🗑️</button>
          </div>
        </td>
      </tr>
    `;
    })
    .join('');

  tbody.querySelectorAll<HTMLElement>('[data-cycle-bag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const bag = state.luggage.find((x) => x.id === btn.dataset.cycleBag);
      if (!bag) return;
      const order = [
        LuggageStatus.ON_BUS,
        LuggageStatus.HOTEL_LOBBY,
        LuggageStatus.DELIVERED_TO_ROOM,
        LuggageStatus.LOST,
      ];
      bag.status = order[(order.indexOf(bag.status) + 1) % order.length];
      saveState();
      renderLuggageSection();
      showToast(`تم تحديث حالة ${bag.tagCode}`);
    });
  });

  tbody.querySelectorAll<HTMLElement>('[data-del-bag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.luggage = state.luggage.filter((x) => x.id !== btn.dataset.delBag);
      saveState();
      renderLuggageSection();
    });
  });
}

function openLuggagePrintModal(): void {
  const grid = document.getElementById('luggage-tags-print-grid');
  if (!grid) return;
  grid.innerHTML = state.luggage
    .map((bag) => {
      const qrText = `${bag.tagCode} | ROOM: ${bag.roomNumber} | ${bag.pilgrimName} | ${state.settings.hotelNameEn} | TEL: ${state.settings.supervisorPhone}`;
      return `
      <div style="border:2px dashed #064e3b;border-radius:10px;padding:0.85rem;background:#f0fdf4;color:#022c22;text-align:center;">
        <div style="font-weight:800;font-size:0.9rem;">${escapeHtml(state.settings.tripTitle)} 🕋</div>
        <div style="font-size:1.15rem;font-weight:900;color:#b45309;margin:0.25rem 0;">غرفة [ ${escapeHtml(bag.roomNumber)} ]</div>
        <div style="font-size:0.86rem;font-weight:700;">${escapeHtml(bag.pilgrimName)}</div>
        <div style="font-size:0.75rem;">${escapeHtml(state.settings.hotelNameAr)}</div>
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
  const list = document.getElementById('medical-cards-list');
  const badge = document.getElementById('medical-count-badge');
  if (badge) badge.textContent = `${state.medical.length} حالات مسجلة`;
  if (!list) return;

  list.innerHTML = state.medical
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
      <p style="font-size:0.84rem;color:var(--text-muted);margin-bottom:0.35rem;">${escapeHtml(m.notes)}</p>
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;font-size:0.84rem;">
        <span>مرافق الطوارئ: <strong>${escapeHtml(m.emergencyContactName)}</strong> (<span dir="ltr">${escapeHtml(m.emergencyContactPhone)}</span>)</span>
        <button type="button" class="btn btn-secondary" style="min-height:32px;padding:0.2rem 0.5rem;font-size:0.75rem;color:var(--danger);" data-del-med="${escapeHtml(m.id)}">حذف</button>
      </div>
    </div>
  `
    )
    .join('');

  list.querySelectorAll<HTMLElement>('[data-del-med]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.medical = state.medical.filter((x) => x.id !== btn.dataset.delMed);
      saveState();
      renderMedicalSection();
    });
  });
}

// =========================================================================
// TAB SWITCHING & CSV EXPORT
// =========================================================================
function switchTab(tab: string): void {
  const tabs = ['manifest', 'whatsapp', 'gameya', 'print', 'sos', 'women-guide', 'logistics-health'];
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
      btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    } else {
      btn.removeAttribute('aria-current');
    }
  });
}

function exportManifestCSV(): void {
  const rows = [
    ['اسم المعتمر', 'النوع', 'رقم الجواز', 'الهاتف', 'الغرفة', 'حالة الباص', 'حالة نُسك'],
    ...state.pilgrims.map((p) => [
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
  a.download = `umrah_manifest_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('📥 تم تنزيل كشف المعتمرين (CSV / Excel)');
}

// =========================================================================
// BOOTSTRAP
// =========================================================================
window.addEventListener('DOMContentLoaded', () => {
  initThemeSync();
  setupDialogs();
  registerServiceWorkerAndNetworkStatus();

  loadState();
  renderAll();

  document.querySelectorAll<HTMLButtonElement>('[data-tab-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.tabTarget) switchTab(btn.dataset.tabTarget);
    });
  });

  document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleColorScheme);

  // Settings Modal
  document.getElementById('btn-open-settings')?.addEventListener('click', () => {
    (document.getElementById('set-trip-title') as HTMLInputElement).value = state.settings.tripTitle;
    (document.getElementById('set-trip-code') as HTMLInputElement).value = state.settings.tripCode;
    (document.getElementById('set-bus-num') as HTMLInputElement).value = state.settings.busNumber;
    (document.getElementById('set-hotel-key') as HTMLSelectElement).value = state.settings.hotelKey;
    (document.getElementById('set-sup-name') as HTMLInputElement).value = state.settings.supervisorName;
    (document.getElementById('set-sup-phone') as HTMLInputElement).value = state.settings.supervisorPhone;
    (document.getElementById('set-meeting') as HTMLInputElement).value = state.settings.meetingPoint;
    openDialogById('settings-modal');
  });

  document.getElementById('settings-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const key = (document.getElementById('set-hotel-key') as HTMLSelectElement).value;
    const preset = HOTEL_PRESETS[key] || HOTEL_PRESETS.kiswah;
    state.settings = {
      ...state.settings,
      tripTitle: (document.getElementById('set-trip-title') as HTMLInputElement).value.trim() || state.settings.tripTitle,
      tripCode: (document.getElementById('set-trip-code') as HTMLInputElement).value.trim() || state.settings.tripCode,
      busNumber: (document.getElementById('set-bus-num') as HTMLInputElement).value.trim() || state.settings.busNumber,
      hotelKey: key,
      hotelNameAr: preset.nameAr,
      hotelNameEn: preset.nameEn,
      hotelAddressAr: preset.addressAr,
      hotelPhone: preset.phone,
      hotelLat: preset.lat,
      hotelLng: preset.lng,
      supervisorName: (document.getElementById('set-sup-name') as HTMLInputElement).value.trim() || state.settings.supervisorName,
      supervisorPhone: (document.getElementById('set-sup-phone') as HTMLInputElement).value.trim() || state.settings.supervisorPhone,
      meetingPoint: (document.getElementById('set-meeting') as HTMLInputElement).value.trim() || state.settings.meetingPoint,
    };
    saveState();
    renderAll();
    closeDialogById('settings-modal');
    showToast('✅ تم تحديث إعدادات الفوج والفندق في جميع التبويبات');
  });

  // Add Pilgrim Form
  document.getElementById('add-pilgrim-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fullName = (document.getElementById('new-pilgrim-name') as HTMLInputElement).value.trim();
    const passportNumber = (document.getElementById('new-pilgrim-passport') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('new-pilgrim-phone') as HTMLInputElement).value.trim();
    const gender = (document.getElementById('new-pilgrim-gender') as HTMLSelectElement).value as Gender;
    if (!fullName || !passportNumber) return;

    state.pilgrims.push({
      id: `p-${Date.now()}`,
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
    form.reset();
    showToast(`✅ تمت إضافة المعتمر: ${fullName}`);
  });

  document.getElementById('manifest-search')?.addEventListener('input', (e) => {
    manifestFilter = (e.target as HTMLInputElement).value;
    renderManifestTable();
  });

  document.getElementById('btn-export-csv')?.addEventListener('click', exportManifestCSV);

  // Add Room + Assign Room
  document.getElementById('add-room-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
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
    state.rooms.push({
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

  // Gam'eya Add Member
  document.getElementById('add-gameya-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (document.getElementById('new-gam-name') as HTMLInputElement).value.trim();
    const phone = (document.getElementById('new-gam-phone') as HTMLInputElement).value.trim();
    const target = Number((document.getElementById('new-gam-target') as HTMLInputElement).value) || 40000;
    const monthly = Number((document.getElementById('new-gam-monthly') as HTMLInputElement).value) || 4000;
    if (!name) return;

    state.gameya.push({
      id: `g-${Date.now()}`,
      name,
      phone,
      turnMonth: state.gameya.length + 1,
      totalTarget: target,
      monthlyInstallment: monthly,
      totalPaid: 0,
    });
    saveState();
    renderAll();
    (e.target as HTMLFormElement).reset();
    showToast(`✅ تم تسجيل ${name} في الجمعية`);
  });

  // Print center
  document.getElementById('btn-open-wristband')?.addEventListener('click', openWristbandPreview);
  document.getElementById('btn-open-agreement')?.addEventListener('click', openAgreementPreview);
  document.getElementById('btn-open-luggage-print')?.addEventListener('click', openLuggagePrintModal);
  document.querySelectorAll<HTMLElement>('.btn-print-active').forEach((b) => {
    b.addEventListener('click', () => window.print());
  });

  // Copy Pilgrim Share URL
  document.getElementById('btn-copy-share-url')?.addEventListener('click', () => {
    const val = (document.getElementById('share-pilgrim-url') as HTMLInputElement).value;
    void copyToClipboard(val, '✅ تم نسخ رابط بطاقة المعتمر');
  });

  // Log SOS Alert manually (from WhatsApp GPS message)
  document.getElementById('add-sos-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (document.getElementById('sos-pilgrim-name') as HTMLInputElement).value.trim();
    const coordsRaw = (document.getElementById('sos-coords') as HTMLInputElement).value.trim();
    const notes = (document.getElementById('sos-notes') as HTMLInputElement).value.trim() || 'بلاغ تائه';
    const [latStr, lngStr] = coordsRaw.split(',').map((s) => s.trim());
    const lat = Number(latStr) || 21.4225;
    const lng = Number(lngStr) || 39.8262;

    const dispatcher = new EmergencySOSDispatcher(
      new Hotel({
        id: state.settings.hotelKey,
        nameAr: state.settings.hotelNameAr,
        nameEn: state.settings.hotelNameEn,
        city: 'MAKKAH',
        addressAr: state.settings.hotelAddressAr,
        addressEn: state.settings.hotelAddressAr,
        phone: state.settings.hotelPhone,
        latitude: state.settings.hotelLat,
        longitude: state.settings.hotelLng,
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

    state.sosAlerts.unshift({
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
    showToast(`🚨 تم تسجيل بلاغ ${alert.pilgrimName} وحساب المسافة للفندق`);
  });

  // Women's WhatsApp copy & open
  document.querySelectorAll<HTMLElement>('[data-copy-box]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const box = document.getElementById(btn.dataset.copyBox!);
      if (box) void copyToClipboard(box.textContent || '', '✅ تم نسخ الرسالة');
    });
  });

  // Luggage add
  document.getElementById('add-bag-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (document.getElementById('new-bag-name') as HTMLInputElement).value.trim();
    const room = (document.getElementById('new-bag-room') as HTMLInputElement).value.trim();
    const type = (document.getElementById('new-bag-type') as HTMLSelectElement).value as BagType;
    if (!name || !room) return;
    const count = state.luggage.filter((b) => b.roomNumber === room).length + 1;
    state.luggage.push({
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

  // Medical add
  document.getElementById('add-med-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = (document.getElementById('new-med-name') as HTMLInputElement).value.trim();
    const room = (document.getElementById('new-med-room') as HTMLInputElement).value.trim();
    const ecName = (document.getElementById('new-med-ec-name') as HTMLInputElement).value.trim();
    const ecPhone = (document.getElementById('new-med-ec-phone') as HTMLInputElement).value.trim();
    const notes = (document.getElementById('new-med-notes') as HTMLInputElement).value.trim();
    const wheelchair = (document.getElementById('new-med-wheelchair') as HTMLInputElement).checked;
    const cart = (document.getElementById('new-med-cart') as HTMLInputElement).checked;
    const insulin = (document.getElementById('new-med-insulin') as HTMLInputElement).checked;
    if (!name) return;

    state.medical.push({
      id: `m-${Date.now()}`,
      pilgrimName: name,
      roomNumber: room || '---',
      conditions: [ChronicCondition.NONE],
      requiresWheelchair: wheelchair,
      requiresElectricCart: cart,
      requiresInsulinRefrigeration: insulin,
      emergencyContactName: ecName || 'المشرف',
      emergencyContactPhone: ecPhone || state.settings.supervisorPhone,
      notes: notes || 'متابعة رعاية خاصة',
    });
    saveState();
    renderMedicalSection();
    (e.target as HTMLFormElement).reset();
    showToast(`✅ تمت إضافة الملف الصحي لـ ${name}`);
  });

  // Dialog close buttons
  document.querySelectorAll<HTMLElement>('[data-close-dialog]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.closeDialog;
      if (id) closeDialogById(id);
    });
  });

  // Reset demo data
  document.getElementById('btn-reset-demo')?.addEventListener('click', () => {
    state = createInitialState();
    saveState();
    renderAll();
    showToast('🔄 تمت استعادة البيانات الافتراضية');
  });
});
