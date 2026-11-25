/**
 * Resilient Offline Storage Layer (IndexedDB + Blob Support + BroadcastChannel Sync)
 * Prevents silent 5MB localStorage QuotaExceeded data loss for multi-group workspaces and Nusuk permit images.
 */

const DB_NAME = 'umrah_platform_db';
const DB_VERSION = 1;
const STORE_KV = 'kv_store';
const STORE_BLOBS = 'blob_store';
const SYNC_CHANNEL = 'umrah_platform_sync_v1';

export interface StorageHealthReport {
  backend: 'indexeddb' | 'localstorage';
  usedBytesApprox?: number;
  quotaBytesApprox?: number;
}

let cachedDbPromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (cachedDbPromise) return cachedDbPromise;
  cachedDbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      cachedDbPromise = null;
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_KV)) {
        db.createObjectStore(STORE_KV);
      }
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        db.createObjectStore(STORE_BLOBS);
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => {
        db.close();
        cachedDbPromise = null;
      };
      db.onclose = () => {
        cachedDbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => {
      cachedDbPromise = null;
      reject(req.error || new Error('Failed to open IndexedDB'));
    };
  });
  return cachedDbPromise;
}

export async function idbGetJson<T>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_KV, 'readonly');
      const req = tx.objectStore(STORE_KV).get(key);
      req.onsuccess = () => resolve((req.result as T | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function idbSetJson<T>(key: string, value: T): Promise<boolean> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_KV, 'readwrite');
      tx.objectStore(STORE_KV).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch {
    return false;
  }
}

export async function idbSetBlob(key: string, blob: Blob): Promise<boolean> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_BLOBS, 'readwrite');
      tx.objectStore(STORE_BLOBS).put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch {
    return false;
  }
}

export async function idbGetBlob(key: string): Promise<Blob | null> {
  try {
    const db = await openDatabase();
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(STORE_BLOBS, 'readonly');
      const req = tx.objectStore(STORE_BLOBS).get(key);
      req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function idbDeleteBlob(key: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_BLOBS, 'readwrite');
      tx.objectStore(STORE_BLOBS).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return true;
  } catch {
    return false;
  }
}

export function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [header, base64] = dataUrl.split(',');
    if (!header || !base64) return null;
    const mimeMatch = header.match(/data:([^;]+)/);
    const mime = mimeMatch?.[1] || 'image/jpeg';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  } catch {
    return null;
  }
}

export function createSyncChannel(onExternalUpdate: (scope: string) => void): {
  notify: (scope: string) => void;
  close: () => void;
} {
  if (typeof BroadcastChannel === 'undefined') {
    return { notify: () => undefined, close: () => undefined };
  }
  const channel = new BroadcastChannel(SYNC_CHANNEL);
  channel.addEventListener('message', (event) => {
    const scope = (event.data as { scope?: string } | undefined)?.scope;
    if (scope) onExternalUpdate(scope);
  });
  return {
    notify: (scope: string) => channel.postMessage({ scope, ts: Date.now() }),
    close: () => channel.close(),
  };
}

export async function getStorageHealth(): Promise<StorageHealthReport> {
  const backend = typeof indexedDB !== 'undefined' ? 'indexeddb' : 'localstorage';
  try {
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      return {
        backend,
        usedBytesApprox: est.usage,
        quotaBytesApprox: est.quota,
      };
    }
  } catch {
    // ignore estimate errors
  }
  return { backend };
}
