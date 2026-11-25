export interface D1PreparedStatement {
  bind(...values: unknown[]): {
    first<T = Record<string, unknown>>(): Promise<T | null>;
    all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
    run(): Promise<{ success: boolean }>;
  };
}

export interface D1Like {
  prepare(query: string): D1PreparedStatement;
}

export interface PagesEnv {
  DB?: D1Like;
  /** Set in Cloudflare Pages dashboard environment variables — never commit a secret value. */
  SYNC_SECRET?: string;
}

export const MAX_SYNC_BODY_BYTES = 512 * 1024;
export const MAX_BADGE_BODY_BYTES = 64 * 1024;
export const MAX_SOS_BODY_BYTES = 16 * 1024;

function constantTimeEqual(a: string, b: string): boolean {
  const maxLen = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < maxLen; i++) {
    const ca = i < a.length ? a.charCodeAt(i) : 0;
    const cb = i < b.length ? b.charCodeAt(i) : 0;
    diff |= ca ^ cb;
  }
  return diff === 0;
}

/**
 * Verifies Authorization: Bearer <token> against env.SYNC_SECRET using constant-time comparison.
 * When SYNC_SECRET is unset (local development), requests are permitted so local tests work cleanly.
 */
export function isAuthorized(request: Request, env: PagesEnv): boolean {
  const secret = env.SYNC_SECRET?.trim();
  if (!secret) return true;
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7).trim();
  if (!token) return false;
  return constantTimeEqual(token, secret);
}

export function unauthorizedResponse(): Response {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
