import { describe, it, expect } from 'vitest';
import { Money } from '../../src/financial/money.js';
import {
  GameyaGroup,
  GameyaType,
  PaymentMethod,
  InstallmentStatus,
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
    // 100 EGP divided equally across 3 installments -> 33.34, 33.33, 33.33
    const total = Money.fromDecimal(100, 'EGP');
    const parts = total.allocate(3);
    expect(parts.length).toBe(3);
    expect(parts[0].toDecimal()).toBe(33.34);
    expect(parts[1].toDecimal()).toBe(33.33);
    expect(parts[2].toDecimal()).toBe(33.33);

    // Sum of allocated parts must exactly equal original total
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
    // 40,000 / 10 = 4,000 per month
    expect(schedule[0].amountDue.toDecimal()).toBe(4000);
    expect(schedule[0].status).toBe(InstallmentStatus.PENDING);

    const totalScheduled = schedule.reduce(
      (acc, s) => acc.add(s.amountDue),
      Money.zero('EGP')
    );
    expect(totalScheduled.minorAmount).toBe(Money.fromDecimal(40000, 'EGP').minorAmount);
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

    // 10 members join
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
    const inst1 = schedule[0]; // 5,000 EGP

    // 1. Partial payment: pays 2,000 EGP
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

    // 2. Complete payment: pays remaining 3,000 EGP
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
});
