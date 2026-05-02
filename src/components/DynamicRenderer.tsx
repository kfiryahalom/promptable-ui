'use client';

import React, { useMemo, useState, useEffect } from 'react';
import * as Recharts from 'recharts';

interface Props {
  code: string;
  /** Primary data for this widget (the configured dataResource) */
  data: any[];
  /**
   * All resources keyed by name — lets generated Widget code do joins /
   * cross-resource analysis without additional fetch calls.
   * e.g. allData.earnings.filter(e => e.symbol === row.symbol)
   */
  allData?: Record<string, any[]>;
}

type WidgetFn = React.ComponentType<{ data: any[]; allData?: Record<string, any[]> }>;

function compileWidget(code: string): WidgetFn | null {
  // eslint-disable-next-line no-new-func
  const factory = new Function('React', 'Recharts', `
    "use strict";
    ${code}
    return typeof Widget !== 'undefined' ? Widget : null;
  `);
  return factory(React, Recharts) as WidgetFn | null;
}

export function DynamicRenderer({ code, data, allData }: Props) {
  const [renderError, setRenderError] = useState<string | null>(null);

  const Widget = useMemo(() => {
    try {
      return compileWidget(code);
    } catch (e: any) {
      console.error('[DynamicRenderer compile]', e);
      return null;
    }
  }, [code]);

  useEffect(() => { setRenderError(null); }, [code, data]);

  if (!Widget) {
    return <div style={{ color: '#EF4444', fontSize: 13, padding: 12 }}>Could not compile generated component.</div>;
  }

  if (renderError) {
    return <div style={{ color: '#EF4444', fontSize: 13, padding: 12 }}>Render error: {renderError}</div>;
  }

  return (
    <ErrorBoundary onError={setRenderError}>
      <Widget data={data} allData={allData} />
    </ErrorBoundary>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (msg: string) => void },
  { caught: boolean }
> {
  state = { caught: false };
  componentDidCatch(error: Error) {
    this.props.onError(error.message);
    this.setState({ caught: true });
  }
  render() {
    return this.state.caught ? null : this.props.children;
  }
}
