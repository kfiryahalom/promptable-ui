import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDb } from '@/lib/db';

interface LayoutRow {
  layout_json: string;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = request.nextUrl.searchParams.get('userId') ?? (session.user as any).id;

  try {
    const db = getDb();
    const row = db
      .prepare('SELECT layout_json FROM dashboard_layouts WHERE user_id = ?')
      .get(userId) as LayoutRow | undefined;

    return NextResponse.json({ layout: row ? JSON.parse(row.layout_json) : null });
  } catch (err) {
    console.error('[layout GET]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { userId, widgets } = await request.json();
    if (!userId || !Array.isArray(widgets)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const db = getDb();
    db.prepare(`
      INSERT INTO dashboard_layouts (user_id, layout_json, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        layout_json = excluded.layout_json,
        updated_at  = excluded.updated_at
    `).run(userId, JSON.stringify(widgets));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[layout POST]', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
