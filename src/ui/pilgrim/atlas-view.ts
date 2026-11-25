import { ZiyaratGuideCatalog, ZiyaratCity } from '../../guidance/ziyarat-guide.js';
import { HaramainBestPracticesCatalog } from '../../guidance/rituals-and-best-practices.js';
import { HaramGatesGuide } from '../../guidance/haram-gates-guide.js';
import { HaramainAtlasCatalog } from '../../guidance/haramain-gates-and-services.js';
import { MIQAT_ROUTE_GUIDES } from '../../guidance/official-resources.js';
import { escapeHtml, showToast } from '../shared.js';

const ziyaratCatalog = new ZiyaratGuideCatalog();
const haramainCatalog = new HaramainBestPracticesCatalog();
const gatesGuide = new HaramGatesGuide();
const haramainAtlas = new HaramainAtlasCatalog();

export function renderZiyaratAndFieldGuides(): void {
  const madinahContainer = document.getElementById('ziyarat-madinah-grid');
  const makkahContainer = document.getElementById('ziyarat-makkah-grid');
  const renderCard = (s: ReturnType<ZiyaratGuideCatalog['getAllSites']>[number]) => `
    <article class="card">
      ${
        s.imageUrl
          ? `<img class="landmark-card-img" src="${escapeHtml(s.imageUrl)}" alt="${escapeHtml(s.imageAltAr || s.nameAr)}" loading="lazy" width="800" height="500">`
          : ''
      }
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

export function renderHaramAtlasSection(filter: string = 'ALL'): void {
  const cardsContainer = document.getElementById('haram-atlas-cards');
  const benefitsContainer = document.getElementById('haram-benefits-grid');
  if (cardsContainer) {
    const all = haramainAtlas.getAllLandmarksAndGates();
    const filtered = all.filter((item) => {
      if (filter === 'ALL') return true;
      if (filter === 'KAABA_CORE') return item.category === 'KAABA_CORE' || item.category === 'MAKKAH_FACILITY';
      if (filter === 'MAKKAH_GATE') return item.category === 'MAKKAH_GATE';
      if (filter === 'MADINAH_ALL') return item.city === 'MADINAH';
      return true;
    });

    cardsContainer.innerHTML = filtered
      .map(
        (item) => `
      <article class="card">
        <img class="landmark-card-img" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.imageAltAr)}" loading="lazy" width="800" height="500">
        <div class="card-header">
          <h3 class="card-title">${escapeHtml(item.nameAr)}</h3>
          <span class="badge ${item.city === 'MADINAH' ? 'badge-warning' : 'badge-primary'}">
            ${item.gateNumber ? `بوابة ${item.gateNumber}` : item.city === 'MADINAH' ? 'المسجد النبوي' : 'المسجد الحرام'}
          </span>
        </div>
        <div style="font-size:0.82rem;font-weight:700;color:var(--gold-dark);margin-bottom:0.4rem;">
          🧭 ${escapeHtml(item.directionAr)} • ${escapeHtml(item.areaOrLandmarkAr)}
        </div>
        <p style="font-size:0.9rem;line-height:1.75;margin-bottom:0.65rem;">${escapeHtml(item.summaryAr)}</p>
        <div class="info-box-neutral">
          <strong>الخدمات والمنافع المتاحة هنا:</strong>
          <ul class="benefits-list">
            ${item.benefitsAndServicesAr.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
          </ul>
          ${item.hotelAccessNoteAr ? `<div style="margin-top:0.45rem;font-size:0.84rem;color:var(--primary-ink);font-weight:700;">🏨 ${escapeHtml(item.hotelAccessNoteAr)}</div>` : ''}
        </div>
      </article>
    `
      )
      .join('');
  }

  if (benefitsContainer) {
    benefitsContainer.innerHTML = haramainAtlas
      .getAllBenefits()
      .map(
        (b) => `
      <article class="info-box-neutral">
        ${
          b.imageUrl
            ? `<img class="landmark-card-img" src="${escapeHtml(b.imageUrl)}" alt="${escapeHtml(b.imageAltAr || b.titleAr)}" loading="lazy" width="800" height="500">`
            : ''
        }
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.4rem;">
          <strong style="color:var(--primary-ink);">${escapeHtml(b.titleAr)}</strong>
          <span class="badge badge-success">${escapeHtml(b.categoryAr)}</span>
        </div>
        <div style="font-size:0.84rem;color:var(--gold-dark);font-weight:700;margin-bottom:0.35rem;">📍 ${escapeHtml(b.whereToFindAr)}</div>
        <p style="font-size:0.88rem;line-height:1.7;">${escapeHtml(b.howToBenefitAr)}</p>
      </article>
    `
      )
      .join('');
  }
}

export function renderGateWayfinder(): void {
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
      ${
        g!.imageUrl
          ? `<img class="gate-photo-thumb" src="${escapeHtml(g!.imageUrl)}" alt="${escapeHtml(g!.imageAltAr || g!.nameAr)}" loading="lazy" width="340" height="212">`
          : ''
      }
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

export function detectNearestHaramGate(): void {
  const resultBox = document.getElementById('nearest-gate-compass-box');
  if (!resultBox) return;

  if (!('geolocation' in navigator)) {
    resultBox.hidden = false;
    resultBox.innerHTML = '⚠️ المتصفح لا يدعم خدمة تحديد الموقع GPS.';
    return;
  }

  resultBox.hidden = false;
  resultBox.innerHTML = '📡 جاري تحديد موقعك وحساب أقرب بوابة للمسجد الحرام...';

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const match = gatesGuide.findNearestGate(pos.coords.latitude, pos.coords.longitude);
      const g = match.gate;
      resultBox.innerHTML = `
        <div style="display:flex;gap:0.85rem;align-items:center;flex-wrap:wrap;">
          ${g.imageUrl ? `<img class="gate-photo-thumb" style="max-width:170px;margin-bottom:0;" src="${escapeHtml(g.imageUrl)}" alt="${escapeHtml(g.imageAltAr || g.nameAr)}" width="170" height="106">` : ''}
          <div style="flex:1;min-width:210px;">
            <div style="font-weight:800;font-size:1.02rem;color:var(--primary-ink);">🧭 أقرب بوابة لك الآن: ${escapeHtml(g.nameAr)} (بوابة ${g.gateNumber})</div>
            <div style="font-size:0.88rem;margin:0.25rem 0;">📏 المسافة التقريبية: <strong>${match.distanceMeters.toLocaleString('ar-EG')} متر</strong> • الاتجاه: <strong>${escapeHtml(match.directionAr)}</strong> (${match.bearingDegrees}°)</div>
            <div style="font-size:0.85rem;color:var(--text-muted);">${escapeHtml(g.howToReachHotelAr)}</div>
          </div>
        </div>
      `;
      showToast(`🧭 أقرب بوابة: ${g.nameAr} (${match.distanceMeters}م)`);
    },
    () => {
      // Offline indoor fallback helper: guide pilgrim cleanly
      resultBox.innerHTML =
        'ℹ️ تعذر التقاط GPS داخل المبنى المسقوف — انظر لأقرب عمود مرقم وأخبر رجل الأمن باسم فندقك، أو افتح اللوحات المضيئة باتجاه باب الملك فهد (79) وباب العمرة (62) وباب الفتح (45).';
    },
    { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 }
  );
}
