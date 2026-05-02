'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { DynamicUIContextValue, SchemaDefinition, OnPromptFn } from '../types';
import type { StorageAdapter } from '../storage';
import { NullStorageAdapter } from '../storage';

export const DynamicUIContext = createContext<DynamicUIContextValue | null>(null);

/** Access the shared dashboard context from inside any widget. */
export function useDynamicUI(): DynamicUIContextValue {
  const ctx = useContext(DynamicUIContext);
  if (!ctx) throw new Error('useDynamicUI must be used inside DynamicUIProvider');
  return ctx;
}

interface DynamicUIProviderProps {
  /**
   * Identifier for the current user.
   * Used to namespace widget configs and layouts in storage.
   */
  userId: string;

  /**
   * Describes every data resource available in your app.
   * Passed to `onPrompt` so your MCP/LLM knows what fields exist and how resources relate.
   * Write clear `description` strings — the LLM uses them to understand join keys and semantics.
   */
  dataSchema: SchemaDefinition;

  /**
   * Called by a widget when it needs to (re)load data for a resource.
   * Triggered when a widget switches its active resource after an LLM-generated config is applied.
   *
   * @example
   * ```ts
   * fetchData={resource => fetch(`/api/data?resource=${resource}`).then(r => r.json())}
   * ```
   */
  fetchData: (resource: string) => Promise<any[]>;

  /**
   * Your MCP or LLM handler. Called when the user submits a natural-language prompt in a widget.
   *
   * The package **never calls any external API** — this is your integration point and trust boundary.
   * Validate and sanitise the returned config before passing it back.
   *
   * @example — wrapping a REST endpoint that calls your MCP server:
   * ```ts
   * onPrompt={async (prompt, { schema, currentConfig }) => {
   *   const res = await fetch('/api/mcp/generate', {
   *     method: 'POST',
   *     body: JSON.stringify({ prompt, schema, currentConfig }),
   *   });
   *   if (!res.ok) throw new Error('MCP call failed');
   *   return (await res.json()).config;
   * }}
   * ```
   */
  onPrompt: OnPromptFn;

  /**
   * Storage adapter for persisting widget configs and dashboard layout.
   *
   * If omitted, `NullStorageAdapter` is used — configs are kept in memory only
   * and are lost on page reload.
   *
   * Built-in options:
   * - `new LocalStorageAdapter('my-app')` — browser localStorage, no backend required
   * - `new ServerAdapter('/api/configs', '/api/layout')` — syncs via your HTTP endpoints
   * - Implement `StorageAdapter` to connect any database, KV store, or API
   */
  storage?: StorageAdapter;

  /**
   * Pre-fetched data for **all** resources.
   * When provided, LLM-generated Widget functions receive this as `allData`
   * so they can join or cross-analyse multiple datasets without extra fetches.
   *
   * @example
   * ```ts
   * allData={{ orders: ordersRows, customers: customersRows, products: productsRows }}
   * ```
   */
  allData?: Record<string, any[]>;

  children: React.ReactNode;
}

export function DynamicUIProvider({
  userId,
  dataSchema,
  fetchData,
  onPrompt,
  storage,
  allData,
  children,
}: DynamicUIProviderProps) {
  const resolvedStorage = useMemo<StorageAdapter>(() => {
    if (storage) return storage;
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[promptable-ui] No storage adapter provided — widget configs will not persist across page loads. ' +
        'Pass storage={new LocalStorageAdapter("my-app")} to enable persistence.'
      );
    }
    return new NullStorageAdapter();
  }, [storage]);

  return (
    <DynamicUIContext.Provider
      value={{ userId, dataSchema, fetchData, onPrompt, storage: resolvedStorage, allData }}
    >
      {children}
    </DynamicUIContext.Provider>
  );
}
