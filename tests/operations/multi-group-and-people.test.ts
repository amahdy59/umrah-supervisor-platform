import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Gender, TripStatus } from '../../src/operations/trip-logistics.js';
import { ChronicCondition } from '../../src/operations/medical-profile.js';
import { PeopleDirectory } from '../../src/operations/people-directory.js';
import { UmrahGroupRegistry } from '../../src/operations/multi-group-manager.js';
import { GameyaType } from '../../src/financial/gameya.js';
import { dataUrlToBlob } from '../../src/ui/storage.js';

describe('PeopleDirectory - سجل الأشخاص الدائم عبر الرحلات', () => {
  it('stores, searches, tracks trip history, and detects passports expiring within 6 months', () => {
    const dir = new PeopleDirectory();

    dir.upsertPerson({
      id: 'person-1',
      fullName: 'أحمد محمود الشريف',
      gender: Gender.MALE,
      nationalId: '29001011234567',
      passportNumber: 'A12345678',
      passportExpiryDate: '2027-06-01',
      phone: '+201000000001',
      emergencyContactName: 'محمود الشريف',
      emergencyContactPhone: '+201099999999',
      conditions: [ChronicCondition.NONE],
      requiresWheelchair: false,
      requiresInsulinRefrigeration: false,
      pastTrips: ['عمرة رجب 1446'],
    });

    dir.upsertPerson({
      id: 'person-2',
      fullName: 'الحاج إبراهيم خليل',
      gender: Gender.MALE,
      passportNumber: 'A88887777',
      passportExpiryDate: '2026-04-01',
      phone: '+201200000000',
      emergencyContactName: 'سعيد إبراهيم',
      emergencyContactPhone: '+201211111111',
      conditions: [ChronicCondition.DIABETES],
      requiresWheelchair: true,
      requiresInsulinRefrigeration: true,
      pastTrips: [],
    });

    expect(dir.searchPeople('الشريف').length).toBe(1);
    dir.recordTripParticipation('person-1', 'عمرة شعبان 1447');
    expect(dir.getPerson('person-1')?.pastTrips).toContain('عمرة شعبان 1447');

    // For a trip departing 2026-02-01, passport valid until 2026-04-01 (< 6 months) must be flagged
    const expiring = dir.getExpiringPassports(new Date('2026-02-01'), 6);
    expect(expiring.map((p) => p.id)).toEqual(['person-2']);
  });
});

describe('UmrahGroupRegistry - إدارة الأفواج المتزامنة والمتتابعة', () => {
  it('manages multiple concurrent groups, validates stage transitions, and clones sequential trips', () => {
    const registry = new UmrahGroupRegistry();

    registry.addGroup({
      id: 'grp-1',
      tripTitle: 'فوج شعبان 1447 - مجموعة أ',
      tripCode: '#SHB-1447-A',
      status: TripStatus.IN_MAKKAH,
      startDate: '2026-02-01',
      endDate: '2026-02-11',
      hotelNameAr: 'فندق أبراج الكسوة',
      busNumber: 'باص 1',
      supervisorName: 'أبو عبد الرحمن',
      totalPilgrims: 45,
      boardedCount: 43,
      activeSosCount: 0,
      totalCollectedMinor: 32000000,
      totalTargetMinor: 40000000,
    });

    registry.addGroup({
      id: 'grp-2',
      tripTitle: 'فوج رمضان الأوائل 1447',
      tripCode: '#RMD-1447-1',
      status: TripStatus.PRE_DEPARTURE,
      startDate: '2026-02-20',
      endDate: '2026-03-02',
      hotelNameAr: 'فندق أبراج البيت',
      busNumber: 'باص 2',
      supervisorName: 'أبو عمر',
      totalPilgrims: 30,
      boardedCount: 0,
      activeSosCount: 0,
      totalCollectedMinor: 25000000,
      totalTargetMinor: 30000000,
    });

    const agg = registry.getAggregateActiveMetrics();
    expect(agg.activeGroupsCount).toBe(2);
    expect(agg.totalActivePilgrims).toBe(75);
    expect(agg.totalBoardedPilgrims).toBe(43);

    // Sequential transition: grp-1 moves IN_MAKKAH -> RETURN_TRANSIT -> COMPLETED
    registry.transitionGroupStage('grp-1', TripStatus.RETURN_TRANSIT);
    registry.transitionGroupStage('grp-1', TripStatus.COMPLETED);
    expect(registry.getCompletedGroups().length).toBe(1);
    expect(registry.getActiveGroups().length).toBe(1);

    // Clone grp-1 settings for a sequential follow-up trip
    const nextBatch = registry.cloneForNextSequentialTrip('grp-1', {
      id: 'grp-3',
      tripTitle: 'فوج شوال 1447',
      tripCode: '#SHW-1447',
      startDate: '2026-04-05',
      endDate: '2026-04-15',
    });
    expect(nextBatch.hotelNameAr).toBe('فندق أبراج الكسوة');
    expect(nextBatch.status).toBe(TripStatus.REGISTRATION_OPEN);
    expect(nextBatch.totalPilgrims).toBe(0);
  });
});

describe('Schema Parity & Storage Helpers', () => {
  it('keeps SQL schema enums and tables aligned with TS domain models', () => {
    const sql = readFileSync(resolve(process.cwd(), 'packages/database-schema/schema.sql'), 'utf-8');
    for (const plan of Object.values(GameyaType)) {
      expect(sql).toContain(`'${plan}'`);
    }
    expect(sql).toContain('CREATE TABLE people_directory');
    expect(sql).toContain('CREATE TABLE luggage_tags');
    expect(sql).toContain('passport_expiry_date DATE');
  });

  it('converts base64 data URLs cleanly to binary Blobs for IndexedDB migration', () => {
    const blob = dataUrlToBlob('data:image/png;base64,iVBORw0KGgo=');
    expect(blob).not.toBeNull();
    expect(blob?.type).toBe('image/png');
    expect(blob?.size).toBeGreaterThan(0);
    expect(dataUrlToBlob('not-a-data-url')).toBeNull();
  });
});
