# promptable-ui

AI-customizable dashboard widgets for React. Users describe what they want in natural language — your LLM or MCP server returns a `WidgetConfig` — the package renders it.

**Bring your own LLM.** The package has no dependency on any AI provider. It works with OpenAI, Anthropic, Google Gemini, Mistral, a local Ollama instance, or anything else — you wire up the `onPrompt` callback to whatever model or endpoint you already use, and the package just handles the rendering.

---

## Live Examples

Three full demos are deployed so you can explore the package without any setup:

| App | Live Demo | Description |
|-----|-----------|-------------|
| `task-pulse` | [task-pulse-mu.vercel.app](https://task-pulse-mu.vercel.app) | Next.js + NextAuth + SQLite, two demo users (`user1@demo.com` / `password123`), `ServerAdapter` |
| `fit-board` | [fit-board-tau.vercel.app](https://fit-board-tau.vercel.app) | No auth, `LocalStorageAdapter`, fitness/nutrition data |
| `market-lens` | [market-lens-alpha.vercel.app](https://market-lens-alpha.vercel.app) | No auth, `LocalStorageAdapter`, dark terminal theme, market data |

Source for all three lives in [`examples/`](./examples/).

> **⚠️ Demo notice:** These examples were built for learning purposes only. They have known security limitations — no rate limiting, weak sandboxing, and shared API keys. Do not use them as a base for production. See [Security & Disclaimers](#security--disclaimers) at the bottom for the full picture.

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

## Security & Disclaimers

The demo apps were built for learning purposes. They demonstrate the package's capabilities but deliberately skip production-grade hardening to keep the code simple and readable. Do not treat them as a base for production.

### The live demos run on a shared API key

The hosted demos happen to use Google Gemini, but that is just the choice made for these examples — the package itself works with any LLM. Every "Generate" click calls Gemini via an API key paid for by the repo author. The key has a hard spending cap of around $1 — intentionally very low. Once that quota is gone, the AI features stop working for everyone until it resets, and the only way to try the demos will be to clone the repo and supply your own key.

Please use the demos to explore the package, not to run automated tests or hammer the generate button repeatedly. The goal is to keep these demos live and accessible for as many people as possible. That only works if everyone uses them with care.

### Self-hosting means you own the API costs

When you clone the repo and wire up your own LLM key (Gemini, OpenAI, Anthropic, or any other), every call to `/api/promptable-ui/interpret` charges your account. The fit-board and market-lens demos have **no authentication and no rate limiting** on that route. If you expose a deployment publicly, anyone who finds the URL can trigger unlimited LLM calls at your expense.

Before making a self-hosted copy public you should:
- Add rate limiting to the interpret route (e.g. [`@upstash/ratelimit`](https://github.com/upstash/ratelimit))
- Require authentication before the route is reachable, or restrict it to signed-in users only
- Set a hard spending cap on your LLM provider account as a last-resort backstop

### `new Function(...)` is not a real sandbox

When `chartType: 'custom'` is used, the LLM returns a JavaScript function that runs in the browser via `new Function(...)`. The generated code is given access only to `React` and `Recharts`, and it runs inside an error boundary. However, `new Function` does not isolate memory or prevent prototype pollution — a carefully crafted prompt could potentially escape the intended scope.

In any deployment where untrusted users can type prompts, you should either restrict AI customization to trusted users, or avoid `chartType: 'custom'` entirely. A proper fix would run generated code inside a sandboxed `<iframe>` with a strict Content Security Policy.

### Demo credentials and ephemeral storage

The task-pulse demo uses hardcoded credentials (`user1@demo.com` / `password123`) that are visible in this README and in the source. The SQLite database resets on every Vercel cold start. Do not store anything real in it. The credentials exist only to let you try the login flow.

---

## Security roadmap

We are aware of the limitations above. No timeline or commitment is attached to any of them, but these are the areas where the work would make the biggest difference:

| Area | What a proper fix looks like |
|------|------------------------------|
| Rate limiting | Per-user or per-IP budget on the interpret route (Upstash Redis or similar) |
| Auth on no-auth demos | Even a lightweight API-key check on the interpret route would prevent open abuse |
| `custom` widget sandbox | Sandboxed `<iframe>` with `sandbox` attribute + CSP blocking network access |
| LLM output validation | Zod schema on the `WidgetConfig` returned by the LLM before it is applied |
| Persistent storage | Hosted database (Postgres, Turso) instead of ephemeral SQLite in task-pulse |

---

## Contributing

If any of the above interests you, contributions and collaboration are very welcome. We have not solved these problems yet, and we are open to working with anyone who wants to help move things forward. Open an issue or a pull request.

---

## License

MIT
