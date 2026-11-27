import {
  BRAND_FEATURED_VIDEOS,
  BRAND_IMAGES,
  BRAND_PILLARS,
  BRAND_SOCIAL_LINKS,
  BRAND_STATS,
  MARKETING_BROADCAST_TEMPLATES,
  SHEIKH_BRAND,
  WHATSAPP_DIRECT_INTENTS,
  buildMostafaDirectWhatsAppUrl,
  type BrandImageAsset,
  type BrandLocalizedText,
  type WhatsAppIntentPreset,
} from '../../brand/sheikh-brand.js';
import { t } from '../i18n.js';
import { buildWhatsAppUrl, copyToClipboard, escapeHtml } from '../shared.js';

type Lang = 'ar' | 'en';

export interface BrandPilgrimContext {
  fullName?: string;
  tripCode?: string;
  tripTitle?: string;
}

function getUiLang(): Lang {
  return typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'ar';
}

function pick(text: BrandLocalizedText, lang: Lang): string {
  return text[lang];
}

function buildComposerMessage(
  preset: WhatsAppIntentPreset,
  lang: Lang,
  ctx?: BrandPilgrimContext
): string {
  const base = pick(preset.template, lang);
  const name = ctx?.fullName?.trim();
  const code = ctx?.tripCode?.trim();
  if (!name) return base;
  return lang === 'en'
    ? `${base}\n\nSender: ${name}${code ? ` (${code})` : ''}`
    : `${base}\n\nالمرسل: ${name}${code ? ` (${code})` : ''}`;
}

