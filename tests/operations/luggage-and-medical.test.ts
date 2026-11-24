import { describe, it, expect } from 'vitest';
import {
  LuggageTracker,
  LuggageStatus,
} from '../../src/operations/luggage-tracker.js';
import {
  MedicalRegistry,
  ChronicCondition,
} from '../../src/operations/medical-profile.js';

describe('LuggageTracker - إدارة وفرز أمتعة الفوج', () => {
  it('should add bags and format unique tags per room', () => {
    const tracker = new LuggageTracker();
    const bag1 = tracker.addBag('p1', 'أحمد محمود', '502', 'SUITCASE');
    const bag2 = tracker.addBag('p2', 'محمود حسن', '502', 'SUITCASE');

    expect(bag1.tagCode).toBe('BAG-502-01');
    expect(bag2.tagCode).toBe('BAG-502-02');
    expect(bag1.status).toBe(LuggageStatus.ON_BUS);
  });

  it('should update luggage status through the logistics chain', () => {
    const tracker = new LuggageTracker();
    const bag = tracker.addBag('p1', 'سعيد خليل', '504');

    const updatedLobby = tracker.updateBagStatus(bag.id, LuggageStatus.HOTEL_LOBBY);
    expect(updatedLobby.status).toBe(LuggageStatus.HOTEL_LOBBY);

    const updatedRoom = tracker.updateBagStatus(bag.id, LuggageStatus.DELIVERED_TO_ROOM);
    expect(updatedRoom.status).toBe(LuggageStatus.DELIVERED_TO_ROOM);
  });

  it('should generate printable bag tag text for hotel staff', () => {
    const tracker = new LuggageTracker();
    const bag = tracker.addBag('p1', 'فاطمة إبراهيم', '601');
    const tagText = tracker.generatePrintableTagText(
      bag.id,
      'فندق أبراج الكسوة',
      '+966501234567'
    );

    expect(tagText).toContain('فاطمة إبراهيم');
    expect(tagText).toContain('601');
    expect(tagText).toContain('أبراج الكسوة');
  });
});

describe('MedicalRegistry - السجل الصحي ورعاية ذوي الاحتياجات الخاصة', () => {
  it('should register medical profile and identify wheelchair and insulin requirements', () => {
    const registry = new MedicalRegistry();

    registry.registerProfile({
      pilgrimId: 'p1',
      pilgrimName: 'الحاج إبراهيم',
      conditions: [ChronicCondition.DIABETES, ChronicCondition.MOBILITY_IMPAIRED],
      requiresWheelchair: true,
      requiresInsulinRefrigeration: true,
      emergencyContactName: 'أحمد إبراهيم',
      emergencyContactPhone: '+201012345678',
    });

    registry.registerProfile({
      pilgrimId: 'p2',
      pilgrimName: 'سارة عبد الله',
      conditions: [ChronicCondition.NONE],
      requiresWheelchair: false,
      requiresInsulinRefrigeration: false,
      emergencyContactName: 'عبد الله',
      emergencyContactPhone: '+201087654321',
    });

    const wheelchairs = registry.getWheelchairDemands();
    expect(wheelchairs.length).toBe(1);
    expect(wheelchairs[0].pilgrimName).toBe('الحاج إبراهيم');

    const insulins = registry.getInsulinStorageDemands();
    expect(insulins.length).toBe(1);

    const emergencyNumbers = registry.getEmergencyNumbers();
    expect(emergencyNumbers.RED_CRESCENT_AMBULANCE).toBe('997');
  });
});
