# promptable-ui

AI-customizable dashboard widgets for React. Users describe what they want in natural language — your LLM or MCP server returns a `WidgetConfig` — the package renders it.

**Bring your own LLM.** The package never calls any external AI service directly.

---

## Live Examples

Three full demos are deployed so you can explore the package without any setup:

| App | Live Demo | Description |
|-----|-----------|-------------|
| `task-pulse` | [task-pulse-mu.vercel.app](https://task-pulse-mu.vercel.app) | Next.js + NextAuth + SQLite, two demo users (`user1@demo.com` / `password123`), `ServerAdapter` |
| `fit-board` | [fit-board-tau.vercel.app](https://fit-board-tau.vercel.app) | No auth, `LocalStorageAdapter`, fitness/nutrition data |
| `market-lens` | [market-lens-alpha.vercel.app](https://market-lens-alpha.vercel.app) | No auth, `LocalStorageAdapter`, dark terminal theme, market data |

Source for all three lives in [`examples/`](./examples/).

---

## ⚠️ Security & Usage Notice

**These demos were built for learning and exploration, not production use.** There are deliberate simplifications that introduce real security trade-offs. Read this before deploying your own copy or sharing the live links publicly.

### The live demos run on a shared API key

The hosted demos call Gemini via an API key that belongs to the repo author. Every "Generate" click you make costs real money from that quota. Please use the demos to understand the package, not to build on top of them or run automated tests against them.

### If you deploy your own copy, you are the API key owner

When you clone the repo and fill in `GEMINI_API_KEY` (or any other LLM key), every request to the `/api/promptable-ui/interpret` endpoint charges your account. The demo apps have **no rate limiting and no authentication on the interpret route** (fit-board and market-lens). Anyone who finds your deployment URL can trigger unlimited LLM calls at your expense. Before exposing a deployment publicly you should:

- Add rate limiting to the `/api/promptable-ui/interpret` route (e.g. `@upstash/ratelimit`)
- Put the app behind authentication, or restrict the interpret endpoint to authenticated users only
- Set a spending cap on your LLM provider account

### LLM-generated code runs in the browser (`chartType: 'custom'`)

When a widget uses `chartType: 'custom'`, the LLM response includes a JavaScript function that is evaluated at runtime via `new Function(...)`. The sandbox only exposes `React` and `Recharts` — it does not have access to `fetch`, `localStorage`, or any other browser API. However, `new Function` is not a true security boundary: a crafted prompt could potentially produce code that escapes the sandbox through prototype pollution or other JavaScript tricks.

**This means:** in any deployment that real users can access, you should only allow trusted users to trigger AI customization, or disable `chartType: 'custom'` entirely if untrusted input is a concern.

### Demo credentials and ephemeral data

The task-pulse demo uses hardcoded credentials (`user1@demo.com` / `password123`) that are visible in this README and in the source code. The SQLite database on the Vercel deployment resets on every cold start. **Do not store anything real in the task-pulse demo.** These credentials exist solely so you can try the login flow without creating an account.

### Summary

| Risk | Affected demos | Mitigation before going to production |
|------|---------------|---------------------------------------|
| Unlimited LLM spend if URL is public | fit-board, market-lens | Add auth + rate limiting to interpret route |
| LLM-generated code execution | All three | Restrict AI-customize to trusted users, or disable `custom` chart type |
| Hardcoded demo credentials | task-pulse | Replace with a real auth system and a real database |
| Ephemeral storage | task-pulse | Replace SQLite with a persistent database |

---

## Install

```bash
npm install promptable-ui recharts
# peer deps: react, react-dom, recharts
```

---

## Quick start

```tsx
import {
  DynamicUIProvider,
  DynamicWidget,
  LocalStorageAdapter,
} from 'promptable-ui';

const schema = {
  resources: [
    {
      name: 'orders',
      description: 'Customer orders. Joinable with customers on customerId.',
      fields: [
        { name: 'id',       type: 'number' },
        { name: 'amount',   type: 'number' },
        { name: 'category', type: 'string' },
        { name: 'date',     type: 'date'   },
      ],
    },
  ],
};

// Called when the user clicks "Generate" in the customize modal.
// Post to your own LLM or MCP endpoint — never called by the package itself.
const onPrompt = async (prompt, { schema, currentConfig }) => {
  const res = await fetch('/api/ai/interpret', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, schema, currentConfig }),
  });
  if (!res.ok) throw new Error('AI call failed');
  return (await res.json()).config; // must return a WidgetConfig
};

const fetchData = async (resource) => {
  const res = await fetch(`/api/data?resource=${resource}`);
  return res.json();
};

export default function Dashboard() {
  return (
    <DynamicUIProvider
      userId="user-1"
      dataSchema={schema}
      fetchData={fetchData}
      onPrompt={onPrompt}
      storage={new LocalStorageAdapter('my-app')}
    >
      <DynamicWidget
        widgetId="revenue-chart"
        defaultConfig={{
          widgetId: 'revenue-chart',
          userId: 'user-1',
          chartType: 'bar',
          dataResource: 'orders',
          fields: ['category', 'amount'],
          filters: [],
          updatedAt: new Date().toISOString(),
        }}
      />
    </DynamicUIProvider>
  );
}
```

---

## How it works

```
User types prompt in the customize modal
  → onPrompt(prompt, { schema, currentConfig })   ← your integration point
  → POST /api/ai/interpret (your endpoint)
  → LLM returns WidgetConfig
  → Package shows a full-size preview
  → User clicks "Apply changes"
  → Config saved to storage, widget re-renders
```

---

## Components

### `<DynamicUIProvider>`

Wrap your dashboard. Provides context to all widgets inside.

| Prop | Type | Description |
|------|------|-------------|
| `userId` | `string` | Namespaces widget configs in storage |
| `dataSchema` | `SchemaDefinition` | Describes every available data resource — passed to your LLM |
| `fetchData` | `(resource: string) => Promise<any[]>` | Called when a widget needs (or changes) its data |
| `onPrompt` | `OnPromptFn` | Your LLM/MCP handler — receives the user's prompt, returns a new `WidgetConfig` |
| `storage` | `StorageAdapter` | Where widget configs and layout are persisted |
| `allData?` | `Record<string, any[]>` | Pre-loaded datasets — passed to LLM-generated widgets as `allData` for cross-resource joins |

### `<DynamicWidget>`

A single widget card. Shows data, a title, and hover buttons (AI-customize, duplicate, remove).

| Prop | Type | Description |
|------|------|-------------|
| `widgetId` | `string` | Stable unique ID — used as the storage key |
| `defaultConfig` | `WidgetConfig` | Initial config before the user customizes anything |
| `variant?` | `'light' \| 'dark'` | Card color scheme (default: `'light'`) |
| `onRemove?` | `() => void` | Called when the user clicks the remove button |
| `onDuplicate?` | `(config: WidgetConfig) => void` | Called when the user duplicates the widget |

---

## Built-in renderers

| `chartType` | Renderer | Description |
|-------------|----------|-------------|
| `'bar'` | `BarRenderer` | Bar chart via Recharts |
| `'line'` | `LineRenderer` | Line chart via Recharts |
| `'pie'` | `PieRenderer` | Pie chart via Recharts |
| `'stat'` | `StatRenderer` | Single KPI card |
| `'table'` | `TableRenderer` | Sortable data table |
| `'card-grid'` | `CardGridRenderer` | Grid of summary cards |
| `'custom'` | `DynamicRenderer` | LLM-generated React component (sandboxed) |

### `renderWidget(config, data, allData?)`

Call this directly if you want to embed a renderer outside a `DynamicWidget` card.

```tsx
import { renderWidget } from 'promptable-ui';

function MyCard({ config, data }) {
  return <div>{renderWidget(config, data)}</div>;
}
```

---

## Storage adapters

### `LocalStorageAdapter(namespace)`

Persists in the browser — no backend needed.

```ts
new LocalStorageAdapter('my-app')
```

### `ServerAdapter(configsUrl, layoutUrl)`

Calls your GET/POST endpoints.

```ts
new ServerAdapter('/api/widget-configs', '/api/dashboard/layout')
```

Expected API contract:
- `GET  {configsUrl}?widgetId=X&userId=Y` → `WidgetConfig | null`
- `POST {configsUrl}` (body: `WidgetConfig`) → saves config
- `GET  {layoutUrl}?userId=Y` → `string[]` (ordered widget IDs)
- `POST {layoutUrl}` (body: `{ userId, layout: string[] }`) → saves layout

### `NullStorageAdapter`

Memory only — no persistence. Useful for read-only demos.

```ts
new NullStorageAdapter()
```

### Custom adapter

Implement the `StorageAdapter` interface:

```ts
import type { StorageAdapter, WidgetConfig } from 'promptable-ui';

class MyAdapter implements StorageAdapter {
  async getConfig(widgetId: string, userId: string): Promise<WidgetConfig | null> { ... }
  async saveConfig(config: WidgetConfig): Promise<void> { ... }
  async getLayout?(userId: string): Promise<string[] | null> { ... }
  async saveLayout?(userId: string, layout: string[]): Promise<void> { ... }
}
```

---

## Data pipeline

Before a renderer receives data, `renderWidget` runs three transforms in order:

1. **Filter** — `config.filters` (eq / neq / gt / lt / contains per field)
2. **Group & aggregate** — `config.groupBy` + `config.aggregations` (sum / avg / min / max / count)
3. **Sort** — `config.sortBy` + `config.sortDir`

---

## WidgetConfig reference

```ts
interface WidgetConfig {
  widgetId: string;
  userId: string;
  chartType: 'table' | 'bar' | 'line' | 'pie' | 'stat' | 'card-grid' | 'custom';
  dataResource: string;    // must match a resource name in your schema
  fields: string[];        // empty = show all
  filters: FilterRule[];
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  groupBy?: string;
  aggregations?: AggregationRule[];
  title?: string;
  colorScheme?: string;
  prompt?: string;         // original user request, stored for reference
  updatedAt: string;       // ISO timestamp
  generatedCode?: string;  // LLM-generated Widget function source (chartType: 'custom')
}
```

---

## Styling

The package uses **React inline styles only** — no Tailwind, no CSS imports. It works in any app regardless of your styling setup.

Demo apps in `examples/` use Tailwind for their own layouts, but that is separate from the package.

---

## LLM-generated widgets (`chartType: 'custom'`)

When your LLM returns `chartType: 'custom'`, it must also return `generatedCode` — a JavaScript function source string (no JSX, use `React.createElement`).

The code must define a function named `Widget({ data, allData })`. It has access only to `React` and the full `Recharts` namespace. It is sandboxed via `new Function(...)` and wrapped in an error boundary.

```js
// example generatedCode string your LLM might return
function Widget({ data }) {
  return React.createElement(
    Recharts.ResponsiveContainer, { width: '100%', height: 300 },
    React.createElement(Recharts.AreaChart, { data },
      React.createElement(Recharts.Area, { dataKey: 'value', fill: '#6366f1' })
    )
  );
}
```

---

## License

MIT
