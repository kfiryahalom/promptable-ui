'use client';

import React from 'react';
import type { WidgetConfig } from '../types';
import { getFields } from '../utils';

interface Props {
  config: WidgetConfig;
  data: any[];
}

export function StatRenderer({ config, data }: Props) {
  const filtered = data;
  const fields = getFields(config, data);

  const numField = fields.find(
    f => filtered[0] != null && (typeof filtered[0][f] === 'number' || !isNaN(Number(filtered[0][f])))
  );
  const labelField = fields.find(
    f => f !== numField && filtered[0] != null && typeof filtered[0][f] === 'string'
  );

  if (filtered.length === 1) {
    const value = numField ? filtered[0][numField] : '—';
    const label = labelField ? filtered[0][labelField] : config.title ?? '';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        {config.title && (
          <p style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            {config.title}
          </p>
        )}
        <p style={{ fontSize: 'clamp(2rem, 10cqi, 4rem)', fontWeight: 700, color: '#3B82F6', lineHeight: 1 }}>
          {value}
        </p>
        {label && (
          <p style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>{label}</p>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {config.title && (
        <h3 style={{ flexShrink: 0, fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#1F2937' }}>
          {config.title}
        </h3>
      )}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {filtered.map((item, i) => (
            <div key={i} style={{ background: '#EFF6FF', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
              <p style={{ fontSize: 'clamp(1rem, 5cqi, 1.5rem)', fontWeight: 700, color: '#3B82F6', lineHeight: 1 }}>
                {numField ? item[numField] : '—'}
              </p>
              <p style={{ fontSize: 11, color: '#6B7280', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {labelField ? item[labelField] : `Item ${i + 1}`}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
