import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { mockTasks, mockSummaryMetrics } from '@/lib/mock-data';
import { getDb } from '@/lib/db';
import { DashboardClient, DEFAULT_LAYOUT } from './DashboardClient';
import type { WidgetItem } from './DashboardClient';

interface LayoutRow {
  layout_json: string;
}

async function getUserLayout(userId: string): Promise<WidgetItem[]> {
  try {
    const db = getDb();
    const row = db
      .prepare('SELECT layout_json FROM dashboard_layouts WHERE user_id = ?')
      .get(userId) as LayoutRow | undefined;
    return row ? JSON.parse(row.layout_json) : DEFAULT_LAYOUT;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  const userId = (session.user as any).id as string;
  const initialLayout = await getUserLayout(userId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold text-gray-900">Dynamic UI</span>
              <span className="hidden sm:inline text-gray-300 mx-2">·</span>
              <span className="hidden sm:inline text-xs text-gray-400">{session.user.email}</span>
            </div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors font-medium"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Project Overview</h1>
          <p className="text-sm text-gray-400 mt-1">
            Hover any widget to reveal AI customization, duplicate, and remove controls.
          </p>
        </div>

        <DashboardClient
          userId={userId}
          tasksData={mockTasks}
          summaryData={mockSummaryMetrics}
          initialLayout={initialLayout}
        />
      </main>
    </div>
  );
}
