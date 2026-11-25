import { Money } from '../../financial/money.js';
import { GameyaGroup, GameyaType, InstallmentStatus, PaymentMethod } from '../../financial/gameya.js';
import { escapeHtml, openDialogById } from '../shared.js';
import { getCurrentLanguage } from '../i18n.js';

export interface PilgrimInstallmentSummary {
  memberName: string;
  tripTitle: string;
  planType: GameyaType;
  totalTarget: number;
  downPayment: number;
  totalPaid: number;
  installmentCount: number;
  startDateIso: string;
}

const STORAGE_PAY_KEY = 'umrah_pilgrim_installment_v1';

const PLAN_LABELS_AR: Record<GameyaType, string> = {
  [GameyaType.DEPOSIT_PLUS_MONTHLY]: 'مقدم حجز + أقساط شهرية',
  [GameyaType.DIRECT_INSTALLMENT]: 'تقسيط شهري متساوٍ',
  [GameyaType.ROTATING_ROSCA]: 'جمعية دورية بالأدوار',
  [GameyaType.DEPOSIT_PLUS_FINAL]: 'مقدم + الباقي قبل السفر',
  [GameyaType.BIWEEKLY_INSTALLMENT]: 'تقسيط كل أسبوعين',
  [GameyaType.FULL_CASH]: 'سداد نقدي كامل',
};

const PLAN_LABELS_EN: Record<GameyaType, string> = {
  [GameyaType.DEPOSIT_PLUS_MONTHLY]: 'Booking Deposit + Monthly',
  [GameyaType.DIRECT_INSTALLMENT]: 'Equal Monthly Installments',
  [GameyaType.ROTATING_ROSCA]: 'Rotating ROSCA (Gam’eya)',
  [GameyaType.DEPOSIT_PLUS_FINAL]: 'Deposit + Balance Before Travel',
  [GameyaType.BIWEEKLY_INSTALLMENT]: 'Biweekly Installments',
  [GameyaType.FULL_CASH]: 'Full Cash Settlement',
};

const DEFAULT_SUMMARY: PilgrimInstallmentSummary = {
  memberName: 'أحمد محمود الشريف',
  tripTitle: 'فوج عمرة شعبان المبارك',
  planType: GameyaType.DEPOSIT_PLUS_MONTHLY,
  totalTarget: 42000,
  downPayment: 12000,
  totalPaid: 27000,
  installmentCount: 6,
  startDateIso: '2026-01-15',
};

let personalPlan: PilgrimInstallmentSummary = { ...DEFAULT_SUMMARY };

export interface InstallmentLinkInspection {
  /** Candidate parsed from URL params if payPlan + payTarget are valid, else null. */
  candidate: PilgrimInstallmentSummary | null;
  /** True when localStorage already has a custom saved plan differing from candidate. */
  wouldOverwriteSavedPlan: boolean;
}

export function inspectPersonalInstallmentsFromStorageAndParams(params: URLSearchParams): InstallmentLinkInspection {
  let existingSaved: PilgrimInstallmentSummary | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_PAY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PilgrimInstallmentSummary>;
      existingSaved = { ...DEFAULT_SUMMARY, ...parsed };
      personalPlan = { ...existingSaved };
    }
  } catch {
    personalPlan = { ...DEFAULT_SUMMARY };
  }

  const plan = params.get('payPlan') as GameyaType | null;
  const target = Number(params.get('payTarget'));
  const paid = Number(params.get('payPaid'));
  const down = Number(params.get('payDown'));
  const count = Number(params.get('payCount'));
  const name = params.get('name');
  const trip = params.get('trip');

  if (!plan || !Object.values(GameyaType).includes(plan) || !Number.isFinite(target) || target <= 0) {
    return { candidate: null, wouldOverwriteSavedPlan: false };
  }

  const candidate: PilgrimInstallmentSummary = {
    memberName: name?.trim() || personalPlan.memberName,
    tripTitle: trip?.trim() || personalPlan.tripTitle,
    planType: plan,
    totalTarget: target,
    downPayment: Number.isFinite(down) && down >= 0 ? down : 0,
    totalPaid: Number.isFinite(paid) && paid >= 0 ? paid : 0,
    installmentCount: Number.isFinite(count) && count >= 1 ? Math.min(48, Math.round(count)) : 6,
    startDateIso: existingSaved?.startDateIso || new Date().toISOString().slice(0, 10),
  };

  const hasSavedCustomPlan =
    existingSaved !== null &&
    (existingSaved.memberName !== DEFAULT_SUMMARY.memberName ||
      existingSaved.totalTarget !== DEFAULT_SUMMARY.totalTarget ||
      existingSaved.totalPaid !== DEFAULT_SUMMARY.totalPaid ||
      existingSaved.planType !== DEFAULT_SUMMARY.planType);

  const differsFromSaved =
    existingSaved !== null &&
    (existingSaved.memberName !== candidate.memberName ||
      existingSaved.tripTitle !== candidate.tripTitle ||
      existingSaved.planType !== candidate.planType ||
      existingSaved.totalTarget !== candidate.totalTarget ||
      existingSaved.downPayment !== candidate.downPayment ||
      existingSaved.totalPaid !== candidate.totalPaid ||
      existingSaved.installmentCount !== candidate.installmentCount);

  if (!hasSavedCustomPlan || !differsFromSaved) {
    setPersonalInstallmentData(candidate);
    return { candidate, wouldOverwriteSavedPlan: false };
  }

  return { candidate, wouldOverwriteSavedPlan: true };
}

/**
 * Legacy-compatible loader: applies silently only if no custom saved plan would be overwritten.
 */
