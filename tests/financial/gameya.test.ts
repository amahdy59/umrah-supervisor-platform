import { describe, it, expect } from 'vitest';
import { Money } from '../../src/financial/money.js';
import {
  GameyaGroup,
  GameyaType,
  PaymentMethod,
  InstallmentStatus,
  previewInstallmentPlan,
} from '../../src/financial/gameya.js';

describe('Money Value Object', () => {
  it('creates money in minor units (cents/piastres) without float errors', () => {
    const m = Money.fromDecimal(3500.5, 'EGP');
    expect(m.minorAmount).toBe(350050);
    expect(m.toDecimal()).toBe(3500.5);
    expect(m.currency).toBe('EGP');
  });

  it('adds and subtracts money accurately', () => {
    const m1 = Money.fromDecimal(100.25, 'EGP');
    const m2 = Money.fromDecimal(50.75, 'EGP');
    const sum = m1.add(m2);
    expect(sum.toDecimal()).toBe(151.0);
    expect(sum.minorAmount).toBe(15100);

    const diff = m1.subtract(m2);
    expect(diff.toDecimal()).toBe(49.5);
  });

  it('throws error when operating across mismatched currencies', () => {
    const egp = Money.fromDecimal(100, 'EGP');
    const sar = Money.fromDecimal(100, 'SAR');
    expect(() => egp.add(sar)).toThrow(/Currency mismatch/);
  });

  it('allocates amounts without losing penny fractions', () => {
    const total = Money.fromDecimal(100, 'EGP');
    const parts = total.allocate(3);
    expect(parts.length).toBe(3);
    expect(parts[0].toDecimal()).toBe(33.34);
    expect(parts[1].toDecimal()).toBe(33.33);
    expect(parts[2].toDecimal()).toBe(33.33);

    const reconciled = parts.reduce((acc, p) => acc.add(p), Money.zero('EGP'));
    expect(reconciled.minorAmount).toBe(total.minorAmount);
  });
});

