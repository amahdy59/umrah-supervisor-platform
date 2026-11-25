import {
  isAuthorized,
  MAX_BADGE_BODY_BYTES,
  unauthorizedResponse,
  type PagesEnv,
} from '../../_lib/auth.js';

/**
 * POST /api/badge/write
 * Body: { groupId, pilgrimId, badgeToken, badgeData }
 * Upserts a pilgrim badge record into the pilgrim_badges D1 table.
 * Requires Authorization: Bearer <SYNC_SECRET> when configured.
 */
export async function onRequestPost(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  if (!isAuthorized(request, env)) {
    return unauthorizedResponse();
  }

  if (!env.DB) {
    return Response.json({ mode: 'local-only', written: false });
  }

  const contentLength = Number(request.headers.get('content-length') || '0');
  if (contentLength > MAX_BADGE_BODY_BYTES) {
    return Response.json({ error: 'Badge payload exceeds 64 KB limit' }, { status: 413 });
  }

  let body: {
    groupId?: string;
    pilgrimId?: string;
    badgeToken?: string;
    badgeData?: Record<string, unknown>;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const groupId = body.groupId?.trim();
  const pilgrimId = body.pilgrimId?.trim();
  const badgeToken = body.badgeToken?.trim();
  if (!groupId || !pilgrimId || !badgeToken || badgeToken.length > 120) {
    return Response.json({ error: 'Missing or invalid groupId, pilgrimId, or badgeToken' }, { status: 400 });
  }

  const payload = JSON.stringify(body.badgeData || {});
  if (payload.length > MAX_BADGE_BODY_BYTES) {
    return Response.json({ error: 'Serialized badgeData exceeds 64 KB limit' }, { status: 413 });
  }

  const updatedAt = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO pilgrim_badges (badge_token, group_id, pilgrim_id, badge_json, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(badge_token) DO UPDATE SET
       group_id    = excluded.group_id,
       pilgrim_id  = excluded.pilgrim_id,
       badge_json  = excluded.badge_json,
       updated_at  = excluded.updated_at`
  )
    .bind(badgeToken, groupId, pilgrimId, payload, updatedAt)
    .run();

  return Response.json({ mode: 'd1', written: true, updatedAt });
}
