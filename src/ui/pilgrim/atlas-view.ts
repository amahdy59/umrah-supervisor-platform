import { ZiyaratGuideCatalog, ZiyaratCity } from '../../guidance/ziyarat-guide.js';
import { HaramainBestPracticesCatalog } from '../../guidance/rituals-and-best-practices.js';
import { HaramGatesGuide } from '../../guidance/haram-gates-guide.js';
import { HaramainAtlasCatalog } from '../../guidance/haramain-gates-and-services.js';
import { MIQAT_ROUTE_GUIDES } from '../../guidance/official-resources.js';
import { escapeHtml, showToast } from '../shared.js';
import { getCurrentLanguage } from '../i18n.js';
import { renderReferencePillsHtml } from '../references-ui.js';
import {
  bearingDirectionLabel,
  FIELD_GUIDES_EN,
  HARAM_ATLAS_EN,
  HARAM_BENEFITS_EN,
  HARAM_GATES_EN,
  MIQAT_ROUTES_EN,
  ZIYARAT_SITES_EN,
} from '../guidance-en.js';

const ziyaratCatalog = new ZiyaratGuideCatalog();
const haramainCatalog = new HaramainBestPracticesCatalog();
const gatesGuide = new HaramGatesGuide();
const haramainAtlas = new HaramainAtlasCatalog();

export interface CompassHotelTarget {
  hotelKey: string;
  hotelNameAr: string;
  hotelNameEn: string;
  hotelLat: number;
  hotelLng: number;
  city?: 'MAKKAH' | 'MADINAH';
}

