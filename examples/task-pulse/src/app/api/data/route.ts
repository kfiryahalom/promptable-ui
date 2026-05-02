import { NextRequest, NextResponse } from 'next/server';
import { mockTasks, mockSummaryMetrics } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const resource = request.nextUrl.searchParams.get('resource');

  switch (resource) {
    case 'tasks':
      return NextResponse.json(mockTasks);
    case 'summary':
      return NextResponse.json(mockSummaryMetrics);
    default:
      return NextResponse.json({ error: `Unknown resource: ${resource}` }, { status: 400 });
  }
}
