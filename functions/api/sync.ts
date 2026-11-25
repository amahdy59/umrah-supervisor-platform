interface D1Prepared {
  bind(...values: unknown[]): {
    first<T = Record<string, unknown>>(): Promise<T | null>;
    run(): Promise<{ success: boolean }>;
  };
}

interface D1Like {
  prepare(query: string): D1Prepared;
}

interface PagesEnv {
  DB?: D1Like;
}

const MAX_BODY_BYTES = 512 * 1024;

export async function onRequestGet(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;
  if (!env.DB) {
    return Response.json({ mode: 'local-only', synced: false });
  }

  const url = new URL(request.url);
  const groupId = url.searchParams.get('groupId')?.trim();
  if (!groupId) {
    return Response.json({ error: 'Missing groupId query parameter' }, { status: 400 });
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
  if (!env.DB) {
    return Response.json({ mode: 'local-only', synced: false });
  }

  const contentLength = Number(request.headers.get('content-length') || '0');
  if (contentLength > MAX_BODY_BYTES) {
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
  if (!groupId || !body.workspace) {
    return Response.json({ error: 'Missing groupId or workspace' }, { status: 400 });
  }

  const serialized = JSON.stringify(body.workspace);
  if (serialized.length > MAX_BODY_BYTES) {
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
      settings.tripCode || '#UMR',
      settings.tripTitle || 'فوج عمرة',
      settings.status || 'IN_MAKKAH',
      serialized,
      nowIso
    )
    .run();

  return Response.json({ mode: 'd1', synced: true, updatedAt: nowIso });
}
