import { HaramainAtlasCatalog } from '../../guidance/haramain-gates-and-services.js';
import { ZiyaratGuideCatalog } from '../../guidance/ziyarat-guide.js';
import { escapeHtml } from '../shared.js';

const haramainAtlas = new HaramainAtlasCatalog();
const ziyaratCatalog = new ZiyaratGuideCatalog();
let activeSupAtlasFilter = 'ALL';

export function renderSupervisorHaramAtlas(filter: string = activeSupAtlasFilter): void {
  activeSupAtlasFilter = filter;
  const cardsEl = document.getElementById('sup-haram-atlas-cards');
  const benefitsEl = document.getElementById('sup-haram-benefits-grid');

  if (cardsEl) {
    if (filter === 'ZIYARAT') {
      cardsEl.innerHTML = ziyaratCatalog
        .getAllSites()
        .map(
          (s) => `
        <article class="card">
          ${
            s.imageUrl
              ? `<img class="landmark-card-img" src="${escapeHtml(s.imageUrl)}" alt="${escapeHtml(s.imageAltAr || s.nameAr)}" loading="lazy" width="800" height="500">`
              : ''
          }
          <div class="card-header">
            <h3 class="card-title">${escapeHtml(s.nameAr)}</h3>
            <span class="badge ${s.city === 'MADINAH' ? 'badge-warning' : 'badge-primary'}">${s.city === 'MADINAH' ? 'المدينة' : 'مكة'}</span>
          </div>
          <p style="font-size:0.9rem;line-height:1.7;margin-bottom:0.5rem;">${escapeHtml(s.virtueAr)}</p>
          <div class="info-box-neutral"><strong>توجيه للمشرف والمعتمر:</strong> ${escapeHtml(s.sunnahEtiquette)}</div>
          ${s.bidahWarnings ? `<div class="info-box-danger" style="margin-top:0.5rem;"><strong>⚠️ تنبيه شرعي:</strong> ${escapeHtml(s.bidahWarnings)}</div>` : ''}
        </article>
      `
        )
        .join('');
    } else {
      const gatesAndZones =
        filter === 'MAKKAH'
          ? haramainAtlas.getByCity('MAKKAH')
          : filter === 'MADINAH'
            ? haramainAtlas.getByCity('MADINAH')
            : haramainAtlas.getAllLandmarksAndGates();
      cardsEl.innerHTML = gatesAndZones
        .map(
          (item) => `
        <article class="card">
          <img class="landmark-card-img" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.imageAltAr)}" loading="lazy" width="800" height="500">
          <div class="card-header">
            <h3 class="card-title">${escapeHtml(item.nameAr)}</h3>
            <span class="badge ${item.city === 'MADINAH' ? 'badge-warning' : 'badge-primary'}">${item.gateNumber ? `بوابة ${item.gateNumber}` : item.city === 'MADINAH' ? 'المدينة' : 'مكة'}</span>
          </div>
          <div style="font-size:0.82rem;font-weight:700;color:var(--gold-dark);margin-bottom:0.4rem;">🧭 ${escapeHtml(item.directionAr)}</div>
          <p style="font-size:0.88rem;line-height:1.7;margin-bottom:0.5rem;">${escapeHtml(item.summaryAr)}</p>
          <ul class="benefits-list">${item.benefitsAndServicesAr.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
        </article>
      `
        )
        .join('');
    }
  }

  if (benefitsEl) {
    benefitsEl.innerHTML = haramainAtlas
      .getAllBenefits()
      .map(
        (b) => `
      <div class="info-box-neutral">
        ${
          b.imageUrl
            ? `<img class="landmark-card-img" src="${escapeHtml(b.imageUrl)}" alt="${escapeHtml(b.imageAltAr || b.titleAr)}" loading="lazy" width="800" height="500">`
            : ''
        }
        <div style="display:flex;justify-content:space-between;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.35rem;">
          <strong style="color:var(--primary-ink);">${escapeHtml(b.titleAr)}</strong>
          <span class="badge badge-success">${escapeHtml(b.categoryAr)}</span>
        </div>
        <div style="font-size:0.83rem;color:var(--gold-dark);font-weight:700;margin-bottom:0.3rem;">📍 ${escapeHtml(b.whereToFindAr)}</div>
        <p style="font-size:0.87rem;line-height:1.65;">${escapeHtml(b.howToBenefitAr)}</p>
      </div>
    `
      )
      .join('');
  }
}
