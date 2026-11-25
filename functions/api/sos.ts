import {
  isAuthorized,
  MAX_SOS_BODY_BYTES,
  unauthorizedResponse,
  type PagesEnv,
} from '../_lib/auth.js';

/** GET /api/sos?tripCode=&resolved=0
 *  Returns open or resolved SOS alerts for the authenticated supervisor dashboard. */
export async function onRequestGet(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  if (!isAuthorized(request, env)) {
    return unauthorizedResponse();
  }

  if (!env.DB) {
    return Response.json({ mode: 'local-only', events: [] });
  }

  const url = new URL(request.url);
  const tripCode = url.searchParams.get('tripCode')?.trim().slice(0, 32);
  const resolvedParam = url.searchParams.get('resolved');
  const resolvedFilter = resolvedParam === '1' ? 1 : 0;

  const query = tripCode
    ? 'SELECT id, trip_code, pilgrim_name, latitude, longitude, notes, resolved, created_at FROM sos_events WHERE trip_code = ? AND resolved = ? ORDER BY created_at DESC LIMIT 100'
    : 'SELECT id, trip_code, pilgrim_name, latitude, longitude, notes, resolved, created_at FROM sos_events WHERE resolved = ? ORDER BY created_at DESC LIMIT 100';
  const bindings = tripCode ? [tripCode, resolvedFilter] : [resolvedFilter];

  const { results } = await env.DB.prepare(query).bind(...bindings).all<{
    id: string;
    trip_code: string;
    pilgrim_name: string;
    latitude: number;
    longitude: number;
    notes: string;
    resolved: number;
    created_at: string;
  }>();

  return Response.json({ mode: 'd1', events: results });
}

/** POST /api/sos — pilgrim emergency beacon submission (public, size/range validated) */
export async function onRequestPost(context: { request: Request; env: PagesEnv }): Promise<Response> {
  if (!context.env.DB) {
    return Response.json({ mode: 'local-only', stored: false });
  }

  const contentLength = Number(context.request.headers.get('content-length') || '0');
  if (contentLength > MAX_SOS_BODY_BYTES) {
    return Response.json({ error: 'Payload exceeds 16 KB limit' }, { status: 413 });
  }

  let body: {
    tripCode?: string;
    pilgrimName?: string;
    latitude?: number;
    longitude?: number;
    notes?: string;
  };
  try {
    body = (await context.request.json()) as typeof body;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawLat = Number(body.latitude);
  const rawLng = Number(body.longitude);
  const latitude = Number.isFinite(rawLat) && rawLat >= -90 && rawLat <= 90 ? rawLat : 21.4225;
  const longitude = Number.isFinite(rawLng) && rawLng >= -180 && rawLng <= 180 ? rawLng : 39.8262;

  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sos-${Date.now()}`;
  const createdAt = new Date().toISOString();

  await context.env.DB.prepare(
    'INSERT INTO sos_events (id, trip_code, pilgrim_name, latitude, longitude, notes, resolved, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)'
  )
    .bind(
      id,
      String(body.tripCode || '#UMR').trim().slice(0, 32) || '#UMR',
      String(body.pilgrimName || 'معتمر').trim().slice(0, 120) || 'معتمر',
      latitude,
      longitude,
      String(body.notes || '').trim().slice(0, 400),
      createdAt
    )
    .run();

  return Response.json({ mode: 'd1', stored: true, id, createdAt });
}

/** PATCH /api/sos — supervisor marks an SOS alert as resolved */
export async function onRequestPatch(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  if (!isAuthorized(request, env)) {
    return unauthorizedResponse();
  }

  if (!env.DB) {
    return Response.json({ mode: 'local-only', updated: false });
  }

  let body: { id?: string; resolved?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const id = body.id?.trim();
  if (!id || id.length > 120) {
    return Response.json({ error: 'Missing or invalid id' }, { status: 400 });
  }

  const resolvedVal = body.resolved === false ? 0 : 1;
  await env.DB.prepare('UPDATE sos_events SET resolved = ? WHERE id = ?')
    .bind(resolvedVal, id)
    .run();

  return Response.json({ mode: 'd1', updated: true, id, resolved: resolvedVal === 1 });
}
