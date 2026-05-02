import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are a financial data visualization assistant for a dark-themed stock market dashboard. Generate a React Widget component using React.createElement (NO JSX).

Return JSON:
{
  "dataResource": string,
  "chartType": "custom",
  "fields": [],
  "filters": [],
  "sortBy": null,
  "sortDir": null,
  "groupBy": null,
  "aggregations": null,
  "title": string,
  "colorScheme": "dark",
  "prompt": string,
  "generatedCode": string
}

The generatedCode MUST be a function named Widget({ data }) using React.createElement only.

DESIGN — dark terminal style, use these inline styles:
- Container: { fontFamily: 'monospace', color: '#E2E8F0' }
- Positive numbers: { color: '#10B981', fontWeight: 600 }
- Negative numbers: { color: '#F43F5E', fontWeight: 600 }
- Table header cell: { padding: '6px 12px', background: '#0F172A', color: '#94A3B8', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid #334155' }
- Table data cell: { padding: '8px 12px', borderBottom: '1px solid #1E293B', fontSize: 13, fontFamily: 'monospace' }
- Table row hover: alternate bg #0F172A / #1a2540
- Chart colors for recharts: ['#38BDF8','#10B981','#F59E0B','#F43F5E','#A78BFA','#FB923C']

Available: React, Recharts.* (all components)
NO Tailwind classNames — inline styles only.

Rules:
- For price/change fields: show + prefix for positive, color-code positive green / negative red
- Format large numbers: marketCap in trillions (e.g. "$2.85T"), volume in millions (e.g. "58.4M")
- Recharts charts must be wrapped in Recharts.ResponsiveContainer { width:'100%', height: 260 }
- The Widget receives BOTH primary data AND all resources:
    Widget({ data, allData })
    where allData = { stocks: [...], indices: [...], earnings: [...], analysts: [...] }
- For cross-resource analysis (e.g. join stocks with earnings on symbol, or combine stocks with analyst ratings):
    const enriched = allData.stocks.map(s => ({ ...s, earnData: allData.earnings.filter(e => e.symbol === s.symbol) }))
- allData is always available even if data is for a single resource
- Use allData for anomaly detection, joins, correlation analysis across resources`;


async function callWithRetry(msg: string, attempts = 3): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: msg,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          maxOutputTokens: 8192,
          temperature: 0.2,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 0 },
        },
      });
      const t = r.text ?? '';
      if (!t.trim()) throw new Error('Empty response');
      return t;
    } catch (e: any) {
      if ((e?.message?.includes('503') || e?.message?.includes('UNAVAILABLE')) && i < attempts - 1) {
        await new Promise(r => setTimeout(r, 600 * Math.pow(2, i)));
        continue;
      }
      throw e;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, schema, currentConfig } = await req.json();
    if (!prompt || !schema) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const text = await callWithRetry(
      `User request: "${prompt}"\n\nSchema:\n${JSON.stringify(schema, null, 2)}\n\nCurrent config:\n${JSON.stringify(currentConfig, null, 2)}`
    );
    const config = JSON.parse(text);
    return NextResponse.json({ config });
  } catch (e: any) {
    const busy = e?.message?.includes('503') || e?.message?.includes('UNAVAILABLE');
    console.error('[market-lens interpret]', e?.message);
    return NextResponse.json(
      { error: busy ? 'Gemini is busy — try again in a moment' : 'Failed to interpret' },
      { status: busy ? 503 : 500 }
    );
  }
}
