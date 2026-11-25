import { closeDialogById, openDialogById, showToast } from '../shared.js';

const PIN_HASH_KEY = 'umrah_supervisor_pin_hash_v1';
const SESSION_UNLOCK_KEY = 'umrah_supervisor_unlocked_v1';

export async function hashSupervisorPin(pin: string): Promise<string> {
  const normalized = `umrah-sup:${pin.trim()}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(normalized);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback deterministic digest when non-HTTPS localhost blocks subtle
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv-${(hash >>> 0).toString(16)}`;
}

export function hasPinProtection(): boolean {
  try {
    return Boolean(localStorage.getItem(PIN_HASH_KEY));
  } catch {
    return false;
  }
}

export function isSessionUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_UNLOCK_KEY) === '1';
  } catch {
    return false;
  }
}

export function updatePinStatusUi(): void {
  const configured = hasPinProtection();
  document.querySelectorAll<HTMLElement>('[data-pin-setup-btn]').forEach((btn) => {
    btn.textContent = configured ? '🔓 إدارة / إزالة قفل الرمز' : '🔒 تفعيل قفل الخصوصية (PIN)';
  });
  document.querySelectorAll<HTMLElement>('[data-pin-lock-now]').forEach((btn) => {
    btn.hidden = !configured;
  });
}

export function enforcePrivacyLockIfConfigured(): void {
  updatePinStatusUi();
  if (hasPinProtection() && !isSessionUnlocked()) {
    const main = document.getElementById('main-content');
    if (main) main.setAttribute('inert', '');
    openDialogById('pin-unlock-modal');
  }
}

export function lockSupervisorSessionNow(): void {
  if (!hasPinProtection()) {
    showToast('قم بتعيين رمز قفل (PIN) أولاً من القائمة');
    return;
  }
  try {
    sessionStorage.removeItem(SESSION_UNLOCK_KEY);
  } catch {
    // ignore
  }
  const main = document.getElementById('main-content');
  if (main) main.setAttribute('inert', '');
  openDialogById('pin-unlock-modal');
}

export function wirePrivacyLockHandlers(): void {
  const unlockDialog = document.getElementById('pin-unlock-modal') as HTMLDialogElement | null;
  // Prevent accidental Esc dismissal while locked
  unlockDialog?.addEventListener('cancel', (e) => {
    if (hasPinProtection() && !isSessionUnlocked()) {
      e.preventDefault();
    }
  });

  document.getElementById('pin-unlock-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('pin-unlock-input') as HTMLInputElement;
    const savedHash = localStorage.getItem(PIN_HASH_KEY);
    const candidateHash = await hashSupervisorPin(input.value);
    if (savedHash && candidateHash === savedHash) {
      try {
        sessionStorage.setItem(SESSION_UNLOCK_KEY, '1');
      } catch {
        // ignore
      }
      document.getElementById('main-content')?.removeAttribute('inert');
      input.value = '';
      closeDialogById('pin-unlock-modal');
      showToast('🔓 تم فتح لوحة المشرف بنجاح');
    } else {
      input.setCustomValidity('الرمز غير صحيح');
      input.reportValidity();
      showToast('⚠️ رمز الحماية غير صحيح', true);
    }
  });

  document.getElementById('pin-unlock-input')?.addEventListener('input', (e) => {
    (e.target as HTMLInputElement).setCustomValidity('');
  });

  document.querySelectorAll<HTMLElement>('[data-pin-setup-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const configured = hasPinProtection();
      const removeBtn = document.getElementById('btn-pin-remove');
      if (removeBtn) removeBtn.hidden = !configured;
      openDialogById('pin-setup-modal');
    });
  });

  document.querySelectorAll<HTMLElement>('[data-pin-lock-now]').forEach((btn) => {
    btn.addEventListener('click', lockSupervisorSessionNow);
  });

  document.getElementById('pin-setup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pinInput = document.getElementById('pin-setup-input') as HTMLInputElement;
    const val = pinInput.value.trim();
    if (!/^\d{4,6}$/.test(val)) {
      pinInput.setCustomValidity('أدخل 4 إلى 6 أرقام');
      pinInput.reportValidity();
      return;
    }
    const hash = await hashSupervisorPin(val);
    try {
      localStorage.setItem(PIN_HASH_KEY, hash);
      sessionStorage.setItem(SESSION_UNLOCK_KEY, '1');
    } catch {
      // ignore
    }
    pinInput.value = '';
    closeDialogById('pin-setup-modal');
    updatePinStatusUi();
    showToast('🔒 تم تفعيل قفل الحماية لحماية بيانات المعتمرين');
  });

  document.getElementById('btn-pin-remove')?.addEventListener('click', () => {
    try {
      localStorage.removeItem(PIN_HASH_KEY);
      sessionStorage.removeItem(SESSION_UNLOCK_KEY);
    } catch {
      // ignore
    }
    document.getElementById('main-content')?.removeAttribute('inert');
    closeDialogById('pin-setup-modal');
    updatePinStatusUi();
    showToast('🔓 تم إلغاء قفل الرمز السري');
  });
}