export function loadPersonalInstallmentsFromStorageAndParams(params: URLSearchParams): void {
  inspectPersonalInstallmentsFromStorageAndParams(params);
}

export function setPersonalInstallmentData(data: Partial<PilgrimInstallmentSummary>): void {
  personalPlan = { ...personalPlan, ...data };
  try {
    localStorage.setItem(STORAGE_PAY_KEY, JSON.stringify(personalPlan));
  } catch {
    // ignore
  }
}

export function openMyInstallmentsModal(): void {
  const isEn = getCurrentLanguage() === 'en';
  const body = document.getElementById('my-installments-body');
  if (!body) return;

  const group = new GameyaGroup({
    id: 'my-plan',
    name: personalPlan.tripTitle,
    type: personalPlan.planType,
    targetAmountPerMember: Money.fromDecimal(personalPlan.totalTarget, 'EGP'),
    downPayment: personalPlan.downPayment > 0 ? Money.fromDecimal(personalPlan.downPayment, 'EGP') : undefined,
    durationMonths: Math.max(1, personalPlan.installmentCount),
    startDate: new Date(personalPlan.startDateIso || Date.now()),
    currency: 'EGP',
  });
  group.registerMember({
    id: 'self',
    pilgrimId: 'self',
    fullName: personalPlan.memberName,
    phone: '',
    customPlanType: personalPlan.planType,
    downPayment: personalPlan.downPayment > 0 ? Money.fromDecimal(personalPlan.downPayment, 'EGP') : undefined,
  });
  const items = group.generateMemberSchedule('self', {
    planType: personalPlan.planType,
    installmentCount: Math.max(1, personalPlan.installmentCount),
  });
  if (personalPlan.totalPaid > 0) {
    group.recordFlexiblePayment({
      memberId: 'self',
      amount: Money.fromDecimal(Math.min(personalPlan.totalPaid, personalPlan.totalTarget), 'EGP'),
      method: PaymentMethod.INSTAPAY,
      supervisorId: 'sup',
    });
  }
  const summary = group.getMemberSummary('self');
  const pct = Math.min(100, Math.round((summary.totalPaid.toDecimal() / Math.max(1, summary.totalTarget.toDecimal())) * 100));
  const locale = isEn ? 'en-US' : 'ar-EG';
  const curSuffix = isEn ? ' EGP' : ' ج.م';
  const planLabel = (isEn ? PLAN_LABELS_EN : PLAN_LABELS_AR)[personalPlan.planType];

  const rowsHtml = items
    .map((it) => {
      const statusText =
        it.status === InstallmentStatus.PAID
          ? isEn
            ? 'Paid ✅'
            : 'مسدد ✅'
          : it.status === InstallmentStatus.PARTIALLY_PAID
            ? isEn
              ? 'Partial'
              : 'جزئي'
            : isEn
              ? 'Due'
              : 'مستحق';
      const label = isEn ? `Installment ${it.installmentNumber}` : it.labelAr || `قسط ${it.installmentNumber}`;
      return `
    <tr>
      <th scope="row">${escapeHtml(label)}</th>
      <td>${it.dueDate.toLocaleDateString(locale)}</td>
      <td>${it.amountDue.toDecimal().toLocaleString(locale)}${curSuffix}</td>
      <td>${it.amountPaid.toDecimal().toLocaleString(locale)}${curSuffix}</td>
      <td><span class="badge ${it.status === InstallmentStatus.PAID ? 'badge-success' : it.status === InstallmentStatus.PARTIALLY_PAID ? 'badge-warning' : 'badge-primary'}">${statusText}</span></td>
    </tr>
  `;
    })
    .join('');

  body.innerHTML = `
    <div class="info-box-neutral" style="margin-bottom:0.85rem;">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:0.4rem;">
        <strong>${escapeHtml(personalPlan.memberName)}</strong>
        <span class="badge badge-primary">${escapeHtml(planLabel)}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0.5rem;margin-top:0.65rem;text-align:center;">
        <div style="background:var(--card-bg);padding:0.5rem;border-radius:8px;border:1px solid var(--border);"><div style="font-size:0.75rem;color:var(--text-muted);">${isEn ? 'Total' : 'الإجمالي'}</div><strong>${summary.totalTarget.toDecimal().toLocaleString(locale)}</strong></div>
        <div style="background:var(--card-bg);padding:0.5rem;border-radius:8px;border:1px solid var(--border);"><div style="font-size:0.75rem;color:var(--text-muted);">${isEn ? `Paid (${pct}%)` : `المسدد (${pct}%)`}</div><strong style="color:var(--success);">${summary.totalPaid.toDecimal().toLocaleString(locale)}</strong></div>
        <div style="background:var(--card-bg);padding:0.5rem;border-radius:8px;border:1px solid var(--border);"><div style="font-size:0.75rem;color:var(--text-muted);">${isEn ? 'Remaining' : 'المتبقي'}</div><strong style="color:var(--gold-dark);">${summary.totalRemaining.toDecimal().toLocaleString(locale)}</strong></div>
      </div>
    </div>
    <div class="table-wrapper" tabindex="0" role="region" aria-label="${isEn ? 'My payment schedule' : 'جدول أقساطي'}">
      <table class="schedule-table"><thead><tr><th>${isEn ? 'Item' : 'البند'}</th><th>${isEn ? 'Due Date' : 'الاستحقاق'}</th><th>${isEn ? 'Amount' : 'المطلوب'}</th><th>${isEn ? 'Paid' : 'المسدد'}</th><th>${isEn ? 'Status' : 'الحالة'}</th></tr></thead><tbody>${rowsHtml}</tbody></table>
    </div>
  `;

  openDialogById('my-installments-modal');
}
