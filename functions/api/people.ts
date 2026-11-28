import {
  isAuthorized,
  MAX_SYNC_BODY_BYTES,
  unauthorizedResponse,
  type PagesEnv,
} from '../_lib/auth.js';

interface CrmPersonInput {
  id?: string;
  fullName?: string;
  gender?: string;
  passportNumber?: string;
  passportExpiryDate?: string;
  phone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  requiresWheelchair?: boolean;
  requiresInsulinRefrigeration?: boolean;
  notes?: string;
  updatedAt?: string;
}

export async function onRequestGet(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  if (!isAuthorized(request, env)) {
    return unauthorizedResponse();
  }

  if (!env.DB) {
    return Response.json({ mode: 'local-only', people: [] });
  }

  try {
    const res = await env.DB.prepare(
      `SELECT id, full_name, gender, passport_number, passport_expiry, phone,
              emergency_name, emergency_phone, requires_wheelchair, requires_insulin, notes, updated_at
       FROM people_directory
       WHERE deleted_at IS NULL
       ORDER BY updated_at DESC
       LIMIT 500`
    ).all<{
      id: string;
      full_name: string;
      gender: 'MALE' | 'FEMALE';
      passport_number: string;
      passport_expiry: string | null;
      phone: string;
      emergency_name: string;
      emergency_phone: string;
      requires_wheelchair: number;
      requires_insulin: number;
      notes: string | null;
      updated_at: string;
    }>();

    const people = (res.results || []).map((r) => ({
      id: r.id,
      fullName: r.full_name,
      gender: r.gender,
      passportNumber: r.passport_number,
      passportExpiryDate: r.passport_expiry || undefined,
      phone: r.phone,
      emergencyContactName: r.emergency_name,
      emergencyContactPhone: r.emergency_phone,
      requiresWheelchair: r.requires_wheelchair === 1,
      requiresInsulinRefrigeration: r.requires_insulin === 1,
      notes: r.notes || undefined,
      updatedAt: r.updated_at,
    }));

    return Response.json({ mode: 'd1', people });
  } catch {
    return Response.json({ mode: 'd1', people: [] });
  }
}

export async function onRequestPost(context: { request: Request; env: PagesEnv }): Promise<Response> {
  const { request, env } = context;

  if (!isAuthorized(request, env)) {
    return unauthorizedResponse();
  }

  if (!env.DB) {
    return Response.json({ mode: 'local-only', synced: false, upserted: 0 });
  }

  const contentLength = Number(request.headers.get('content-length') || '0');
  if (contentLength > MAX_SYNC_BODY_BYTES) {
    return Response.json({ error: 'Payload exceeds 512 KB limit' }, { status: 413 });
  }

  let body: { people?: CrmPersonInput[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  if (!Array.isArray(body.people)) {
    return Response.json({ error: 'Expected people array' }, { status: 400 });
  }

  let upserted = 0;
  const nowIso = new Date().toISOString();

  for (const person of body.people) {
    if (!person.id || !person.fullName || !person.passportNumber) continue;
    const gender = person.gender === 'FEMALE' ? 'FEMALE' : 'MALE';
    await env.DB.prepare(
      `INSERT INTO people_directory (
        id, full_name, gender, passport_number, passport_expiry, phone,
        emergency_name, emergency_phone, requires_wheelchair, requires_insulin, notes, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
      ON CONFLICT(passport_number) DO UPDATE SET
        full_name = excluded.full_name,
        gender = excluded.gender,
        passport_expiry = excluded.passport_expiry,
        phone = excluded.phone,
        emergency_name = excluded.emergency_name,
        emergency_phone = excluded.emergency_phone,
        requires_wheelchair = excluded.requires_wheelchair,
        requires_insulin = excluded.requires_insulin,
        notes = excluded.notes,
        updated_at = excluded.updated_at,
        deleted_at = NULL`
    )
      .bind(
        String(person.id).slice(0, 100),
        String(person.fullName).slice(0, 140),
        gender,
        String(person.passportNumber).trim().slice(0, 40),
        person.passportExpiryDate ? String(person.passportExpiryDate).slice(0, 20) : null,
        String(person.phone || '').slice(0, 40),
        String(person.emergencyContactName || '').slice(0, 140),
        String(person.emergencyContactPhone || '').slice(0, 40),
        person.requiresWheelchair ? 1 : 0,
        person.requiresInsulinRefrigeration ? 1 : 0,
        person.notes ? String(person.notes).slice(0, 400) : null,
        person.updatedAt || nowIso
      )
      .run();
    upserted += 1;
  }

  return Response.json({ mode: 'd1', synced: true, upserted });
}
