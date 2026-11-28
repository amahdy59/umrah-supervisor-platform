import { Money } from '../../financial/money.js';
import { GameyaGroup, GameyaType, InstallmentStatus, PaymentMethod } from '../../financial/gameya.js';
import { buildWhatsAppUrl, escapeHtml, openDialogById } from '../shared.js';
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
  supervisorName?: string;
  supervisorPhone?: string;
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
  supervisorName: 'الشيخ مصطفى فليفل (أبو رضوى)',
  supervisorPhone: '+201040414659',
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
  const startParam = params.get('payStart');
  const name = params.get('name');
  const trip = params.get('trip');
  const supName = params.get('supName');
  const supPhone = params.get('supPhone');

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
    startDateIso:
      startParam && /^\d{4}-\d{2}-\d{2}$/.test(startParam)
        ? startParam
        : existingSaved?.startDateIso || new Date().toISOString().slice(0, 10),
    supervisorName: supName?.trim() || personalPlan.supervisorName,
    supervisorPhone: supPhone?.trim() || personalPlan.supervisorPhone,
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
      existingSaved.installmentCount !== candidate.installmentCount ||
      existingSaved.startDateIso !== candidate.startDateIso);

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
  const pct = Math.min(
    100,
    Math.round((summary.totalPaid.toDecimal() / Math.max(1, summary.totalTarget.toDecimal())) * 100)
  );
  const locale = isEn ? 'en-US' : 'ar-EG';
  const curSuffix = isEn ? ' EGP' : ' ج.م';
  const planLabel = (isEn ? PLAN_LABELS_EN : PLAN_LABELS_AR)[personalPlan.planType];
  const remainingDec = summary.totalRemaining.toDecimal();

  const nextDue = summary.nextDueItem;
  const nextDueBanner =
    remainingDec === 0
      ? `<div class="info-box-neutral" style="border-inline-start:4px solid var(--success);margin-bottom:0.85rem;">
           <strong style="color:var(--success);">🎉 ${isEn ? 'All installments settled in full!' : 'تم سداد قيمة الباقة بالكامل بحمد الله!'}</strong>
         </div>`
      : nextDue
        ? `<div class="${summary.overdueCount > 0 ? 'info-box-danger' : 'info-box-warn'}" style="margin-bottom:0.85rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
             <div>
               <strong>${summary.overdueCount > 0 ? (isEn ? '⚠️ Overdue / Next Payment:' : '⚠️ دفعة مستحقة / متأخرة:') : isEn ? '📅 Next Upcoming Installment:' : '📅 الدفعة القادمة المستحقة:'}</strong>
               <div style="font-size:0.86rem;margin-top:0.15rem;">
                 ${escapeHtml(isEn ? `Installment #${nextDue.installmentNumber}` : nextDue.labelAr || `قسط ${nextDue.installmentNumber}`)} —
                 <strong>${nextDue.remainingBalance.toDecimal().toLocaleString(locale)}${curSuffix}</strong>
                 (${isEn ? 'Due' : 'يستحق في'} ${nextDue.dueDate.toLocaleDateString(locale)})
               </div>
             </div>
             <a href="${buildWhatsAppUrl(
               isEn
                 ? `Assalamu Alaykum, ${personalPlan.memberName} here regarding (${personalPlan.tripTitle}). Inquiring about / confirming payment of ${nextDue.remainingBalance.toDecimal()} EGP.`
                 : `السلام عليكم مشرفنا الفاضل، معكم ${personalPlan.memberName} بخصوص أقساط (${personalPlan.tripTitle}) — الاستفسار أو إرسال تحويل بمبلغ ${nextDue.remainingBalance.toDecimal().toLocaleString('ar-EG')} ج.م.`,
               personalPlan.supervisorPhone
             )}" target="_blank" rel="noopener" class="btn btn-gold" style="min-height:40px;font-size:0.8rem;text-decoration:none;">
               📲 ${isEn ? 'Notify Supervisor' : 'إشعار سداد للمشرف'}
             </a>
           </div>`
        : '';

  const rowsHtml = items
    .map((it) => {
      const isOverdue = it.status !== InstallmentStatus.PAID && it.dueDate.getTime() < Date.now();
      const statusText =
        it.status === InstallmentStatus.PAID
          ? isEn
            ? 'Paid ✅'
            : 'مسدد ✅'
          : it.status === InstallmentStatus.PARTIALLY_PAID
            ? isEn
              ? 'Partial'
              : 'جزئي'
            : isOverdue
              ? isEn
                ? 'Overdue ⚠️'
                : 'متأخر ⚠️'
              : isEn
                ? 'Due'
                : 'مستحق';
      const badgeCls =
        it.status === InstallmentStatus.PAID
          ? 'badge-success'
          : isOverdue
            ? 'badge-danger'
            : it.status === InstallmentStatus.PARTIALLY_PAID
              ? 'badge-warning'
              : 'badge-primary';
      const label = isEn ? `Installment ${it.installmentNumber}` : it.labelAr || `قسط ${it.installmentNumber}`;
      return `
    <tr>
      <th scope="row">${escapeHtml(label)}</th>
      <td>${it.dueDate.toLocaleDateString(locale)}</td>
      <td>${it.amountDue.toDecimal().toLocaleString(locale)}${curSuffix}</td>
      <td>${it.amountPaid.toDecimal().toLocaleString(locale)}${curSuffix}</td>
      <td><span class="badge ${badgeCls}">${statusText}</span></td>
    </tr>
  `;
    })
    .join('');

  body.innerHTML = `
    <div class="info-box-neutral" style="margin-bottom:0.85rem;">
      <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.55rem;">
        <strong>${escapeHtml(personalPlan.memberName)}</strong>
        <span class="badge badge-primary">${escapeHtml(planLabel)}</span>
      </div>
      <progress class="umrah-progress" max="100" value="${pct}" aria-label="${isEn ? `Payment progress ${pct}%` : `نسبة السداد ${pct}%`}" style="margin-bottom:0.55rem;"></progress>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0.5rem;text-align:center;">
        <div style="background:var(--card-bg);padding:0.5rem;border-radius:8px;border:1px solid var(--border);"><div style="font-size:0.75rem;color:var(--text-muted);">${isEn ? 'Total' : 'الإجمالي'}</div><strong>${summary.totalTarget.toDecimal().toLocaleString(locale)}</strong></div>
        <div style="background:var(--card-bg);padding:0.5rem;border-radius:8px;border:1px solid var(--border);"><div style="font-size:0.75rem;color:var(--text-muted);">${isEn ? `Paid (${pct}%)` : `المسدد (${pct}%)`}</div><strong style="color:var(--success);">${summary.totalPaid.toDecimal().toLocaleString(locale)}</strong></div>
        <div style="background:var(--card-bg);padding:0.5rem;border-radius:8px;border:1px solid var(--border);"><div style="font-size:0.75rem;color:var(--text-muted);">${isEn ? 'Remaining' : 'المتبقي'}</div><strong style="color:var(--gold-dark);">${remainingDec.toLocaleString(locale)}</strong></div>
      </div>
    </div>
    ${nextDueBanner}
    <div class="info-box-neutral" style="margin-bottom:0.85rem;font-size:0.84rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
      <div>
        <strong>🏦 ${isEn ? 'Official Transfer Channels (Granada #1094):' : 'قنوات السداد الرسمية (شركة غرناطة ترخيص ١٠٩٤):'}</strong>
        <div style="color:var(--text-muted);margin-top:0.15rem;">
          ${isEn ? `InstaPay / Wallet to Supervisor: ${personalPlan.supervisorPhone || '+201040414659'} — Include your full name in notes.` : `إنستاباي / محفظة إلكترونية على رقم الإشراف (${personalPlan.supervisorPhone || '+201040414659'}) — مع إرسال صورة الإيصال للشيخ.`}
        </div>
      </div>
    </div>
    <div class="table-wrapper" tabindex="0" role="region" aria-label="${isEn ? 'My payment schedule' : 'جدول أقساطي'}">
      <table class="schedule-table">
        <caption class="sr-only">${isEn ? 'Personal Umrah installment schedule' : 'جدول أقساط المعتمر التفصيلي'}</caption>
        <thead><tr><th scope="col">${isEn ? 'Item' : 'البند'}</th><th scope="col">${isEn ? 'Due Date' : 'الاستحقاق'}</th><th scope="col">${isEn ? 'Amount' : 'المطلوب'}</th><th scope="col">${isEn ? 'Paid' : 'المسدد'}</th><th scope="col">${isEn ? 'Status' : 'الحالة'}</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;

  openDialogById('my-installments-modal');
}
