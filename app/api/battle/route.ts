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

  const lastUserMessage = messages[messages.length - 1]?.content || ''
  const history = messages.slice(0, -1).map((m: any) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }))

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [
          ...history,
          { role: 'user', parts: [{ text: lastUserMessage }] }
        ],
        generationConfig: { maxOutputTokens: 8192 }
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  // Convert Gemini SSE to OpenAI-compatible SSE format
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6).trim()
          if (!data || data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || ''
            if (text) {
              // Format as OpenAI-compatible SSE so battle page works unchanged
              const formatted = `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`
              controller.enqueue(encoder.encode(formatted))
            }
          } catch { }
        }
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}