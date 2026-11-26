import qrcode from 'qrcode-generator';
import { TripStatus } from '../operations/trip-logistics.js';
import { getCurrentLanguage, t } from './i18n.js';
import { TRIP_STAGE_LABELS_EN } from './guidance-en.js';

export const TRIP_STAGE_LABELS: Record<TripStatus, string> = {
  [TripStatus.DRAFT]: 'مسودة الإعداد',
  [TripStatus.REGISTRATION_OPEN]: 'باب التسجيل مفتوح',
  [TripStatus.PRE_DEPARTURE]: 'تجهيز ما قبل السفر',
  [TripStatus.IN_TRANSIT]: 'في الطريق / الميقات',
  [TripStatus.IN_MAKKAH]: 'في مكة المكرمة',
  [TripStatus.IN_MADINAH]: 'في المدينة المنورة',
  [TripStatus.RETURN_TRANSIT]: 'الاستعداد للعودة',
  [TripStatus.COMPLETED]: 'رحلة مكتملة (أرشيف)',
};

export function getTripStageLabel(stage: TripStatus): string {
  return getCurrentLanguage() === 'en' ? TRIP_STAGE_LABELS_EN[stage] : TRIP_STAGE_LABELS[stage];
}

export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function cleanPhoneDigits(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

export function buildWhatsAppUrl(text: string, phone?: string): string {
  const encoded = encodeURIComponent(text);
  if (phone) {
    const digits = cleanPhoneDigits(phone);
    if (digits) {
      return `https://wa.me/${digits}?text=${encoded}`;
    }
  }
  return `https://wa.me/?text=${encoded}`;
}

export function renderQrSvg(data: string, altLabel: string = 'QR Code'): string {
  const qr = qrcode(0, 'M');
  qr.addData(data || 'https://umrah-supervisor.pages.dev');
  qr.make();
  const svg = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
  return svg.replace(
    '<svg ',
    `<svg role="img" aria-label="${escapeHtml(altLabel)}" style="max-width:140px;width:100%;height:auto;display:inline-block;" `
  );
}

export function getMakkahHijriDate(date: Date = new Date()): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Riyadh',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', opts).format(date);
  } catch {
    try {
      return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', opts).format(date);
    } catch {
      return date.toLocaleDateString('ar-SA', { timeZone: 'Asia/Riyadh' });
    }
  }
}

export function announceToScreenReader(text: string, urgent: boolean = false): void {
  const region = document.getElementById(urgent ? 'a11y-assertive-region' : 'a11y-polite-region');
  if (!region) return;
  region.textContent = '';
  window.setTimeout(() => {
    region.textContent = text;
  }, 40);
}

let toastTimer: number | null = null;

export function showToast(text: string, urgent: boolean = false): void {
  const toast = document.getElementById('toast-msg');
  if (toast) {
    toast.textContent = text;
    toast.classList.add('show');
    if (toastTimer !== null) {
      window.clearTimeout(toastTimer);
    }
    toastTimer = window.setTimeout(() => {
      toast.classList.remove('show');
      toastTimer = null;
    }, 3200);
  }
  announceToScreenReader(text, urgent);
}

export async function copyToClipboard(text: string, successMessage: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast(successMessage);
  }
}

/**
 * Sets up native <dialog> elements with returnValue cleanup and
 * closedby="any" light-dismiss fallback for Safari / older browsers.
 */
const dialogOpeners = new WeakMap<HTMLDialogElement, HTMLElement>();

export function setupDialogs(): void {
  const dialogs = document.querySelectorAll<HTMLDialogElement>('dialog');
  dialogs.forEach((dialog) => {
    dialog.addEventListener('close', () => {
      dialog.returnValue = '';
      const opener = dialogOpeners.get(dialog);
      dialogOpeners.delete(dialog);
      if (opener && opener.isConnected && typeof opener.focus === 'function') {
        window.requestAnimationFrame(() => opener.focus({ preventScroll: true }));
      }
    });
  });

  if (!('closedBy' in HTMLDialogElement.prototype)) {
    const isOutside = (e: PointerEvent, dialog: HTMLDialogElement): boolean => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };

    document.querySelectorAll<HTMLDialogElement>('dialog[closedby="any"]').forEach((dialog) => {
      let pressedOutside = false;
      dialog.addEventListener('pointerdown', (e) => {
        if (dialog.open) {
          pressedOutside = isOutside(e, dialog);
        }
      });
      dialog.addEventListener('pointerup', (e) => {
        if (dialog.open && pressedOutside && isOutside(e, dialog)) {
          dialog.close();
        }
        pressedOutside = false;
      });
    });
  }
}

export function openDialogById(id: string): void {
  const dialog = document.getElementById(id) as HTMLDialogElement | null;
  if (!dialog) return;
  if (!dialog.open) {
    const activeEl = document.activeElement as HTMLElement | null;
    if (activeEl && activeEl !== document.body) {
      dialogOpeners.set(dialog, activeEl);
    }
    dialog.showModal();
  }
}

export function closeDialogById(id: string): void {
  const dialog = document.getElementById(id) as HTMLDialogElement | null;
  if (dialog && dialog.open) {
    dialog.close();
  }
}

/**
 * Progressive-enhancement sticky header observer: adds .is-stuck fallback class
 * for browsers without @container scroll-state(stuck: top).
 */
