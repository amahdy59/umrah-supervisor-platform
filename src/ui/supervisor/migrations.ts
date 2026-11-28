import type { GroupWorkspace, MultiGroupRootState } from './types.js';

export const CURRENT_ROOT_SCHEMA_VERSION = 2;

function normalizeWorkspace(group: Partial<GroupWorkspace>, fallbackGroup: GroupWorkspace): GroupWorkspace {
  const version = typeof group.version === 'number' && Number.isFinite(group.version) && group.version >= 1 ? Math.floor(group.version) : 1;
  const updatedAt = group.updatedAt || new Date().toISOString();
  const gameya = Array.isArray(group.gameya)
    ? group.gameya.map((member) => ({
        ...member,
        totalTarget: Math.max(0, Number(member.totalTarget) || 0),
        downPayment: Math.max(0, Number(member.downPayment) || 0),
        installmentCount: Math.max(1, Number(member.installmentCount) || 1),
        totalPaid: Math.max(0, Number(member.totalPaid) || 0),
        turnMonth: Math.max(1, Number(member.turnMonth) || 1),
        payments: Array.isArray(member.payments) ? member.payments : [],
      }))
    : fallbackGroup.gameya;

  return {
    ...fallbackGroup,
    ...group,
    id: group.id || fallbackGroup.id,
    version,
    updatedAt,
    settings: { ...fallbackGroup.settings, ...(group.settings || {}) },
    pilgrims: Array.isArray(group.pilgrims) ? group.pilgrims : fallbackGroup.pilgrims,
    rooms: Array.isArray(group.rooms) ? group.rooms : fallbackGroup.rooms,
    gameya,
    luggage: Array.isArray(group.luggage) ? group.luggage : fallbackGroup.luggage,
    medical: Array.isArray(group.medical) ? group.medical : fallbackGroup.medical,
    sosAlerts: Array.isArray(group.sosAlerts) ? group.sosAlerts : fallbackGroup.sosAlerts,
  };
}

/**
 * Deterministically migrates persisted supervisor root state across schema versions
 * (v1 legacy arrays -> v2 versioned workspaces + normalized payment logs & audit metadata).
 */
export function migrateRootState(
  parsed: Partial<MultiGroupRootState>,
  fallback: MultiGroupRootState
): MultiGroupRootState {
  const fallbackFirst = fallback.groups[0];
  const rawGroups = Array.isArray(parsed.groups) && parsed.groups.length > 0 ? parsed.groups : fallback.groups;
  const groups = rawGroups.map((grp, idx) => normalizeWorkspace(grp, fallback.groups[idx] || fallbackFirst));

  const rawPeople = Array.isArray(parsed.people) ? parsed.people : fallback.people;
  const people = rawPeople.map((person) => ({
    ...person,
    pastTrips: Array.isArray(person.pastTrips) ? person.pastTrips : [],
    updatedAt: person.updatedAt || new Date().toISOString(),
  }));

  const activeExists = groups.some((g) => g.id === parsed.activeGroupId);
  return {
    schemaVersion: CURRENT_ROOT_SCHEMA_VERSION,
    activeGroupId: activeExists && parsed.activeGroupId ? parsed.activeGroupId : groups[0].id,
    groups,
    people,
  };
}
