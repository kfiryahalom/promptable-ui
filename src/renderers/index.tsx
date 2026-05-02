import React from 'react';
import type { WidgetConfig } from '../types';
import { groupAndAggregate, applyFilters, applySort } from '../utils';
import { DynamicRenderer } from '../components/DynamicRenderer';
import { TableRenderer } from './TableRenderer';
import { BarRenderer } from './BarRenderer';
import { LineRenderer } from './LineRenderer';
import { PieRenderer } from './PieRenderer';
import { StatRenderer } from './StatRenderer';
import { CardGridRenderer } from './CardGridRenderer';

function prepareData(config: WidgetConfig, rawData: any[]): any[] {
  let data = applyFilters(rawData, config.filters);
  if (config.groupBy && config.aggregations && config.aggregations.length > 0) {
    data = groupAndAggregate(data, config.groupBy, config.aggregations);
  }
  return applySort(data, config.sortBy, config.sortDir);
}

export function renderWidget(config: WidgetConfig, rawData: any[], allData?: Record<string, any[]>): React.ReactElement {
  // LLM-generated component: pass raw data AND all resources for joins
  if (config.generatedCode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {config.title && (
          <h3 style={{ flexShrink: 0, fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#1F2937' }}>
            {config.title}
          </h3>
        )}
        <div style={{ flex: 1, minHeight: 0 }}>
          <DynamicRenderer code={config.generatedCode} data={rawData} allData={allData} />
        </div>
      </div>
    );
  }

  // Config-driven fallback
  const data = prepareData(config, rawData);
  switch (config.chartType) {
    case 'bar':       return <BarRenderer config={config} data={data} />;
    case 'line':      return <LineRenderer config={config} data={data} />;
    case 'pie':       return <PieRenderer config={config} data={data} />;
    case 'stat':      return <StatRenderer config={config} data={data} />;
    case 'card-grid': return <CardGridRenderer config={config} data={data} />;
    case 'table':
    default:          return <TableRenderer config={config} data={data} />;
  }
}

export { TableRenderer, BarRenderer, LineRenderer, PieRenderer, StatRenderer, CardGridRenderer, DynamicRenderer };
