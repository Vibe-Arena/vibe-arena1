import { NextResponse } from 'next/server'

export async function GET() {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://vibearena.gg',
      'X-Title': 'Vibe Arena',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messages: [
        {
          role: 'user',
          content: `Generate a single battle prompt for a 15-minute frontend coding competition. 

Format: "Build a [adjective] [product] for [niche]"

Rules:
- One sentence only, no punctuation at the end
- Must be buildable with HTML, CSS, JavaScript in 15 minutes
- Be creative and specific
- Examples: "Build a minimal habit tracker for busy parents", "Build a neon-themed pomodoro timer for developers", "Build a clean expense splitter for roommates"

Respond with ONLY the prompt, nothing else.`
        }
      ],
      max_tokens: 50,
    }),
  })

  const data = await response.json()
  const prompt = data.choices?.[0]?.message?.content?.trim() || 'Build a beautiful todo app with priority levels'

  return NextResponse.json({ prompt })
}