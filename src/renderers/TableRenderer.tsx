'use client';

import React, { useState } from 'react';
import type { WidgetConfig } from '../types';
import { getFields } from '../utils';

interface Props {
  config: WidgetConfig;
  data: any[];
}

export function TableRenderer({ config, data }: Props) {
  const [sortField, setSortField] = useState<string | null>(config.sortBy ?? null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(config.sortDir ?? 'asc');

  const fields = getFields(config, data);
  const processed = sortField
    ? [...data].sort((a, b) => {
        const aVal = a[sortField]; const bVal = b[sortField];
        const dir = sortDir === 'asc' ? 1 : -1;
        if (aVal == null) return dir; if (bVal == null) return -dir;
        return String(aVal).localeCompare(String(bVal)) * dir;
      })
    : data;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {config.title && (
        <h3 style={{ flexShrink: 0, fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#1F2937' }}>
          {config.title}
        </h3>
      )}
      {/* Scrollable table area with sticky header */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'auto' }}>
        {processed.length === 0 ? (
          <p style={{ fontSize: 13, color: '#9CA3AF', padding: '16px 0', textAlign: 'center' }}>No data</p>
        ) : (
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {fields.map(field => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    style={{
                      padding: '6px 10px',
                      textAlign: 'left',
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      cursor: 'pointer',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      userSelect: 'none',
                      textTransform: 'capitalize',
                    }}
                  >
                    {field}{' '}
                    {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processed.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                  {fields.map(field => (
                    <td
                      key={field}
                      style={{ padding: '6px 10px', border: '1px solid #F3F4F6', whiteSpace: 'nowrap', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {String(row[field] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
