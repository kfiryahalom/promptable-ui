'use client';

import { useState, useMemo, useCallback } from 'react';
import GridLayoutItem, { WidthProvider } from 'react-grid-layout/legacy';
import type { LayoutItem } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import { DynamicUIProvider, DynamicWidget, ServerAdapter, LocalStorageAdapter } from 'promptable-ui';
import type { SchemaDefinition, ChartType, StorageAdapter, OnPromptFn, WidgetConfig } from 'promptable-ui';

const RGL = WidthProvider(GridLayoutItem);

export interface WidgetItem {
  widgetId: string;
  defaultResource: string;
  defaultView: ChartType;
  title: string;
  colSpan?: 1 | 2;
  // Persisted grid position
  x?: number;
  y?: number;
  w?: number;
  h?: number;
}

export const DEFAULT_LAYOUT: WidgetItem[] = [
  { widgetId: 'widget-tasks-table', defaultResource: 'tasks',   defaultView: 'table', title: 'All Tasks',         colSpan: 2 },
  { widgetId: 'widget-tasks-bar',   defaultResource: 'tasks',   defaultView: 'bar',   title: 'Tasks by Category' },
  { widgetId: 'widget-summary-stat',defaultResource: 'summary', defaultView: 'stat',  title: 'Project Metrics'   },
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
      name: 'tasks',
      description: 'Project tasks with status, priority, category, and assignment info',
      fields: [
        { name: 'id',       type: 'number' },
        { name: 'title',    type: 'string' },
        { name: 'status',   type: 'string' },
        { name: 'priority', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'assignee', type: 'string' },
        { name: 'dueDate',  type: 'date'   },
      ],
    },
    {
      name: 'summary',
      description: 'Aggregate project metrics: total tasks, completion rate, counts by status/priority',
      fields: [
        { name: 'metric', type: 'string' },
        { name: 'value',  type: 'number' },
      ],
    },
  ],
};

async function fetchData(resource: string): Promise<any[]> {
  const res = await fetch(`/api/data?resource=${encodeURIComponent(resource)}`);
  if (!res.ok) throw new Error(`Failed to fetch ${resource}`);
  return res.json();
}

interface Props {
  userId: string;
  tasksData: any[];
  summaryData: any[];
  initialLayout: WidgetItem[];
  storage?: StorageAdapter;
}

export function DashboardClient({ userId, tasksData, summaryData, initialLayout, storage: storageProp }: Props) {
  const storage = useMemo<StorageAdapter>(
    () => storageProp ?? new ServerAdapter('/api/promptable-ui/configs', '/api/dashboard/layout'),
    [storageProp]
  );

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

  const [widgets, setWidgets] = useState<WidgetItem[]>(initialLayout);
  const [gridLayoutItem, setGridLayoutItem] = useState<readonly LayoutItem[]>(() => widgetsToLayoutItem(initialLayout));

  function defaultDataFor(resource: string) {
    return resource === 'summary' ? summaryData : tasksData;
  }

  async function persistLayoutItem(next: WidgetItem[], layout: readonly LayoutItem[]) {
    const withPositions = next.map(w => {
      const pos = layout.find(l => l.i === w.widgetId);
      return pos ? { ...w, x: pos.x, y: pos.y, w: pos.w, h: pos.h } : w;
    });
    setWidgets(withPositions);
    try { await storage.saveLayout?.(userId, withPositions); } catch { /* non-critical */ }
  }

  function handleLayoutItemChange(newLayoutItem: readonly LayoutItem[]) {
    setGridLayoutItem(newLayoutItem);
  }

  async function handleDragResizeStop(newLayoutItem: readonly LayoutItem[]) {
    await persistLayoutItem(widgets, newLayoutItem);
  }

  async function cloneWidget(sourceId: string) {
    const newId = `widget-clone-${Date.now()}`;
    const source = widgets.find(w => w.widgetId === sourceId);
    try {
      const existing = await storage.getConfig(sourceId, userId);
      if (existing) await storage.saveConfig({ ...existing, widgetId: newId, updatedAt: new Date().toISOString() });
    } catch { /* clone without config */ }
    const maxY = gridLayoutItem.reduce((m, l) => Math.max(m, l.y + l.h), 0);
    const newPos: LayoutItem = { i: newId, x: 0, y: maxY, w: 6, h: 5, minW: 2, minH: 2 };
    const next = [...widgets, { widgetId: newId, defaultResource: source?.defaultResource ?? 'tasks', defaultView: source?.defaultView ?? 'table', title: `${source?.title ?? 'Widget'} (copy)`, colSpan: 1 as const }];
    const newGrid = [...gridLayoutItem, newPos];
    setWidgets(next);
    setGridLayoutItem(newGrid);
    await persistLayoutItem(next, newGrid);
  }

  async function addWidget() {
    const newId = `widget-new-${Date.now()}`;
    const maxY = gridLayoutItem.reduce((m, l) => Math.max(m, l.y + l.h), 0);
    const newPos: LayoutItem = { i: newId, x: 0, y: maxY, w: 6, h: 5, minW: 2, minH: 2 };
    const next = [...widgets, { widgetId: newId, defaultResource: 'tasks', defaultView: 'table' as const, title: 'New Widget', colSpan: 1 as const }];
    const newGrid = [...gridLayoutItem, newPos];
    setWidgets(next);
    setGridLayoutItem(newGrid);
    await persistLayoutItem(next, newGrid);
  }

  async function removeWidget(widgetId: string) {
    const next = widgets.filter(w => w.widgetId !== widgetId);
    const newGrid = gridLayoutItem.filter(l => l.i !== widgetId);
    setWidgets(next);
    setGridLayoutItem(newGrid);
    await persistLayoutItem(next, newGrid);
  }

  return (
    <DynamicUIProvider userId={userId} dataSchema={dataSchema} fetchData={fetchData} onPrompt={onPrompt} storage={storage}>
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
        {widgets.map(widget => (
          <div key={widget.widgetId}>
            <DynamicWidget
              widgetId={widget.widgetId}
              defaultData={defaultDataFor(widget.defaultResource)}
              defaultView={widget.defaultView}
              defaultResource={widget.defaultResource}
              title={widget.title}
              onClone={() => cloneWidget(widget.widgetId)}
              onRemove={widgets.length > 1 ? () => removeWidget(widget.widgetId) : undefined}
            />
          </div>
        ))}
      </RGL>

      <div className="mt-8 flex justify-center">
        <button
          onClick={addWidget}
          className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', boxShadow: '0 4px 16px rgba(79,70,229,0.35)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(79,70,229,0.5)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(79,70,229,0.35)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Widget
        </button>
      </div>
    </DynamicUIProvider>
  );
}
