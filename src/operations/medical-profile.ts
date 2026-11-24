/**
 * Medical & Special Needs Profiles
 * Keeps track of chronic illnesses, wheelchair needs, and insulin refrigeration.
 */

export enum ChronicCondition {
  DIABETES = 'DIABETES', // السكري
  HYPERTENSION = 'HYPERTENSION', // ضغط الدم
  HEART_DISEASE = 'HEART_DISEASE', // أمراض القلب
  ASTHMA = 'ASTHMA', // حساسية الصدر / الربو
  MOBILITY_IMPAIRED = 'MOBILITY_IMPAIRED', // صعوبة في الحركة
  NONE = 'NONE',
}

export interface MedicalProfile {
  pilgrimId: string;
  pilgrimName: string;
  conditions: ChronicCondition[];
  requiresWheelchair: boolean;
  requiresInsulinRefrigeration: boolean;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bloodType?: string;
  notes?: string;
}

export class MedicalRegistry {
  private profiles: Map<string, MedicalProfile> = new Map();

  registerProfile(profile: MedicalProfile): void {
    this.profiles.set(profile.pilgrimId, profile);
  }

  getProfile(pilgrimId: string): MedicalProfile | undefined {
    return this.profiles.get(pilgrimId);
  }

  getAllProfiles(): MedicalProfile[] {
    return Array.from(this.profiles.values());
  }

  getWheelchairDemands(): MedicalProfile[] {
    return Array.from(this.profiles.values()).filter((p) => p.requiresWheelchair);
  }

  getInsulinStorageDemands(): MedicalProfile[] {
    return Array.from(this.profiles.values()).filter(
      (p) => p.requiresInsulinRefrigeration
    );
  }

  getHighRiskPilgrims(): MedicalProfile[] {
    return Array.from(this.profiles.values()).filter(
      (p) =>
        p.conditions.includes(ChronicCondition.HEART_DISEASE) ||
        p.requiresWheelchair ||
        p.requiresInsulinRefrigeration
    );
  }

  getEmergencyNumbers(): Record<string, string> {
    return {
      RED_CRESCENT_AMBULANCE: '997', // الهلال الأحمر السعودي
      CIVIL_DEFENSE: '998', // الدفاع المدني
      POLICE: '999', // الشرطة
      ROAD_SECURITY: '996', // أمن الطرق
      HARAM_EMERGENCY: '911', // الطوارئ الموحد
      MINISTRY_OF_HAJJ: '1966', // مركز خدمة ضيوف الرحمن
    };
  }
}
