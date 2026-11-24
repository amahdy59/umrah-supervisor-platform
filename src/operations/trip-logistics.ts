export enum TripStatus {
  DRAFT = 'DRAFT',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  PRE_DEPARTURE = 'PRE_DEPARTURE',
  IN_TRANSIT = 'IN_TRANSIT',
  IN_MAKKAH = 'IN_MAKKAH',
  IN_MADINAH = 'IN_MADINAH',
  RETURN_TRANSIT = 'RETURN_TRANSIT',
  COMPLETED = 'COMPLETED',
}

export interface TripConfig {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
}

export class Trip {
  readonly id: string;
  readonly title: string;
  readonly startDate: Date;
  readonly endDate: Date;
  private _status: TripStatus = TripStatus.DRAFT;

  // Permitted stage transitions
  private static readonly VALID_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
    [TripStatus.DRAFT]: [TripStatus.REGISTRATION_OPEN],
    [TripStatus.REGISTRATION_OPEN]: [TripStatus.PRE_DEPARTURE, TripStatus.DRAFT],
    [TripStatus.PRE_DEPARTURE]: [TripStatus.IN_TRANSIT, TripStatus.REGISTRATION_OPEN],
    [TripStatus.IN_TRANSIT]: [TripStatus.IN_MAKKAH, TripStatus.IN_MADINAH],
    [TripStatus.IN_MAKKAH]: [TripStatus.IN_MADINAH, TripStatus.RETURN_TRANSIT],
    [TripStatus.IN_MADINAH]: [TripStatus.IN_MAKKAH, TripStatus.RETURN_TRANSIT],
    [TripStatus.RETURN_TRANSIT]: [TripStatus.COMPLETED],
    [TripStatus.COMPLETED]: [],
  };

  constructor(config: TripConfig) {
    this.id = config.id;
    this.title = config.title;
    this.startDate = config.startDate;
    this.endDate = config.endDate;
  }

  get status(): TripStatus {
    return this._status;
  }

  transitionTo(nextStatus: TripStatus): void {
    const allowed = Trip.VALID_TRANSITIONS[this._status] || [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(
        `Invalid state transition: cannot transition from ${this._status} to ${nextStatus}`
      );
    }
    this._status = nextStatus;
  }
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum RoomType {
  DOUBLE = 'DOUBLE',
  TRIPLE = 'TRIPLE',
  QUAD = 'QUAD',
  SUITE = 'SUITE',
}

export interface Pilgrim {
  id: string;
  fullName: string;
  gender: Gender;
  phone: string;
  passportNumber: string;
  medicalConditions?: string[];
  wheelchairNeeded?: boolean;
}

export interface HotelConfig {
  id: string;
  nameAr: string;
  nameEn: string;
  city: 'MAKKAH' | 'MADINAH';
  addressAr: string;
  addressEn: string;
  phone: string;
  latitude: number;
  longitude: number;
}

export class Hotel {
  readonly id: string;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly city: 'MAKKAH' | 'MADINAH';
  readonly addressAr: string;
  readonly addressEn: string;
  readonly phone: string;
  readonly latitude: number;
  readonly longitude: number;

  constructor(config: HotelConfig) {
    this.id = config.id;
    this.nameAr = config.nameAr;
    this.nameEn = config.nameEn;
    this.city = config.city;
    this.addressAr = config.addressAr;
    this.addressEn = config.addressEn;
    this.phone = config.phone;
    this.latitude = config.latitude;
    this.longitude = config.longitude;
  }
}

export interface RoomConfig {
  id: string;
  roomNumber: string;
  hotelId: string;
  floor: number;
  type: RoomType;
  capacity: number;
  isFamilyRoom?: boolean;
}

export class Room {
  readonly id: string;
  readonly roomNumber: string;
  readonly hotelId: string;
  readonly floor: number;
  readonly type: RoomType;
  readonly capacity: number;
  readonly isFamilyRoom: boolean;
  occupants: Pilgrim[] = [];

