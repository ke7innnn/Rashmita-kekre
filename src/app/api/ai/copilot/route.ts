import { NextRequest, NextResponse } from 'next/server';
import { extractMicroContext, generateDeterministicResponse } from '@/lib/ai/copilotEngine';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '';

// Priority cascade of high-performance, cost-effective OpenRouter models
const MODELS = [
  'google/gemini-2.0-flash-lite-preview-02-05:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-chat',
  'openai/gpt-4o-mini'
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    // 1. Run Intent-Routed Real-Time Micro-Chunking (Extracts exact data slice in ~40-120 tokens)
    const microContext = await extractMicroContext(message);

    // 2. If OpenRouter API Key is configured, query OpenRouter with the micro-chunk
    if (OPENROUTER_API_KEY) {
      const systemPrompt = `You are the Health 360 Clinical & Operations AI Assistant for Dr. Rashmita Karvir Kekre's Physiotherapy and Biodynamic Craniosacral Therapy (BCST) Clinic.
Answer the user's question accurately, concisely, and professionally using the verified real-time database chunk below.
If the question is clinical (e.g. rehab protocols, exercises, CST, SOAP notes), provide expert, evidence-based physiotherapy guidance.
Format with clean bullet points and bold headers when helpful.

REAL-TIME CRM DATA CHUNK:
${microContext.denseChunk}`;

      // Build conversation messages (limit history to last 2 turns to minimize token cost)
      const sanitizedHistory = Array.isArray(history) 
        ? history.slice(-4).map(h => ({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: String(h.content || '')
          }))
        : [];

      const messagesPayload = [
        { role: 'system', content: systemPrompt },
        ...sanitizedHistory,
        { role: 'user', content: message }
      ];

      for (const model of MODELS) {
        try {
          const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'HTTP-Referer': 'https://thehealth360.in',
              'X-Title': 'Health 360 CRM Copilot',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model,
              messages: messagesPayload,
              temperature: 0.3,
              max_tokens: 600
            })
          });

          if (openRouterRes.ok) {
            const data = await openRouterRes.json();
            const aiText = data.choices?.[0]?.message?.content;
            if (aiText) {
              return NextResponse.json({
                response: aiText,
                domain: microContext.domain,
                tokenEstimate: microContext.tokenEstimate,
                modelUsed: model,
                source: 'openrouter'
              });
            }
          }
        } catch (apiErr) {
          console.warn(`OpenRouter model ${model} failed, trying next model...`, apiErr);
        }
      }
    }

    // 3. Fallback: Instant Real-Time Deterministic Engine (0 tokens, 0 cost, 100% accurate)
    const deterministicReply = generateDeterministicResponse(message, microContext);

    return NextResponse.json({
      response: deterministicReply,
      domain: microContext.domain,
      tokenEstimate: microContext.tokenEstimate,
      modelUsed: 'realtime-synthesis-engine',
      source: 'realtime_engine'
    });

  } catch (error: any) {
    console.error('Error in AI Copilot route:', error);
    return NextResponse.json({
      error: 'Failed to process AI query',
      details: error.message
    }, { status: 500 });
  }
}
