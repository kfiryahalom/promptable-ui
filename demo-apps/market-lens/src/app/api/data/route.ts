import { NextRequest, NextResponse } from 'next/server';
import { mockStocks, mockIndices, mockEarnings, mockAnalysts } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const resource = request.nextUrl.searchParams.get('resource');
  switch (resource) {
    case 'stocks':   return NextResponse.json(mockStocks);
    case 'indices':  return NextResponse.json(mockIndices);
    case 'earnings': return NextResponse.json(mockEarnings);
    case 'analysts': return NextResponse.json(mockAnalysts);
    // Return ALL resources for multi-resource widget generation
    case 'all':      return NextResponse.json({ stocks: mockStocks, indices: mockIndices, earnings: mockEarnings, analysts: mockAnalysts });
    default: return NextResponse.json({ error: `Unknown resource: ${resource}` }, { status: 400 });
  }
}
