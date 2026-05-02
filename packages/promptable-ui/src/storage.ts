import type { WidgetConfig } from './types';

/**
 * Interface your storage backend must implement.
 * The package calls these methods to load and save widget configs and the dashboard layout.
 *
 * Implement this to connect to any persistence layer: a database, a KV store,
 * a serverless function, or even an MCP tool.
 *
 * @example — minimal in-memory implementation for testing:
 * ```ts
 * class MemoryAdapter implements StorageAdapter {
 *   private store = new Map<string, WidgetConfig>();
 *   async getConfig(widgetId, userId) { return this.store.get(`${userId}:${widgetId}`) ?? null; }
 *   async saveConfig(config) { this.store.set(`${config.userId}:${config.widgetId}`, config); }
 * }
 * ```
 */
export interface StorageAdapter {
  /**
   * Load the saved config for one widget.
   * Return `null` if nothing is saved yet — the widget will use its defaults.
   */
  getConfig(widgetId: string, userId: string): Promise<WidgetConfig | null>;

  /**
   * Persist a widget config after the user saves a customisation.
   * The config object already contains `widgetId` and `userId`.
   */
  saveConfig(config: WidgetConfig): Promise<void>;

  /**
   * Load the ordered list of widgets for a dashboard layout.
   * Return `null` if nothing is saved — the default layout will be used.
   * Optional: implement only if you want to persist layout order.
   */
  getLayout?(userId: string): Promise<any[] | null>;

  /**
   * Persist the ordered list of widgets after the user adds, removes, or reorders.
   * Optional: implement only if you want to persist layout order.
   */
  saveLayout?(userId: string, layout: any[]): Promise<void>;
}

// ─── Built-in adapters ────────────────────────────────────────────────────────

/**
 * Stores widget configs and layout in **browser `localStorage`**.
 *
 * - Zero backend required — works immediately with no setup.
 * - Data is per-device and per-browser (not synced across users or devices).
 * - Pass a unique `prefix` to avoid key collisions between multiple apps.
 *
 * @example
 * ```ts
 * new LocalStorageAdapter('my-dashboard')
 * ```
 */
export class LocalStorageAdapter implements StorageAdapter {
  private readonly prefix: string;

  constructor(prefix = 'promptable-ui') {
    this.prefix = prefix;
  }

  private configKey(widgetId: string, userId: string) {
    return `${this.prefix}:config:${userId}:${widgetId}`;
  }

  private layoutKey(userId: string) {
    return `${this.prefix}:layout:${userId}`;
  }

  async getConfig(widgetId: string, userId: string): Promise<WidgetConfig | null> {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(this.configKey(widgetId, userId));
    return raw ? (JSON.parse(raw) as WidgetConfig) : null;
  }

  async saveConfig(config: WidgetConfig): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.configKey(config.widgetId, config.userId), JSON.stringify(config));
  }

  async getLayout(userId: string): Promise<any[] | null> {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(this.layoutKey(userId));
    return raw ? JSON.parse(raw) : null;
  }

  async saveLayout(userId: string, layout: any[]): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.layoutKey(userId), JSON.stringify(layout));
  }
}

/**
 * No-op adapter — configs are **not persisted** (lost on page reload).
 *
 * Use for:
 * - Testing without a backend
 * - Ephemeral dashboards where state does not need to survive navigation
 *
 * This is the default when no `storage` prop is passed to `DynamicUIProvider`.
 */
export class NullStorageAdapter implements StorageAdapter {
  async getConfig(): Promise<null> {
    return null;
  }
  async saveConfig(): Promise<void> {
    // intentional no-op
  }
}

/**
 * Syncs configs and layout via your own **HTTP endpoints**.
 *
 * Use when you want widget configs to persist across devices or users
 * (requires a backend that implements the two endpoint contracts below).
 *
 * **Config endpoint** (`configEndpoint`):
 * - `GET  ?widgetId=…&userId=…` → `{ config: WidgetConfig | null }`
 * - `POST` with body `{ config: WidgetConfig }` → any `2xx`
 *
 * **Layout endpoint** (`layoutEndpoint`, optional):
 * - `GET  ?userId=…` → `{ layout: any[] | null }`
 * - `POST` with body `{ userId: string, widgets: any[] }` → any `2xx`
 *
 * @example
 * ```ts
 * new ServerAdapter('/api/promptable-ui/configs', '/api/dashboard/layout')
 * ```
 */
export class ServerAdapter implements StorageAdapter {
  constructor(
    private configEndpoint: string,
    private layoutEndpoint?: string
  ) {}

  async getConfig(widgetId: string, userId: string): Promise<WidgetConfig | null> {
    const res = await fetch(
      `${this.configEndpoint}?widgetId=${encodeURIComponent(widgetId)}&userId=${encodeURIComponent(userId)}`
    );
    const { config } = await res.json();
    return config ?? null;
  }

  async saveConfig(config: WidgetConfig): Promise<void> {
    await fetch(this.configEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
  }

  async getLayout(userId: string): Promise<any[] | null> {
    if (!this.layoutEndpoint) return null;
    const res = await fetch(`${this.layoutEndpoint}?userId=${encodeURIComponent(userId)}`);
    const { layout } = await res.json();
    return layout ?? null;
  }

  async saveLayout(userId: string, layout: any[]): Promise<void> {
    if (!this.layoutEndpoint) return;
    await fetch(this.layoutEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, widgets: layout }),
    });
  }
}
