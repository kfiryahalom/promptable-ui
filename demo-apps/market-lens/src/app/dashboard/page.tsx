import { mockStocks, mockIndices, mockEarnings, mockAnalysts } from '@/lib/mock-data';
import { DashboardClient } from './DashboardClient';

export default function DashboardPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B1120' }}>
      {/* Top nav */}
      <header
        style={{
          borderBottom: '1px solid #1E2D45',
          padding: '0 24px',
          height: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0D1526',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#38BDF8', fontWeight: 700, fontSize: 14, letterSpacing: '0.06em' }}>
            ◈ MARKET<span style={{ color: '#E2E8F0' }}>LENS</span>
          </span>
          <span style={{ color: '#1E2D45', fontSize: 12 }}>│</span>
          <span style={{ color: '#475569', fontSize: 11, letterSpacing: '0.04em' }}>
            EQUITIES · INDICES · REAL-TIME
          </span>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10B981',
                display: 'inline-block',
                boxShadow: '0 0 6px #10B981',
              }}
            />
            <span style={{ color: '#10B981' }}>LIVE</span>
          </span>
          <span style={{ color: '#334155', fontSize: 11 }}>NYSE · NASDAQ</span>
        </div>
      </header>

      {/* Ticker bar */}
      <div
        style={{
          borderBottom: '1px solid #1E2D45',
          padding: '7px 24px',
          backgroundColor: '#0F1929',
          display: 'flex',
          gap: 28,
          overflowX: 'auto',
        }}
      >
        {mockIndices.map(idx => (
          <span key={idx.index} style={{ whiteSpace: 'nowrap', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#64748B' }}>{idx.index}</span>
            <span style={{ color: '#CBD5E1', fontWeight: 600 }}>{idx.value.toLocaleString()}</span>
            <span style={{ color: idx.changePct >= 0 ? '#10B981' : '#F43F5E' }}>
              {idx.changePct >= 0 ? '▲' : '▼'} {Math.abs(idx.changePct).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>

      <main style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ color: '#E2E8F0', fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>
              Portfolio Intelligence
            </div>
            <div style={{ color: '#475569', fontSize: 12, marginTop: 4 }}>
              Hover any panel to reveal AI customization controls.
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              color: '#334155',
              background: '#0F1929',
              border: '1px solid #1E2D45',
              borderRadius: 6,
              padding: '4px 10px',
            }}
          >
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
        <DashboardClient
          stocksData={mockStocks}
          indicesData={mockIndices}
          earningsData={mockEarnings}
          analystsData={mockAnalysts}
        />
      </main>
    </div>
  );
}
