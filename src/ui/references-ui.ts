import { EDITORIAL_METHODOLOGY, KnowledgeReference } from '../guidance/references.js';
import { escapeHtml } from './shared.js';

/**
 * Renders verified scholarly or official reference chips safely inside cards or disclosures.
 */
export function renderReferencePillsHtml(
  references: KnowledgeReference[] | undefined,
  isEn: boolean
): string {
  if (!references || references.length === 0) return '';

  const badges = references
    .map((ref) => {
      const icon =
        ref.kind === 'QURAN'
          ? '📖'
          : ref.kind === 'HADITH'
            ? '📜'
            : ref.kind === 'FATWA'
              ? '⚖️'
              : ref.kind === 'FIELD_TARIFF'
                ? '🚕'
                : '🏛️';
      const title = isEn ? ref.bookOrAuthorityEn : ref.bookOrAuthorityAr;
      const citation = isEn ? ref.citationEn : ref.citationAr;
      const grade = isEn ? ref.gradeOrScopeEn : ref.gradeOrScopeAr;
      const linkHtml = ref.url
        ? `<a href="${escapeHtml(ref.url)}" target="_blank" rel="noopener" style="color:var(--primary-ink);font-weight:700;text-decoration:underline;">${isEn ? 'Verify source ↗' : 'توثيق المصدر ↗'}</a>`
        : '';

      return `
        <li style="margin-bottom:0.35rem;">
          <strong>${icon} ${escapeHtml(title)}</strong>${grade ? ` <span class="badge badge-primary">${escapeHtml(grade)}</span>` : ''}:
          <span>${escapeHtml(citation)}</span>
          <span style="font-size:0.76rem;color:var(--text-muted);">(${isEn ? 'Verified:' : 'محدّث:'} ${escapeHtml(ref.lastVerified)})</span>
          ${linkHtml}
        </li>
      `;
    })
    .join('');

  return `
    <details class="ref-disclosure" style="margin-top:0.55rem;border:1px solid var(--border);border-radius:10px;padding:0.45rem 0.7rem;background:var(--bg);">
      <summary style="cursor:pointer;font-size:0.8rem;font-weight:800;color:var(--primary-ink);list-style:none;">
        📚 ${isEn ? `Sources & Verification (${references.length})` : `المرجع والتوثيق (${references.length})`} ▾
      </summary>
      <ul style="margin:0.45rem 1.15rem 0.1rem;padding:0;font-size:0.8rem;line-height:1.65;">
        ${badges}
      </ul>
    </details>
  `;
}

/**
 * Renders the standardized editorial methodology card used in both Pilgrim Fiqh & Supervisor Hubs.
 */
export function renderEditorialMethodologyHtml(isEn: boolean): string {
  return `
    <div class="info-box-neutral" style="border-inline-start:4px solid var(--primary);">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.35rem;">
        <strong style="color:var(--primary-ink);">📚 ${escapeHtml(isEn ? EDITORIAL_METHODOLOGY.titleEn : EDITORIAL_METHODOLOGY.titleAr)}</strong>
        <span class="badge badge-success">${isEn ? `Last Audit: ${EDITORIAL_METHODOLOGY.lastAudit}` : `آخر مراجعة: ${EDITORIAL_METHODOLOGY.lastAudit}`}</span>
      </div>
      <p style="font-size:0.88rem;line-height:1.7;">${escapeHtml(isEn ? EDITORIAL_METHODOLOGY.summaryEn : EDITORIAL_METHODOLOGY.summaryAr)}</p>
    </div>
  `;
}
