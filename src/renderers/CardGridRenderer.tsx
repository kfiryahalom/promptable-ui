'use client';

import React from 'react';
import type { WidgetConfig } from '../types';
import { getFields } from '../utils';

interface Props {
  config: WidgetConfig;
  data: any[];
}

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const STATUS_COLORS: Record<string, string> = {
  done: 'bg-green-100 text-green-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  todo: 'bg-gray-100 text-gray-600',
};

function Badge({ field, value }: { field: string; value: string }) {
  const colorMap = field === 'priority' ? PRIORITY_COLORS : field === 'status' ? STATUS_COLORS : {};
  const cls = colorMap[value] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {value}
    </span>
  );
}

export function CardGridRenderer({ config, data }: Props) {
  const processed = data;
  const fields = getFields(config, data);
  const badgeFields = new Set(['status', 'priority']);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {config.title && (
        <h3 style={{ flexShrink: 0, fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#1F2937' }}>
          {config.title}
        </h3>
      )}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {processed.map((item, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
              {fields.map(field => {
                const val = String(item[field] ?? '');
                return (
                  <div key={field} className="mb-1 flex items-center gap-1 flex-wrap">
                    <span className="text-xs text-gray-400 capitalize">{field}:</span>
                    {badgeFields.has(field) ? (
                      <Badge field={field} value={val} />
                    ) : (
                      <span className="text-sm text-gray-700">{val}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