export function renderZiyaratAndFieldGuides(): void {
  const isEn = getCurrentLanguage() === 'en';
  const madinahContainer = document.getElementById('ziyarat-madinah-grid');
  const makkahContainer = document.getElementById('ziyarat-makkah-grid');

  const renderCard = (s: ReturnType<ZiyaratGuideCatalog['getAllSites']>[number]) => {
    const en = ZIYARAT_SITES_EN[s.id];
    const title = isEn ? s.nameEn : s.nameAr;
    const alt = isEn ? s.nameEn : s.imageAltAr || s.nameAr;
    const cityLabel =
      s.city === ZiyaratCity.MADINAH
        ? isEn
          ? 'Madinah'
          : 'المدينة المنورة'
        : isEn
          ? 'Makkah'
          : 'مكة المكرمة';
    const virtue = isEn && en ? en.virtueEn : s.virtueAr;
    const etiquette = isEn && en ? en.etiquetteEn : s.sunnahEtiquette;
    const warning = s.bidahWarnings ? (isEn && en?.warningsEn ? en.warningsEn : s.bidahWarnings) : '';
    const times = s.recommendedTimes ? (isEn && en?.timesEn ? en.timesEn : s.recommendedTimes) : '';

    return `
    <article class="card">
      ${
        s.imageUrl
          ? `<button type="button" class="img-zoom-btn" data-zoom-src="${escapeHtml(s.imageUrl)}" data-zoom-title="${escapeHtml(title)}" data-zoom-alt="${escapeHtml(alt)}" aria-label="${isEn ? `Zoom photo of ${escapeHtml(title)}` : `تكبير صورة ${escapeHtml(title)}`}">
              <img class="landmark-card-img" src="${escapeHtml(s.imageUrl)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" width="800" height="500">
            </button>`
          : ''
      }
      <div class="card-header">
        <h3 class="card-title">${escapeHtml(title)}</h3>
        <span class="badge badge-primary">${cityLabel}</span>
      </div>
      <p style="font-size:0.92rem;line-height:1.75;margin-bottom:0.75rem;">${escapeHtml(virtue)}</p>
      <div class="info-box-neutral" style="margin-bottom:0.5rem;">
        <strong>${isEn ? 'Sunnah Etiquette:' : 'الآداب والهَدْي:'}</strong> ${escapeHtml(etiquette)}
      </div>
      ${warning ? `<div class="info-box-danger" style="margin-bottom:0.5rem;"><strong>${isEn ? '⚠️ Caution:' : '⚠️ تحذيرات هامة:'}</strong> ${escapeHtml(warning)}</div>` : ''}
      ${times ? `<div style="font-size:0.84rem;color:var(--gold-dark);font-weight:700;">⏰ ${escapeHtml(times)}</div>` : ''}
      ${renderReferencePillsHtml(s.references, isEn)}
    </article>
  `;
  };

  if (madinahContainer) {
    madinahContainer.innerHTML = ziyaratCatalog.getSitesByCity(ZiyaratCity.MADINAH).map(renderCard).join('');
  }
  if (makkahContainer) {
    makkahContainer.innerHTML = ziyaratCatalog.getSitesByCity(ZiyaratCity.MAKKAH).map(renderCard).join('');
  }

  const miqatContainer = document.getElementById('miqat-routes-grid');
  if (miqatContainer) {
    miqatContainer.innerHTML = MIQAT_ROUTE_GUIDES.map((m) => {
      const en = MIQAT_ROUTES_EN[m.id];
      return `
      <div class="info-box-neutral">
        <div style="font-weight:800;color:var(--primary-ink);margin-bottom:0.25rem;">${escapeHtml(isEn && en ? en.routeEn : m.routeAr)}</div>
        <div style="font-size:0.86rem;font-weight:700;color:var(--gold-dark);margin-bottom:0.3rem;">${isEn ? 'Miqat:' : 'الميقات:'} ${escapeHtml(isEn && en ? en.miqatEn : m.miqatNameAr)}</div>
        <p style="font-size:0.86rem;line-height:1.65;">${escapeHtml(isEn && en ? en.timingEn : m.timingGuidanceAr)}</p>
        ${renderReferencePillsHtml(m.references, isEn)}
      </div>
    `;
    }).join('');
  }

  const fieldContainer = document.getElementById('haramain-field-guides');
  if (fieldContainer) {
    fieldContainer.innerHTML = haramainCatalog
      .getAllGuides()
      .map((g) => {
        const en = FIELD_GUIDES_EN[g.id];
        return `
      <div class="info-box-neutral">
        <div style="display:flex;justify-content:space-between;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.35rem;">
          <strong style="color:var(--primary-ink);">${escapeHtml(isEn ? g.titleEn : g.titleAr)}</strong>
          ${g.officialSource ? `<span class="badge badge-success">${escapeHtml(isEn && en ? en.sourceEn : g.officialSource)}</span>` : ''}
        </div>
        <p style="font-size:0.88rem;line-height:1.7;">${escapeHtml(isEn && en ? en.adviceEn : g.practicalAdvice)}</p>
      </div>
    `;
      })
      .join('');
  }
}

