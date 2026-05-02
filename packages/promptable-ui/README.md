# promptable-ui

**AI-customizable dashboard widgets for React. Bring your own LLM.**

Users type natural language into any widget — _"show as a pie chart grouped by category"_ — and
your MCP server or LLM returns a `WidgetConfig` that the package renders instantly.
The package never calls any external service. You own the AI boundary entirely.

---

## How it works

```
User types prompt in widget
  → onPrompt(prompt, { schema, currentConfig })    ← your integration point
  → POST /api/your-mcp-endpoint                    ← you implement this
  → LLM returns WidgetConfig JSON
  → Preview modal shown, user confirms
  → Widget re-renders with new config + persists to your storage
```

1. You pass your data and a `dataSchema` to `DynamicUIProvider`.
2. The user types a prompt in any widget.
3. The package calls **your** `onPrompt` handler with the prompt + current context.
4. Your handler calls your MCP server or LLM and returns a `WidgetConfig`.
5. A full-size preview is shown; on confirm the widget re-renders automatically.

---

## Installation

```bash
npm install promptable-ui recharts
# or
pnpm add promptable-ui recharts
```

**Peer dependencies:** `react ≥ 18`, `react-dom ≥ 18`, `recharts ≥ 2`

---

## Quick start

```tsx
import { DynamicUIProvider, DynamicWidget, LocalStorageAdapter } from 'promptable-ui';
import type { OnPromptFn } from 'promptable-ui';

// 1. Wire up your MCP or LLM endpoint
const onPrompt: OnPromptFn = async (prompt, { schema, currentConfig }) => {
  const res = await fetch('/api/mcp/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, schema, currentConfig }),
  });
  if (!res.ok) throw new Error('MCP call failed');
  return (await res.json()).config;   // must be a WidgetConfig
};

// 2. Describe your data
const dataSchema = {
  resources: [
    {
      name: 'orders',
      description: 'Customer orders. Joinable with customers on customerId.',
      fields: [
        { name: 'id',         type: 'number' },
        { name: 'customerId', type: 'string' },
        { name: 'amount',     type: 'number' },
        { name: 'status',     type: 'string' },
        { name: 'date',       type: 'date'   },
      ],
    },
  ],
};

// 3. Render
export function Dashboard({ ordersData }) {
  return (
    <DynamicUIProvider
      userId="user-123"
      dataSchema={dataSchema}
      fetchData={resource => fetch(`/api/data?resource=${resource}`).then(r => r.json())}
      onPrompt={onPrompt}
      storage={new LocalStorageAdapter('my-app')}
    >
      <DynamicWidget
        widgetId="orders-overview"
        defaultData={ordersData}
        defaultResource="orders"
        defaultView="table"
        title="Orders"
        onClone={() => { /* add duplicate */ }}
        onRemove={() => { /* remove widget */ }}
      />
    </DynamicUIProvider>
  );
}
```

---

## Core concepts

### `onPrompt` — your LLM / MCP handler

The single integration point between the package and your AI backend.

```ts
type OnPromptFn = (
  prompt: string,
  context: PromptContext
) => Promise<WidgetConfig>;

interface PromptContext {
  schema: SchemaDefinition;    // all resources + fields the LLM can reference
  currentConfig: WidgetConfig; // current widget state — baseline for refinement
}
```

Your handler receives the user's prompt and the widget's current state.
Call your MCP server, LLM, or any AI API, then return the new `WidgetConfig`.

The package **never calls any external service** — this is intentional.
You control authentication, rate limiting, and output validation.

### `dataSchema` — teach the LLM about your data

```ts
const dataSchema: SchemaDefinition = {
  resources: [
    {
      name: 'orders',
      // Write descriptions clearly — the LLM uses them to understand join keys
      description: 'Customer orders. Joinable with customers on customerId field.',
      fields: [
        { name: 'customerId', type: 'string' },
        { name: 'amount',     type: 'number' },
        { name: 'status',     type: 'string' },
        { name: 'date',       type: 'date'   },
      ],
    },
    {
      name: 'customers',
      description: 'Customer profiles. Joinable with orders on customerId field.',
      fields: [
        { name: 'customerId', type: 'string' },
        { name: 'name',       type: 'string' },
        { name: 'region',     type: 'string' },
      ],
    },
  ],
};
```

### `allData` — cross-resource joins in generated widgets

Pass all pre-fetched datasets to `DynamicUIProvider`. LLM-generated widget functions
receive it as `allData` so they can join across datasets without extra fetches.

```tsx
<DynamicUIProvider
  allData={{ orders: ordersRows, customers: customerRows }}
  ...
>
```

Inside the generated `Widget` function:

```js
function Widget({ data, allData }) {
  const enriched = data.map(order => ({
    ...order,
    customer: allData.customers.find(c => c.customerId === order.customerId),
  }));
  // render with React.createElement + Recharts.*
}
```

### `StorageAdapter` — bring your own persistence

