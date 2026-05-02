import { NextRequest, NextResponse } from 'next/server';
import { mockWorkouts, mockGoals, mockNutrition, mockBiometrics } from '@/lib/mock-data';

export async function GET(request: NextRequest) {
  const resource = request.nextUrl.searchParams.get('resource');
  switch (resource) {
    case 'workouts':   return NextResponse.json(mockWorkouts);
    case 'goals':      return NextResponse.json(mockGoals);
    case 'nutrition':  return NextResponse.json(mockNutrition);
    case 'biometrics': return NextResponse.json(mockBiometrics);
    // Return ALL resources for multi-resource widget generation
    case 'all':        return NextResponse.json({ workouts: mockWorkouts, goals: mockGoals, nutrition: mockNutrition, biometrics: mockBiometrics });
    default: return NextResponse.json({ error: `Unknown resource: ${resource}` }, { status: 400 });
  }
}
