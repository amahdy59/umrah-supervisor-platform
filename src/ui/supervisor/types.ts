import { Gender, RoomType, TripStatus } from '../../operations/trip-logistics.js';
import { LuggageStatus, BagType } from '../../operations/luggage-tracker.js';
import { ChronicCondition } from '../../operations/medical-profile.js';
import { PersonRecord } from '../../operations/people-directory.js';
import { GameyaType, PaymentMethod } from '../../financial/gameya.js';

export interface PilgrimRecord {
  id: string;
  personId?: string;
  fullName: string;
  gender: Gender;
  passportNumber: string;
  phone: string;
  roomNumber: string;
  boarded: boolean;
  nusukReady: boolean;
}

export interface RoomRecord {
  id: string;
  roomNumber: string;
  type: RoomType;
  capacity: number;
  isFamilyRoom: boolean;
  occupantIds: string[];
}

export interface InstallmentPaymentLog {
  id: string;
  amount: number;
  method: PaymentMethod;
  ref?: string;
  dateIso: string;
}

export interface GameyaRecord {
  id: string;
  name: string;
  phone: string;
  planType: GameyaType;
  turnMonth: number;
  totalTarget: number;
  downPayment: number;
  installmentCount: number;
  totalPaid: number;
  startDateIso: string;
  payments: InstallmentPaymentLog[];
}

export interface LuggageRecord {
  id: string;
  tagCode: string;
  pilgrimName: string;
  roomNumber: string;
  bagType: BagType;
  status: LuggageStatus;
}

export interface MedicalRecord {
  id: string;
  pilgrimName: string;
  roomNumber: string;
  conditions: ChronicCondition[];
  requiresWheelchair: boolean;
  requiresElectricCart: boolean;
  requiresInsulinRefrigeration: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
}

export interface SOSRecord {
  id: string;
  pilgrimName: string;
  phone: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  notes: string;
  resolved: boolean;
  createdAt: string;
}

export interface GroupSettings {
  tripTitle: string;
  tripCode: string;
  status: TripStatus;
  startDate: string;
  endDate: string;
  busNumber: string;
  hotelKey: string;
  hotelNameAr: string;
  hotelNameEn: string;
  hotelAddressAr: string;
  hotelPhone: string;
  hotelLat: number;
  hotelLng: number;
  supervisorName: string;
  supervisorPhone: string;
  gatheringTime: string;
  meetingPoint: string;
}

export interface GroupWorkspace {
  id: string;
  settings: GroupSettings;
  pilgrims: PilgrimRecord[];
  rooms: RoomRecord[];
  gameya: GameyaRecord[];
  luggage: LuggageRecord[];
  medical: MedicalRecord[];
  sosAlerts: SOSRecord[];
}

export interface MultiGroupRootState {
  activeGroupId: string;
  groups: GroupWorkspace[];
  people: PersonRecord[];
}
