import {
  BRAND_FEATURED_VIDEOS,
  BRAND_IMAGES,
  BRAND_PILLARS,
  BRAND_SOCIAL_LINKS,
  BRAND_STATS,
  MARKETING_BROADCAST_TEMPLATES,
  SHEIKH_BRAND,
  type BrandImageAsset,
  type BrandLocalizedText,
} from '../../brand/sheikh-brand.js';
import { t } from '../i18n.js';
import { buildWhatsAppUrl, copyToClipboard, escapeHtml } from '../shared.js';

type Lang = 'ar' | 'en';

function getUiLang(): Lang {
  return typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'ar';
}

function pick(text: BrandLocalizedText, lang: Lang): string {
  return text[lang];
}

function renderGalleryCard(asset: BrandImageAsset, lang: Lang): string {
  const caption = escapeHtml(pick(asset.caption, lang));
  const alt = escapeHtml(pick(asset.alt, lang));
  const source = escapeHtml(pick(asset.sourceLabel, lang));
  return `
    <figure class="card brand-gallery-card">
      <button
        type="button"
        class="img-zoom-btn"
        data-zoom-src="${escapeHtml(asset.src)}"
        data-zoom-title="${caption}"
        data-zoom-alt="${alt}"
        aria-label="${escapeHtml(lang === 'ar' ? `تكبير: ${pick(asset.caption, lang)}` : `Zoom: ${pick(asset.caption, lang)}`)}"
      >
        <img
          src="${escapeHtml(asset.src)}"
          alt="${alt}"
          width="${asset.width}"
          height="${asset.height}"
          class="brand-gallery-thumb"
          loading="lazy"
          decoding="async"
        >
      </button>
      <figcaption>
        <strong style="display:block;font-size:0.9rem;color:var(--primary-ink);">${caption}</strong>
        <span style="display:block;font-size:0.78rem;color:var(--text-muted);margin-top:0.15rem;">${source}</span>
      </figcaption>
    </figure>
  `;
}

/**
 * Renders the compact Supervisor & Abshirou Trust Banner on the main Rituals tab
 * and the comprehensive Personal Branding & Official Channels Hub inside `#tab-abshirou`.
 */
