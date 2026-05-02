import type { FilterRule, AggregationRule } from './types';

export function applyFilters(data: any[], filters: FilterRule[]): any[] {
  if (!filters || filters.length === 0) return data;
  return data.filter(item =>
    filters.every(rule => {
      const value = item[rule.field];
      switch (rule.operator) {
        case 'eq': return String(value) === String(rule.value);
        case 'neq': return String(value) !== String(rule.value);
        case 'gt': return Number(value) > Number(rule.value);
        case 'lt': return Number(value) < Number(rule.value);
        case 'contains':
          return String(value ?? '').toLowerCase().includes(String(rule.value).toLowerCase());
        default: return true;
      }
    })
  );
}

export function applySort(
  data: any[],
  sortBy?: string | null,
  sortDir?: 'asc' | 'desc'
): any[] {
  if (!sortBy) return data;
  return [...data].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const dir = sortDir === 'desc' ? -1 : 1;
    if (aVal == null) return dir;
    if (bVal == null) return -dir;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * dir;
    }
    return String(aVal).localeCompare(String(bVal)) * dir;
  });
}

export function groupAndAggregate(
  data: any[],
  groupBy: string,
  aggregations: AggregationRule[]
): any[] {
  // Collect items per group, preserving insertion order
  const groupMap = new Map<string, any[]>();
  for (const item of data) {
    const key = String(item[groupBy] ?? 'Unknown');
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(item);
  }

  return Array.from(groupMap.entries()).map(([groupKey, items]) => {
    const row: Record<string, any> = { [groupBy]: groupKey };

    for (const agg of aggregations) {
      const values = items.map(i => i[agg.field]).filter(v => v != null);

      switch (agg.func) {
        case 'count':
          row[agg.alias] = items.length;
          break;
        case 'sum':
          row[agg.alias] = values.reduce((a, b) => a + Number(b), 0);
          break;
        case 'avg':
          row[agg.alias] = values.length
            ? Math.round((values.reduce((a, b) => a + Number(b), 0) / values.length) * 100) / 100
            : 0;
          break;
        case 'min':
          row[agg.alias] = values.slice().sort()[0] ?? null;
          break;
        case 'max':
          row[agg.alias] = values.slice().sort().pop() ?? null;
          break;
      }
    }

    return row;
  });
}

// Simple count-based aggregation for charts (bar / pie) when no groupBy config is set
export function aggregateData(
  data: any[],
  groupField: string,
  valueField?: string
): { name: string; value: number }[] {
  const groups = new Map<string, number>();
  data.forEach(item => {
    const key = String(item[groupField] ?? 'Unknown');
    if (valueField) {
      const val = Number(item[valueField]) || 0;
      groups.set(key, (groups.get(key) ?? 0) + val);
    } else {
      groups.set(key, (groups.get(key) ?? 0) + 1);
    }
  });
  return Array.from(groups.entries()).map(([name, value]) => ({ name, value }));
}

export function getFields(config: { fields: string[] }, data: any[]): string[] {
  if (config.fields.length > 0) return config.fields;
  if (data.length > 0) return Object.keys(data[0]);
  return [];
}
