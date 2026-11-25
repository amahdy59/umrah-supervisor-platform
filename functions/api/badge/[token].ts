interface D1Like {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T = Record<string, unknown>>(): Promise<T | null>;
    };
  };
}

interface PagesEnv {
  DB?: D1Like;
}

export async function onRequestGet(context: {
  params: { token?: string };
  env: PagesEnv;
}): Promise<Response> {
  const token = context.params?.token?.trim();
  if (!token) {
    return Response.json({ error: 'Missing badge token' }, { status: 400 });
  }
  if (!context.env.DB) {
    return Response.json({ mode: 'local-only', found: false });
  }

  const row = await context.env.DB.prepare(
    'SELECT badge_json, updated_at FROM pilgrim_badges WHERE badge_token = ?'
  )
    .bind(token)
    .first<{ badge_json: string; updated_at: string }>();

  if (!row) {
    return Response.json({ mode: 'd1', found: false }, { status: 404 });
  }

  return Response.json({
    mode: 'd1',
    found: true,
    updatedAt: row.updated_at,
    badge: JSON.parse(row.badge_json),
  });
}
