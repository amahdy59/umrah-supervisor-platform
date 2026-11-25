import { TripStatus } from './trip-logistics.js';

/**
 * Multi-Group & Sequential Trip Orchestrator
 * Enables a supervisor to manage concurrent groups simultaneously and sequential batches over time.
 */

export interface ManagedGroupSummary {
  id: string;
  tripTitle: string;
  tripCode: string;
  status: TripStatus;
  startDate: string; // ISO YYYY-MM-DD
  endDate: string;
  hotelNameAr: string;
  busNumber: string;
  supervisorName: string;
  totalPilgrims: number;
  boardedCount: number;
  activeSosCount: number;
  totalCollectedMinor: number;
  totalTargetMinor: number;
}

const VALID_STAGE_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  [TripStatus.DRAFT]: [TripStatus.REGISTRATION_OPEN],
  [TripStatus.REGISTRATION_OPEN]: [TripStatus.PRE_DEPARTURE, TripStatus.DRAFT],
  [TripStatus.PRE_DEPARTURE]: [TripStatus.IN_TRANSIT, TripStatus.REGISTRATION_OPEN],
  [TripStatus.IN_TRANSIT]: [TripStatus.IN_MAKKAH, TripStatus.IN_MADINAH],
  [TripStatus.IN_MAKKAH]: [TripStatus.IN_MADINAH, TripStatus.RETURN_TRANSIT],
  [TripStatus.IN_MADINAH]: [TripStatus.IN_MAKKAH, TripStatus.RETURN_TRANSIT],
  [TripStatus.RETURN_TRANSIT]: [TripStatus.COMPLETED],
  [TripStatus.COMPLETED]: [],
};

export class UmrahGroupRegistry {
  private groups: Map<string, ManagedGroupSummary> = new Map();

  addGroup(group: ManagedGroupSummary): ManagedGroupSummary {
    this.groups.set(group.id, { ...group });
    return this.groups.get(group.id)!;
  }

  getGroup(id: string): ManagedGroupSummary | undefined {
    return this.groups.get(id);
  }

  getAllGroups(): ManagedGroupSummary[] {
    return Array.from(this.groups.values());
  }

  getActiveGroups(): ManagedGroupSummary[] {
    return this.getAllGroups().filter((g) => g.status !== TripStatus.COMPLETED);
  }

  getCompletedGroups(): ManagedGroupSummary[] {
    return this.getAllGroups().filter((g) => g.status === TripStatus.COMPLETED);
  }

  getAllowedNextStages(current: TripStatus): TripStatus[] {
    return VALID_STAGE_TRANSITIONS[current] || [];
  }

  transitionGroupStage(groupId: string, nextStatus: TripStatus): ManagedGroupSummary {
    const group = this.groups.get(groupId);
    if (!group) {
      throw new Error(`Group ${groupId} not found`);
    }
    const allowed = this.getAllowedNextStages(group.status);
    if (!allowed.includes(nextStatus)) {
      throw new Error(`Invalid transition from ${group.status} to ${nextStatus}`);
    }
    group.status = nextStatus;
    return group;
  }

  cloneForNextSequentialTrip(
    sourceGroupId: string,
    newTrip: { id: string; tripTitle: string; tripCode: string; startDate: string; endDate: string }
  ): ManagedGroupSummary {
    const source = this.groups.get(sourceGroupId);
    if (!source) {
      throw new Error(`Source group ${sourceGroupId} not found`);
    }
    const nextGroup: ManagedGroupSummary = {
      ...source,
      id: newTrip.id,
      tripTitle: newTrip.tripTitle,
      tripCode: newTrip.tripCode,
      startDate: newTrip.startDate,
      endDate: newTrip.endDate,
      status: TripStatus.REGISTRATION_OPEN,
      totalPilgrims: 0,
      boardedCount: 0,
      activeSosCount: 0,
      totalCollectedMinor: 0,
      totalTargetMinor: 0,
    };
    this.groups.set(nextGroup.id, nextGroup);
    return nextGroup;
  }

  getAggregateActiveMetrics(): {
    activeGroupsCount: number;
    completedGroupsCount: number;
    totalActivePilgrims: number;
    totalBoardedPilgrims: number;
    totalActiveSos: number;
  } {
    const active = this.getActiveGroups();
    return {
      activeGroupsCount: active.length,
      completedGroupsCount: this.getCompletedGroups().length,
      totalActivePilgrims: active.reduce((s, g) => s + g.totalPilgrims, 0),
      totalBoardedPilgrims: active.reduce((s, g) => s + g.boardedCount, 0),
      totalActiveSos: active.reduce((s, g) => s + g.activeSosCount, 0),
    };
  }
}