  constructor(config: RoomConfig) {
    this.id = config.id;
    this.roomNumber = config.roomNumber;
    this.hotelId = config.hotelId;
    this.floor = config.floor;
    this.type = config.type;
    this.capacity = config.capacity;
    this.isFamilyRoom = config.isFamilyRoom ?? false;
  }
}

export class RoomingEngine {
  assignPilgrimToRoom(room: Room, pilgrim: Pilgrim): void {
    if (room.occupants.length >= room.capacity) {
      throw new Error(
        `Assignment exceeds room capacity of ${room.capacity} beds in room ${room.roomNumber}`
      );
    }

    if (!room.isFamilyRoom && room.occupants.length > 0) {
      const existingGender = room.occupants[0].gender;
      if (pilgrim.gender !== existingGender) {
        throw new Error(
          `Gender separation violation: cannot assign ${pilgrim.gender} to a ${existingGender} room without family authorization`
        );
      }
    }

    room.occupants.push(pilgrim);
  }
}

export interface BusConfig {
  id: string;
  busNumber: string;
  plateNumber: string;
  driverName: string;
  driverPhone: string;
  capacity: number;
}

export class Bus {
  readonly id: string;
  readonly busNumber: string;
  readonly plateNumber: string;
  readonly driverName: string;
  readonly driverPhone: string;
  readonly capacity: number;

  constructor(config: BusConfig) {
    this.id = config.id;
    this.busNumber = config.busNumber;
    this.plateNumber = config.plateNumber;
    this.driverName = config.driverName;
    this.driverPhone = config.driverPhone;
    this.capacity = config.capacity;
  }
}

export class BusRollCall {
  private registeredManifest: Set<string> = new Set();
  private boardedPilgrims: Set<string> = new Set();

  constructor(readonly bus: Bus) {}

  registerManifest(pilgrimIds: string[]): void {
    for (const id of pilgrimIds) {
      this.registeredManifest.add(id);
    }
  }

  checkIn(pilgrimId: string): void {
    this.boardedPilgrims.add(pilgrimId);
  }

  getBoardedCount(): number {
    return this.boardedPilgrims.size;
  }

  getMissingPilgrimIds(): string[] {
    const missing: string[] = [];
    for (const id of this.registeredManifest) {
      if (!this.boardedPilgrims.has(id)) {
        missing.push(id);
      }
    }
    return missing;
  }
}

export interface SOSAlert {
  alertId: string;
  pilgrimId: string;
  pilgrimName: string;
  latitude: number;
  longitude: number;
  batteryLevel: number;
  notes?: string;
  distanceToHotelMeters: number;
  arabicTaxiCard: string;
  timestamp: Date;
}

export class EmergencySOSDispatcher {
  constructor(readonly activeHotel: Hotel) {}

  createSOSAlert(params: {
    pilgrimId: string;
    pilgrimName: string;
    latitude: number;
    longitude: number;
    batteryLevel: number;
    notes?: string;
  }): SOSAlert {
    const distanceMeters = this.calculateHaversineDistance(
      params.latitude,
      params.longitude,
      this.activeHotel.latitude,
      this.activeHotel.longitude
    );

    const arabicTaxiCard = [
      'يا سائق التاكسي الكريم، أنا معتمر ضللت طريقي.',
      'أرجو توصيلي إلى هذا الفندق:',
      `اسم الفندق: ${this.activeHotel.nameAr} (${this.activeHotel.nameEn})`,
      `العنوان: ${this.activeHotel.addressAr}`,
      `هاتف الاستقبال: ${this.activeHotel.phone}`,
    ].join('\n');

    return {
      alertId: `SOS-${Date.now().toString(36).toUpperCase()}`,
      pilgrimId: params.pilgrimId,
      pilgrimName: params.pilgrimName,
      latitude: params.latitude,
      longitude: params.longitude,
      batteryLevel: params.batteryLevel,
      notes: params.notes,
      distanceToHotelMeters: Math.round(distanceMeters),
      arabicTaxiCard,
      timestamp: new Date(),
    };
  }

  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
