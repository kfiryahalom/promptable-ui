# dynamicView — Project Overview for Claude Code

## What this project is

A React/TypeScript monorepo containing **`promptable-ui`** — a package that adds AI-customizable widget dashboards to any Next.js app. Users type natural language into a modal ("show as a pie chart by category") and the app's LLM/MCP endpoint returns a `WidgetConfig` that the package renders. The package itself **never calls any external service** — that is always the consuming app's responsibility.

Three demo apps show different use cases: a task dashboard (with auth), a fitness tracker, and a market data terminal.

---

## Monorepo layout

```
packages/
  promptable-ui/          ← the publishable package
    src/
      components/
        DynamicUIProvider.tsx   context + provider
        DynamicWidget.tsx       widget card + hover action buttons
        CustomizeModal.tsx      AI prompt editing modal (two-layer: edit + full preview)
        DynamicRenderer.tsx     executes LLM-generated React code in a sandbox
      renderers/
        index.tsx               renderWidget() dispatcher
        BarRenderer.tsx
        LineRenderer.tsx
        PieRenderer.tsx
        StatRenderer.tsx
        TableRenderer.tsx
        CardGridRenderer.tsx
      types.ts                  all public types (WidgetConfig, SchemaDefinition, OnPromptFn…)
      storage.ts                LocalStorageAdapter | ServerAdapter | NullStorageAdapter
      utils.ts                  applyFilters, groupAndAggregate, applySort, getFields
      index.ts                  public exports

demo-apps/
  task-pulse/          ← full-featured: Next.js + NextAuth + SQLite, two demo user accounts
  fit-board/           ← no auth, LocalStorageAdapter, purple/pink gradient theme
  market-lens/         ← no auth, LocalStorageAdapter, dark terminal theme
```

---

## Key data flow

```
User types prompt in CustomizeModal
  → onPrompt(prompt, { schema, currentConfig })   ← YOUR integration point
  → POST /api/promptable-ui/interpret (in the demo apps)
  → LLM returns WidgetConfig
  → CustomizeModal shows full-size preview modal (separate z-60 overlay)
  → User clicks "Apply changes"
  → DynamicWidget.handleSave() → storage.saveConfig(newConfig)
  → DynamicWidget re-renders with new config + fresh data fetch if resource changed
```

---

## Critical design decisions

### 1. The package has no LLM dependency
`onPrompt` is a `(prompt, context) => Promise<WidgetConfig>` callback owned entirely by the consuming app. The package only calls it — it never imports OpenAI, Anthropic, or any model SDK. This is intentional so the package stays dependency-light and the app controls security/validation.

### 2. Styling: all inline styles in the package, no Tailwind coupling
`DynamicWidget` and `CustomizeModal` use only React inline `style` props and a single injected `<style>` tag for the spin animation (`@keyframes dui-spin`, `@keyframes dui-widget-spin`). This means the package works regardless of whether the consuming app uses Tailwind, CSS Modules, or nothing. Demo apps use Tailwind, but that is their own concern.

### 3. CustomizeModal is two layers
- **Layer 1 (z-50):** The editing modal — compact, shows prompt textarea, quick suggestion chips, Generate button. Lives here permanently until Cancel or Apply.
- **Layer 2 (z-60):** Full-size preview modal — appears on top after Generate completes. Shows widget at full `maxWidth: 900` with "Back to edit" and "Apply changes". The preview state is `showPreview: boolean` + `previewConfig: WidgetConfig | null`.

### 4. DynamicWidget hover buttons
Buttons (duplicate, AI-customize, remove) are hidden (`opacity: 0`) and revealed on `onMouseEnter` via `hovered` state. They render inside a frosted-glass pill with `backdropFilter: blur`. Dark-variant styling uses `#1E2D45` hover background; light-variant uses `#EEF2FF` (indigo tint) for the AI button and `#F3F4F6` for duplicate.

### 5. LLM-generated code execution (DynamicRenderer)
When `chartType === 'custom'`, `generatedCode` is evaluated via `new Function('React', 'Recharts', ...)`. The generated code must define a function named `Widget({ data, allData })`. It only has access to `React` and the full `Recharts` namespace — nothing else. Wrapped in an ErrorBoundary.

