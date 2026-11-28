import {
  isAuthorized,
  MAX_SYNC_BODY_BYTES,
  unauthorizedResponse,
  type PagesEnv,
} from '../_lib/auth.js';

interface GameyaSyncPayment {
  id?: string;
  amount?: number;
  method?: string;
  ref?: string;
  dateIso?: string;
}

interface GameyaSyncMember {
  id?: string;
  name?: string;
  phone?: string;
  planType?: string;
  turnMonth?: number;
  totalTarget?: number;
  downPayment?: number;
  installmentCount?: number;
  totalPaid?: number;
  startDateIso?: string;
  payments?: GameyaSyncPayment[];
}

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
    .first<{ id: string; payload_json: string; updated_at: string; version?: number }>();

  if (!row) {
    return Response.json({ mode: 'd1', found: false });
  }

  let version = typeof row.version === 'number' ? row.version : 1;
  try {
    const vRow = await env.DB.prepare('SELECT version FROM group_workspaces WHERE id = ?')
      .bind(groupId)
      .first<{ version?: number }>();
    if (vRow && typeof vRow.version === 'number') {
      version = vRow.version;
    }
  } catch {
    // pre-0002 schema fallback
  }

  return Response.json({
    mode: 'd1',
    found: true,
    version,
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
    expectedVersion?: number;
    workspace?: {
      settings?: { tripCode?: string; tripTitle?: string; status?: string };
      gameya?: GameyaSyncMember[];
    };
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

  let nextVersion = 1;
  const expectedVersion = typeof body.expectedVersion === 'number' ? Math.floor(body.expectedVersion) : undefined;
  try {
    const existing = await env.DB.prepare(
      'SELECT version, payload_json, updated_at FROM group_workspaces WHERE id = ?'
    )
      .bind(groupId)
      .first<{ version?: number; payload_json?: string; updated_at?: string }>();
    if (existing && typeof existing.version === 'number') {
      if (expectedVersion !== undefined && existing.version > expectedVersion) {
        return Response.json(
          {
            mode: 'd1',
            error: 'version_conflict',
            serverVersion: existing.version,
            updatedAt: existing.updated_at,
            workspace: existing.payload_json ? JSON.parse(existing.payload_json) : undefined,
          },
          { status: 409 }
        );
      }
      nextVersion = existing.version + 1;
    } else if (expectedVersion !== undefined) {
      nextVersion = Math.max(1, expectedVersion + 1);
    }
  } catch {
    nextVersion = expectedVersion !== undefined ? Math.max(1, expectedVersion + 1) : 1;
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

  try {
    await env.DB.prepare('UPDATE group_workspaces SET version = ? WHERE id = ?').bind(nextVersion, groupId).run();

    const members = Array.isArray(body.workspace.gameya) ? body.workspace.gameya : [];
    for (const member of members) {
      if (!member.id) continue;
      await env.DB.prepare(
        `INSERT INTO gameya_plans (
          id, group_id, member_name, phone, plan_type, turn_month,
          total_target_minor, down_payment_minor, installment_count, total_paid_minor, start_date, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          member_name = excluded.member_name,
          phone = excluded.phone,
          plan_type = excluded.plan_type,
          turn_month = excluded.turn_month,
          total_target_minor = excluded.total_target_minor,
          down_payment_minor = excluded.down_payment_minor,
          installment_count = excluded.installment_count,
          total_paid_minor = excluded.total_paid_minor,
          start_date = excluded.start_date,
          updated_at = excluded.updated_at`
      )
        .bind(
          String(member.id).slice(0, 100),
          groupId,
          String(member.name || 'مشترك').slice(0, 140),
          String(member.phone || '').slice(0, 40),
          String(member.planType || 'DIRECT_INSTALLMENT').slice(0, 40),
          Math.max(1, Math.round(Number(member.turnMonth) || 1)),
          Math.max(0, Math.round((Number(member.totalTarget) || 0) * 100)),
          Math.max(0, Math.round((Number(member.downPayment) || 0) * 100)),
          Math.max(1, Math.round(Number(member.installmentCount) || 1)),
          Math.max(0, Math.round((Number(member.totalPaid) || 0) * 100)),
          String(member.startDateIso || nowIso.slice(0, 10)).slice(0, 20),
          nowIso
        )
        .run();

      const payments = Array.isArray(member.payments) ? member.payments : [];
      for (const p of payments) {
        if (!p.id || (Number(p.amount) || 0) <= 0) continue;
        await env.DB.prepare(
          `INSERT OR IGNORE INTO payment_ledger (
            id, plan_id, group_id, amount_minor, method, transaction_ref, paid_date, entry_type, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PAYMENT', ?)`
        )
          .bind(
            String(p.id).slice(0, 100),
            String(member.id).slice(0, 100),
            groupId,
            Math.max(1, Math.round((Number(p.amount) || 0) * 100)),
            String(p.method || 'CASH').slice(0, 40),
            p.ref ? String(p.ref).slice(0, 80) : null,
            String(p.dateIso || nowIso.slice(0, 10)).slice(0, 20),
            nowIso
          )
          .run();
      }
    }
  } catch {
    // Normalized ledger writes are skipped cleanly if migration 0002 has not been applied yet
  }

  return Response.json({ mode: 'd1', synced: true, version: nextVersion, updatedAt: nowIso });
}
