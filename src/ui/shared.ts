import qrcode from 'qrcode-generator';

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
  return svg.replace('<svg ', `<svg role="img" aria-label="${escapeHtml(altLabel)}" style="max-width:140px;width:100%;height:auto;display:inline-block;" `);
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

export function showToast(text: string): void {
  const toast = document.getElementById('toast-msg');
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 3000);
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
export function setupDialogs(): void {
  const dialogs = document.querySelectorAll<HTMLDialogElement>('dialog');
  dialogs.forEach((dialog) => {
    dialog.addEventListener('close', () => {
      dialog.returnValue = '';
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
    dialog.showModal();
  }
}

export function closeDialogById(id: string): void {
  const dialog = document.getElementById(id) as HTMLDialogElement | null;
  if (dialog && dialog.open) {
    dialog.close();
  }
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
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  const isDark = getResolvedTheme() === 'dark';
  btn.innerHTML = isDark
    ? '<span aria-hidden="true">☀️</span> <span>الوضع النهاري</span>'
    : '<span aria-hidden="true">🌙</span> <span>الوضع الليلي</span>';
  btn.setAttribute('aria-pressed', String(isDark));
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

export function registerServiceWorkerAndNetworkStatus(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore registration errors in unsupported environments
      });
    });
  }

  const updateBadge = () => {
    const el = document.getElementById('network-status-pill');
    if (!el) return;
    if (navigator.onLine) {
      el.textContent = 'متصل • جاهز أوفلاين ✅';
      el.className = 'badge badge-success';
    } else {
      el.textContent = 'وضع بدون إنترنت (أوفلاين) 📴';
      el.className = 'badge badge-warning';
    }
  };

  window.addEventListener('online', updateBadge);
  window.addEventListener('offline', updateBadge);
  updateBadge();
}
