import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are a React data visualization assistant. Given a user's description and a data schema, return a JSON object that includes a fully generated React Widget component.

Return JSON with this exact shape:
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
  "colorScheme": null,
  "prompt": string,
  "generatedCode": string
}

The "generatedCode" field MUST be a JavaScript function named Widget using React.createElement (NOT JSX, because no transpiler is available at runtime):

function Widget({ data }) {
  // data = raw array fetched from dataResource
  // Transform data here as needed (group, aggregate, filter, sort, etc.)
  // Render using React.createElement — do NOT use JSX angle-bracket syntax
  return React.createElement("div", null, "...");
}

Available in scope (no imports needed):
- React           — React object (React.createElement, React.useState, React.useMemo, etc.)
- Recharts        — all Recharts exports: Recharts.PieChart, Recharts.Pie, Recharts.Cell,
                    Recharts.BarChart, Recharts.Bar, Recharts.XAxis, Recharts.YAxis,
                    Recharts.Tooltip, Recharts.Legend, Recharts.ResponsiveContainer,
                    Recharts.LineChart, Recharts.Line, Recharts.CartesianGrid

Design tokens — use these as inline style values (NO Tailwind className):
- Primary blue:   #3B82F6
- Green:          #10B981
- Amber:          #F59E0B
- Red:            #EF4444
- Purple:         #8B5CF6
- Pink:           #EC4899
- Text dark:      #111827
- Text muted:     #6B7280
- Border:         #E5E7EB
- Surface:        #F9FAFB
- Card style:     { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 12, border: '1px solid #E5E7EB' }

Recharts chart pattern (always wrap in ResponsiveContainer):
React.createElement(Recharts.ResponsiveContainer, { width: '100%', height: 280 },
  React.createElement(Recharts.PieChart, null,
    React.createElement(Recharts.Pie, { data: chartData, dataKey: 'value', nameKey: 'name', cx: '50%', cy: '50%', innerRadius: 60, outerRadius: 100, paddingAngle: 2 },
      chartData.map((_, i) => React.createElement(Recharts.Cell, { key: i, fill: COLORS[i % COLORS.length] }))
    ),
    React.createElement(Recharts.Tooltip),
    React.createElement(Recharts.Legend)
  )
)

Table pattern (pure HTML, no Recharts):
React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', fontSize: 13 } },
  React.createElement('thead', null,
    React.createElement('tr', null,
      ...headers.map(h => React.createElement('th', { key: h, style: { padding: '8px 12px', textAlign: 'left', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', fontWeight: 600 } }, h))
    )
  ),
  React.createElement('tbody', null,
    rows.map((row, i) => React.createElement('tr', { key: i, style: { background: i % 2 === 0 ? '#fff' : '#F9FAFB' } },
      headers.map(h => React.createElement('td', { key: h, style: { padding: '8px 12px', borderBottom: '1px solid #F3F4F6' } }, String(row[h] ?? '')))
    ))
  )
)

Rules:
- The Widget function MUST handle all data transformation (group, aggregate, sort, filter) internally
- Use React.useState or React.useMemo for derived state when helpful
- Match the visual style described above; if user specifies a different style, follow their preference instead
- Only use fields/dataResource names that exist in the provided schema
- Return ONLY the JSON object, no other text`;

async function callGemini(userMessage: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userMessage,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: 8192,
      temperature: 0.2,
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
  const text = response.text ?? '';
  if (!text.trim()) throw new Error('Empty response from model');
  return text;
}

async function callWithRetry(msg: string, maxAttempts = 3): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await callGemini(msg);
    } catch (err: any) {
      const retryable =
        err?.message?.includes('503') ||
        err?.message?.includes('UNAVAILABLE') ||
        err?.message?.includes('high demand');
      if (retryable && attempt < maxAttempts - 1) {
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, schema, currentConfig } = body;
    if (!prompt || !schema) {
      return NextResponse.json({ error: 'Missing prompt or schema' }, { status: 400 });
    }

    const userMessage = `User request: "${prompt}"

Available data schema:
${JSON.stringify(schema, null, 2)}

Current widget config (for context):
${JSON.stringify(currentConfig, null, 2)}

Generate the Widget component and return the full JSON config.`;

    const text = await callWithRetry(userMessage);

    let config: unknown;
    try {
      config = JSON.parse(text);
    } catch {
      console.error('[interpret] bad JSON:', text.slice(0, 300));
      return NextResponse.json({ error: "Couldn't parse that, try rephrasing" }, { status: 422 });
    }

    return NextResponse.json({ config });
  } catch (err: any) {
    const overloaded =
      err?.message?.includes('503') ||
      err?.message?.includes('UNAVAILABLE') ||
      err?.message?.includes('high demand');
    console.error('[interpret]', err?.message ?? err);
    return NextResponse.json(
      { error: overloaded ? 'Gemini is busy right now — please try again in a moment' : 'Failed to interpret prompt' },
      { status: overloaded ? 503 : 500 }
    );
  }
}