export function initStickyHeaders(): void {
  const sentinel = document.getElementById('sticky-header-sentinel');
  const stickyNav = document.querySelector<HTMLElement>('.sticky-bar-container');
  if (stickyNav && 'ResizeObserver' in window) {
    const syncHeaderHeight = () => {
      const h = Math.ceil(stickyNav.getBoundingClientRect().height);
      if (h > 0) {
        document.documentElement.style.setProperty('--header-height', `${h}px`);
      }
    };
    syncHeaderHeight();
    const ro = new ResizeObserver(syncHeaderHeight);
    ro.observe(stickyNav);
  }
  if (!sentinel || !stickyNav || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const stuck = entries[0] ? !entries[0].isIntersecting : false;
      stickyNav.classList.toggle('is-stuck', stuck);
    },
    { threshold: 0 }
  );
  observer.observe(sentinel);
}

const THEME_STORAGE_KEY = 'umrah_color_scheme';

export function getResolvedTheme(): 'light' | 'dark' {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  const content = meta?.content || 'light dark';
  if (content === 'dark') return 'dark';
  if (content === 'light') return 'light';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyColorScheme(value: string | null): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  const next = value === 'dark' || value === 'light' ? value : 'light dark';
  if (meta) meta.content = next;
  const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.content = getResolvedTheme() === 'dark' ? '#0b1115' : '#064e3b';
  }
  updateThemeButtonLabel();
}

export function toggleColorScheme(): void {
  const currentRendered = getResolvedTheme();
  const target = currentRendered === 'dark' ? 'light' : 'dark';
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const systemScheme = systemDark ? 'dark' : 'light';

  try {
    if (target === systemScheme) {
      localStorage.removeItem(THEME_STORAGE_KEY);
      applyColorScheme(null);
    } else {
      localStorage.setItem(THEME_STORAGE_KEY, target);
      applyColorScheme(target);
    }
  } catch {
    applyColorScheme(target);
  }
  showToast(target === 'dark' ? '🌙 تم تفعيل الوضع الليلي المريح للعين' : '☀️ تم تفعيل الوضع النهاري');
}

export function updateThemeButtonLabel(): void {
  const isDark = getResolvedTheme() === 'dark';
  const label = isDark ? t('tools.themeLight') : t('tools.theme');
  const icon = isDark ? '☀️' : '🌙';
  document.querySelectorAll<HTMLElement>('[data-theme-toggle]').forEach((btn) => {
    btn.innerHTML = `<span aria-hidden="true">${icon}</span> <span>${escapeHtml(label)}</span>`;
    btn.setAttribute('aria-pressed', String(isDark));
  });
}

export function initThemeSync(): void {
  try {
    applyColorScheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    applyColorScheme(null);
  }
  window.addEventListener('storage', (e) => {
    if (e.key === THEME_STORAGE_KEY) {
      applyColorScheme(e.newValue);
    }
  });
}

export function updateNetworkStatusBadge(): void {
  const el = document.getElementById('network-status-pill');
  if (!el) return;
  if (navigator.onLine) {
    el.textContent = t('tools.netOnline');
    el.className = 'badge badge-success';
  } else {
    el.textContent = t('tools.netOffline');
    el.className = 'badge badge-warning';
  }
}

export function registerServiceWorkerAndNetworkStatus(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore registration errors in unsupported environments
      });
    });
  }

  window.addEventListener('online', updateNetworkStatusBadge);
  window.addEventListener('offline', updateNetworkStatusBadge);
  updateNetworkStatusBadge();
}

let lightboxWired = false;

/**
 * Enables tap-to-zoom lightbox previews on Atlas, Ziyarat, and Gate photos
 * using a shared native <dialog> without duplicating modal markup.
 */
export function initImageLightbox(): void {
  if (lightboxWired) return;
  lightboxWired = true;

  let dialog = document.getElementById('image-lightbox-modal') as HTMLDialogElement | null;
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'image-lightbox-modal';
    dialog.className = 'lightbox-dialog';
    dialog.setAttribute('closedby', 'any');
    dialog.setAttribute('aria-labelledby', 'lightbox-title');
    dialog.innerHTML = `
      <div class="dialog-header">
        <h2 id="lightbox-title" style="font-size:1.05rem;"></h2>
        <button type="button" class="dialog-close-btn" data-close-lightbox aria-label="إغلاق">&times;</button>
      </div>
      <img id="lightbox-img" class="lightbox-img" src="" alt="">
      <p id="lightbox-caption" style="font-size:0.86rem;color:var(--text-muted);margin-top:0.65rem;line-height:1.6;"></p>
    `;
    document.body.appendChild(dialog);

    dialog.querySelector('[data-close-lightbox]')?.addEventListener('click', () => {
      dialog?.close();
    });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog?.close();
    });
  }

  document.addEventListener('click', (e) => {
    const trigger = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-zoom-src]');
    if (!trigger || !dialog) return;
    const src = trigger.dataset.zoomSrc;
    if (!src) return;
    const title = trigger.dataset.zoomTitle || '';
    const alt = trigger.dataset.zoomAlt || title;
    const imgEl = dialog.querySelector<HTMLImageElement>('#lightbox-img');
    const titleEl = dialog.querySelector<HTMLElement>('#lightbox-title');
    const capEl = dialog.querySelector<HTMLElement>('#lightbox-caption');
    if (imgEl) {
      imgEl.src = src;
      imgEl.alt = alt;
    }
    if (titleEl) titleEl.textContent = title;
    if (capEl) capEl.textContent = alt !== title ? alt : '';
    if (!dialog.open) dialog.showModal();
  });
}