function renderGalleryCard(asset: BrandImageAsset, lang: Lang): string {
  const caption = escapeHtml(pick(asset.caption, lang));
  const alt = escapeHtml(pick(asset.alt, lang));
  const source = escapeHtml(pick(asset.sourceLabel, lang));
  const isPortrait = asset.orientation === 'portrait';
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
          class="brand-gallery-thumb ${isPortrait ? 'brand-gallery-thumb--portrait' : 'brand-gallery-thumb--landscape'}"
        >
      </button>
      <figcaption>
        <strong class="brand-gallery-caption">${caption}</strong>
        <span class="brand-gallery-source">${source}</span>
      </figcaption>
    </figure>
  `;
}

/**
 * Renders the unified direct-contact and official Abshirou channels footer bar
 * consistently across both `/` and `/supervisor`.
 */
export function renderSharedBrandFooter(portal: 'pilgrim' | 'supervisor'): void {
  const footerEl = document.getElementById('app-brand-footer');
  if (!footerEl) return;

  const lang = getUiLang();
  const isAr = lang === 'ar';
  const waHref = buildMostafaDirectWhatsAppUrl(
    isAr
      ? 'السلام عليكم فضيلة الشيخ مصطفى فليفل، أتواصل معكم عبر منصة أبشروا.'
      : 'As-salamu alaykum Sheikh Mostafa Flefel, contacting you via the Abshirou platform.'
  );
  const fbPage = BRAND_SOCIAL_LINKS.find((s) => s.id === 'facebook-page')?.url || '#';
  const ytLink = BRAND_SOCIAL_LINKS.find((s) => s.id === 'youtube')?.url || '#';
  const igLink = BRAND_SOCIAL_LINKS.find((s) => s.id === 'instagram')?.url || '#';

  const portalSwitch =
    portal === 'pilgrim'
      ? `<a href="/supervisor" class="brand-footer-link">${escapeHtml(t('app.pilgrim.supervisorLink'))}</a>`
      : `<a href="/" class="brand-footer-link">${escapeHtml(t('tools.pilgrimApp'))}</a>`;

  footerEl.innerHTML = `
    <div class="brand-footer-inner">
      <div class="brand-footer-identity">
        <strong>${escapeHtml(pick(SHEIKH_BRAND.brandName, lang))} — ${escapeHtml(pick(SHEIKH_BRAND.shortName, lang))}</strong>
        <span>${escapeHtml(isAr ? 'شركة غرناطة للسياحة (ترخيص 1094) • يعمل بدون إنترنت داخل الحرمين' : 'Granada Tourism Co. (License #1094) • Offline-Ready Inside Al-Haramain')}</span>
      </div>
      <nav class="brand-footer-actions" aria-label="${escapeHtml(isAr ? 'قنوات التواصل والروابط الرسمية' : 'Official Contact Channels')}">
        <a href="${escapeHtml(waHref)}" target="_blank" rel="noopener noreferrer" class="brand-footer-pill brand-footer-pill--wa">
          💬 ${escapeHtml(isAr ? `واتساب الشيخ (${SHEIKH_BRAND.contact.umrahWhatsappDisplay})` : `WhatsApp Sheikh (${SHEIKH_BRAND.contact.umrahWhatsappDisplay})`)}
        </a>
        <a href="tel:${escapeHtml(SHEIKH_BRAND.contact.agencyPhoneIntl)}" class="brand-footer-pill">
          📞 ${escapeHtml(isAr ? `شركة غرناطة (${SHEIKH_BRAND.contact.agencyPhoneDisplay})` : `Granada (${SHEIKH_BRAND.contact.agencyPhoneDisplay})`)}
        </a>
        <a href="${escapeHtml(SHEIKH_BRAND.contact.whatsappGroupUrl)}" target="_blank" rel="noopener noreferrer" class="brand-footer-pill">
          👥 ${escapeHtml(isAr ? 'جروب العمرة' : 'Umrah Group')}
        </a>
        <a href="${escapeHtml(fbPage)}" target="_blank" rel="noopener noreferrer" class="brand-footer-link">Facebook</a>
        <a href="${escapeHtml(ytLink)}" target="_blank" rel="noopener noreferrer" class="brand-footer-link">YouTube</a>
        <a href="${escapeHtml(igLink)}" target="_blank" rel="noopener noreferrer" class="brand-footer-link">Instagram</a>
        ${portalSwitch}
      </nav>
    </div>
  `;
}

/**
 * Renders the Supervisor & Abshirou executive spotlight card on `#tab-rituals`,
 * the full Personal Branding & Direct WhatsApp Hub inside `#tab-abshirou`,
 * and the unified Abshirou contact footer.
 */
export function renderBrandViews(
  onNavigateToBrand?: () => void,
  pilgrimContext?: BrandPilgrimContext
): void {
  const lang = getUiLang();
  const isAr = lang === 'ar';

  renderSharedBrandFooter('pilgrim');

  const spotlight = document.getElementById('pilgrim-brand-spotlight');
  if (spotlight) {
    const avatar = BRAND_IMAGES.avatar;
    const whatsappHref = buildMostafaDirectWhatsAppUrl(
      buildComposerMessage(WHATSAPP_DIRECT_INTENTS[0], lang, pilgrimContext)
    );
    spotlight.innerHTML = `
      <article class="brand-spotlight-card" aria-labelledby="spotlight-sheikh-heading">
        <div class="brand-spotlight-identity">
          <button
            type="button"
            class="brand-avatar-btn"
            data-zoom-src="${escapeHtml(avatar.src)}"
            data-zoom-title="${escapeHtml(pick(SHEIKH_BRAND.name, lang))}"
            data-zoom-alt="${escapeHtml(pick(avatar.alt, lang))}"
            aria-label="${escapeHtml(t('brand.zoomAvatarAria'))}"
          >
            <img
              src="${escapeHtml(avatar.src)}"
              alt="${escapeHtml(pick(avatar.alt, lang))}"
              width="72"
              height="72"
              class="brand-avatar-img"
            >
          </button>
          <div class="brand-spotlight-copy">
            <div class="brand-badge-row" style="margin-block-end:0.35rem;">
              <span class="brand-pill-hero-verified">✓ ${escapeHtml(pick(SHEIKH_BRAND.brandName, lang))} • 8.5M+</span>
              <span class="brand-pill-hero-license">🏢 ${escapeHtml(isAr ? 'غرناطة للسياحة • ترخيص 1094' : 'Granada Tourism • License #1094')}</span>
            </div>
            <h2 id="spotlight-sheikh-heading" class="brand-spotlight-heading">
              ${escapeHtml(pick(SHEIKH_BRAND.name, lang))}
            </h2>
            <p class="brand-spotlight-sub">
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
            💬 ${escapeHtml(isAr ? `راسل الشيخ واتساب (${SHEIKH_BRAND.contact.umrahWhatsappDisplay})` : `WhatsApp Sheikh (${SHEIKH_BRAND.contact.umrahWhatsappDisplay})`)}
          </a>
          <a
            href="${escapeHtml(SHEIKH_BRAND.contact.whatsappGroupUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn brand-glass-btn"
            style="text-decoration:none;"
          >
            👥 ${escapeHtml(isAr ? 'جروب العمرة' : 'Umrah Group')}
          </a>
          <button type="button" class="btn brand-glass-btn" data-open-brand-hub>
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

  const kaabaDua = BRAND_IMAGES.kaabaDua;
  const nabawiChamber = BRAND_IMAGES.nabawiChamber;
  const defaultPreset = WHATSAPP_DIRECT_INTENTS[0];
  const initialComposerMsg = buildComposerMessage(defaultPreset, lang, pilgrimContext);
  const bookingWaHref = buildMostafaDirectWhatsAppUrl(initialComposerMsg);

  const inviteTemplate = MARKETING_BROADCAST_TEMPLATES[0];
  const inviteMsg = pick(inviteTemplate.message, lang);
  const shareInviteWaHref = buildWhatsAppUrl(inviteMsg);

  hubContainer.innerHTML = `
    <article class="card brand-hero-emerald brand-card-shell" aria-labelledby="brand-hero-title">
      <div class="brand-profile-card">
        <figure class="brand-media">
          <button
            type="button"
            class="img-zoom-btn brand-portrait-frame"
            data-zoom-src="${escapeHtml(kaabaDua.src)}"
            data-zoom-title="${escapeHtml(pick(SHEIKH_BRAND.name, lang))}"
            data-zoom-alt="${escapeHtml(pick(kaabaDua.alt, lang))}"
            aria-label="${escapeHtml(pick(kaabaDua.caption, lang))}"
          >
            <img
              src="${escapeHtml(kaabaDua.src)}"
              alt="${escapeHtml(pick(kaabaDua.alt, lang))}"
              width="${kaabaDua.width}"
              height="${kaabaDua.height}"
              class="brand-portrait-img"
              decoding="async"
            >
          </button>
        </figure>

        <div>
          <div class="brand-badge-row">
            <span class="brand-pill-hero-verified">✓ ${escapeHtml(pick(SHEIKH_BRAND.brandName, lang))} • ${escapeHtml(pick(SHEIKH_BRAND.pageCreatedLabel, lang))}</span>
            <span class="brand-pill-hero-license">🪪 ${escapeHtml(isAr ? 'شركة غرناطة للسياحة — ترخيص 1094' : 'Granada Tourism Co. — License #1094')}</span>
          </div>

          <h2 id="brand-hero-title" class="brand-hero-heading">
            ${escapeHtml(pick(SHEIKH_BRAND.name, lang))}
          </h2>
          <p class="brand-hero-role">
            ${escapeHtml(pick(SHEIKH_BRAND.roleTitle, lang))}
          </p>
          <p class="brand-hero-mission">
            ${escapeHtml(pick(SHEIKH_BRAND.missionQuote, lang))}
          </p>

          <ul class="brand-hero-creds">
            <li>🎓 ${escapeHtml(pick(SHEIKH_BRAND.education, lang))}</li>
            <li>🧭 ${escapeHtml(pick(SHEIKH_BRAND.supervisorExperience, lang))}</li>
            <li>📍 ${escapeHtml(isAr ? `مقر الشركة: ${SHEIKH_BRAND.agencyAddress.ar} • ${SHEIKH_BRAND.homeBase.ar}` : `Office: ${SHEIKH_BRAND.agencyAddress.en} • ${SHEIKH_BRAND.homeBase.en}`)}</li>
          </ul>

          <div class="brand-hero-actions">
            <a href="${escapeHtml(bookingWaHref)}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp" style="text-decoration:none;">
              💬 ${escapeHtml(isAr ? `واتساب مباشر للشيخ (${SHEIKH_BRAND.contact.umrahWhatsappDisplay})` : `Direct WhatsApp (${SHEIKH_BRAND.contact.umrahWhatsappDisplay})`)}
            </a>
            <a href="${escapeHtml(SHEIKH_BRAND.contact.whatsappGroupUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-gold" style="text-decoration:none;">
              👥 ${escapeHtml(isAr ? 'انضم لجروب العمرة الرسمي' : 'Join Official Umrah Group')}
            </a>
            <a href="tel:${escapeHtml(SHEIKH_BRAND.contact.agencyPhoneIntl)}" class="btn brand-glass-btn" style="text-decoration:none;">
              📞 ${escapeHtml(isAr ? `اتصال شركة غرناطة (${SHEIKH_BRAND.contact.agencyPhoneDisplay})` : `Granada Line (${SHEIKH_BRAND.contact.agencyPhoneDisplay})`)}
            </a>
          </div>
        </div>
      </div>

      <div class="brand-stats-grid" aria-label="${escapeHtml(isAr ? 'إحصائيات الثقة والانتشار' : 'Verified Reach Metrics')}">
        ${BRAND_STATS.map(
          (stat) => `
            <div class="brand-hero-stat-tile">
              <span class="brand-hero-stat-value">${escapeHtml(pick(stat.value, lang))}</span>
              <span class="brand-hero-stat-label">${escapeHtml(pick(stat.label, lang))}</span>
            </div>
          `
        ).join('')}
      </div>
    </article>

    <section class="card brand-wa-composer" id="brand-wa-composer" aria-labelledby="wa-composer-title">
      <div class="card-header">
        <h3 id="wa-composer-title" class="card-title">
          💬 ${escapeHtml(isAr ? 'أرسل رسالة واتساب مباشرة للشيخ مصطفى فليفل' : 'Send a Direct WhatsApp Message to Sheikh Mostafa Flefel')}
        </h3>
        <span class="badge badge-success" dir="ltr">+20 104 041 4659</span>
      </div>
      <p style="margin:0 0 0.75rem;font-size:0.88rem;color:var(--text-muted);line-height:1.6;">
        ${escapeHtml(isAr ? 'اختر موضوع رسالتك أو عدّل النص بحرية ثم اضغط «إرسال عبر واتساب» لبدء محادثة فورية مع الشيخ مصطفى:' : 'Pick a quick topic or customize your message below, then tap Send via WhatsApp to chat directly with Sheikh Mostafa:')}
      </p>
      <div class="atlas-filter-bar" role="group" aria-label="${escapeHtml(isAr ? 'قوالب الرسالة المباشرة' : 'Quick Message Topics')}">
        ${WHATSAPP_DIRECT_INTENTS.map(
          (intent, idx) => `
            <button
              type="button"
              class="btn btn-secondary atlas-filter-btn"
              data-wa-intent="${escapeHtml(intent.id)}"
              aria-pressed="${idx === 0 ? 'true' : 'false'}"
            >
              <span aria-hidden="true">${intent.icon}</span> ${escapeHtml(pick(intent.label, lang))}
            </button>
          `
        ).join('')}
      </div>
      <label for="brand-wa-message" class="field-label">
        ${escapeHtml(isAr ? 'نص الرسالة الموجهة إلى 01040414659:' : 'Message to +20 104 041 4659:')}
      </label>
      <textarea id="brand-wa-message" class="field-input brand-wa-textarea" rows="4">${escapeHtml(initialComposerMsg)}</textarea>
      <div class="brand-wa-composer-actions">
        <button type="button" id="btn-send-mostafa-wa" class="btn btn-whatsapp" style="flex:1;min-width:220px;">
          💬 ${escapeHtml(isAr ? `إرسال عبر واتساب الآن (${SHEIKH_BRAND.contact.umrahWhatsappDisplay})` : `Send via WhatsApp Now (${SHEIKH_BRAND.contact.umrahWhatsappDisplay})`)}
        </button>
        <button type="button" id="btn-copy-mostafa-wa" class="btn btn-secondary">
          📋 ${escapeHtml(isAr ? 'نسخ الرسالة' : 'Copy Message')}
        </button>
        <a href="tel:${escapeHtml(SHEIKH_BRAND.contact.umrahWhatsappIntl)}" class="btn btn-secondary" style="text-decoration:none;">
          📞 ${escapeHtml(isAr ? 'اتصال مباشر' : 'Call Directly')}
        </a>
      </div>
    </section>

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
        ${escapeHtml(isAr ? '📸 لقطات من الحرمين الشريفين ومسيرة الشيخ مصطفى فليفل' : '📸 Portraits of Sheikh Mostafa Flefel & Haramain Landmarks')}
      </h3>
      <p style="margin:0 0 0.9rem;font-size:0.86rem;color:var(--text-muted);">
        ${escapeHtml(isAr ? 'اضغط على أي صورة للتكبير واستعراض تفاصيلها.' : 'Tap any photo to zoom and inspect details.')}
      </p>
      <div class="brand-gallery-portraits">
        ${renderGalleryCard(kaabaDua, lang)}
        ${renderGalleryCard(nabawiChamber, lang)}
      </div>
      <div class="brand-gallery-landscapes">
        ${renderGalleryCard(BRAND_IMAGES.kaabaDoor, lang)}
        ${renderGalleryCard(BRAND_IMAGES.nabawiUmbrellas, lang)}
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

  const msgTextarea = hubContainer.querySelector<HTMLTextAreaElement>('#brand-wa-message');
  hubContainer.querySelectorAll<HTMLButtonElement>('[data-wa-intent]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const intent = WHATSAPP_DIRECT_INTENTS.find((x) => x.id === btn.dataset.waIntent);
      if (!intent) return;
      hubContainer.querySelectorAll<HTMLButtonElement>('[data-wa-intent]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      if (msgTextarea) {
        msgTextarea.value = buildComposerMessage(intent, lang, pilgrimContext);
      }
    });
  });

  hubContainer.querySelector('#btn-send-mostafa-wa')?.addEventListener('click', () => {
    const text = (msgTextarea?.value || initialComposerMsg).trim();
    window.open(buildMostafaDirectWhatsAppUrl(text), '_blank', 'noopener,noreferrer');
  });

  hubContainer.querySelector('#btn-copy-mostafa-wa')?.addEventListener('click', () => {
    const text = (msgTextarea?.value || initialComposerMsg).trim();
    void copyToClipboard(
      text,
      isAr ? '✅ تم نسخ رسالتك الجاهزة لإرسالها للشيخ مصطفى' : '✅ Message copied for Sheikh Mostafa'
    );
  });

  hubContainer.querySelector('[data-copy-brand-invite]')?.addEventListener('click', () => {
    void copyToClipboard(
      inviteMsg,
      isAr ? '✅ تم نسخ دعوة أبشروا الرسمية' : '✅ Abshirou official invitation copied'
    );
  });
}
