import { Money } from './money.js';

export enum GameyaType {
  ROTATING_ROSCA = 'ROTATING_ROSCA', // جمعية دورية بالأدوار
  DIRECT_INSTALLMENT = 'DIRECT_INSTALLMENT', // تقسيط مباشر شهري لرحلة معينة
  DEPOSIT_PLUS_MONTHLY = 'DEPOSIT_PLUS_MONTHLY', // مقدم حجز + أقساط شهرية
  DEPOSIT_PLUS_FINAL = 'DEPOSIT_PLUS_FINAL', // مقدم حجز + سداد الباقي قبل السفر
  BIWEEKLY_INSTALLMENT = 'BIWEEKLY_INSTALLMENT', // تقسيط كل أسبوعين (نصف شهري)
  FULL_CASH = 'FULL_CASH', // سداد كامل نقداً / دفعة واحدة
}

export enum InstallmentStatus {
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  INSTAPAY = 'INSTAPAY',
  VODAFONE_CASH = 'VODAFONE_CASH',
  CARD = 'CARD',
}

export interface GameyaMember {
  id: string;
  pilgrimId: string;
  fullName: string;
  phone: string;
  turnNumber?: number; // For ROTATING_ROSCA
  payoutDate?: Date;
  customPlanType?: GameyaType;
  downPayment?: Money;
}

export interface InstallmentScheduleItem {
  id: string;
  memberId: string;
  installmentNumber: number;
  labelAr?: string;
  dueDate: Date;
  amountDue: Money;
  amountPaid: Money;
  remainingBalance: Money;
  status: InstallmentStatus;
}

export interface PaymentReceipt {
  receiptNumber: string;
  scheduleId: string;
  memberId: string;
  memberName: string;
  amountPaid: Money;
  remainingBalance: Money;
  method: PaymentMethod;
  transactionRef?: string;
  supervisorId: string;
  timestamp: Date;
  digitalSignature: string;
}

export interface GameyaConfig {
  id: string;
  name: string;
  type: GameyaType;
  targetAmountPerMember: Money;
  monthlyInstallment?: Money;
  downPayment?: Money;
  durationMonths: number;
  startDate: Date;
  departureDate?: Date;
  currency: string;
}

export interface FlexibleScheduleOptions {
  planType?: GameyaType;
  downPayment?: Money;
  installmentCount?: number;
  startDate?: Date;
  departureDate?: Date;
}

export class GameyaGroup {
  readonly id: string;
  readonly name: string;
  readonly type: GameyaType;
  readonly targetAmountPerMember: Money;
  readonly monthlyInstallment?: Money;
  readonly downPayment?: Money;
  readonly durationMonths: number;
  readonly startDate: Date;
  readonly departureDate?: Date;
  readonly currency: string;

  private members: Map<string, GameyaMember> = new Map();
  private schedules: Map<string, InstallmentScheduleItem[]> = new Map();
  private receipts: PaymentReceipt[] = [];

