export { DynamicUIProvider, useDynamicUI } from './components/DynamicUIProvider';
export { DynamicWidget } from './components/DynamicWidget';
export { CustomizeModal } from './components/CustomizeModal';
export { DynamicRenderer } from './components/DynamicRenderer';

export {
  TableRenderer, BarRenderer, LineRenderer, PieRenderer,
  StatRenderer, CardGridRenderer, renderWidget,
} from './renderers';

// Storage adapters — choose one and pass it to DynamicUIProvider
export { LocalStorageAdapter, NullStorageAdapter, ServerAdapter } from './storage';
export type { StorageAdapter } from './storage';

export type {
  WidgetConfig, ChartType, FilterRule, FilterOperator,
  AggregationRule, AggregationFunc, FieldDefinition, FieldType,
  ResourceDefinition, SchemaDefinition, DynamicUIContextValue,
  OnPromptFn, PromptContext,
} from './types';
