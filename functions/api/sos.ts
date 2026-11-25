interface D1Like {
  prepare(query: string): {
    bind(...values: unknown[]): {
      run(): Promise<{ success: boolean }>;
    };
  };
}

interface PagesEnv {
  DB?: D1Like;
}

export async function onRequestPost(context: { request: Request; env: PagesEnv }): Promise<Response> {
  if (!context.env.DB) {
    return Response.json({ mode: 'local-only', stored: false });
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

  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sos-${Date.now()}`;
  const createdAt = new Date().toISOString();

  await context.env.DB.prepare(
    'INSERT INTO sos_events (id, trip_code, pilgrim_name, latitude, longitude, notes, resolved, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)'
  )
    .bind(
      id,
      (body.tripCode || '#UMR').trim(),
      (body.pilgrimName || 'معتمر').trim(),
      Number(body.latitude) || 21.4225,
      Number(body.longitude) || 39.8262,
      (body.notes || '').trim(),
      createdAt
    )
    .run();

  return Response.json({ mode: 'd1', stored: true, id, createdAt });
}
