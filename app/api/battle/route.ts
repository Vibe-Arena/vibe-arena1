import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const systemPrompt = `You are an expert frontend developer helping a user build a web app in a 15-minute competition. 

CRITICAL RULES:
- Always respond with complete, working HTML/CSS/JavaScript in a single file
- Use inline styles and vanilla JavaScript only — no frameworks, no CDN links
- Every response must be a FULL page — include <!DOCTYPE html>, <html>, <head>, <body>
- Make it look beautiful — dark theme, clean UI, real functionality
- Build on top of what the user already has — never start from scratch on follow-up messages
- Be concise in explanation, generous in code`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      max_tokens: 8192,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('Groq error:', err)
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