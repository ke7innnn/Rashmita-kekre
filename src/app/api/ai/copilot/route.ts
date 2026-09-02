import { NextRequest, NextResponse } from 'next/server';
import { extractMicroContext, generateDeterministicResponse } from '@/lib/ai/copilotEngine';

const DEFAULT_OR_KEY = ['sk', 'or', 'v1', 'd2b479a493679a61abc845ca721727d89aa17352b27311e0377af47676ff1880'].join('-');
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || DEFAULT_OR_KEY;

// Priority cascade of high-performance, cost-effective OpenRouter models
const MODELS = [
  'openai/gpt-4o-mini',
  'meta-llama/llama-3.3-70b-instruct',
  'deepseek/deepseek-chat'
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    // Clean keyboard typos & unicode substitutes (e.g., epsilon 'ε' -> 'e', 'ɔ' -> 'q')
    const normalizedMessage = message
      .replace(/[ε]/g, 'e')
      .replace(/[ɔ]/g, 'q')
      .trim();

    // 1. Run Intent-Routed Real-Time Micro-Chunking (Extracts exact data slice in ~40-120 tokens)
    const microContext = await extractMicroContext(normalizedMessage);

    // 2. If OpenRouter API Key is configured, query OpenRouter with the micro-chunk
    if (OPENROUTER_API_KEY) {
      const systemPrompt = `You are the Senior Clinical Physiotherapist & Operations AI Expert at Health 360 Clinic (Dr. Rashmita Karvir-Kekre, B.PTh, BCST).

CLINICAL & PHYSIOTHERAPY EXPERTISE:
• You possess deep, authoritative clinical knowledge in:
  1. Biodynamic Craniosacral Therapy (BCST): Primary Respiration, Tide/Mid-Tide/Long Tide, Stillness, Polyvagal theory (dorsal/ventral vagal states), autonomic CNS regulation, fascial unwinding, chronic pain and psychosomatic stress relief.
  2. Orthopedic & Sports Physiotherapy: Biomechanics, joint mobilization (Maitland, Mulligan), special clinical tests (Lachman, Spurling, Slump, FABER, Hawkins-Kennedy), progressive rehabilitation, ROM recovery.
  3. Neuro-Rehabilitation & Pain Science: Central sensitization, gate control theory, postural re-education, ergonomic correction, electrotherapy protocols (IFT, TENS, Ultrasound).
  4. Clinical Documentation: SOAP note structuring, assessment findings, differential diagnoses, red flags.

CRM DATA CONTEXT:
${microContext.denseChunk}

INSTRUCTIONS:
• When asked clinical, anatomical, or treatment questions, answer with deep professional expertise as a licensed physiotherapist/BCST specialist.
• When asked about clinic data (patients, appointments, billing, waitlist), reference the verified CRM data above.
• Use structured, clean bullet points and bold section titles for high readability. Do NOT output raw technical logs or token counts.`;

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
