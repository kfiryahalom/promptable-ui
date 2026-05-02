import type { StorageAdapter } from './storage';

// ─── Primitive types ──────────────────────────────────────────────────────────

/** Supported built-in chart renderers. Use `'custom'` when the LLM generates its own component. */
export type ChartType = 'table' | 'bar' | 'line' | 'pie' | 'stat' | 'card-grid' | 'custom';

/** Filter comparison operators for data pre-processing. */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'contains';

/** A single filter condition applied to the data before rendering. */
export interface FilterRule {
  /** Name of the field to filter on. */
  field: string;
  operator: FilterOperator;
  value: string | number;
}

/** Aggregation functions available for groupBy operations. */
export type AggregationFunc = 'min' | 'max' | 'sum' | 'count' | 'avg';

/** Defines one aggregated column produced by a groupBy operation. */
export interface AggregationRule {
  /** Source field to aggregate. */
  field: string;
  func: AggregationFunc;
  /** Column name in the output row. */
  alias: string;
}

// ─── Widget config ────────────────────────────────────────────────────────────

/**
 * Full description of how a single widget should be rendered.
 * This is what you persist in your storage backend and restore on page load.
 */
export interface WidgetConfig {
  /** Stable, unique identifier for this widget instance. */
  widgetId: string;
  /** User ID used to namespace configs in storage. */
  userId: string;
  /** Which renderer to use. Set to `'custom'` when `generatedCode` is present. */
  chartType: ChartType;
  /** Name of the data resource this widget displays (matches a key in your `allData`). */
  dataResource: string;
  /** Fields to display. Empty array means "show all". */
  fields: string[];
  /** Filter rules applied before rendering. */
  filters: FilterRule[];
  /** Field to sort by. */
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  /** Group rows by this field before aggregating. */
  groupBy?: string;
  aggregations?: AggregationRule[];
  /** Widget heading shown in the card. */
  title?: string;
  /** Colour palette hint passed to the LLM when generating code. */
  colorScheme?: string;
  /** The user's original natural-language request — stored for reference. */
  prompt?: string;
  /** ISO timestamp of the last save. */
  updatedAt: string;
  /**
   * LLM-generated Widget function source code (React.createElement, no JSX).
   * When present this overrides all built-in chart renderers.
   *
   * The code must define a function named `Widget({ data, allData })`.
   * It has access to `React` and `Recharts.*` globals only.
   */
  generatedCode?: string;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

/** Primitive field types understood by the LLM and data pipeline. */
export type FieldType = 'string' | 'number' | 'date' | 'boolean';

/** Describes one field within a data resource. */
export interface FieldDefinition {
  name: string;
  type: FieldType;
}

/**
 * Describes one data resource (a table, a query result, an MCP tool output, etc.).
 * The `description` is passed verbatim to the LLM — write it clearly so the model
 * understands join keys, units, and any domain-specific semantics.
 *
 * @example
 * {
 *   name: 'orders',
 *   description: 'Customer orders. Joinable with customers on customerId.',
 *   fields: [{ name: 'id', type: 'number' }, { name: 'amount', type: 'number' }],
 * }
 */
export interface ResourceDefinition {
  name: string;
  description: string;
  fields: FieldDefinition[];
}

/** Full schema describing every data resource available in your dashboard. */
export interface SchemaDefinition {
  resources: ResourceDefinition[];
}

// ─── onPrompt ─────────────────────────────────────────────────────────────────

/**
 * Context snapshot passed to your `onPrompt` handler alongside the user's prompt.
 * Use it to give your MCP server or LLM enough information to generate the correct widget.
 */
export interface PromptContext {
  /** Full data schema — every resource, its fields and descriptions. */
  schema: SchemaDefinition;
  /**
   * The widget's current config before the user's request.
   * Pass this as baseline context so the LLM can refine rather than start from scratch.
   */
  currentConfig: WidgetConfig;
}

/**
 * The function your app provides to handle a user's natural-language prompt.
 * Called when the user clicks "Generate" in the widget editor.
 *
 * The package **never calls any external service** — this is your trust boundary.
 * Validate and sanitise the returned config here before passing it back.
 *
 * @param prompt  What the user typed, e.g. `"show as a pie chart grouped by category"`
 * @param context Snapshot of the current widget state + full schema
 * @returns       The new `WidgetConfig` to render
 *
 * @example — call your own MCP endpoint:
 * ```ts
 * const onPrompt: OnPromptFn = async (prompt, { schema, currentConfig }) => {
 *   const res = await fetch('/api/mcp/generate', {
 *     method: 'POST',
 *     body: JSON.stringify({ prompt, schema, currentConfig }),
 *   });
 *   if (!res.ok) throw new Error('MCP call failed');
 *   return (await res.json()).config;
 * };
 * ```
 */
export type OnPromptFn = (prompt: string, context: PromptContext) => Promise<WidgetConfig>;

// ─── Context ──────────────────────────────────────────────────────────────────

/** Internal React context value — use `useDynamicUI()` to access it inside a widget. */
export interface DynamicUIContextValue {
  userId: string;
  dataSchema: SchemaDefinition;
  /** Called by widgets when the active data resource changes. */
  fetchData: (resource: string) => Promise<any[]>;
  /** Your MCP/LLM handler — receives user prompt, returns new WidgetConfig. */
  onPrompt: OnPromptFn;
  storage: StorageAdapter;
  /**
   * All resources pre-loaded — available to LLM-generated Widget code as `allData`
   * so it can join or cross-analyse multiple datasets without extra fetches.
   */
  allData?: Record<string, any[]>;
}

export type { StorageAdapter };
