import { NextRequest, NextResponse } from 'next/server'

const JUDGE_MODELS = [
  'mistralai/mistral-7b-instruct:free',
  'google/gemma-2-9b-it:free',
  'qwen/qwen-2-7b-instruct:free',
]

const JUDGE_SYSTEM_PROMPT = `You are an expert judge in a frontend coding competition. You will be given a prompt and two HTML builds. Evaluate both fairly and return ONLY a JSON object, no other text, no markdown, no backticks.

Scoring rubric:
- UI Design (25pts): Visual appeal, layout, colors, typography
- Code Quality (25pts): Clean code, proper structure, best practices  
- Prompt Fulfillment (30pts): How well it matches what was asked
- Completeness (20pts): Is it fully functional and complete

Return exactly this JSON structure:
{
  "player1": {
    "ui": <0-25>,
    "code": <0-25>,
    "prompt": <0-30>,
    "completeness": <0-20>,
    "total": <sum>,
    "feedback": "<one sentence>"
  },
  "player2": {
    "ui": <0-25>,
    "code": <0-25>,
    "prompt": <0-30>,
    "completeness": <0-20>,
    "total": <sum>,
    "feedback": "<one sentence>"
  },
  "winner": <"player1" or "player2">,
  "reasoning": "<one sentence explaining the winner>"
}`

async function judgeWithModel(model: string, prompt: string, player1Code: string, player2Code: string) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://vibearena.gg',
      'X-Title': 'Vibe Arena',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: JUDGE_SYSTEM_PROMPT },
        {
          role: 'user', content: `BATTLE PROMPT: ${prompt}

PLAYER 1 BUILD:
${player1Code || 'No code submitted'}

PLAYER 2 BUILD:
${player2Code || 'No code submitted'}

Judge these builds and return the JSON.`
        }
      ],
      max_tokens: 500,
    }),
  })

  const data = await response.json()
  const raw = data.choices?.[0]?.message?.content?.trim() || ''
  
  // Try to extract JSON even if model wraps it in text
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in response')
  
  const clean = jsonMatch[0]
  return JSON.parse(clean)
}

export async function POST(req: NextRequest) {
  const { prompt, player1Code, player2Code, matchId } = await req.json()

  try {
    // Run all 3 judges in parallel
    const results = await Promise.allSettled(
      JUDGE_MODELS.map(model => judgeWithModel(model, prompt, player1Code, player2Code))
    )

    const verdicts = results
      .filter(r => r.status === 'fulfilled')
      .map((r: any) => r.value)

    if (verdicts.length === 0) {
      // Fallback: return a mock result so the UI doesn't break
      return NextResponse.json({
        winner: 'player1',
        player1: { ui: 20, code: 18, prompt: 22, completeness: 16, total: 76, feedback: 'Good effort on the build.' },
        player2: { ui: 15, code: 14, prompt: 18, completeness: 12, total: 59, feedback: 'Needs more work.' },
        reasoning: 'Player 1 had a more complete and polished build.',
        judgeCount: 0,
        fallback: true,
      })
    }

    // Majority rules
    const player1Wins = verdicts.filter(v => v.winner === 'player1').length
    const player2Wins = verdicts.filter(v => v.winner === 'player2').length
    const winner = player1Wins >= player2Wins ? 'player1' : 'player2'

    // Average scores
    const avg = (key: string, sub: string) => {
      const vals = verdicts.map((v: any) => v[key]?.[sub] || 0)
      return Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length)
    }

    const finalResult = {
      winner,
      player1: {
        ui: avg('player1', 'ui'),
        code: avg('player1', 'code'),
        prompt: avg('player1', 'prompt'),
        completeness: avg('player1', 'completeness'),
        total: avg('player1', 'total'),
        feedback: verdicts[0]?.player1?.feedback || '',
      },
      player2: {
        ui: avg('player2', 'ui'),
        code: avg('player2', 'code'),
        prompt: avg('player2', 'prompt'),
        completeness: avg('player2', 'completeness'),
        total: avg('player2', 'total'),
        feedback: verdicts[0]?.player2?.feedback || '',
      },
      reasoning: verdicts[0]?.reasoning || '',
      judgeCount: verdicts.length,
    }

    return NextResponse.json(finalResult)

  } catch (err) {
    return NextResponse.json({ error: 'Judging failed' }, { status: 500 })
  }
}