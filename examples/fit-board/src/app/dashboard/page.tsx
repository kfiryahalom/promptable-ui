import { mockWorkouts, mockGoals, mockNutrition, mockBiometrics } from '@/lib/mock-data';
import { DashboardClient } from './DashboardClient';

export default function DashboardPage() {
  const totalCalories = mockWorkouts.reduce((s, w) => s + w.calories, 0);
  const totalMinutes  = mockWorkouts.reduce((s, w) => s + w.duration, 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '22px 28px 0' }}>
          {/* Brand row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                🏋️
              </div>
              <div>
                <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                  FitBoard
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, margin: 0 }}>
                  Your AI-powered fitness dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Stat pills */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              borderTop: '1px solid rgba(255,255,255,0.15)',
              paddingTop: 16,
              paddingBottom: 20,
            }}
          >
            {[
              { emoji: '🔥', label: 'Calories Burned', value: totalCalories.toLocaleString(), unit: 'kcal' },
              { emoji: '⏱️', label: 'Active Minutes',  value: totalMinutes,                  unit: 'min'  },
              { emoji: '💪', label: 'Total Workouts',  value: mockWorkouts.length,            unit: 'sessions' },
            ].map(stat => (
              <div
                key={stat.label}
                style={{
                  background: 'rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 14,
                  padding: '10px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 22 }}>{stat.emoji}</span>
                <div>
                  <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, lineHeight: 1 }}>
                    {stat.value}{' '}
                    <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.75 }}>{stat.unit}</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 }}>
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 28px' }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ color: '#1E1B4B', fontSize: 20, fontWeight: 700, margin: 0 }}>Your Dashboard</h2>
          <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>
            Hover any widget and click the AI button to ask your fitness coach anything.
          </p>
        </div>
        <DashboardClient
          workoutsData={mockWorkouts}
          goalsData={mockGoals}
          nutritionData={mockNutrition}
          biometricsData={mockBiometrics}
        />
      </main>
    </div>
  );
}