  constructor(config: GameyaConfig) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.targetAmountPerMember = config.targetAmountPerMember;
    this.monthlyInstallment = config.monthlyInstallment;
    this.downPayment = config.downPayment;
    this.durationMonths = config.durationMonths;
    this.startDate = config.startDate;
    this.departureDate = config.departureDate;
    this.currency = config.currency.toUpperCase();
  }

  registerMember(member: GameyaMember): GameyaMember {
    this.members.set(member.id, member);
    return member;
  }

  getMembers(): GameyaMember[] {
    return Array.from(this.members.values());
  }

  getMemberSchedule(memberId: string): InstallmentScheduleItem[] {
    return this.schedules.get(memberId) || [];
  }

  getReceiptsForMember(memberId: string): PaymentReceipt[] {
    return this.receipts.filter((r) => r.memberId === memberId);
  }

  generateMemberSchedule(memberId: string, options: FlexibleScheduleOptions = {}): InstallmentScheduleItem[] {
    const member = this.members.get(memberId);
    if (!member) {
      throw new Error(`Member with id ${memberId} not found`);
    }

    const planType = options.planType || member.customPlanType || this.type;
    const startDate = options.startDate || this.startDate;
    const departureDate = options.departureDate || this.departureDate;
    const downPayment = options.downPayment || member.downPayment || this.downPayment;

    const scheduleItems: InstallmentScheduleItem[] = [];

    if (planType === GameyaType.FULL_CASH) {
      scheduleItems.push({
        id: `inst-${memberId}-1`,
        memberId,
        installmentNumber: 1,
        labelAr: 'سداد نقدي كامل',
        dueDate: new Date(startDate),
        amountDue: this.targetAmountPerMember,
        amountPaid: Money.zero(this.currency),
        remainingBalance: this.targetAmountPerMember,
        status: InstallmentStatus.PENDING,
      });
      this.schedules.set(memberId, scheduleItems);
      return scheduleItems;
    }

    if (planType === GameyaType.DEPOSIT_PLUS_FINAL) {
      const deposit =
        downPayment && downPayment.minorAmount > 0 && downPayment.minorAmount < this.targetAmountPerMember.minorAmount
          ? downPayment
          : this.targetAmountPerMember.allocate(3)[0]; // ~33% booking deposit default
      const finalBal = this.targetAmountPerMember.subtract(deposit);
      const finalDate = departureDate
        ? new Date(departureDate.getTime() - 14 * 24 * 60 * 60 * 1000)
        : new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate());

      scheduleItems.push(
        {
          id: `inst-${memberId}-1`,
          memberId,
          installmentNumber: 1,
          labelAr: 'مقدم الحجز وتأكيد المقعد',
          dueDate: new Date(startDate),
          amountDue: deposit,
          amountPaid: Money.zero(this.currency),
          remainingBalance: deposit,
          status: InstallmentStatus.PENDING,
        },
        {
          id: `inst-${memberId}-2`,
          memberId,
          installmentNumber: 2,
          labelAr: 'الدفعة الختامية قبل السفر',
          dueDate: finalDate,
          amountDue: finalBal,
          amountPaid: Money.zero(this.currency),
          remainingBalance: finalBal,
          status: InstallmentStatus.PENDING,
        }
      );
      this.schedules.set(memberId, scheduleItems);
      return scheduleItems;
    }

    if (planType === GameyaType.DEPOSIT_PLUS_MONTHLY && downPayment && downPayment.minorAmount > 0) {
      if (downPayment.minorAmount >= this.targetAmountPerMember.minorAmount) {
        scheduleItems.push({
          id: `inst-${memberId}-1`,
          memberId,
          installmentNumber: 1,
          labelAr: 'سداد كامل عند التعاقد',
          dueDate: new Date(startDate),
          amountDue: this.targetAmountPerMember,
          amountPaid: Money.zero(this.currency),
          remainingBalance: this.targetAmountPerMember,
          status: InstallmentStatus.PENDING,
        });
        this.schedules.set(memberId, scheduleItems);
        return scheduleItems;
      }

      const count = Math.max(1, options.installmentCount || this.durationMonths);
      const remainingToAllocate = this.targetAmountPerMember.subtract(downPayment);
      const portions = remainingToAllocate.allocate(count);

      scheduleItems.push({
        id: `inst-${memberId}-1`,
        memberId,
        installmentNumber: 1,
        labelAr: 'مقدم التعاقد',
        dueDate: new Date(startDate),
        amountDue: downPayment,
        amountPaid: Money.zero(this.currency),
        remainingBalance: downPayment,
        status: InstallmentStatus.PENDING,
      });

      for (let i = 0; i < count; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i + 1);
        scheduleItems.push({
          id: `inst-${memberId}-${i + 2}`,
          memberId,
          installmentNumber: i + 2,
          labelAr: `قسط شهري (${i + 1})`,
          dueDate,
          amountDue: portions[i],
          amountPaid: Money.zero(this.currency),
          remainingBalance: portions[i],
          status: InstallmentStatus.PENDING,
        });
      }
      this.schedules.set(memberId, scheduleItems);
      return scheduleItems;
    }

    // Standard monthly (DIRECT_INSTALLMENT / ROTATING_ROSCA) or BIWEEKLY_INSTALLMENT
    const totalCount = Math.max(1, options.installmentCount || this.durationMonths);
    const portions = this.targetAmountPerMember.allocate(totalCount);

    for (let i = 0; i < totalCount; i++) {
      const dueDate = new Date(startDate);
      if (planType === GameyaType.BIWEEKLY_INSTALLMENT) {
        dueDate.setDate(dueDate.getDate() + i * 14);
      } else {
        dueDate.setMonth(dueDate.getMonth() + i);
      }

      scheduleItems.push({
        id: `inst-${memberId}-${i + 1}`,
        memberId,
        installmentNumber: i + 1,
        labelAr: planType === GameyaType.BIWEEKLY_INSTALLMENT ? `قسط نصف شهري (${i + 1})` : `قسط شهر (${i + 1})`,
        dueDate,
        amountDue: portions[i],
        amountPaid: Money.zero(this.currency),
        remainingBalance: portions[i],
        status: InstallmentStatus.PENDING,
      });
    }

    this.schedules.set(memberId, scheduleItems);
    return scheduleItems;
  }

  getTurnPayoutPlan(): { turnNumber: number; memberId: string; payoutAmount: Money; payoutMonth: Date }[] {
    if (this.type !== GameyaType.ROTATING_ROSCA) {
      throw new Error('Payout plan with turns is only applicable for ROTATING_ROSCA');
    }

    const membersWithTurns = Array.from(this.members.values())
      .filter((m) => m.turnNumber !== undefined)
      .sort((a, b) => (a.turnNumber || 0) - (b.turnNumber || 0));

    return membersWithTurns.map((member) => {
      const payoutMonth = new Date(this.startDate);
      payoutMonth.setMonth(payoutMonth.getMonth() + ((member.turnNumber || 1) - 1));

      return {
        turnNumber: member.turnNumber!,
        memberId: member.id,
        payoutAmount: this.targetAmountPerMember,
        payoutMonth,
      };
    });
  }

  recordPayment(params: {
    scheduleId: string;
    amount: Money;
    method: PaymentMethod;
    transactionRef?: string;
    supervisorId: string;
  }): PaymentReceipt {
    let targetItem: InstallmentScheduleItem | undefined;
    let targetMemberId: string | undefined;

    for (const [memberId, items] of this.schedules.entries()) {
      const match = items.find((it) => it.id === params.scheduleId);
      if (match) {
        targetItem = match;
        targetMemberId = memberId;
        break;
      }
    }

    if (!targetItem || !targetMemberId) {
      throw new Error(`Installment schedule with id ${params.scheduleId} not found`);
    }

    const member = this.members.get(targetMemberId)!;
    targetItem.amountPaid = targetItem.amountPaid.add(params.amount);
    targetItem.remainingBalance = targetItem.amountDue.subtract(targetItem.amountPaid);

    if (targetItem.remainingBalance.minorAmount <= 0) {
      targetItem.status = InstallmentStatus.PAID;
      targetItem.remainingBalance = Money.zero(this.currency);
    } else {
      targetItem.status = InstallmentStatus.PARTIALLY_PAID;
    }

    const receiptNumber = `REC-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      Math.random() * 1000
    )}`;

    const receipt: PaymentReceipt = {
      receiptNumber,
      scheduleId: targetItem.id,
      memberId: targetMemberId,
      memberName: member.fullName,
      amountPaid: params.amount,
      remainingBalance: targetItem.remainingBalance,
      method: params.method,
      transactionRef: params.transactionRef,
      supervisorId: params.supervisorId,
      timestamp: new Date(),
      digitalSignature: `SIG_${receiptNumber}_${targetItem.id}`,
    };

    this.receipts.push(receipt);
    return receipt;
  }

  /**
   * Allocates any custom payment amount sequentially across a member's open installments.
   */
  recordFlexiblePayment(params: {
    memberId: string;
    amount: Money;
    method: PaymentMethod;
    transactionRef?: string;
    supervisorId: string;
  }): PaymentReceipt[] {
    const items = this.schedules.get(params.memberId);
    if (!items || items.length === 0) {
      throw new Error(`No schedule found for member ${params.memberId}`);
    }

    let remainingMinor = params.amount.minorAmount;
    const generated: PaymentReceipt[] = [];

    for (const item of items) {
      if (remainingMinor <= 0) break;
      if (item.remainingBalance.minorAmount <= 0) continue;

      const applyMinor = Math.min(remainingMinor, item.remainingBalance.minorAmount);
      const portion = new Money(applyMinor, this.currency);
      const receipt = this.recordPayment({
        scheduleId: item.id,
        amount: portion,
        method: params.method,
        transactionRef: params.transactionRef,
        supervisorId: params.supervisorId,
      });
      generated.push(receipt);
      remainingMinor -= applyMinor;
    }

    return generated;
  }

  getMemberSummary(memberId: string, asOfDate: Date = new Date()): {
    totalTarget: Money;
    totalPaid: Money;
    totalRemaining: Money;
    overdueCount: number;
    nextDueItem?: InstallmentScheduleItem;
  } {
    const items = this.schedules.get(memberId) || [];
    const totalPaid = items.reduce((acc, it) => acc.add(it.amountPaid), Money.zero(this.currency));
    const totalRemaining = items.reduce((acc, it) => acc.add(it.remainingBalance), Money.zero(this.currency));
    const overdueCount = items.filter(
      (it) => it.status !== InstallmentStatus.PAID && it.dueDate.getTime() < asOfDate.getTime()
    ).length;
    const nextDueItem = items.find((it) => it.status !== InstallmentStatus.PAID);

    return {
      totalTarget: this.targetAmountPerMember,
      totalPaid,
      totalRemaining,
      overdueCount,
      nextDueItem,
    };
  }

  generateWhatsAppReminder(scheduleId: string): string {
    let targetItem: InstallmentScheduleItem | undefined;
    let targetMember: GameyaMember | undefined;

    for (const [memberId, items] of this.schedules.entries()) {
      const match = items.find((it) => it.id === scheduleId);
      if (match) {
        targetItem = match;
        targetMember = this.members.get(memberId);
        break;
      }
    }

    if (!targetItem || !targetMember) {
      throw new Error(`Installment schedule item not found for reminder`);
    }

    const dueDateFormatted = targetItem.dueDate.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return [
      `السلام عليكم ورحمة الله وبركاته، أخي الكريم ${targetMember.fullName}.`,
      `نود تذكيركم بموعد استحقاق قسط العمرة رقم (${targetItem.installmentNumber}) لـ "${this.name}".`,
      `المبلغ المطلوب: ${targetItem.remainingBalance.format()}`,
      `تاريخ الاستحقاق: ${dueDateFormatted}`,
      `للسداد أو الاستفسار، يرجى التواصل مع المشرف. تقبل الله طاعتكم ويسر أمركم.`,
    ].join('\n');
  }
}

