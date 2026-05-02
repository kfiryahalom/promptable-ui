'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { WidgetConfig } from '../types';
import { aggregateData, getFields } from '../utils';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

interface Props {
  config: WidgetConfig;
  data: any[];
}

export function BarRenderer({ config, data }: Props) {
  const fields = getFields(config, data);

  const xField = fields[0] ?? 'name';
  const yField = fields[1];

  const firstItem = data[0];
  const isPreAggregated = !!config.groupBy;
  const yIsNumeric = yField && firstItem && typeof firstItem[yField] === 'number';

  const chartData =
    isPreAggregated || yIsNumeric
      ? data
      : aggregateData(data, xField, yField);

  const dataKey = isPreAggregated || yIsNumeric ? (yField ?? fields[1] ?? 'value') : 'value';
  const nameKey = isPreAggregated ? xField : yIsNumeric ? xField : 'name';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {config.title && (
        <h3 style={{ flexShrink: 0, fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#1F2937' }}>
          {config.title}
        </h3>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey={dataKey} fill={COLORS[0]} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
