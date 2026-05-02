'use client';

import React, { useState } from 'react';
import type { WidgetConfig, SchemaDefinition, OnPromptFn } from '../types';
import { renderWidget } from '../renderers';

interface Props {
  widgetId: string;
  currentConfig: WidgetConfig;
  currentData: any[];
  onSave: (config: WidgetConfig) => void;
  onClose: () => void;
  onPrompt: OnPromptFn;
  userId: string;
  schema: SchemaDefinition;
  fetchData: (resource: string) => Promise<any[]>;
}

const SUGGESTIONS = [
  'Pie chart by category',
  'Bar chart sorted by value',
  'Show only top 5 items',
  'Line chart over time',
  'Summary stats view',
];

export function CustomizeModal({
  widgetId,
  currentConfig,
  currentData,
  onSave,
  onClose,
  onPrompt,
  userId,
  schema,
  fetchData,
}: Props) {
  const [prompt, setPrompt] = useState('');
  const [previewConfig, setPreviewConfig] = useState<WidgetConfig | null>(null);
  const [previewData, setPreviewData] = useState<any[]>(currentData);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const rawConfig = await onPrompt(prompt, { schema, currentConfig });
      if (!rawConfig || typeof rawConfig.chartType !== 'string') {
        throw new Error('Invalid config returned');
      }
      const newConfig: WidgetConfig = {
        ...rawConfig,
        widgetId,
        userId,
        prompt,
        updatedAt: new Date().toISOString(),
      };
      setPreviewConfig(newConfig);
      if (newConfig.dataResource !== currentConfig.dataResource) {
        try {
          setPreviewData(await fetchData(newConfig.dataResource));
        } catch {
          setPreviewData(currentData);
        }
      } else {
        setPreviewData(currentData);
      }
      setShowPreview(true);
    } catch (err: any) {
      setError(err?.message ?? "Couldn't parse that, try rephrasing");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      {/* Main editing modal */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          backgroundColor: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(3px)',
        }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            width: '100%',
            maxWidth: 560,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Gradient header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div>
                <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 15, margin: 0, lineHeight: 1.2 }}>
                  Customize with AI
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span
                    style={{
                      fontSize: 11,
                      background: 'rgba(255,255,255,0.2)',
                      color: 'rgba(255,255,255,0.9)',
                      padding: '2px 8px',
                      borderRadius: 20,
                      fontWeight: 500,
                    }}
                  >
                    {currentConfig.chartType}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>·</span>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                    {currentConfig.dataResource}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.8)',
                flexShrink: 0,
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.25)')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Prompt input */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                Describe what you want to see
              </label>
              <textarea
                style={{
                  width: '100%',
                  border: '1.5px solid #E5E7EB',
                  borderRadius: 12,
                  padding: '12px 14px',
                  fontSize: 13,
                  resize: 'none',
                  height: 88,
                  outline: 'none',
                  background: '#F9FAFB',
                  color: '#111827',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  transition: 'border-color 0.15s',
                }}
                placeholder='e.g. "show as a pie chart grouped by category" or "bar chart sorted by priority"'
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onFocus={e => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = '#6366F1')}
                onBlur={e => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = '#E5E7EB')}
                onKeyDown={e => e.key === 'Enter' && e.metaKey && handleGenerate()}
              />
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Press ⌘+Enter to generate</p>
            </div>

            {/* Quick suggestions */}
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6B7280',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Quick suggestions
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setPrompt(s)}
                    style={{
                      fontSize: 12,
                      padding: '5px 12px',
                      borderRadius: 20,
                      border: '1.5px solid #E5E7EB',
                      background: '#fff',
                      color: '#4B5563',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#818CF8';
                      (e.currentTarget as HTMLButtonElement).style.color = '#4F46E5';
                      (e.currentTarget as HTMLButtonElement).style.background = '#EEF2FF';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
                      (e.currentTarget as HTMLButtonElement).style.color = '#4B5563';
                      (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Error state */}
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  background: '#FEF2F2',
                  border: '1.5px solid #FECACA',
                  borderRadius: 10,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Preview ready hint */}
            {previewConfig && !showPreview && (
              <button
                onClick={() => setShowPreview(true)}
                style={{
                  padding: '10px 14px',
                  background: '#EEF2FF',
                  border: '1.5px solid #C7D2FE',
                  borderRadius: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#4F46E5',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Preview ready — click to view full size
              </button>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid #F3F4F6',
              background: '#FAFAFA',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: '#6B7280',
                background: '#fff',
                border: '1.5px solid #E5E7EB',
                borderRadius: 10,
                cursor: 'pointer',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#111827')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = '#6B7280')}
            >
              Cancel
            </button>

            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              style={{
                flex: 1,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                color: '#fff',
                background: generating || !prompt.trim() ? '#A5B4FC' : '#4F46E5',
                border: 'none',
                borderRadius: 10,
                cursor: generating || !prompt.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              {generating ? (
                <>
                  <svg
                    style={{ animation: 'dui-spin 0.8s linear infinite' }}
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Full-size preview modal — rendered on top of the editing modal */}
      {previewConfig && showPreview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(6px)',
          }}
          onClick={e => e.target === e.currentTarget && setShowPreview(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
              width: '100%',
              maxWidth: 900,
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Preview header */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FAFAFA',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    fontSize: 11,
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontWeight: 600,
                  }}
                >
                  Preview · {previewConfig.chartType}
                </span>
                <span style={{ fontSize: 12, color: '#9CA3AF' }}>{previewConfig.dataResource}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={() => setShowPreview(false)}
                  style={{
                    padding: '7px 14px',
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#6B7280',
                    background: '#fff',
                    border: '1.5px solid #E5E7EB',
                    borderRadius: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Back to edit
                </button>
                <button
                  onClick={() => onSave(previewConfig)}
                  style={{
                    padding: '7px 20px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#fff',
                    background: '#059669',
                    border: 'none',
                    borderRadius: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#047857')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = '#059669')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Apply changes
                </button>
              </div>
            </div>

            {/* Preview content */}
            <div style={{ padding: 32, overflowY: 'auto', flex: 1 }}>
              {renderWidget(previewConfig, previewData)}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dui-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