export function renderHaramAtlasSection(filter: string = 'ALL'): void {
  const isEn = getCurrentLanguage() === 'en';
  const cardsContainer = document.getElementById('haram-atlas-cards');
  const benefitsContainer = document.getElementById('haram-benefits-grid');
  const ziyaratWrap = document.getElementById('atlas-ziyarat-wrap');
  const servicesWrap = document.getElementById('atlas-services-wrap');

  const showAtlasCards = filter === 'ALL' || filter === 'KAABA_CORE' || filter === 'MAKKAH_GATE' || filter === 'MADINAH_ALL';
  const showZiyarat = filter === 'ALL' || filter === 'ZIYARAT';
  const showServices = filter === 'ALL' || filter === 'SERVICES';

  if (ziyaratWrap) ziyaratWrap.hidden = !showZiyarat;
  if (servicesWrap) servicesWrap.hidden = !showServices;

  if (cardsContainer) {
    cardsContainer.hidden = !showAtlasCards;
    if (showAtlasCards) {
      const all = haramainAtlas.getAllLandmarksAndGates();
      const filtered = all.filter((item) => {
        if (filter === 'ALL') return true;
        if (filter === 'KAABA_CORE') return item.category === 'KAABA_CORE' || item.category === 'MAKKAH_FACILITY';
        if (filter === 'MAKKAH_GATE') return item.category === 'MAKKAH_GATE';
        if (filter === 'MADINAH_ALL') return item.city === 'MADINAH';
        return true;
      });

      cardsContainer.innerHTML = filtered
        .map((item) => {
          const en = HARAM_ATLAS_EN[item.id];
          const title = isEn ? item.nameEn : item.nameAr;
          const alt = isEn ? item.nameEn : item.imageAltAr;
          const badgeText = item.gateNumber
            ? isEn
              ? `Gate ${item.gateNumber}`
              : `بوابة ${item.gateNumber}`
            : item.city === 'MADINAH'
              ? isEn
                ? 'Prophet Mosque'
                : 'المسجد النبوي'
              : isEn
                ? 'Masjid al-Haram'
                : 'المسجد الحرام';
          const direction = isEn && en ? en.directionEn : item.directionAr;
          const area = isEn && en ? en.areaEn : item.areaOrLandmarkAr;
          const summary = isEn && en ? en.summaryEn : item.summaryAr;
          const benefits = isEn && en ? en.benefitsEn : item.benefitsAndServicesAr;
          const hotelNote = item.hotelAccessNoteAr
            ? isEn && en?.hotelAccessNoteEn
              ? en.hotelAccessNoteEn
              : item.hotelAccessNoteAr
            : '';

          return `
        <article class="card" id="atlas-card-${escapeHtml(item.id)}">
          <button type="button" class="img-zoom-btn" data-zoom-src="${escapeHtml(item.imageUrl)}" data-zoom-title="${escapeHtml(title)}" data-zoom-alt="${escapeHtml(alt)}" aria-label="${isEn ? `Zoom photo of ${escapeHtml(title)}` : `تكبير صورة ${escapeHtml(title)}`}">
            <img class="landmark-card-img" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" width="800" height="500">
          </button>
          <div class="card-header">
            <h3 class="card-title">${escapeHtml(title)}</h3>
            <span class="badge ${item.city === 'MADINAH' ? 'badge-warning' : 'badge-primary'}">
              ${escapeHtml(badgeText)}
            </span>
          </div>
          <div style="font-size:0.82rem;font-weight:700;color:var(--gold-dark);margin-bottom:0.4rem;">
            🧭 ${escapeHtml(direction)} • ${escapeHtml(area)}
          </div>
          <p style="font-size:0.9rem;line-height:1.75;margin-bottom:0.65rem;">${escapeHtml(summary)}</p>
          <div class="info-box-neutral">
            <strong>${isEn ? 'Available Services & Benefits:' : 'الخدمات والمنافع المتاحة هنا:'}</strong>
            <ul class="benefits-list">
              ${benefits.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
            </ul>
            ${hotelNote ? `<div style="margin-top:0.45rem;font-size:0.84rem;color:var(--primary-ink);font-weight:700;">🏨 ${escapeHtml(hotelNote)}</div>` : ''}
          </div>
          ${renderReferencePillsHtml(item.references, isEn)}
        </article>
      `;
        })
        .join('');
    }
  }

  if (benefitsContainer && showServices) {
    benefitsContainer.innerHTML = haramainAtlas
      .getAllBenefits()
      .map((b) => {
        const en = HARAM_BENEFITS_EN[b.id];
        const title = isEn && en ? en.titleEn : b.titleAr;
        const alt = isEn && en ? en.titleEn : b.imageAltAr || b.titleAr;
        return `
      <article class="info-box-neutral" id="benefit-card-${escapeHtml(b.id)}">
        ${
          b.imageUrl
            ? `<button type="button" class="img-zoom-btn" data-zoom-src="${escapeHtml(b.imageUrl)}" data-zoom-title="${escapeHtml(title)}" data-zoom-alt="${escapeHtml(alt)}" aria-label="${isEn ? `Zoom photo of ${escapeHtml(title)}` : `تكبير صورة ${escapeHtml(title)}`}">
                <img class="landmark-card-img" src="${escapeHtml(b.imageUrl)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" width="800" height="500">
              </button>`
            : ''
        }
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.4rem;">
          <strong style="color:var(--primary-ink);">${escapeHtml(title)}</strong>
          <span class="badge badge-success">${escapeHtml(isEn && en ? en.categoryEn : b.categoryAr)}</span>
        </div>
        <div style="font-size:0.84rem;color:var(--gold-dark);font-weight:700;margin-bottom:0.35rem;">📍 ${escapeHtml(isEn && en ? en.whereToFindEn : b.whereToFindAr)}</div>
        <p style="font-size:0.88rem;line-height:1.7;">${escapeHtml(isEn && en ? en.howToBenefitEn : b.howToBenefitAr)}</p>
        ${renderReferencePillsHtml(b.references, isEn)}
      </article>
    `;
      })
      .join('');
  }
}

