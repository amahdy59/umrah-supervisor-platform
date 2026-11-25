import { Gender } from './trip-logistics.js';
import { ChronicCondition } from './medical-profile.js';

/**
 * Persistent People / Pilgrim CRM Directory
 * Keeps longitudinal records of pilgrims across multiple Umrah trips (passports, medical needs, trip history).
 */

export interface PersonRecord {
  id: string;
  fullName: string;
  gender: Gender;
  nationalId?: string;
  passportNumber: string;
  passportExpiryDate?: string; // ISO YYYY-MM-DD
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  conditions: ChronicCondition[];
  requiresWheelchair: boolean;
  requiresInsulinRefrigeration: boolean;
  pastTrips: string[];
  notes?: string;
  updatedAt: string;
}

export class PeopleDirectory {
  private people: Map<string, PersonRecord> = new Map();

  upsertPerson(input: Omit<PersonRecord, 'updatedAt'>): PersonRecord {
    const existing = this.people.get(input.id);
    const mergedTrips = Array.from(
      new Set([...(existing?.pastTrips || []), ...(input.pastTrips || [])])
    );
    const record: PersonRecord = {
      ...input,
      pastTrips: mergedTrips,
      updatedAt: new Date().toISOString(),
    };
    this.people.set(record.id, record);
    return record;
  }

  getPerson(id: string): PersonRecord | undefined {
    return this.people.get(id);
  }

  getAllPeople(): PersonRecord[] {
    return Array.from(this.people.values());
  }

  removePerson(id: string): boolean {
    return this.people.delete(id);
  }

  searchPeople(query: string): PersonRecord[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAllPeople();
    return this.getAllPeople().filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.passportNumber.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        (p.nationalId || '').toLowerCase().includes(q)
    );
  }

  recordTripParticipation(personId: string, tripTitle: string): PersonRecord {
    const person = this.people.get(personId);
    if (!person) {
      throw new Error(`Person ${personId} not found in directory`);
    }
    if (!person.pastTrips.includes(tripTitle)) {
      person.pastTrips.push(tripTitle);
    }
    person.updatedAt = new Date().toISOString();
    return person;
  }

  /**
   * Saudi Umrah regulations require at least 6 months passport validity from travel date.
   */
  isPassportValidForTrip(person: PersonRecord, tripStartDate: Date, minMonths: number = 6): boolean {
    if (!person.passportExpiryDate) return true;
    const expiry = new Date(person.passportExpiryDate);
    if (Number.isNaN(expiry.getTime())) return true;
    const minValidUntil = new Date(tripStartDate);
    minValidUntil.setMonth(minValidUntil.getMonth() + minMonths);
    return expiry.getTime() >= minValidUntil.getTime();
  }

  getExpiringPassports(tripStartDate: Date, minMonths: number = 6): PersonRecord[] {
    return this.getAllPeople().filter(
      (p) => p.passportExpiryDate && !this.isPassportValidForTrip(p, tripStartDate, minMonths)
    );
  }
}