The package calls `getConfig` / `saveConfig` on page load and after each save.
Implement this interface to connect any persistence layer.

```ts
interface StorageAdapter {
  getConfig(widgetId: string, userId: string): Promise<WidgetConfig | null>;
  saveConfig(config: WidgetConfig): Promise<void>;
  getLayout?(userId: string): Promise<any[] | null>;   // optional: persist widget order
  saveLayout?(userId: string, layout: any[]): Promise<void>;
}
```

**Built-in adapters:**

| Adapter | When to use |
|:--------|:------------|
| `new LocalStorageAdapter('my-app')` | Browser `localStorage` — zero backend, single device |
| `new ServerAdapter('/api/configs', '/api/layout')` | HTTP endpoints — syncs across devices |
| `new NullStorageAdapter()` | No persistence — testing or ephemeral dashboards |

If you omit `storage`, `NullStorageAdapter` is used and a dev-mode warning is logged.

---

## `DynamicUIProvider` props

| Prop | Type | Required | Description |
|:-----|:-----|:--------:|:------------|
| `userId` | `string` | ✓ | Namespaces configs and layout in storage |
| `dataSchema` | `SchemaDefinition` | ✓ | Describes your data resources to the LLM |
| `fetchData` | `(resource: string) => Promise<any[]>` | ✓ | Called when a widget switches its data resource |
| `onPrompt` | `OnPromptFn` | ✓ | Your MCP / LLM handler |
| `storage` | `StorageAdapter` | | Omit to use `NullStorageAdapter` |
| `allData` | `Record<string, any[]>` | | Pre-loaded resources for cross-resource joins |
| `children` | `React.ReactNode` | ✓ | Your `DynamicWidget` instances |

---

## `DynamicWidget` props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `widgetId` | `string` | — | Stable unique ID used as the storage key |
| `defaultData` | `any[]` | — | Initial data before any saved config is applied |
| `defaultResource` | `string` | `'tasks'` | Initial resource name |
| `defaultView` | `ChartType` | `'table'` | Initial chart type |
| `title` | `string` | | Widget heading |
| `onClone` | `() => void` | | Renders a clone button when provided |
| `onRemove` | `() => void` | | Renders a remove button when provided |
| `variant` | `'light' \| 'dark'` | `'light'` | Card style — white or dark terminal |

---

## `WidgetConfig` reference

This is what your `onPrompt` handler must return and what is persisted in storage.

```ts
interface WidgetConfig {
  widgetId: string;
  userId: string;
  chartType: ChartType;         // 'table'|'bar'|'line'|'pie'|'stat'|'card-grid'|'custom'
  dataResource: string;         // which resource to display
  fields: string[];             // columns to show (empty = show all)
  filters: FilterRule[];
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  groupBy?: string;
  aggregations?: AggregationRule[];
  title?: string;
  colorScheme?: string;
  prompt?: string;              // user's original request, stored for reference
  updatedAt: string;            // ISO timestamp
  generatedCode?: string;       // LLM-generated Widget function (see Security below)
}
```

---

## Data pipeline

Before any built-in renderer receives data, three transforms run in order:

1. **`applyFilters(data, filters)`** — per-field `eq / neq / gt / lt / contains` conditions
2. **`groupAndAggregate(data, groupBy, aggregations)`** — optional groupBy with `sum / avg / min / max / count`
3. **`applySort(data, sortBy, sortDir)`** — optional field sort

When `generatedCode` is present, raw data is passed directly to the generated `Widget`
function and these transforms are skipped — the generated code handles them itself.

---

## LLM system prompt guide

When writing the system prompt for your endpoint, instruct the model to:

1. Return a JSON object matching the `WidgetConfig` shape.
2. For chart/visual widgets, set `chartType: "custom"` and put the component in `generatedCode`.
3. The generated function **must be named `Widget({ data, allData })`** and use only `React.createElement` — no JSX, no imports, no bundler available at runtime.
4. Only `React` and `Recharts.*` are available as globals.
5. Use `allData.<resourceName>` for cross-resource joins.

Example system prompt fragment:

```
Return JSON matching WidgetConfig.

For visual widgets set chartType to "custom" and place the Widget source in generatedCode.

Rules for generatedCode:
- Function MUST be named Widget({ data, allData })
- Use React.createElement only — no JSX
- Available globals: React, Recharts.BarChart, Recharts.PieChart, Recharts.LineChart,
  Recharts.ResponsiveContainer, Recharts.XAxis, Recharts.YAxis, Recharts.Tooltip,
  Recharts.Legend, Recharts.Bar, Recharts.Line, Recharts.Pie, Recharts.Cell
- Use allData.<name> for cross-resource data (it is always available)
- Use inline styles only — no Tailwind, no CSS modules
```

---

## ServerAdapter endpoint contracts

If you use `ServerAdapter`, implement these two HTTP endpoints on your backend.

**Config endpoint** (e.g. `/api/promptable-ui/configs`):