export function renderGateWayfinder(): void {
  const isEn = getCurrentLanguage() === 'en';
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
    .map((g) => {
      const en = HARAM_GATES_EN[g!.gateNumber];
      const title = isEn ? g!.nameEn : g!.nameAr;
      const alt = isEn ? g!.nameEn : g!.imageAltAr || g!.nameAr;
      const area = isEn && en ? en.nearestAreaEn : g!.nearestAreaAr;
      const reach = isEn && en ? en.howToReachEn : g!.howToReachHotelAr;
      const warn = g!.avoidWarningAr ? (isEn && en?.avoidWarningEn ? en.avoidWarningEn : g!.avoidWarningAr) : '';
      return `
    <div style="margin-bottom:0.85rem;">
      ${
        g!.imageUrl
          ? `<button type="button" class="img-zoom-btn img-zoom-btn-thumb" data-zoom-src="${escapeHtml(g!.imageUrl)}" data-zoom-title="${escapeHtml(title)}" data-zoom-alt="${escapeHtml(alt)}" aria-label="${isEn ? `Zoom photo of ${escapeHtml(title)}` : `تكبير صورة ${escapeHtml(title)}`}">
              <img class="gate-photo-thumb" src="${escapeHtml(g!.imageUrl)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" width="340" height="212">
            </button>`
          : ''
      }
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.35rem;">
        <span style="font-size:1.05rem;font-weight:800;color:var(--primary-ink);">🚪 ${escapeHtml(title)} (${isEn ? `Gate ${g!.gateNumber}` : `بوابة ${g!.gateNumber}`})</span>
        <span class="badge badge-success">${isEn ? 'Nearest exit:' : 'أقرب مخرج:'} ${escapeHtml(area)}</span>
      </div>
      <p style="font-size:0.93rem;line-height:1.75;margin-bottom:0.35rem;"><strong>${isEn ? 'Route to Hotel:' : 'طريقة الوصول للفندق:'}</strong> ${escapeHtml(reach)}</p>
      ${warn ? `<div style="font-size:0.86rem;color:var(--danger);font-weight:700;">⚠️ ${escapeHtml(warn)}</div>` : ''}
      ${renderReferencePillsHtml(g!.references, isEn)}
    </div>
  `;
    })
    .join('<hr style="border:none;border-top:1px dashed var(--border);margin:0.75rem 0;">');
}

