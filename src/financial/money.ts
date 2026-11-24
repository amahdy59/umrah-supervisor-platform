/**
 * Money Value Object
 * Enforces integer minor units (cents/piastres/halalas) to prevent IEEE-754 floating point errors.
 */
export class Money {
  readonly minorAmount: number; // e.g. 10050 = 100.50
  readonly currency: string;

  constructor(minorAmount: number, currency: string = 'EGP') {
    if (!Number.isInteger(minorAmount)) {
      throw new Error(`Money minorAmount must be an integer, received: ${minorAmount}`);
    }
    this.minorAmount = minorAmount;
    this.currency = currency.toUpperCase();
  }

  static fromDecimal(amount: number, currency: string = 'EGP'): Money {
    const minor = Math.round(amount * 100);
    return new Money(minor, currency);
  }

  static zero(currency: string = 'EGP'): Money {
    return new Money(0, currency);
  }

  toDecimal(): number {
    return this.minorAmount / 100;
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorAmount + other.minorAmount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorAmount - other.minorAmount, this.currency);
  }

  multiply(factor: number): Money {
    const newMinor = Math.round(this.minorAmount * factor);
    return new Money(newMinor, this.currency);
  }

  /**
   * Allocates an amount across N portions distributing any remainder pennies
   * so that sum(allocated) === original amount.
   */
  allocate(parts: number): Money[] {
    if (parts <= 0 || !Number.isInteger(parts)) {
      throw new Error(`Parts must be a positive integer, received: ${parts}`);
    }
    const baseShare = Math.floor(this.minorAmount / parts);
    let remainder = this.minorAmount % parts;

    const result: Money[] = [];
    for (let i = 0; i < parts; i++) {
      let portion = baseShare;
      if (remainder > 0) {
        portion += 1;
        remainder -= 1;
      }
      result.push(new Money(portion, this.currency));
    }
    return result;
  }

  format(): string {
    const formatted = (this.minorAmount / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatted} ${this.currency}`;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Currency mismatch: cannot operate between ${this.currency} and ${other.currency}`
      );
    }
  }
}
