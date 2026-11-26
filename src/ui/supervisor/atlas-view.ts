import { HaramainAtlasCatalog } from '../../guidance/haramain-gates-and-services.js';
import { ZiyaratGuideCatalog } from '../../guidance/ziyarat-guide.js';
import { escapeHtml } from '../shared.js';
import { getCurrentLanguage } from '../i18n.js';
import { renderReferencePillsHtml } from '../references-ui.js';
import { HARAM_ATLAS_EN, HARAM_BENEFITS_EN, ZIYARAT_SITES_EN } from '../guidance-en.js';

const haramainAtlas = new HaramainAtlasCatalog();
const ziyaratCatalog = new ZiyaratGuideCatalog();
let activeSupAtlasFilter = 'ALL';

export function renderSupervisorHaramAtlas(filter: string = activeSupAtlasFilter): void {
  activeSupAtlasFilter = filter;
  const isEn = getCurrentLanguage() === 'en';
  const cardsEl = document.getElementById('sup-haram-atlas-cards');
  const benefitsEl = document.getElementById('sup-haram-benefits-grid');

  if (cardsEl) {
    if (filter === 'ZIYARAT') {
      cardsEl.innerHTML = ziyaratCatalog
        .getAllSites()
        .map((s) => {
          const en = ZIYARAT_SITES_EN[s.id];
          const title = isEn ? s.nameEn : s.nameAr;
          const alt = isEn ? s.nameEn : s.imageAltAr || s.nameAr;
          const warn = s.bidahWarnings ? (isEn && en?.warningsEn ? en.warningsEn : s.bidahWarnings) : '';
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
            <span class="badge ${s.city === 'MADINAH' ? 'badge-warning' : 'badge-primary'}">${s.city === 'MADINAH' ? (isEn ? 'Madinah' : 'المدينة') : isEn ? 'Makkah' : 'مكة'}</span>
          </div>
          <p style="font-size:0.9rem;line-height:1.7;margin-bottom:0.5rem;">${escapeHtml(isEn && en ? en.virtueEn : s.virtueAr)}</p>
          <div class="info-box-neutral"><strong>${isEn ? 'Supervisor Guidance:' : 'توجيه للمشرف والمعتمر:'}</strong> ${escapeHtml(isEn && en ? en.etiquetteEn : s.sunnahEtiquette)}</div>
          ${warn ? `<div class="info-box-danger" style="margin-top:0.5rem;"><strong>${isEn ? '⚠️ Caution:' : '⚠️ تنبيه شرعي:'}</strong> ${escapeHtml(warn)}</div>` : ''}
          ${renderReferencePillsHtml(s.references, isEn)}
        </article>
      `;
        })
        .join('');
    } else {
      const gatesAndZones =
        filter === 'MAKKAH'
          ? haramainAtlas.getByCity('MAKKAH')
          : filter === 'MADINAH'
            ? haramainAtlas.getByCity('MADINAH')
            : haramainAtlas.getAllLandmarksAndGates();
      cardsEl.innerHTML = gatesAndZones
        .map((item) => {
          const en = HARAM_ATLAS_EN[item.id];
          const title = isEn ? item.nameEn : item.nameAr;
          const alt = isEn ? item.nameEn : item.imageAltAr;
          const badge = item.gateNumber
            ? isEn
              ? `Gate ${item.gateNumber}`
              : `بوابة ${item.gateNumber}`
            : item.city === 'MADINAH'
              ? isEn
                ? 'Madinah'
                : 'المدينة'
              : isEn
                ? 'Makkah'
                : 'مكة';
          return `
        <article class="card">
          <button type="button" class="img-zoom-btn" data-zoom-src="${escapeHtml(item.imageUrl)}" data-zoom-title="${escapeHtml(title)}" data-zoom-alt="${escapeHtml(alt)}" aria-label="${isEn ? `Zoom photo of ${escapeHtml(title)}` : `تكبير صورة ${escapeHtml(title)}`}">
            <img class="landmark-card-img" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" width="800" height="500">
          </button>
          <div class="card-header">
            <h3 class="card-title">${escapeHtml(title)}</h3>
            <span class="badge ${item.city === 'MADINAH' ? 'badge-warning' : 'badge-primary'}">${escapeHtml(badge)}</span>
          </div>
          <div style="font-size:0.82rem;font-weight:700;color:var(--gold-dark);margin-bottom:0.4rem;">🧭 ${escapeHtml(isEn && en ? en.directionEn : item.directionAr)}</div>
          <p style="font-size:0.88rem;line-height:1.7;margin-bottom:0.5rem;">${escapeHtml(isEn && en ? en.summaryEn : item.summaryAr)}</p>
          <ul class="benefits-list">${(isEn && en ? en.benefitsEn : item.benefitsAndServicesAr).map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
          ${renderReferencePillsHtml(item.references, isEn)}
        </article>
      `;
        })
        .join('');
    }
  }

  if (benefitsEl) {
    benefitsEl.innerHTML = haramainAtlas
      .getAllBenefits()
      .map((b) => {
        const en = HARAM_BENEFITS_EN[b.id];
        const title = isEn && en ? en.titleEn : b.titleAr;
        const alt = isEn && en ? en.titleEn : b.imageAltAr || b.titleAr;
        return `
      <div class="info-box-neutral">
        ${
          b.imageUrl
            ? `<button type="button" class="img-zoom-btn" data-zoom-src="${escapeHtml(b.imageUrl)}" data-zoom-title="${escapeHtml(title)}" data-zoom-alt="${escapeHtml(alt)}" aria-label="${isEn ? `Zoom photo of ${escapeHtml(title)}` : `تكبير صورة ${escapeHtml(title)}`}">
                <img class="landmark-card-img" src="${escapeHtml(b.imageUrl)}" alt="${escapeHtml(alt)}" loading="lazy" decoding="async" width="800" height="500">
              </button>`
            : ''
        }
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.35rem;">
          <strong style="color:var(--primary-ink);">${escapeHtml(title)}</strong>
          <span class="badge badge-success">${escapeHtml(isEn && en ? en.categoryEn : b.categoryAr)}</span>
        </div>
        <div style="font-size:0.83rem;color:var(--gold-dark);font-weight:700;margin-bottom:0.3rem;">📍 ${escapeHtml(isEn && en ? en.whereToFindEn : b.whereToFindAr)}</div>
        <p style="font-size:0.87rem;line-height:1.65;">${escapeHtml(isEn && en ? en.howToBenefitEn : b.howToBenefitAr)}</p>
        ${renderReferencePillsHtml(b.references, isEn)}
      </div>
    `;
      })
      .join('');
  }
}
