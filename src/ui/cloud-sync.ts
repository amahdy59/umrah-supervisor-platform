import { idbGetJson, idbSetJson } from './storage.js';

const OUTBOX_KEY = 'umrah_cloud_sync_outbox_v1';

export interface OutboxMutation {
  id: string;
  endpoint: string;
  groupId?: string;
  payload: unknown;
  createdAt: string;
}

export interface SyncPushResult {
  mode: 'd1' | 'local-only' | 'offline-queued';
  synced: boolean;
  pendingCount: number;
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

export async function pushGroupWorkspaceToCloud(groupId: string, workspacePayload: unknown): Promise<SyncPushResult> {
  const mutation: OutboxMutation = {
    id: `mut-${Date.now()}`,
    endpoint: '/api/sync',
    groupId,
    payload: { groupId, workspace: workspacePayload, updatedAt: new Date().toISOString() },
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mutation.payload),
    });
    if (!res.ok) {
      return { mode: 'local-only', synced: false, pendingCount: (await getOutbox()).length };
    }
    const data = (await res.json()) as { mode?: string; synced?: boolean };
    if (data.mode === 'd1' && data.synced) {
      const remaining = (await getOutbox()).filter(
        (x) => !(x.endpoint === '/api/sync' && (x.groupId ?? '') === groupId)
      );
      await saveOutbox(remaining);
      return { mode: 'd1', synced: true, pendingCount: remaining.length };
    }
    return { mode: 'local-only', synced: false, pendingCount: 0 };
  } catch {
    const queue = await getOutbox();
    const deduped = enqueueMutation(queue, mutation);
    await saveOutbox(deduped);
    return { mode: 'offline-queued', synced: false, pendingCount: deduped.length };
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
  for (const item of queue) {
    try {
      const res = await fetch(item.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.payload),
      });
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
    mode: anyD1Synced ? 'd1' : 'local-only',
    synced: remaining.length === 0,
    pendingCount: remaining.length,
  };
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
