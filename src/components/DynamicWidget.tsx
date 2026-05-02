'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { WidgetConfig } from '../types';
import { DynamicUIContext } from './DynamicUIProvider';
import { CustomizeModal } from './CustomizeModal';
import { renderWidget } from '../renderers';

interface Props {
  widgetId: string;
  defaultData: any[];
  defaultView?: WidgetConfig['chartType'];
  defaultResource?: string;
  title?: string;
  onClone?: () => void;
  onRemove?: () => void;
  /** 'light' (default white card) | 'dark' (dark terminal card) */
  variant?: 'light' | 'dark';
}

export function DynamicWidget({
  widgetId,
  defaultData,
  defaultView = 'table',
  defaultResource = 'tasks',
  title,
  onClone,
  onRemove,
  variant = 'light',
}: Props) {
  const isDark = variant === 'dark';

  const cardStyle: React.CSSProperties = isDark
    ? { position: 'relative', border: '1px solid #1E2D45', borderRadius: 8, padding: 16, backgroundColor: '#131f35', display: 'flex', flexDirection: 'column' }
    : { position: 'relative', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' };

  const context = React.useContext(DynamicUIContext);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [data, setData] = useState<any[]>(defaultData);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!context) { setLoading(false); return; }
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetId, context?.userId]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  async function loadConfig() {
    if (!context) return;
    try {
      const saved = await context.storage.getConfig(widgetId, context.userId);
      if (saved) {
        setConfig(saved);
        try { setData(await context.fetchData(saved.dataResource)); } catch { setData(defaultData); }
      }
    } catch { /* fall back silently */ } finally { setLoading(false); }
  }

  const handleSave = async (newConfig: WidgetConfig) => {
    try { await context!.storage.saveConfig(newConfig); } catch (err) { console.error('[DynamicWidget] save failed', err); }
    setConfig(newConfig);
    try { setData(await context!.fetchData(newConfig.dataResource)); } catch { /* keep */ }
    setShowModal(false);
  };

  const activeConfig: WidgetConfig = config ?? {
    widgetId,
    userId: context?.userId ?? '',
    chartType: defaultView,
    dataResource: defaultResource,
    fields: [],
    filters: [],
    updatedAt: new Date().toISOString(),
    title,
  };

  // Menu item colours per theme
  const menuBg   = isDark ? '#0F1929' : '#fff';
  const menuBdr  = isDark ? '#1E2D45' : '#E5E7EB';
  const itemColor = isDark ? '#94A3B8' : '#374151';
  const itemHoverBg = isDark ? '#1E2D45' : '#F3F4F6';

  function MenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
    const [hov, setHov] = useState(false);
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 12px',
          border: 'none',
          background: hov ? (danger ? '#FEF2F2' : itemHoverBg) : 'transparent',
          color: hov && danger ? '#EF4444' : itemColor,
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 500,
          textAlign: 'left',
          transition: 'all 0.1s',
        }}
      >
        {icon}
        {label}
      </button>
    );
  }

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); }}
    >
      {/* Content area — rendered before the menu so the menu paints on top */}
      <div style={{ flex: 1, minHeight: 0, paddingRight: 8, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div
              style={{
                width: 24,
                height: 24,
                border: '2px solid #6366F1',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'dui-widget-spin 0.7s linear infinite',
              }}
            />
          </div>
        ) : (
          renderWidget(activeConfig, data, context?.allData)
        )}
      </div>

      {/* ⋯ menu trigger — rendered last so it paints above chart SVGs */}
      <div
        ref={menuRef}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 20,
          opacity: hovered || menuOpen ? 1 : 0,
          transition: 'opacity 0.12s',
        }}
      >
        <button
          onClick={() => setMenuOpen(o => !o)}
          title="Widget actions"
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            border: isDark ? '1px solid #1E2D45' : '1px solid #E5E7EB',
            background: isDark ? 'rgba(15,25,41,0.9)' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(4px)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDark ? '#64748B' : '#9CA3AF',
            boxShadow: menuOpen ? '0 0 0 2px rgba(99,102,241,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
            transition: 'all 0.12s',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
          </svg>
        </button>

        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              top: 28,
              right: 0,
              background: menuBg,
              border: `1px solid ${menuBdr}`,
              borderRadius: 10,
              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              minWidth: 162,
              zIndex: 30,
            }}
          >
            <MenuItem
              icon={
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              }
              label="Customize with AI"
              onClick={() => { setShowModal(true); setMenuOpen(false); }}
            />
            {onClone && (
              <MenuItem
                icon={
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                }
                label="Duplicate"
                onClick={() => { onClone(); setMenuOpen(false); }}
              />
            )}
            {onRemove && (
              <>
                <div style={{ height: 1, background: menuBdr, margin: '2px 0' }} />
                <MenuItem
                  icon={
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  }
                  label="Remove widget"
                  onClick={() => { onRemove(); setMenuOpen(false); }}
                  danger
                />
              </>
            )}
          </div>
        )}
      </div>

      {showModal && context && (
        <CustomizeModal
          widgetId={widgetId}
          currentConfig={activeConfig}
          currentData={data}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          onPrompt={context.onPrompt}
          userId={context.userId}
          schema={context.dataSchema}
          fetchData={context.fetchData}
        />
      )}

      <style>{`
        @keyframes dui-widget-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