### 6. Storage adapters
Three built-in adapters all implement `StorageAdapter`:
- `LocalStorageAdapter(namespace)` — browser only, no backend
- `ServerAdapter(configsUrl, layoutUrl)` — calls your GET/POST endpoints
- `NullStorageAdapter` — memory only, no persistence (default if none provided)

`getConfig(widgetId, userId)` / `saveConfig(config)` are per-widget. `getLayout(userId)` / `saveLayout(userId, layout)` are per-dashboard.

### 7. Data pipeline before rendering
`renderWidget(config, data)` runs the data through three sequential transforms before passing to a renderer:
1. `applyFilters(data, config.filters)` — eq/neq/gt/lt/contains per field
2. `groupAndAggregate(data, config.groupBy, config.aggregations)` — optional groupBy with sum/avg/min/max/count
3. `applySort(data, config.sortBy, config.sortDir)` — optional sort

### 8. `allData` for cross-resource joins
`DynamicUIProvider` accepts `allData?: Record<string, any[]>`. This is passed through context to `renderWidget` as its third argument, and also made available as `allData` inside LLM-generated Widget functions. Use this when the LLM should be able to join e.g. workouts with nutrition on date.

---

## Demo apps

### task-pulse (`demo-apps/task-pulse/`)
- NextAuth credentials auth, two accounts: `user1@demo.com` / `user2@demo.com`, password `password123`
- SQLite (`better-sqlite3`) for layout persistence per user
- `ServerAdapter('/api/promptable-ui/configs', '/api/dashboard/layout')` for config/layout
- `@google/genai` + MCP SDK for the interpret endpoint
- Run: `cd demo-apps/task-pulse && pnpm dev`

### fit-board (`demo-apps/fit-board/`)
- No auth, `LocalStorageAdapter('fit-board')`, `userId = 'local'`
- Purple/pink gradient header, light widget variant
- Data: workouts, goals, nutrition, biometrics (joinable on `date`)
- Run: `cd demo-apps/fit-board && pnpm dev`

### market-lens (`demo-apps/market-lens/`)
- No auth, `LocalStorageAdapter('market-lens')`, `userId = 'local'`
- Dark terminal theme (`#0B1120` bg, monospace font), `variant="dark"` widgets
- Data: stocks, indices, earnings, analysts (stocks/earnings/analysts joinable on `symbol`)
- Run: `cd demo-apps/market-lens && pnpm dev`

---

## Public exports from `promptable-ui`

```ts
// Components
DynamicUIProvider, DynamicWidget, CustomizeModal, DynamicRenderer

// Hooks
useDynamicUI

// Renderers
renderWidget, TableRenderer, BarRenderer, LineRenderer, PieRenderer, StatRenderer, CardGridRenderer

// Storage
LocalStorageAdapter, ServerAdapter, NullStorageAdapter

// Types
WidgetConfig, ChartType, FilterRule, AggregationRule, SchemaDefinition,
ResourceDefinition, FieldDefinition, OnPromptFn, PromptContext, StorageAdapter
```

---

## Common tasks

**Add a new renderer type:**
1. Add the new type to `ChartType` in `types.ts`
2. Create `renderers/MyRenderer.tsx`
3. Add the case to the `switch` in `renderers/index.tsx`

**Add a new storage backend:**
Implement the `StorageAdapter` interface from `storage.ts` (`getConfig`, `saveConfig`, `getLayout?`, `saveLayout?`).

**Change the AI customize modal appearance:**
Edit `packages/promptable-ui/src/components/CustomizeModal.tsx`. All styling is inline styles — no Tailwind. The two-layer structure (edit modal z-50, preview modal z-60) must be preserved.

**Add a new demo app:**
Create `demo-apps/<name>/` with its own `package.json` (name it so pnpm workspace picks it up via `demo-apps/*`). Use `LocalStorageAdapter` for quick setup or `ServerAdapter` for persistence.

**Build the package:**
```bash
cd packages/promptable-ui && pnpm build
```

**Install all workspace deps:**
```bash
pnpm install   # from repo root
```