export function renderBrandViews(onNavigateToBrand?: () => void): void {
  const lang = getUiLang();
  const isAr = lang === 'ar';

  const spotlight = document.getElementById('pilgrim-brand-spotlight');
  if (spotlight) {
    const ihram = BRAND_IMAGES.ihramPortrait;
    const whatsappHref = buildWhatsAppUrl(
      isAr
        ? 'السلام عليكم فضيلة الشيخ مصطفى فليفل، أود الاستفسار عن رحلات العمرة مع أبشروا.'
        : 'As-salamu alaykum Sheikh Mostafa Flefel, I would like to inquire about Abshirou Umrah trips.',
      SHEIKH_BRAND.contact.umrahWhatsappIntl
    );
    spotlight.innerHTML = `
      <article class="brand-spotlight-card" aria-labelledby="spotlight-sheikh-heading">
        <div class="brand-spotlight-identity">
          <button
            type="button"
            class="brand-avatar-btn"
            data-zoom-src="${escapeHtml(ihram.src)}"
            data-zoom-title="${escapeHtml(pick(SHEIKH_BRAND.name, lang))}"
            data-zoom-alt="${escapeHtml(pick(ihram.alt, lang))}"
            aria-label="${escapeHtml(t('brand.zoomAvatarAria'))}"
          >
            <img
              src="${escapeHtml(ihram.src)}"
              alt="${escapeHtml(pick(ihram.alt, lang))}"
              width="68"
              height="68"
              class="brand-avatar-img"
              decoding="async"
            >
          </button>
          <div class="brand-spotlight-copy">
            <div class="brand-badge-row" style="margin-block-end:0.3rem;">
              <span class="brand-pill-verified">✓ ${escapeHtml(pick(SHEIKH_BRAND.brandName, lang))}</span>
              <span class="brand-pill-license">🏢 ${escapeHtml(isAr ? 'غرناطة للسياحة • ترخيص 1094' : 'Granada Tourism • License #1094')}</span>
            </div>
            <h2 id="spotlight-sheikh-heading" style="margin:0;font-size:1.02rem;color:var(--primary-ink);">
              ${escapeHtml(pick(SHEIKH_BRAND.name, lang))}
            </h2>
            <p style="margin:0.2rem 0 0;font-size:0.84rem;color:var(--text-muted);line-height:1.5;">
              ${escapeHtml(pick(SHEIKH_BRAND.secondaryTitles, lang))}
            </p>
          </div>
        </div>
        <div class="brand-spotlight-actions">
          <a
            href="${escapeHtml(whatsappHref)}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-whatsapp"
            style="text-decoration:none;"
          >
            💬 ${escapeHtml(isAr ? `واتساب العمرة (${SHEIKH_BRAND.contact.umrahWhatsappDisplay})` : `Umrah WhatsApp (${SHEIKH_BRAND.contact.umrahWhatsappDisplay})`)}
          </a>
          <button type="button" class="btn btn-secondary" data-open-brand-hub>
            ${escapeHtml(t('brand.openHubBtn'))}
          </button>
        </div>
      </article>
    `;

    spotlight.querySelector('[data-open-brand-hub]')?.addEventListener('click', () => {
      onNavigateToBrand?.();
    });
  }

  const hubContainer = document.getElementById('abshirou-brand-container');
  if (!hubContainer) return;

  const haramCover = BRAND_IMAGES.haramCover;
  const bookingWaHref = buildWhatsAppUrl(
    isAr
      ? 'السلام عليكم فضيلة الشيخ مصطفى فليفل، أرغب في حجز/الاستفسار عن أفواج العمرة القادمة (أبشروا - غرناطة 1094).'
      : 'As-salamu alaykum Sheikh Mostafa Flefel, I would like to inquire about upcoming Abshirou Umrah groups (Granada License 1094).',
    SHEIKH_BRAND.contact.umrahWhatsappIntl
  );
  const inviteTemplate = MARKETING_BROADCAST_TEMPLATES[0];
  const inviteMsg = pick(inviteTemplate.message, lang);
  const shareInviteWaHref = buildWhatsAppUrl(inviteMsg);

  hubContainer.innerHTML = `
    <article class="card surface-tint-card brand-card-shell" aria-labelledby="brand-hero-title">
      <div class="brand-profile-card">
        <figure class="brand-media">
          <button
            type="button"
            class="img-zoom-btn brand-portrait-frame"
            data-zoom-src="${escapeHtml(haramCover.src)}"
            data-zoom-title="${escapeHtml(pick(SHEIKH_BRAND.name, lang))}"
            data-zoom-alt="${escapeHtml(pick(haramCover.alt, lang))}"
            aria-label="${escapeHtml(pick(haramCover.caption, lang))}"
          >
            <img
              src="${escapeHtml(haramCover.src)}"
              alt="${escapeHtml(pick(haramCover.alt, lang))}"
              width="${haramCover.width}"
              height="${haramCover.height}"
              class="brand-portrait-img"
              loading="lazy"
              decoding="async"
            >
          </button>
        </figure>

        <div>
          <div class="brand-badge-row">
            <span class="brand-pill-verified">✓ ${escapeHtml(pick(SHEIKH_BRAND.brandName, lang))} • ${escapeHtml(pick(SHEIKH_BRAND.pageCreatedLabel, lang))}</span>
            <span class="brand-pill-license">🪪 ${escapeHtml(isAr ? 'شركة غرناطة للسياحة — ترخيص 1094' : 'Granada Tourism Co. — License #1094')}</span>
          </div>

          <h2 id="brand-hero-title" style="margin:0 0 0.45rem;font-size:1.35rem;color:var(--primary-ink);">
            ${escapeHtml(pick(SHEIKH_BRAND.name, lang))}
          </h2>
          <p style="margin:0 0 0.55rem;font-weight:700;font-size:0.95rem;">
            ${escapeHtml(pick(SHEIKH_BRAND.roleTitle, lang))}
          </p>
          <p style="margin:0 0 0.85rem;font-size:0.92rem;color:var(--text-muted);line-height:1.7;">
            ${escapeHtml(pick(SHEIKH_BRAND.missionQuote, lang))}
          </p>

          <ul style="margin:0 0 1rem;padding-inline-start:1.2rem;font-size:0.88rem;line-height:1.7;color:var(--text-muted);">
            <li>🎓 ${escapeHtml(pick(SHEIKH_BRAND.education, lang))}</li>
            <li>🧭 ${escapeHtml(pick(SHEIKH_BRAND.supervisorExperience, lang))}</li>
            <li>📍 ${escapeHtml(isAr ? `مقر الشركة: ${SHEIKH_BRAND.agencyAddress.ar} • ${SHEIKH_BRAND.homeBase.ar}` : `Office: ${SHEIKH_BRAND.agencyAddress.en} • ${SHEIKH_BRAND.homeBase.en}`)}</li>
          </ul>

          <div style="display:flex;flex-wrap:wrap;gap:0.55rem;">
            <a href="${escapeHtml(bookingWaHref)}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp" style="text-decoration:none;">
              💬 ${escapeHtml(isAr ? `تواصل واتساب العمرة (${SHEIKH_BRAND.contact.umrahWhatsappDisplay})` : `Umrah WhatsApp (${SHEIKH_BRAND.contact.umrahWhatsappDisplay})`)}
            </a>
            <a href="${escapeHtml(SHEIKH_BRAND.contact.whatsappGroupUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="text-decoration:none;">
              👥 ${escapeHtml(isAr ? 'انضم لجروب العمرة الرسمي' : 'Join Official Umrah Group')}
            </a>
            <a href="tel:${escapeHtml(SHEIKH_BRAND.contact.agencyPhoneIntl)}" class="btn btn-secondary" style="text-decoration:none;">
              📞 ${escapeHtml(isAr ? `موبايل السياحة الدينية (${SHEIKH_BRAND.contact.agencyPhoneDisplay})` : `Agency Line (${SHEIKH_BRAND.contact.agencyPhoneDisplay})`)}
            </a>
          </div>
        </div>
      </div>

      <div class="brand-stats-grid" aria-label="${escapeHtml(isAr ? 'إحصائيات الثقة والانتشار' : 'Verified Reach Metrics')}">
        ${BRAND_STATS.map(
          (stat) => `
            <div class="brand-stat-tile">
              <span class="brand-stat-value">${escapeHtml(pick(stat.value, lang))}</span>
              <span class="brand-stat-label">${escapeHtml(pick(stat.label, lang))}</span>
            </div>
          `
        ).join('')}
      </div>
    </article>

    <section class="card" aria-labelledby="brand-pillars-title">
      <h3 id="brand-pillars-title" style="margin:0 0 0.85rem;color:var(--primary-ink);">
        ${escapeHtml(isAr ? '🌟 لماذا تسافر وتتعلم المناسك مع أبشروا؟' : '🌟 Why Journey & Learn Rituals with Abshirou?')}
      </h3>
      <div class="brand-pillars-grid">
        ${BRAND_PILLARS.map(
          (pillar) => `
            <article class="card" style="margin:0;padding:0.95rem;">
              <h4 style="margin:0 0 0.4rem;font-size:0.98rem;color:var(--primary-ink);">
                <span aria-hidden="true">${pillar.icon}</span> ${escapeHtml(pick(pillar.title, lang))}
              </h4>
              <p style="margin:0;font-size:0.86rem;color:var(--text-muted);line-height:1.65;">
                ${escapeHtml(pick(pillar.desc, lang))}
              </p>
            </article>
          `
        ).join('')}
      </div>
    </section>

    <section class="card" aria-labelledby="brand-socials-title">
      <h3 id="brand-socials-title" style="margin:0 0 0.45rem;color:var(--primary-ink);">
        ${escapeHtml(isAr ? '🔗 القنوات والحسابات الرسمية الموثقة' : '🔗 Verified Official Channels')}
      </h3>
      <blockquote class="brand-template-box" style="margin-block-end:0.95rem;">
        “${escapeHtml(pick(SHEIKH_BRAND.channelBio, lang))}”
      </blockquote>
      <div class="brand-social-grid">
        ${BRAND_SOCIAL_LINKS.map(
          (ch) => `
            <a
              href="${escapeHtml(ch.url)}"
              target="_blank"
              rel="noopener noreferrer"
              class="brand-social-link${ch.id === 'whatsapp-group' ? ' brand-social-link--wide' : ''}"
            >
              <span class="brand-social-main">
                <span aria-hidden="true" style="font-size:1.35rem;">${ch.icon}</span>
                <span>
                  <span class="brand-social-title">${escapeHtml(pick(ch.name, lang))}${ch.verifiedBadge ? ' ✓' : ''}</span>
                  <span class="brand-social-meta">${escapeHtml(pick(ch.metric, lang))} • ${escapeHtml(ch.handle)}</span>
                </span>
              </span>
              <span aria-hidden="true" style="font-size:0.88rem;color:var(--primary-ink);font-weight:700;">↗</span>
            </a>
          `
        ).join('')}
      </div>
    </section>

    <section class="card" aria-labelledby="brand-gallery-title">
      <h3 id="brand-gallery-title" style="margin:0 0 0.45rem;color:var(--primary-ink);">
        ${escapeHtml(isAr ? '📸 لقطات ميدانية موثقة من رحلات أبشروا والحرمين' : '📸 Verified Field Photos from Abshirou Journeys')}
      </h3>
      <p style="margin:0 0 0.9rem;font-size:0.86rem;color:var(--text-muted);">
        ${escapeHtml(isAr ? 'اضغط على أي صورة للتكبير واستعراض تفاصيلها.' : 'Tap any photo to zoom and inspect details.')}
      </p>
      <div class="brand-gallery-grid">
        ${renderGalleryCard(BRAND_IMAGES.haramCover, lang)}
        ${renderGalleryCard(BRAND_IMAGES.ihramPortrait, lang)}
        ${renderGalleryCard(BRAND_IMAGES.fbCover, lang)}
        ${renderGalleryCard(BRAND_IMAGES.ytAvatar, lang)}
      </div>
    </section>

    <section class="card" aria-labelledby="brand-videos-title">
      <h3 id="brand-videos-title" style="margin:0 0 0.45rem;color:var(--primary-ink);">
        ${escapeHtml(isAr ? '▶️ مختارات مرئية من قناة أبشروا (@apopara14)' : '▶️ Featured Spiritual Guides from Abshirou YouTube (@apopara14)')}
      </h3>
      <p style="margin:0 0 0.85rem;font-size:0.86rem;color:var(--text-muted);">
        ${escapeHtml(isAr ? 'دروس عملية قبل السفر وفي صحن المطاف والروضة الشريفة عبر يوتيوب الرسمي.' : 'Practical field briefings and supplications from the official YouTube channel.')}
      </p>
      <div class="brand-videos-grid">
        ${BRAND_FEATURED_VIDEOS.map(
          (video) => `
            <a
              href="${escapeHtml(video.url)}"
              target="_blank"
              rel="noopener noreferrer"
              class="brand-social-link"
            >
              <span class="brand-social-main">
                <span aria-hidden="true" style="font-size:1.25rem;">🎬</span>
                <span>
                  <span class="brand-social-title">${escapeHtml(pick(video.title, lang))}</span>
                  <span class="brand-social-meta">${escapeHtml(pick(video.topic, lang))} • ${escapeHtml(pick(video.viewsLabel, lang))}</span>
                </span>
              </span>
              <span aria-hidden="true" style="font-size:0.85rem;color:var(--primary-ink);font-weight:700;">↗</span>
            </a>
          `
        ).join('')}
      </div>
    </section>

    <section class="card" aria-labelledby="brand-share-title">
      <h3 id="brand-share-title" style="margin:0 0 0.35rem;color:var(--primary-ink);">
        ${escapeHtml(isAr ? '📣 شارك دعوة أبشروا مع أهلك وأصدقائك' : '📣 Share Abshirou Umrah Invitation')}
      </h3>
      <p style="margin:0;font-size:0.85rem;color:var(--text-muted);">
        ${escapeHtml(pick(inviteTemplate.audience, lang))}
      </p>
      <div id="brand-invite-preview" class="brand-template-box">${escapeHtml(inviteMsg)}</div>
      <div style="display:flex;flex-wrap:wrap;gap:0.55rem;margin-top:0.75rem;">
        <button type="button" class="btn btn-primary" data-copy-brand-invite>
          📋 ${escapeHtml(isAr ? 'نسخ نص الدعوة الرسمي' : 'Copy Official Invite Text')}
        </button>
        <a href="${escapeHtml(shareInviteWaHref)}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp" style="text-decoration:none;">
          💬 ${escapeHtml(isAr ? 'مشاركة عبر واتساب' : 'Share via WhatsApp')}
        </a>
      </div>
    </section>
  `;

  hubContainer.querySelector('[data-copy-brand-invite]')?.addEventListener('click', () => {
    void copyToClipboard(
      inviteMsg,
      isAr ? '✅ تم نسخ دعوة أبشروا الرسمية' : '✅ Abshirou official invitation copied'
    );
  });
}
