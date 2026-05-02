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
  { widgetId: 'fb-log',      defaultResource: 'workouts', defaultView: 'table', title: '📋 Workout Log',      colSpan: 2 },
  { widgetId: 'fb-calories', defaultResource: 'workouts', defaultView: 'bar',   title: '🔥 Calories by Type' },
  { widgetId: 'fb-goals',    defaultResource: 'goals',    defaultView: 'stat',  title: '🎯 Weekly Goals' },
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
      name: 'workouts',
      description: 'Individual workout sessions — type, duration, calories, distance, heart rate, effort. Joinable with nutrition on date field.',
      fields: [
        { name: 'date',      type: 'date'   },
        { name: 'type',      type: 'string' },
        { name: 'duration',  type: 'number' },
        { name: 'calories',  type: 'number' },
        { name: 'distance',  type: 'number' },
        { name: 'heartRate', type: 'number' },
        { name: 'effort',    type: 'string' },
      ],
    },
    {
      name: 'goals',
      description: 'Weekly fitness goals vs actuals — workouts, calories, distance, active minutes, heart rate',
      fields: [
        { name: 'goal',   type: 'string' },
        { name: 'target', type: 'number' },
        { name: 'actual', type: 'number' },
        { name: 'unit',   type: 'string' },
      ],
    },
    {
      name: 'nutrition',
      description: 'Daily nutrition log — calories, protein, carbs, fat, water intake. Joinable with workouts on date field.',
      fields: [
        { name: 'date',     type: 'date'   },
        { name: 'calories', type: 'number' },
        { name: 'protein',  type: 'number' },
        { name: 'carbs',    type: 'number' },
        { name: 'fat',      type: 'number' },
        { name: 'water',    type: 'number' },
      ],
    },
    {
      name: 'biometrics',
      description: 'Weekly body measurements — weight, body fat %, muscle mass, resting heart rate, sleep hours, HRV',
      fields: [
        { name: 'date',       type: 'date'   },
        { name: 'weight',     type: 'number' },
        { name: 'bodyFat',    type: 'number' },
        { name: 'muscleMass', type: 'number' },
        { name: 'restingHR',  type: 'number' },
        { name: 'sleepHours', type: 'number' },
        { name: 'hrv',        type: 'number' },
      ],
    },
  ],
};

async function fetchData(resource: string): Promise<any[]> {
  const res = await fetch(`/api/data?resource=${encodeURIComponent(resource)}`);
  if (!res.ok) throw new Error(`Failed to fetch ${resource}`);
  return res.json();
}

interface Props { workoutsData: any[]; goalsData: any[]; nutritionData: any[]; biometricsData: any[]; }

export function DashboardClient({ workoutsData, goalsData, nutritionData, biometricsData }: Props) {
  const allData: Record<string, any[]> = { workouts: workoutsData, goals: goalsData, nutrition: nutritionData, biometrics: biometricsData };
  const storage = useMemo<StorageAdapter>(() => new LocalStorageAdapter('fit-board'), []);
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

  function defaultDataFor(r: string) { return allData[r] ?? workoutsData; }

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
    const newId = `fb-clone-${Date.now()}`;
    const source = widgets.find(w => w.widgetId === sourceId);
    try {
      const cfg = await storage.getConfig(sourceId, userId);
      if (cfg) await storage.saveConfig({ ...cfg, widgetId: newId, updatedAt: new Date().toISOString() });
    } catch { /* blank clone */ }
    const maxY = gridLayoutItem.reduce((m, l) => Math.max(m, l.y + l.h), 0);
    const newPos: LayoutItem = { i: newId, x: 0, y: maxY, w: 6, h: 5, minW: 2, minH: 2 };
    const next = [...widgets, { widgetId: newId, defaultResource: source?.defaultResource ?? 'workouts', defaultView: source?.defaultView ?? 'table', title: `${source?.title ?? 'Widget'} (copy)`, colSpan: 1 as const }];
    const newGrid = [...gridLayoutItem, newPos];
    setGridLayoutItem(newGrid);
    await persistLayoutItem(next, newGrid);
  }

  async function addWidget() {
    const newId = `fb-new-${Date.now()}`;
    const maxY = gridLayoutItem.reduce((m, l) => Math.max(m, l.y + l.h), 0);
    const newPos: LayoutItem = { i: newId, x: 0, y: maxY, w: 6, h: 5, minW: 2, minH: 2 };
    const next = [...widgets, { widgetId: newId, defaultResource: 'workouts', defaultView: 'table' as const, title: '✨ New Widget', colSpan: 1 as const }];
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

      <RGL
        layout={gridLayoutItem}
        cols={12}
        rowHeight={80}
        margin={[16, 16]}
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
              onClone={() => cloneWidget(w.widgetId)}
              onRemove={widgets.length > 1 ? () => removeWidget(w.widgetId) : undefined}
            />
          </div>
        ))}
      </RGL>

      {/* Ghost card below the grid — sits outside RGL so it's never part of the draggable canvas */}
      <button
        onClick={addWidget}
        style={{
          marginTop: 16,
          width: '100%',
          minHeight: 80,
          border: '2px dashed #C4B5FD',
          borderRadius: 16,
          background: 'rgba(124,58,237,0.03)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          color: '#7C3AED',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.08)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#A78BFA';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.03)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#C4B5FD';
        }}
      >
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Add Widget</div>
          <div style={{ fontSize: 11, color: '#A78BFA', marginTop: 1 }}>Drag to reposition · resize from corner</div>
        </div>
      </button>
    </DynamicUIProvider>
  );
}
