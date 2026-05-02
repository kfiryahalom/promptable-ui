import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface ConfigRow {
  config_json: string;
}

export async function GET(request: NextRequest) {
  const widgetId = request.nextUrl.searchParams.get('widgetId');
  const userId = request.nextUrl.searchParams.get('userId');

  if (!widgetId || !userId) {
    return NextResponse.json({ error: 'Missing widgetId or userId' }, { status: 400 });
  }

  try {
    const db = getDb();
    const row = db
      .prepare('SELECT config_json FROM widget_configs WHERE widget_id = ? AND user_id = ?')
      .get(widgetId, userId) as ConfigRow | undefined;

    return NextResponse.json({ config: row ? JSON.parse(row.config_json) : null });
  } catch (err) {
    console.error('[configs GET]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { config } = await request.json();

    if (!config?.widgetId || !config?.userId) {
      return NextResponse.json({ error: 'Invalid config' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(`
      INSERT INTO widget_configs (widget_id, user_id, config_json, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(widget_id, user_id) DO UPDATE SET
        config_json = excluded.config_json,
        updated_at  = excluded.updated_at
    `).run(config.widgetId, config.userId, JSON.stringify(config));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[configs POST]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
