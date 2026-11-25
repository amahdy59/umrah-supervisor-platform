import {
  isAuthorized,
  MAX_SYNC_BODY_BYTES,
  unauthorizedResponse,
  type PagesEnv,
} from '../_lib/auth.js';

export async function onRequestGet(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  if (!isAuthorized(request, env)) {
    return unauthorizedResponse();
  }

  if (!env.DB) {
    return Response.json({ mode: 'local-only', synced: false });
  }

  const url = new URL(request.url);
  const groupId = url.searchParams.get('groupId')?.trim();
  if (!groupId || groupId.length > 120) {
    return Response.json({ error: 'Missing or invalid groupId query parameter' }, { status: 400 });
  }

  const row = await env.DB.prepare(
    'SELECT id, trip_code, trip_title, stage, payload_json, updated_at FROM group_workspaces WHERE id = ?'
  )
    .bind(groupId)
    .first<{ id: string; payload_json: string; updated_at: string }>();

  if (!row) {
    return Response.json({ mode: 'd1', found: false });
  }

  return Response.json({
    mode: 'd1',
    found: true,
    updatedAt: row.updated_at,
    workspace: JSON.parse(row.payload_json),
  });
}

export async function onRequestPost(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  if (!isAuthorized(request, env)) {
    return unauthorizedResponse();
  }

  if (!env.DB) {
    return Response.json({ mode: 'local-only', synced: false });
  }

  const contentLength = Number(request.headers.get('content-length') || '0');
  if (contentLength > MAX_SYNC_BODY_BYTES) {
    return Response.json({ error: 'Payload exceeds 512 KB limit' }, { status: 413 });
  }

  let body: {
    groupId?: string;
    workspace?: { settings?: { tripCode?: string; tripTitle?: string; status?: string } };
    updatedAt?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const groupId = body.groupId?.trim();
  if (!groupId || groupId.length > 120 || !body.workspace || typeof body.workspace !== 'object') {
    return Response.json({ error: 'Missing or invalid groupId or workspace' }, { status: 400 });
  }

  const serialized = JSON.stringify(body.workspace);
  if (serialized.length > MAX_SYNC_BODY_BYTES) {
    return Response.json({ error: 'Serialized workspace too large' }, { status: 413 });
  }

  const settings = body.workspace.settings || {};
  const nowIso = body.updatedAt || new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO group_workspaces (id, trip_code, trip_title, stage, payload_json, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       trip_code = excluded.trip_code,
       trip_title = excluded.trip_title,
       stage = excluded.stage,
       payload_json = excluded.payload_json,
       updated_at = excluded.updated_at`
  )
    .bind(
      groupId,
      String(settings.tripCode || '#UMR').slice(0, 32),
      String(settings.tripTitle || 'فوج عمرة').slice(0, 140),
      String(settings.status || 'IN_MAKKAH').slice(0, 40),
      serialized,
      nowIso
    )
    .run();

  return Response.json({ mode: 'd1', synced: true, updatedAt: nowIso });
}
