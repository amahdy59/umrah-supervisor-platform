import { idbGetJson, idbSetJson } from './storage.js';

const OUTBOX_KEY = 'umrah_cloud_sync_outbox_v1';
const SYNC_TOKEN_KEY = 'umrah_sync_secret_v1';

export interface OutboxMutation {
  id: string;
  endpoint: string;
  groupId?: string;
  payload: unknown;
  createdAt: string;
}

export interface SyncPushResult {
  mode: 'd1' | 'local-only' | 'offline-queued' | 'unauthorized' | 'conflict';
  synced: boolean;
  pendingCount: number;
  version?: number;
  serverVersion?: number;
  serverUpdatedAt?: string;
}

export interface CloudSosEventRow {
  id: string;
  trip_code: string;
  pilgrim_name: string;
  latitude: number;
  longitude: number;
  notes: string;
  resolved: number;
  created_at: string;
}

export function getSyncAuthToken(): string {
  try {
    return localStorage.getItem(SYNC_TOKEN_KEY)?.trim() || '';
  } catch {
    return '';
  }
}

export function setSyncAuthToken(token: string): void {
  try {
    const clean = token.trim();
    if (clean) {
      localStorage.setItem(SYNC_TOKEN_KEY, clean);
    } else {
      localStorage.removeItem(SYNC_TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

function buildAuthHeaders(jsonBody: boolean = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (jsonBody) headers['Content-Type'] = 'application/json';
  const token = getSyncAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function getOutbox(): Promise<OutboxMutation[]> {
  return (await idbGetJson<OutboxMutation[]>(OUTBOX_KEY)) || [];
}

async function saveOutbox(items: OutboxMutation[]): Promise<void> {
  await idbSetJson(OUTBOX_KEY, items);
}

function enqueueMutation(queue: OutboxMutation[], mutation: OutboxMutation): OutboxMutation[] {
  const filtered = queue.filter(
    (x) => !(x.endpoint === mutation.endpoint && (x.groupId ?? '') === (mutation.groupId ?? ''))
  );
  return [...filtered.slice(-19), mutation];
}

export async function pushGroupWorkspaceToCloud(
  groupId: string,
  workspacePayload: unknown,
  expectedVersion?: number
): Promise<SyncPushResult> {
  const mutation: OutboxMutation = {
    id: `mut-${Date.now()}`,
    endpoint: '/api/sync',
    groupId,
    payload: {
      groupId,
      expectedVersion,
      workspace: workspacePayload,
      updatedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
  };

  if (!navigator.onLine) {
    const queue = await getOutbox();
    const deduped = enqueueMutation(queue, mutation);
    await saveOutbox(deduped);
    return { mode: 'offline-queued', synced: false, pendingCount: deduped.length };
  }

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: buildAuthHeaders(true),
      body: JSON.stringify(mutation.payload),
    });
    if (res.status === 401) {
      return { mode: 'unauthorized', synced: false, pendingCount: (await getOutbox()).length };
    }
    if (res.status === 409) {
      const conflict = (await res.json()) as { serverVersion?: number; updatedAt?: string };
      return {
        mode: 'conflict',
        synced: false,
        pendingCount: (await getOutbox()).length,
        serverVersion: conflict.serverVersion,
        serverUpdatedAt: conflict.updatedAt,
      };
    }
    if (!res.ok) {
      return { mode: 'local-only', synced: false, pendingCount: (await getOutbox()).length };
    }
    const data = (await res.json()) as { mode?: string; synced?: boolean; version?: number };
    if (data.mode === 'd1' && data.synced) {
      const remaining = (await getOutbox()).filter(
        (x) => !(x.endpoint === '/api/sync' && (x.groupId ?? '') === groupId)
      );
      await saveOutbox(remaining);
      return { mode: 'd1', synced: true, pendingCount: remaining.length, version: data.version };
    }
    return { mode: 'local-only', synced: false, pendingCount: 0 };
  } catch {
    const queue = await getOutbox();
    const deduped = enqueueMutation(queue, mutation);
    await saveOutbox(deduped);
    return { mode: 'offline-queued', synced: false, pendingCount: deduped.length };
  }
}

export interface SyncPullResult {
  mode: 'd1' | 'local-only' | 'unauthorized';
  found: boolean;
  version?: number;
  updatedAt?: string;
  workspace?: unknown;
}

export async function pullGroupWorkspaceFromCloud(groupId: string): Promise<SyncPullResult> {
  if (!navigator.onLine || !groupId) {
    return { mode: 'local-only', found: false };
  }
  try {
    const res = await fetch(`/api/sync?groupId=${encodeURIComponent(groupId)}`, {
      method: 'GET',
      headers: buildAuthHeaders(false),
    });
    if (res.status === 401) return { mode: 'unauthorized', found: false };
    if (!res.ok) return { mode: 'local-only', found: false };
    const data = (await res.json()) as {
      mode?: string;
      found?: boolean;
      version?: number;
      updatedAt?: string;
      workspace?: unknown;
    };
    return {
      mode: data.mode === 'd1' ? 'd1' : 'local-only',
      found: Boolean(data.found),
      version: data.version,
      updatedAt: data.updatedAt,
      workspace: data.workspace,
    };
  } catch {
    return { mode: 'local-only', found: false };
  }
}

export async function pushPeopleDirectoryToCloud(
  people: unknown[]
): Promise<{ mode: 'd1' | 'local-only' | 'unauthorized'; synced: boolean; upserted: number }> {
  if (!navigator.onLine || !Array.isArray(people) || people.length === 0) {
    return { mode: 'local-only', synced: false, upserted: 0 };
  }
  try {
    const res = await fetch('/api/people', {
      method: 'POST',
      headers: buildAuthHeaders(true),
      body: JSON.stringify({ people }),
    });
    if (res.status === 401) return { mode: 'unauthorized', synced: false, upserted: 0 };
    if (!res.ok) return { mode: 'local-only', synced: false, upserted: 0 };
    const data = (await res.json()) as { mode?: string; synced?: boolean; upserted?: number };
    return {
      mode: data.mode === 'd1' ? 'd1' : 'local-only',
      synced: Boolean(data.synced),
      upserted: Number(data.upserted) || 0,
    };
  } catch {
    return { mode: 'local-only', synced: false, upserted: 0 };
  }
}

export async function pullPeopleDirectoryFromCloud(): Promise<{
  mode: 'd1' | 'local-only' | 'unauthorized';
  people: unknown[];
}> {
  if (!navigator.onLine) return { mode: 'local-only', people: [] };
  try {
    const res = await fetch('/api/people', {
      method: 'GET',
      headers: buildAuthHeaders(false),
    });
    if (res.status === 401) return { mode: 'unauthorized', people: [] };
    if (!res.ok) return { mode: 'local-only', people: [] };
    const data = (await res.json()) as { mode?: string; people?: unknown[] };
    return {
      mode: data.mode === 'd1' ? 'd1' : 'local-only',
      people: Array.isArray(data.people) ? data.people : [],
    };
  } catch {
    return { mode: 'local-only', people: [] };
  }
}

export async function flushSyncOutbox(): Promise<SyncPushResult> {
  const queue = await getOutbox();
  if (queue.length === 0) {
    return { mode: navigator.onLine ? 'local-only' : 'offline-queued', synced: true, pendingCount: 0 };
  }
  if (!navigator.onLine) {
    return { mode: 'offline-queued', synced: false, pendingCount: queue.length };
  }

  const remaining: OutboxMutation[] = [];
  let anyD1Synced = false;
  let unauthorized = false;
  for (const item of queue) {
    try {
      const res = await fetch(item.endpoint, {
        method: 'POST',
        headers: buildAuthHeaders(true),
        body: JSON.stringify(item.payload),
      });
      if (res.status === 401) {
        unauthorized = true;
        remaining.push(item);
        continue;
      }
      if (res.ok) {
        const data = (await res.json()) as { mode?: string; synced?: boolean };
        if (data.mode === 'd1' && data.synced) {
          anyD1Synced = true;
          continue;
        }
      }
      remaining.push(item);
    } catch {
      remaining.push(item);
    }
  }
  await saveOutbox(remaining);
  return {
    mode: unauthorized ? 'unauthorized' : anyD1Synced ? 'd1' : 'local-only',
    synced: remaining.length === 0,
    pendingCount: remaining.length,
  };
}

export async function writeBadgeToCloud(input: {
  groupId: string;
  pilgrimId: string;
  badgeToken: string;
  badgeData: Record<string, unknown>;
}): Promise<{ mode: 'd1' | 'local-only' | 'unauthorized'; written: boolean }> {
  if (!navigator.onLine || !input.badgeToken) {
    return { mode: 'local-only', written: false };
  }
  try {
    const res = await fetch('/api/badge/write', {
      method: 'POST',
      headers: buildAuthHeaders(true),
      body: JSON.stringify(input),
    });
    if (res.status === 401) return { mode: 'unauthorized', written: false };
    if (!res.ok) return { mode: 'local-only', written: false };
    const data = (await res.json()) as { mode?: string; written?: boolean };
    return {
      mode: data.mode === 'd1' ? 'd1' : 'local-only',
      written: Boolean(data.written),
    };
  } catch {
    return { mode: 'local-only', written: false };
  }
}

export async function fetchBadgeFromCloud(token: string): Promise<Record<string, unknown> | null> {
  if (!navigator.onLine || !token) return null;
  try {
    const res = await fetch(`/api/badge/${encodeURIComponent(token)}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { found?: boolean; badge?: Record<string, unknown> };
    return data.found && data.badge ? data.badge : null;
  } catch {
    return null;
  }
}

export async function postLiveSosToCloud(payload: {
  tripCode: string;
  pilgrimName: string;
  latitude: number;
  longitude: number;
  notes?: string;
}): Promise<boolean> {
  if (!navigator.onLine) return false;
  try {
    const res = await fetch('/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchCloudSosEvents(
  tripCode?: string
): Promise<{ mode: 'd1' | 'local-only' | 'unauthorized'; events: CloudSosEventRow[] }> {
  if (!navigator.onLine) return { mode: 'local-only', events: [] };
  try {
    const qs = tripCode ? `?tripCode=${encodeURIComponent(tripCode)}&resolved=0` : '?resolved=0';
    const res = await fetch(`/api/sos${qs}`, {
      method: 'GET',
      headers: buildAuthHeaders(false),
    });
    if (res.status === 401) return { mode: 'unauthorized', events: [] };
    if (!res.ok) return { mode: 'local-only', events: [] };
    const data = (await res.json()) as { mode?: string; events?: CloudSosEventRow[] };
    return {
      mode: data.mode === 'd1' ? 'd1' : 'local-only',
      events: Array.isArray(data.events) ? data.events : [],
    };
  } catch {
    return { mode: 'local-only', events: [] };
  }
}

export async function resolveCloudSosEvent(id: string): Promise<boolean> {
  if (!navigator.onLine || !id) return false;
  try {
    const res = await fetch('/api/sos', {
      method: 'PATCH',
      headers: buildAuthHeaders(true),
      body: JSON.stringify({ id, resolved: true }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