describe('Gam\'eya & Installment System', () => {
  it('generates direct installment schedule for individual pilgrim savings', () => {
    const group = new GameyaGroup({
      id: 'grp-direct-1',
      name: 'رحلة عمرة شعبان - تقسيط فردي',
      type: GameyaType.DIRECT_INSTALLMENT,
      targetAmountPerMember: Money.fromDecimal(40000, 'EGP'),
      durationMonths: 10,
      startDate: new Date('2026-01-01'),
      currency: 'EGP',
    });

    const member = group.registerMember({
      id: 'mem-1',
      pilgrimId: 'pilgrim-ahmed',
      fullName: 'أحمد محمود',
      phone: '+201000000001',
    });

    const schedule = group.generateMemberSchedule(member.id);
    expect(schedule.length).toBe(10);
    expect(schedule[0].amountDue.toDecimal()).toBe(4000);
    expect(schedule[0].status).toBe(InstallmentStatus.PENDING);

    const totalScheduled = schedule.reduce((acc, s) => acc.add(s.amountDue), Money.zero('EGP'));
    expect(totalScheduled.minorAmount).toBe(Money.fromDecimal(40000, 'EGP').minorAmount);
  });

  it('supports Deposit + Monthly, Deposit + Final, Biweekly, and Full Cash installment plans', () => {
    const group = new GameyaGroup({
      id: 'grp-flex-1',
      name: 'باقات تقسيط مرنة',
      type: GameyaType.DEPOSIT_PLUS_MONTHLY,
      targetAmountPerMember: Money.fromDecimal(40000, 'EGP'),
      downPayment: Money.fromDecimal(10000, 'EGP'),
      durationMonths: 6,
      startDate: new Date('2026-01-01'),
      departureDate: new Date('2026-07-15'),
      currency: 'EGP',
    });

    const m1 = group.registerMember({ id: 'm1', pilgrimId: 'p1', fullName: 'مقدم + شهري', phone: '+2010' });
    const s1 = group.generateMemberSchedule(m1.id);
    expect(s1.length).toBe(7); // 1 deposit + 6 monthly
    expect(s1[0].amountDue.toDecimal()).toBe(10000);
    expect(s1[1].amountDue.toDecimal()).toBe(5000);

    const m2 = group.registerMember({ id: 'm2', pilgrimId: 'p2', fullName: 'مقدم + قبل السفر', phone: '+2011' });
    const s2 = group.generateMemberSchedule(m2.id, { planType: GameyaType.DEPOSIT_PLUS_FINAL });
    expect(s2.length).toBe(2);
    expect(s2[0].amountDue.toDecimal()).toBe(10000);
    expect(s2[1].amountDue.toDecimal()).toBe(30000);

    const m3 = group.registerMember({ id: 'm3', pilgrimId: 'p3', fullName: 'نصف شهري', phone: '+2012' });
    const s3 = group.generateMemberSchedule(m3.id, { planType: GameyaType.BIWEEKLY_INSTALLMENT, installmentCount: 4 });
    expect(s3.length).toBe(4);
    expect(s3[0].amountDue.toDecimal()).toBe(10000);

    const m4 = group.registerMember({ id: 'm4', pilgrimId: 'p4', fullName: 'نقدي', phone: '+2013' });
    const s4 = group.generateMemberSchedule(m4.id, { planType: GameyaType.FULL_CASH });
    expect(s4.length).toBe(1);
    expect(s4[0].amountDue.toDecimal()).toBe(40000);
  });

  it('allocates flexible custom payments sequentially across multiple installments', () => {
    const group = new GameyaGroup({
      id: 'grp-flex-pay',
      name: 'سداد متدرج',
      type: GameyaType.DIRECT_INSTALLMENT,
      targetAmountPerMember: Money.fromDecimal(12000, 'EGP'),
      durationMonths: 3,
      startDate: new Date('2026-01-01'),
      currency: 'EGP',
    });

    const m = group.registerMember({ id: 'm-seq', pilgrimId: 'p-seq', fullName: 'محمود علي', phone: '+2015' });
    group.generateMemberSchedule(m.id);

    // Pay 5,500 EGP across 4,000 + 4,000 + 4,000 -> closes #1 (4,000) and partially pays #2 (1,500)
    const receipts = group.recordFlexiblePayment({
      memberId: m.id,
      amount: Money.fromDecimal(5500, 'EGP'),
      method: PaymentMethod.INSTAPAY,
      transactionRef: 'IPN-5500',
      supervisorId: 'sup-1',
    });

    expect(receipts.length).toBe(2);
    const summary = group.getMemberSummary(m.id, new Date('2026-02-15'));
    expect(summary.totalPaid.toDecimal()).toBe(5500);
    expect(summary.totalRemaining.toDecimal()).toBe(6500);
    expect(summary.overdueCount).toBe(1); // installment #2 was due 2026-02-01
  });

  it('generates rotating ROSCA group schedule with turn slots', () => {
    const rosca = new GameyaGroup({
      id: 'grp-rosca-1',
      name: 'جمعية عمرة رمضان المبارك',
      type: GameyaType.ROTATING_ROSCA,
      targetAmountPerMember: Money.fromDecimal(50000, 'EGP'),
      monthlyInstallment: Money.fromDecimal(5000, 'EGP'),
      durationMonths: 10,
      startDate: new Date('2026-01-01'),
      currency: 'EGP',
    });

    for (let i = 1; i <= 10; i++) {
      rosca.registerMember({
        id: `mem-${i}`,
        pilgrimId: `pilgrim-${i}`,
        fullName: `معتمر ${i}`,
        phone: `+20100000000${i}`,
        turnNumber: i,
      });
    }

    expect(rosca.getMembers().length).toBe(10);
    const payoutPlan = rosca.getTurnPayoutPlan();
    expect(payoutPlan.length).toBe(10);
    expect(payoutPlan[0].payoutAmount.toDecimal()).toBe(50000);
    expect(payoutPlan[0].memberId).toBe('mem-1');
  });

  it('records full and partial payments, updating balances and receipts', () => {
    const group = new GameyaGroup({
      id: 'grp-pay-1',
      name: 'جمعية الاختبار',
      type: GameyaType.DIRECT_INSTALLMENT,
      targetAmountPerMember: Money.fromDecimal(10000, 'EGP'),
      durationMonths: 2,
      startDate: new Date('2026-01-01'),
      currency: 'EGP',
    });

    const member = group.registerMember({
      id: 'mem-pay',
      pilgrimId: 'p-1',
      fullName: 'خالد عبد الله',
      phone: '+201111111111',
    });

    const schedule = group.generateMemberSchedule(member.id);
    const inst1 = schedule[0];

    const receipt1 = group.recordPayment({
      scheduleId: inst1.id,
      amount: Money.fromDecimal(2000, 'EGP'),
      method: PaymentMethod.INSTAPAY,
      transactionRef: 'IPN-987654321',
      supervisorId: 'sup-1',
    });

    expect(receipt1.receiptNumber).toMatch(/^REC-/);
    expect(receipt1.amountPaid.toDecimal()).toBe(2000);
    expect(inst1.status).toBe(InstallmentStatus.PARTIALLY_PAID);
    expect(inst1.amountPaid.toDecimal()).toBe(2000);
    expect(inst1.remainingBalance.toDecimal()).toBe(3000);

    const receipt2 = group.recordPayment({
      scheduleId: inst1.id,
      amount: Money.fromDecimal(3000, 'EGP'),
      method: PaymentMethod.CASH,
      supervisorId: 'sup-1',
    });

    expect(receipt2.amountPaid.toDecimal()).toBe(3000);
    expect(inst1.status).toBe(InstallmentStatus.PAID);
    expect(inst1.remainingBalance.toDecimal()).toBe(0);
  });

  it('generates Arabic WhatsApp reminder message for upcoming due dates', () => {
    const group = new GameyaGroup({
      id: 'grp-reminder',
      name: 'جمعية عمرة رجب',
      type: GameyaType.DIRECT_INSTALLMENT,
      targetAmountPerMember: Money.fromDecimal(6000, 'EGP'),
      durationMonths: 2,
      startDate: new Date('2026-03-01'),
      currency: 'EGP',
    });

    const member = group.registerMember({
      id: 'mem-rem',
      pilgrimId: 'p-rem',
      fullName: 'سعيد إبراهيم',
      phone: '+201200000000',
    });

    const schedule = group.generateMemberSchedule(member.id);
    const message = group.generateWhatsAppReminder(schedule[0].id);

    expect(message).toContain('سعيد إبراهيم');
    expect(message).toContain('3,000.00 EGP');
    expect(message).toContain('جمعية عمرة رجب');
    expect(message).toContain('المشرف');
  });

  it('computes live installment plan breakdowns and safely handles edge-case full deposits', () => {
    const monthlyPreview = previewInstallmentPlan({
      planType: GameyaType.DEPOSIT_PLUS_MONTHLY,
      totalTarget: 40000,
      downPayment: 10000,
      installmentCount: 6,
    });
    expect(monthlyPreview.valid).toBe(true);
    expect(monthlyPreview.regularInstallmentAmount).toBe(5000);
    expect(monthlyPreview.totalScheduledItems).toBe(7);

    const invalidPreview = previewInstallmentPlan({
      planType: GameyaType.DEPOSIT_PLUS_MONTHLY,
      totalTarget: 40000,
      downPayment: 42000,
      installmentCount: 6,
    });
    expect(invalidPreview.valid).toBe(false);
    expect(invalidPreview.errorAr).toContain('أقل من إجمالي الباقة');

    const group = new GameyaGroup({
      id: 'grp-edge',
      name: 'اختبار المقدم الكامل',
      type: GameyaType.DEPOSIT_PLUS_MONTHLY,
      targetAmountPerMember: Money.fromDecimal(20000, 'EGP'),
      downPayment: Money.fromDecimal(25000, 'EGP'),
      durationMonths: 4,
      startDate: new Date('2026-04-01'),
      currency: 'EGP',
    });
    const m = group.registerMember({ id: 'm-edge', pilgrimId: 'p-edge', fullName: 'عمر خالد', phone: '+2010' });
    const sched = group.generateMemberSchedule(m.id);
    expect(sched.length).toBe(1);
    expect(sched[0].amountDue.toDecimal()).toBe(20000);
  });
});
