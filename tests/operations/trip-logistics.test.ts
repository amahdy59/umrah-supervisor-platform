import { describe, it, expect } from 'vitest';
import {
  Trip,
  TripStatus,
  Gender,
  RoomType,
  Room,
  Hotel,
  Pilgrim,
  Bus,
  RoomingEngine,
  BusRollCall,
  EmergencySOSDispatcher,
} from '../../src/operations/trip-logistics.js';

describe('Trip Lifecycle State Machine', () => {
  it('manages valid transitions between trip stages', () => {
    const trip = new Trip({
      id: 'trip-101',
      title: 'عمرة النصف من شعبان 1447',
      startDate: new Date('2026-02-15'),
      endDate: new Date('2026-02-25'),
    });

    expect(trip.status).toBe(TripStatus.DRAFT);
    trip.transitionTo(TripStatus.REGISTRATION_OPEN);
    expect(trip.status).toBe(TripStatus.REGISTRATION_OPEN);

    trip.transitionTo(TripStatus.PRE_DEPARTURE);
    trip.transitionTo(TripStatus.IN_TRANSIT);
    trip.transitionTo(TripStatus.IN_MAKKAH);
    expect(trip.status).toBe(TripStatus.IN_MAKKAH);
  });

  it('rejects illegal stage jumps', () => {
    const trip = new Trip({
      id: 'trip-102',
      title: 'عمرة رمضان',
      startDate: new Date('2026-03-10'),
      endDate: new Date('2026-03-22'),
    });

    // Cannot jump directly from DRAFT to IN_MAKKAH
    expect(() => trip.transitionTo(TripStatus.IN_MAKKAH)).toThrow(
      /Invalid state transition/
    );
  });
});

describe('Rooming Allocation Engine', () => {
  const hotelMakkah = new Hotel({
    id: 'hotel-mak-1',
    nameAr: 'فندق أبراج الكسوة',
    nameEn: 'Al Kiswah Towers Hotel',
    city: 'MAKKAH',
    addressAr: 'التيسير، جرول، مكة المكرمة',
    addressEn: 'At Taysir, Jarwal, Makkah',
    phone: '+966125300000',
    latitude: 21.4312,
    longitude: 39.8165,
  });

  const pMale1: Pilgrim = {
    id: 'p-m1',
    fullName: 'محمد علي',
    gender: Gender.MALE,
    phone: '+201011111111',
    passportNumber: 'A12345678',
  };

  const pMale2: Pilgrim = {
    id: 'p-m2',
    fullName: 'محمود حسن',
    gender: Gender.MALE,
    phone: '+201022222222',
    passportNumber: 'A23456789',
  };

  const pFemale1: Pilgrim = {
    id: 'p-f1',
    fullName: 'فاطمة إبراهيم',
    gender: Gender.FEMALE,
    phone: '+201033333333',
    passportNumber: 'A34567890',
  };

  it('assigns pilgrims to rooms up to capacity with gender validation', () => {
    const room = new Room({
      id: 'room-501',
      roomNumber: '501',
      hotelId: hotelMakkah.id,
      floor: 5,
      type: RoomType.DOUBLE,
      capacity: 2,
      isFamilyRoom: false,
    });

    const engine = new RoomingEngine();
    engine.assignPilgrimToRoom(room, pMale1);
    expect(room.occupants.length).toBe(1);

    engine.assignPilgrimToRoom(room, pMale2);
    expect(room.occupants.length).toBe(2);

    // Exceeding capacity throws error
    const pMale3: Pilgrim = { ...pMale1, id: 'p-m3', fullName: 'علي مصطفى' };
    expect(() => engine.assignPilgrimToRoom(room, pMale3)).toThrow(/exceeds room capacity/);
  });

  it('prevents mixing unrelated genders in standard non-family rooms', () => {
    const room = new Room({
      id: 'room-502',
      roomNumber: '502',
      hotelId: hotelMakkah.id,
      floor: 5,
      type: RoomType.DOUBLE,
      capacity: 2,
      isFamilyRoom: false,
    });

    const engine = new RoomingEngine();
    engine.assignPilgrimToRoom(room, pMale1);

    // Attempting to place female in male room without family flag must fail
    expect(() => engine.assignPilgrimToRoom(room, pFemale1)).toThrow(
      /Gender separation violation/
    );
  });

  it('allows mixed gender in verified family rooms', () => {
    const familyRoom = new Room({
      id: 'room-601',
      roomNumber: '601',
      hotelId: hotelMakkah.id,
      floor: 6,
      type: RoomType.DOUBLE,
      capacity: 2,
      isFamilyRoom: true, // Family room
    });

    const engine = new RoomingEngine();
    engine.assignPilgrimToRoom(familyRoom, pMale1);
    engine.assignPilgrimToRoom(familyRoom, pFemale1);

    expect(familyRoom.occupants.length).toBe(2);
  });
});

describe('Bus Attendance & Roll-Call', () => {
  it('tracks boarded pilgrims and computes missing list', () => {
    const bus = new Bus({
      id: 'bus-1',
      busNumber: 'باص رقم 1',
      plateNumber: 'أ ب ج 1234',
      driverName: 'أبو عمر',
      driverPhone: '+966500000000',
      capacity: 45,
    });

    const rollCall = new BusRollCall(bus);
    rollCall.registerManifest(['p-1', 'p-2', 'p-3', 'p-4']);

    // Check in p-1 and p-2
    rollCall.checkIn('p-1');
    rollCall.checkIn('p-2');

    expect(rollCall.getBoardedCount()).toBe(2);
    expect(rollCall.getMissingPilgrimIds()).toEqual(['p-3', 'p-4']);
  });
});

describe('Emergency SOS & Hotel Navigator Dispatcher', () => {
  it('calculates distance to hotel and formats Arabic taxi card for lost pilgrim', () => {
    const hotel = new Hotel({
      id: 'hotel-mak-1',
      nameAr: 'فندق أبراج الكسوة',
      nameEn: 'Al Kiswah Towers Hotel',
      city: 'MAKKAH',
      addressAr: 'التيسير، جرول، مكة المكرمة',
      addressEn: 'At Taysir, Jarwal, Makkah',
      phone: '+966125300000',
      latitude: 21.4312,
      longitude: 39.8165,
    });

    const dispatcher = new EmergencySOSDispatcher(hotel);

    // Pilgrim is located near King Fahd Gate in Haram (approx 21.4195, 39.8236)
    const alert = dispatcher.createSOSAlert({
      pilgrimId: 'p-lost-1',
      pilgrimName: 'عبد الرحمن الشريف',
      latitude: 21.4195,
      longitude: 39.8236,
      batteryLevel: 42,
      notes: 'أنا عند بوابة الملك فهد وضعت عن الفوج',
    });

    expect(alert.distanceToHotelMeters).toBeGreaterThan(1000); // ~1.5 km
    expect(alert.arabicTaxiCard).toContain('أرجو توصيلي إلى هذا الفندق');
    expect(alert.arabicTaxiCard).toContain('فندق أبراج الكسوة');
    expect(alert.arabicTaxiCard).toContain('التيسير، جرول، مكة المكرمة');
    expect(alert.arabicTaxiCard).toContain('+966125300000');
  });
});