export function detectNearestHaramGate(target?: CompassHotelTarget): void {
  const isEn = getCurrentLanguage() === 'en';
  const resultBox = document.getElementById('nearest-gate-compass-box');
  if (!resultBox) return;

  if (!('geolocation' in navigator)) {
    resultBox.hidden = false;
    resultBox.innerHTML = isEn
      ? '⚠️ GPS location is not supported in this browser.'
      : '⚠️ المتصفح لا يدعم خدمة تحديد الموقع GPS.';
    return;
  }

  resultBox.hidden = false;
  resultBox.innerHTML = isEn
    ? '📡 Detecting your GPS coordinates and nearest Masjid al-Haram / Nabawi gate...'
    : '📡 جاري تحديد موقعك وحساب أقرب بوابة واتجاه العودة لفندقك...';

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const hotelKey = target?.hotelKey || 'kiswah';
      const hotelLat = target?.hotelLat ?? 21.4312;
      const hotelLng = target?.hotelLng ?? 39.8165;
      const route = gatesGuide.findHotelReturnRoute(
        pos.coords.latitude,
        pos.coords.longitude,
        hotelLat,
        hotelLng,
        hotelKey,
        target?.city
      );
      const match = route.nearestNow;
      const g = match.gate;
      const en = g.city === 'MAKKAH' ? HARAM_GATES_EN[g.gateNumber] : undefined;
      const title = isEn ? g.nameEn : g.nameAr;
      const dir = bearingDirectionLabel(match.bearingDegrees, isEn);
      const hotelDir = bearingDirectionLabel(route.bearingToHotelDegrees, isEn);
      const reach = isEn && en ? en.howToReachEn : g.howToReachHotelAr;
      const recGate = route.recommendedExits[0];
      const hotelName = target ? (isEn ? target.hotelNameEn : target.hotelNameAr) : isEn ? 'Your Hotel' : 'فندقك';

      resultBox.innerHTML = `
        <div style="display:flex;gap:0.85rem;align-items:center;flex-wrap:wrap;">
          ${g.imageUrl ? `<img class="gate-photo-thumb" style="max-width:170px;margin-bottom:0;" src="${escapeHtml(g.imageUrl)}" alt="${escapeHtml(isEn ? title : g.imageAltAr || g.nameAr)}" width="170" height="106">` : ''}
          <div style="flex:1;min-width:210px;">
            <div style="font-weight:800;font-size:1.02rem;color:var(--primary-ink);">${isEn ? `🧭 Nearest Gate Now: ${escapeHtml(title)} (Gate ${g.gateNumber})` : `🧭 أقرب بوابة لك الآن: ${escapeHtml(g.nameAr)} (بوابة ${g.gateNumber})`}</div>
            <div style="font-size:0.88rem;margin:0.25rem 0;">📏 ${isEn ? 'Distance:' : 'المسافة:'} <strong>${isEn ? `${match.distanceMeters} m` : `${match.distanceMeters.toLocaleString('ar-EG')} متر`}</strong> • ${isEn ? 'Direction:' : 'الاتجاه:'} <strong>${escapeHtml(dir)}</strong> (${match.bearingDegrees}°)</div>
            ${
              g.city === 'MAKKAH' && recGate
                ? `<div style="font-size:0.86rem;font-weight:700;color:var(--gold-dark);margin-bottom:0.25rem;">🏨 ${isEn ? `To return to ${escapeHtml(hotelName)} (${Math.round(route.distanceToHotelMeters)}m ${hotelDir}): exit via Gate ${recGate.gateNumber}` : `للعودة إلى ${escapeHtml(hotelName)} (${route.distanceToHotelMeters.toLocaleString('ar-EG')} م باتجاه ${hotelDir}): اتجه لمخرج بوابة ${recGate.gateNumber} (${escapeHtml(recGate.nameAr)})`}</div>`
                : ''
            }
            <div style="font-size:0.85rem;color:var(--text-muted);">${escapeHtml(reach)}</div>
          </div>
        </div>
      `;
      showToast(isEn ? `🧭 Nearest Gate: ${title} (${match.distanceMeters}m)` : `🧭 أقرب بوابة: ${g.nameAr} (${match.distanceMeters}م)`);
    },
    () => {
      resultBox.innerHTML = isEn
        ? 'ℹ️ GPS signal blocked indoors — check the nearest numbered pillar, ask Haram security, or follow overhead lighted signs for Gate 79 (King Fahd), Gate 62 (Umrah), or Gate 45 (Al-Fath).'
        : 'ℹ️ تعذر التقاط GPS داخل المبنى المسقوف — انظر لأقرب عمود مرقم وأخبر رجل الأمن باسم فندقك، أو افتح اللوحات المضيئة باتجاه باب الملك فهد (79) وباب العمرة (62) وباب الفتح (45).';
    },
    { enableHighAccuracy: true, timeout: 7000, maximumAge: 30000 }
  );
}