export interface InstallmentPlanPreview {
  valid: boolean;
  errorAr?: string;
  downPayment: number;
  regularInstallmentAmount: number;
  regularCount: number;
  finalBalance?: number;
  totalScheduledItems: number;
  summaryAr: string;
}

/**
 * Pure Money-safe calculator used for live enrollment previews and form validation.
 */
export function previewInstallmentPlan(params: {
  planType: GameyaType;
  totalTarget: number;
  downPayment?: number;
  installmentCount?: number;
  currency?: string;
}): InstallmentPlanPreview {
  const currency = (params.currency || 'EGP').toUpperCase();
  const total = Number.isFinite(params.totalTarget) ? params.totalTarget : 0;
  const down = Number.isFinite(params.downPayment) ? params.downPayment! : 0;
  const count = Math.max(1, Math.min(48, Math.round(params.installmentCount || 6)));

  if (total <= 0) {
    return {
      valid: false,
      errorAr: 'يجب أن يكون إجمالي الباقة أكبر من صفر.',
      downPayment: 0,
      regularInstallmentAmount: 0,
      regularCount: 0,
      totalScheduledItems: 0,
      summaryAr: 'أدخل إجمالي المبلغ لحساب الأقساط.',
    };
  }

  if (params.planType === GameyaType.FULL_CASH) {
    return {
      valid: true,
      downPayment: total,
      regularInstallmentAmount: total,
      regularCount: 1,
      totalScheduledItems: 1,
      summaryAr: `دفعة واحدة كاملة: ${total.toLocaleString('ar-EG')} ج.م عند التعاقد.`,
    };
  }

  if (
    (params.planType === GameyaType.DEPOSIT_PLUS_MONTHLY ||
      params.planType === GameyaType.DEPOSIT_PLUS_FINAL) &&
    (down < 0 || down >= total)
  ) {
    return {
      valid: false,
      errorAr: 'يجب أن يكون المقدم أقل من إجمالي الباقة (أو اختر سداد نقدي كامل).',
      downPayment: down,
      regularInstallmentAmount: 0,
      regularCount: 0,
      totalScheduledItems: 0,
      summaryAr: 'تحقق من قيمة المقدم مقارنة بإجمالي الباقة.',
    };
  }

  const totalMoney = Money.fromDecimal(total, currency);

  if (params.planType === GameyaType.DEPOSIT_PLUS_FINAL) {
    const depMoney = down > 0 ? Money.fromDecimal(down, currency) : totalMoney.allocate(3)[0];
    const balMoney = totalMoney.subtract(depMoney);
    const depDec = depMoney.toDecimal();
    const balDec = balMoney.toDecimal();
    return {
      valid: true,
      downPayment: depDec,
      regularInstallmentAmount: balDec,
      regularCount: 1,
      finalBalance: balDec,
      totalScheduledItems: 2,
      summaryAr: `مقدم حجز ${depDec.toLocaleString('ar-EG')} ج.م + الدفعة الختامية ${balDec.toLocaleString('ar-EG')} ج.م قبل السفر بأسبوعين.`,
    };
  }

  if (params.planType === GameyaType.DEPOSIT_PLUS_MONTHLY && down > 0) {
    const depMoney = Money.fromDecimal(down, currency);
    const remMoney = totalMoney.subtract(depMoney);
    const parts = remMoney.allocate(count);
    const perDec = parts[0].toDecimal();
    return {
      valid: true,
      downPayment: depMoney.toDecimal(),
      regularInstallmentAmount: perDec,
      regularCount: count,
      totalScheduledItems: count + 1,
      summaryAr: `مقدم ${depMoney.toDecimal().toLocaleString('ar-EG')} ج.م + ${count} أقساط شهرية (~${perDec.toLocaleString('ar-EG')} ج.م/شهر).`,
    };
  }

  const parts = totalMoney.allocate(count);
  const perDec = parts[0].toDecimal();
  const unitLabel = params.planType === GameyaType.BIWEEKLY_INSTALLMENT ? 'دفعة كل أسبوعين' : 'أقساط شهرية';
  return {
    valid: true,
    downPayment: 0,
    regularInstallmentAmount: perDec,
    regularCount: count,
    totalScheduledItems: count,
    summaryAr: `${count} ${unitLabel} بقيمة ~${perDec.toLocaleString('ar-EG')} ج.م لكل دفعة.`,
  };
}
