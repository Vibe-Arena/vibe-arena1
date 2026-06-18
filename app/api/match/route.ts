import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function POST(req: NextRequest) {
  const { userId, model } = await req.json()

  // Check if user is already in queue
  const { data: existing } = await supabase
    .from('queue')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existing) {
    return NextResponse.json({ status: 'already_in_queue' })
  }

  // Check if anyone else is waiting
  const { data: waiting } = await supabase
    .from('queue')
    .select('*')
    .neq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1)
    .single()

  if (waiting) {
    // Match found — generate prompt and create match
    const promptRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/prompt`)
    const { prompt } = await promptRes.json()

    const { data: match } = await supabase
      .from('matches')
      .insert({
        player1_id: waiting.user_id,
        player2_id: userId,
        player1_model: waiting.selected_model,
        player2_model: model,
        prompt,
        status: 'active',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Remove both from queue
    await supabase.from('queue').delete().eq('user_id', waiting.user_id)
    await supabase.from('queue').delete().eq('user_id', userId)

    return NextResponse.json({ status: 'matched', match })
  }

  // No one waiting — add to queue
  await supabase.from('queue').insert({
    user_id: userId,
    selected_model: model,
  })

  return NextResponse.json({ status: 'waiting' })
}

export async function DELETE(req: NextRequest) {
  const { userId } = await req.json()
  await supabase.from('queue').delete().eq('user_id', userId)
  return NextResponse.json({ status: 'removed' })
}