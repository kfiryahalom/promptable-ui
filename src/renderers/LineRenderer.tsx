'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { WidgetConfig } from '../types';
import { getFields } from '../utils';

interface Props {
  config: WidgetConfig;
  data: any[];
}

export function LineRenderer({ config, data }: Props) {
  const filtered = data;
  const fields = getFields(config, data);

  const xField = fields[0] ?? 'name';
  const yField = fields[1] ?? fields[0] ?? 'value';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {config.title && (
        <h3 style={{ flexShrink: 0, fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#1F2937' }}>
          {config.title}
        </h3>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filtered} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={xField} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey={yField}
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
