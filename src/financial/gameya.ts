import { Money } from './money.js';

export enum GameyaType {
  ROTATING_ROSCA = 'ROTATING_ROSCA', // جمعية دورية بالأدوار
  DIRECT_INSTALLMENT = 'DIRECT_INSTALLMENT', // تقسيط مباشر لرحلة معينة
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
}

export interface InstallmentScheduleItem {
  id: string;
  memberId: string;
  installmentNumber: number;
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
  durationMonths: number;
  startDate: Date;
  currency: string;
}

export class GameyaGroup {
  readonly id: string;
  readonly name: string;
  readonly type: GameyaType;
  readonly targetAmountPerMember: Money;
  readonly monthlyInstallment?: Money;
  readonly durationMonths: number;
  readonly startDate: Date;
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
    this.durationMonths = config.durationMonths;
    this.startDate = config.startDate;
    this.currency = config.currency.toUpperCase();
  }

  registerMember(member: GameyaMember): GameyaMember {
    this.members.set(member.id, member);
    return member;
  }

  getMembers(): GameyaMember[] {
    return Array.from(this.members.values());
  }

  generateMemberSchedule(memberId: string): InstallmentScheduleItem[] {
    const member = this.members.get(memberId);
    if (!member) {
      throw new Error(`Member with id ${memberId} not found`);
    }

    const portions = this.targetAmountPerMember.allocate(this.durationMonths);
    const scheduleItems: InstallmentScheduleItem[] = [];

    for (let i = 0; i < this.durationMonths; i++) {
      const dueDate = new Date(this.startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      const item: InstallmentScheduleItem = {
        id: `inst-${memberId}-${i + 1}`,
        memberId,
        installmentNumber: i + 1,
        dueDate,
        amountDue: portions[i],
        amountPaid: Money.zero(this.currency),
        remainingBalance: portions[i],
        status: InstallmentStatus.PENDING,
      };
      scheduleItems.push(item);
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
