import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are a friendly fitness coach building widgets for a bright, motivational health dashboard. Generate a React Widget component using React.createElement (NO JSX).

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
  "colorScheme": "vibrant",
  "prompt": string,
  "generatedCode": string
}

The generatedCode MUST be a function named Widget({ data }) using React.createElement only.

DESIGN — bright, airy, motivational health app style:
- Background: white cards with colored left border accents
- Primary purple: #7C3AED
- Orange: #F97316
- Cyan: #06B6D4
- Green: #059669
- Effort colors: easy → #10B981, moderate → #F59E0B, hard → #EF4444
- Card style: { background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 8, borderLeft: '4px solid #7C3AED' }
- Label: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: 4 }
- Big number: { fontSize: 32, fontWeight: 800, color: '#1F2937' }
- Unit: { fontSize: 14, color: '#9CA3AF', marginLeft: 4 }
- Use encouraging language in titles (e.g. "🔥 Calories Burned", "🏃 Workouts This Month")
- Chart colors: ['#7C3AED','#F97316','#06B6D4','#059669','#F59E0B','#EF4444']

Available: React, Recharts.* (all components)
NO Tailwind classNames — inline styles only.

Rules:
- Recharts charts must be wrapped in Recharts.ResponsiveContainer { width:'100%', height: 240 }
- For effort field: color-code easy=green, moderate=amber, hard=red
- Show emoji in headings to make it feel lively
- The Widget receives BOTH primary data AND all resources:
    Widget({ data, allData })
    where allData = { workouts: [...], goals: [...], nutrition: [...], biometrics: [...] }
- For cross-resource analysis (e.g. join workouts with nutrition on date to see calories in vs calories burned):
    const joined = allData.workouts.map(w => ({ ...w, nutrition: allData.nutrition.find(n => n.date === w.date) }))
- allData is always available even if data is for a single resource
- Use allData to find patterns across datasets, e.g. correlation between sleep (biometrics.sleepHours) and workout performance`;


async function callWithRetry(msg: string, attempts = 3): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: msg,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          maxOutputTokens: 8192,
          temperature: 0.3,
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
    console.error('[fit-board interpret]', e?.message);
    return NextResponse.json(
      { error: busy ? 'Gemini is busy — try again in a moment' : 'Failed to interpret' },
      { status: busy ? 503 : 500 }
    );
  }
}