```
GET  ?widgetId=<id>&userId=<id>   → { config: WidgetConfig | null }
POST body: { config: WidgetConfig }  → 200 OK
```

**Layout endpoint** (e.g. `/api/dashboard/layout`, optional):

```
GET  ?userId=<id>                         → { layout: string[] | null }
POST body: { userId: string, widgets: string[] }  → 200 OK
```

---

## Security

### The trust model

The package itself has **no network access** — it never calls any LLM, MCP server, or external API.
Your `onPrompt` handler is the only entry point for AI output. You control what goes in and what comes back.

### `generatedCode` and `DynamicRenderer`

When a `WidgetConfig` includes `generatedCode`, the package executes it in the browser via
`new Function('React', 'Recharts', code)`. This is a deliberate design choice for maximum
expressiveness: generated code can do arbitrary data transforms, cross-resource joins, and
custom layouts that a fixed JSON schema cannot express.

**What this means in practice:**

| Claim | Reality |
|:------|:--------|
| Only `React` and `Recharts` are passed as explicit arguments | True |
| The generated code has access to `window`, `fetch`, `document` | **Also true** — `new Function` runs in the browser's global scope |
| The generated code can make outbound network requests | Yes — unless your CSP blocks it |
| The generated code can read cookies or `localStorage` | Yes, if the user's browser allows it |

### Recommended mitigations

**For internal tooling and trusted environments** (your own MCP, your own users):
- Validate the shape of the returned `WidgetConfig` in your `onPrompt` handler before returning it.
- The risk is low when you control both the LLM endpoint and the user population.

**For public-facing or multi-tenant apps:**
- Validate and sanitise `generatedCode` in your `onPrompt` handler before passing it back.
- Consider refusing to forward any `generatedCode` and only accepting structured `WidgetConfig` fields
  (`chartType`, `filters`, `groupBy`, etc.) — the built-in renderers cover the common cases.
- Add a strict `Content-Security-Policy` header that blocks `script-src unsafe-eval` and `connect-src`
  to prevent generated code from exfiltrating data via network calls.

### Your `onPrompt` handler is the security boundary

```ts
const onPrompt: OnPromptFn = async (prompt, context) => {
  const raw = await callYourLLM(prompt, context);

  // Validate shape — never trust raw LLM output directly
  const config = WidgetConfigSchema.parse(raw);   // e.g. zod

  // Optionally strip generatedCode if you don't want code execution
  // delete config.generatedCode;

  return config;
};
```

### Disclosure

This package uses `new Function` to execute LLM-generated code when `generatedCode` is present.
This is disclosed here and in the source. The security posture of your deployment depends on
how you validate LLM output in your `onPrompt` handler, not on the package itself.

---

## Demo apps

Three reference implementations are included in the repository to show integration patterns:

| App | Auth | Storage | Theme |
|:----|:-----|:--------|:------|
| **task-pulse** | NextAuth (two demo accounts) | SQLite + `ServerAdapter` | Default light |
| **fit-board** | None | `LocalStorageAdapter` | Purple/pink gradient |
| **market-lens** | None | `LocalStorageAdapter` | Dark terminal |

```bash
# task-pulse — full-featured with auth and server storage
cd demo-apps/task-pulse && pnpm dev

# fit-board — no-auth fitness tracker
cd demo-apps/fit-board && pnpm dev

# market-lens — dark terminal market data view
cd demo-apps/market-lens && pnpm dev
```

Each demo needs a `GEMINI_API_KEY` in `.env.local`. Copy `.env.local.example` for the full list.

---

## Extending the package

**Add a new built-in renderer:**
1. Add the new type to `ChartType` in `types.ts`
2. Create `renderers/MyRenderer.tsx`
3. Add the case to the `switch` in `renderers/index.tsx`

**Add a new storage backend:**
Implement the `StorageAdapter` interface — four methods, two optional.

**Use without `DynamicWidget`:**
Call `renderWidget(config, data, allData)` directly if you manage your own widget shell.

---

## API reference

### Exports

```ts
// Components
DynamicUIProvider    // context + data provider
DynamicWidget        // widget card with hover actions and AI customize button
CustomizeModal       // AI prompt editing modal (usable standalone)
DynamicRenderer      // executes generatedCode — use directly if building a custom shell

// Hook
useDynamicUI()       // access context (userId, schema, onPrompt, storage) inside a widget

// Renderers
renderWidget(config, data, allData?)   // dispatcher — picks the right renderer
TableRenderer, BarRenderer, LineRenderer, PieRenderer, StatRenderer, CardGridRenderer

// Storage
LocalStorageAdapter, ServerAdapter, NullStorageAdapter

// Types
WidgetConfig, ChartType, FilterRule, AggregationRule,
SchemaDefinition, ResourceDefinition, FieldDefinition,
OnPromptFn, PromptContext, StorageAdapter
```

---

## License

MIT — see [LICENSE](./LICENSE).

The security of generated code execution is the responsibility of the consuming application.
See the [Security](#security) section above.
