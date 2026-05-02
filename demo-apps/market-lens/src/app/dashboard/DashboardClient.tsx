'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import GridLayoutItem, { WidthProvider } from 'react-grid-layout/legacy';
import type { LayoutItem } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import { DynamicUIProvider, DynamicWidget, LocalStorageAdapter } from 'promptable-ui';
import type { SchemaDefinition, ChartType, StorageAdapter, OnPromptFn, WidgetConfig } from 'promptable-ui';

const RGL = WidthProvider(GridLayoutItem);

export interface WidgetItem {
  widgetId: string;
  defaultResource: string;
  defaultView: ChartType;
  title: string;
  colSpan?: 1 | 2;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

export const DEFAULT_LAYOUT: WidgetItem[] = [
  { widgetId: 'ml-stocks-table',  defaultResource: 'stocks',  defaultView: 'table', title: 'Equities',       colSpan: 2 },
  { widgetId: 'ml-sector-bar',    defaultResource: 'stocks',  defaultView: 'bar',   title: 'Sector Overview' },
  { widgetId: 'ml-indices-table', defaultResource: 'indices', defaultView: 'table', title: 'Indices' },
];

function widgetsToLayoutItem(widgets: WidgetItem[]): readonly LayoutItem[] {
  let x = 0, y = 0;
  return widgets.map(w => {
    if (w.x !== undefined && w.y !== undefined && w.w !== undefined && w.h !== undefined) {
      return { i: w.widgetId, x: w.x, y: w.y, w: w.w, h: w.h, minW: 2, minH: 2 };
    }
    const isWide = w.colSpan === 2;
    const width = isWide ? 12 : 6;
    if ((isWide && x > 0) || (!isWide && x + width > 12)) { y += 5; x = 0; }
    const item: LayoutItem = { i: w.widgetId, x, y, w: width, h: 5, minW: 2, minH: 2 };
    x += width;
    if (x >= 12) { x = 0; y += 5; }
    return item;
  });
}

const dataSchema: SchemaDefinition = {
  resources: [
    {
      name: 'stocks',
      description: 'Individual stock data — prices, changes, volume, market cap, sector, P/E ratio. Joinable with earnings and analysts on symbol field.',
      fields: [
        { name: 'symbol',    type: 'string' },
        { name: 'name',      type: 'string' },
        { name: 'price',     type: 'number' },
        { name: 'change',    type: 'number' },
        { name: 'changePct', type: 'number' },
        { name: 'volume',    type: 'number' },
        { name: 'marketCap', type: 'number' },
        { name: 'sector',    type: 'string' },
        { name: 'peRatio',   type: 'number' },
      ],
    },
    {
      name: 'indices',
      description: 'Major market indices — S&P 500, NASDAQ, DOW, Russell 2000, with YTD returns',
      fields: [
        { name: 'index',     type: 'string' },
        { name: 'value',     type: 'number' },
        { name: 'change',    type: 'number' },
        { name: 'changePct', type: 'number' },
        { name: 'ytdChange', type: 'number' },
      ],
    },
    {
      name: 'earnings',
      description: 'Recent quarterly earnings results — EPS actual vs estimate, revenue actual vs estimate, beat/miss flag. Joinable with stocks on symbol field.',
      fields: [
        { name: 'symbol',      type: 'string' },
        { name: 'quarter',     type: 'string' },
        { name: 'epsActual',   type: 'number' },
        { name: 'epsEstimate', type: 'number' },
        { name: 'revActual',   type: 'number' },
        { name: 'revEstimate', type: 'number' },
        { name: 'beat',        type: 'boolean' },
      ],
    },
    {
      name: 'analysts',
      description: 'Analyst ratings and price targets per stock. Joinable with stocks on symbol field.',
      fields: [
        { name: 'symbol',      type: 'string' },
        { name: 'firm',        type: 'string' },
        { name: 'rating',      type: 'string' },
        { name: 'priceTarget', type: 'number' },
        { name: 'prevTarget',  type: 'number' },
        { name: 'date',        type: 'date'   },
      ],
    },
  ],
};

async function fetchData(resource: string): Promise<any[]> {
  const res = await fetch(`/api/data?resource=${encodeURIComponent(resource)}`);
  if (!res.ok) throw new Error(`Failed to fetch ${resource}`);
  return res.json();
}

interface Props { stocksData: any[]; indicesData: any[]; earningsData: any[]; analystsData: any[]; }

export function DashboardClient({ stocksData, indicesData, earningsData, analystsData }: Props) {
  const allData: Record<string, any[]> = { stocks: stocksData, indices: indicesData, earnings: earningsData, analysts: analystsData };
  const storage = useMemo<StorageAdapter>(() => new LocalStorageAdapter('market-lens'), []);
  const userId = 'local';

  const onPrompt = useCallback<OnPromptFn>(async (prompt, { schema, currentConfig }) => {
    const res = await fetch('/api/promptable-ui/interpret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, schema, currentConfig }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Request failed');
    return json.config as WidgetConfig;
  }, []);

  const [widgets, setWidgets] = useState<WidgetItem[]>(DEFAULT_LAYOUT);
  const [gridLayoutItem, setGridLayoutItem] = useState<readonly LayoutItem[]>(() => widgetsToLayoutItem(DEFAULT_LAYOUT));

  useEffect(() => {
    storage.getLayout?.(userId).then(saved => {
      if (saved && saved.length > 0) {
        setWidgets(saved);
        setGridLayoutItem(widgetsToLayoutItem(saved));
      }
    });
  }, []); // eslint-disable-line

  function defaultDataFor(resource: string) { return allData[resource] ?? stocksData; }

  async function persistLayoutItem(next: WidgetItem[], layout: readonly LayoutItem[]) {
    const withPositions = next.map(w => {
      const pos = layout.find(l => l.i === w.widgetId);
      return pos ? { ...w, x: pos.x, y: pos.y, w: pos.w, h: pos.h } : w;
    });
    setWidgets(withPositions);
    await storage.saveLayout?.(userId, withPositions);
  }

  function handleLayoutItemChange(newLayoutItem: readonly LayoutItem[]) { setGridLayoutItem(newLayoutItem); }

  async function handleDragResizeStop(newLayoutItem: readonly LayoutItem[]) { await persistLayoutItem(widgets, newLayoutItem); }

  async function cloneWidget(sourceId: string) {
    const newId = `ml-clone-${Date.now()}`;
    const source = widgets.find(w => w.widgetId === sourceId);
    try {
      const cfg = await storage.getConfig(sourceId, userId);
      if (cfg) await storage.saveConfig({ ...cfg, widgetId: newId, updatedAt: new Date().toISOString() });
    } catch { /* blank clone */ }
    const maxY = gridLayoutItem.reduce((m, l) => Math.max(m, l.y + l.h), 0);
    const newPos: LayoutItem = { i: newId, x: 0, y: maxY, w: 6, h: 5, minW: 2, minH: 2 };
    const next = [...widgets, { widgetId: newId, defaultResource: source?.defaultResource ?? 'stocks', defaultView: source?.defaultView ?? 'table', title: `${source?.title ?? 'Panel'} [copy]`, colSpan: 1 as const }];
    const newGrid = [...gridLayoutItem, newPos];
    setGridLayoutItem(newGrid);
    await persistLayoutItem(next, newGrid);
  }

  async function addWidget() {
    const newId = `ml-new-${Date.now()}`;
    const maxY = gridLayoutItem.reduce((m, l) => Math.max(m, l.y + l.h), 0);
    const newPos: LayoutItem = { i: newId, x: 0, y: maxY, w: 6, h: 5, minW: 2, minH: 2 };
    const next = [...widgets, { widgetId: newId, defaultResource: 'stocks', defaultView: 'table' as const, title: 'New Panel', colSpan: 1 as const }];
    const newGrid = [...gridLayoutItem, newPos];
    setGridLayoutItem(newGrid);
    await persistLayoutItem(next, newGrid);
  }

  async function removeWidget(id: string) {
    const next = widgets.filter(w => w.widgetId !== id);
    const newGrid = gridLayoutItem.filter(l => l.i !== id);
    setGridLayoutItem(newGrid);
    await persistLayoutItem(next, newGrid);
  }

  return (
    <DynamicUIProvider userId={userId} dataSchema={dataSchema} fetchData={fetchData}
      onPrompt={onPrompt} storage={storage} allData={allData}>

      {/* Compact terminal button — above the grid, right-aligned */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button
          onClick={addWidget}
          style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.08em', padding: '5px 14px', border: '1px solid #1E2D45', borderRadius: 4, background: 'transparent', color: '#475569', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#38BDF8'; (e.currentTarget as HTMLButtonElement).style.color = '#38BDF8'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(56,189,248,0.06)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1E2D45'; (e.currentTarget as HTMLButtonElement).style.color = '#475569'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          [+ NEW PANEL]
        </button>
      </div>

      <RGL
        layout={gridLayoutItem}
        cols={12}
        rowHeight={80}
        margin={[12, 12]}
        containerPadding={[0, 0]}
        draggableCancel="button, input, textarea, select, a, .recharts-wrapper"
        onLayoutChange={handleLayoutItemChange}
        onDragStop={handleDragResizeStop}
        onResizeStop={handleDragResizeStop}
      >
        {widgets.map(w => (
          <div key={w.widgetId}>
            <DynamicWidget
              widgetId={w.widgetId}
              defaultData={defaultDataFor(w.defaultResource)}
              defaultView={w.defaultView}
              defaultResource={w.defaultResource}
              title={w.title}
              variant="dark"
              onClone={() => cloneWidget(w.widgetId)}
              onRemove={widgets.length > 1 ? () => removeWidget(w.widgetId) : undefined}
            />
          </div>
        ))}
      </RGL>
    </DynamicUIProvider>
  );
}
