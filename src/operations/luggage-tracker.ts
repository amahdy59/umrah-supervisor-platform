/**
 * Luggage and Bag Tagging Tracker
 * Manages bus unloading, lobby sorting, and room delivery for Umrah groups.
 */

export enum LuggageStatus {
  ON_BUS = 'ON_BUS', // بالباص
  HOTEL_LOBBY = 'HOTEL_LOBBY', // في بهو الفندق
  DELIVERED_TO_ROOM = 'DELIVERED_TO_ROOM', // سُلّمت للغرفة
  LOST = 'LOST', // مفقودة / جاري البحث
}

export type BagType = 'SUITCASE' | 'HANDBAG' | 'ZAMZAM';

export interface LuggageItem {
  id: string;
  pilgrimId: string;
  pilgrimName: string;
  roomNumber: string;
  tagCode: string; // e.g. UMR-502-01
  bagType: BagType;
  status: LuggageStatus;
  updatedAt: string;
}

export class LuggageTracker {
  private bags: Map<string, LuggageItem> = new Map();

  addBag(
    pilgrimId: string,
    pilgrimName: string,
    roomNumber: string,
    bagType: BagType = 'SUITCASE'
  ): LuggageItem {
    const existingCount = Array.from(this.bags.values()).filter(
      (b) => b.roomNumber === roomNumber
    ).length;
    const tagCode = `BAG-${roomNumber}-${(existingCount + 1)
      .toString()
      .padStart(2, '0')}`;
    const id = `lug-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const bag: LuggageItem = {
      id,
      pilgrimId,
      pilgrimName,
      roomNumber,
      tagCode,
      bagType,
      status: LuggageStatus.ON_BUS,
      updatedAt: new Date().toISOString(),
    };

    this.bags.set(id, bag);
    return bag;
  }

  updateBagStatus(id: string, status: LuggageStatus): LuggageItem {
    const bag = this.bags.get(id);
    if (!bag) throw new Error(`Luggage item ${id} not found`);
    bag.status = status;
    bag.updatedAt = new Date().toISOString();
    return bag;
  }

  getBagsByRoom(roomNumber: string): LuggageItem[] {
    return Array.from(this.bags.values()).filter((b) => b.roomNumber === roomNumber);
  }

  getBagsByStatus(status: LuggageStatus): LuggageItem[] {
    return Array.from(this.bags.values()).filter((b) => b.status === status);
  }

  getAllBags(): LuggageItem[] {
    return Array.from(this.bags.values());
  }

  generatePrintableTagText(id: string, hotelName: string, supervisorPhone: string): string {
    const bag = this.bags.get(id);
    if (!bag) throw new Error(`Luggage item ${id} not found`);

    return [
      `🕋 [بطاقة أمتعة المعتمر - UMR-LUGGAGE]`,
      `🏷️ كود الحقيبة: ${bag.tagCode}`,
      `👤 صاحب الحقيبة: ${bag.pilgrimName}`,
      `🚪 رقم الغرفة: [ ${bag.roomNumber} ]`,
      `🏨 فندق الإقامة: ${hotelName}`,
      `📞 هاتف طوارئ المشرف: ${supervisorPhone}`,
      `رجاءً تسليم هذه الحقيبة فوراً إلى الغرفة المحددة أعلاه.`,
    ].join('\n');
  }
}
