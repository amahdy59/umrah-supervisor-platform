import { Money } from '../../financial/money.js';
import { GameyaGroup, GameyaType, InstallmentStatus, PaymentMethod } from '../../financial/gameya.js';
import { escapeHtml, openDialogById } from '../shared.js';

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

const PLAN_LABELS: Record<GameyaType, string> = {
  [GameyaType.DEPOSIT_PLUS_MONTHLY]: 'مقدم حجز + أقساط شهرية',
  [GameyaType.DIRECT_INSTALLMENT]: 'تقسيط شهري متساوٍ',
  [GameyaType.ROTATING_ROSCA]: 'جمعية دورية بالأدوار',
  [GameyaType.DEPOSIT_PLUS_FINAL]: 'مقدم + الباقي قبل السفر',
  [GameyaType.BIWEEKLY_INSTALLMENT]: 'تقسيط كل أسبوعين',
  [GameyaType.FULL_CASH]: 'سداد نقدي كامل',
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

export function loadPersonalInstallmentsFromStorageAndParams(params: URLSearchParams): void {
  try {
    const raw = localStorage.getItem(STORAGE_PAY_KEY);
    if (raw) {
      personalPlan = { ...DEFAULT_SUMMARY, ...JSON.parse(raw) };
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

  if (plan && Object.values(GameyaType).includes(plan) && target > 0) {
    personalPlan = {
      memberName: name?.trim() || personalPlan.memberName,
      tripTitle: trip?.trim() || personalPlan.tripTitle,
      planType: plan,
      totalTarget: target,
      downPayment: Number.isFinite(down) && down >= 0 ? down : 0,
      totalPaid: Number.isFinite(paid) && paid >= 0 ? paid : 0,
      installmentCount: Number.isFinite(count) && count >= 1 ? count : 6,
      startDateIso: new Date().toISOString().slice(0, 10),
    };
    try {
      localStorage.setItem(STORAGE_PAY_KEY, JSON.stringify(personalPlan));
    } catch {
      // ignore storage errors
    }
  }
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

  const rowsHtml = items
    .map(
      (it) => `
    <tr>
      <th scope="row">${escapeHtml(it.labelAr || `قسط ${it.installmentNumber}`)}</th>
      <td>${it.dueDate.toLocaleDateString('ar-EG')}</td>
      <td>${it.amountDue.toDecimal().toLocaleString('ar-EG')} ج.م</td>
      <td>${it.amountPaid.toDecimal().toLocaleString('ar-EG')} ج.م</td>
      <td><span class="badge ${it.status === InstallmentStatus.PAID ? 'badge-success' : it.status === InstallmentStatus.PARTIALLY_PAID ? 'badge-warning' : 'badge-primary'}">${it.status === InstallmentStatus.PAID ? 'مسدد ✅' : it.status === InstallmentStatus.PARTIALLY_PAID ? 'جزئي' : 'مستحق'}</span></td>
    </tr>
  `
    )
    .join('');

  body.innerHTML = `
    <div class="info-box-neutral" style="margin-bottom:0.85rem;">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:0.4rem;">
        <strong>${escapeHtml(personalPlan.memberName)}</strong>
        <span class="badge badge-primary">${escapeHtml(PLAN_LABELS[personalPlan.planType])}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0.5rem;margin-top:0.65rem;text-align:center;">
        <div style="background:var(--card-bg);padding:0.5rem;border-radius:8px;border:1px solid var(--border);"><div style="font-size:0.75rem;color:var(--text-muted);">الإجمالي</div><strong>${summary.totalTarget.toDecimal().toLocaleString('ar-EG')}</strong></div>
        <div style="background:var(--card-bg);padding:0.5rem;border-radius:8px;border:1px solid var(--border);"><div style="font-size:0.75rem;color:var(--text-muted);">المسدد (${pct}%)</div><strong style="color:var(--success);">${summary.totalPaid.toDecimal().toLocaleString('ar-EG')}</strong></div>
        <div style="background:var(--card-bg);padding:0.5rem;border-radius:8px;border:1px solid var(--border);"><div style="font-size:0.75rem;color:var(--text-muted);">المتبقي</div><strong style="color:var(--gold-dark);">${summary.totalRemaining.toDecimal().toLocaleString('ar-EG')}</strong></div>
      </div>
    </div>
    <div class="table-wrapper" tabindex="0" role="region" aria-label="جدول أقساطي">
      <table class="schedule-table"><thead><tr><th>البند</th><th>الاستحقاق</th><th>المطلوب</th><th>المسدد</th><th>الحالة</th></tr></thead><tbody>${rowsHtml}</tbody></table>
    </div>
  `;

  openDialogById('my-installments-modal');
}
