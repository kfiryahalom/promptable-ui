'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { WidgetConfig } from '../types';
import { aggregateData, getFields } from '../utils';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

interface Props {
  config: WidgetConfig;
  data: any[];
}

export function PieRenderer({ config, data }: Props) {
  const fields = getFields(config, data);

  const groupField = fields[0] ?? 'name';
  const valueField = fields[1];

  const firstItem = data[0];
  const isPreAggregated = !!config.groupBy;
  const valueIsNumeric = valueField && firstItem && typeof firstItem[valueField] === 'number';

  const chartData =
    isPreAggregated || valueIsNumeric
      ? data.map(item => ({ name: String(item[groupField]), value: Number(item[valueField ?? groupField] ?? 0) }))
      : aggregateData(data, groupField);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {config.title && (
        <h3 style={{ flexShrink: 0, fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#1F2937' }}>
          {config.title}
        </h3>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="28%"
              outerRadius="48%"
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={false}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
