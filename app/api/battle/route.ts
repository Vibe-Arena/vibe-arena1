import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { messages, model } = await req.json()

  const systemPrompt = `You are an expert frontend developer helping a user build a web app in a 15-minute competition. 

CRITICAL RULES:
- Always respond with complete, working HTML/CSS/JavaScript in a single file
- Use inline styles and vanilla JavaScript only — no frameworks, no CDN links
- Every response must be a FULL page — include <!DOCTYPE html>, <html>, <head>, <body>
- Make it look beautiful — dark theme, clean UI, real functionality
- Build on top of what the user already has — never start from scratch on follow-up messages
- Be concise in explanation, generous in code`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://vibearena.gg',
      'X-Title': 'Vibe Arena',
    },
    body: JSON.stringify({
      model: model || 'meta-llama/llama-3.1-8b-instruct:free',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      stream: true,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  return new NextResponse(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}