'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const MODELS = [
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1', provider: 'Meta', color: '#7B61FF' },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B', provider: 'Mistral', color: '#FF6B35' },
  { id: 'google/gemma-2-9b-it:free', name: 'Gemma 2', provider: 'Google', color: '#4285F4' },
  { id: 'qwen/qwen-2-7b-instruct:free', name: 'Qwen 2', provider: 'Alibaba', color: '#FF6900' },
]

type Stage = 'select' | 'waiting' | 'matched'

export default function QueuePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [selectedModel, setSelectedModel] = useState('')
  const [loading, setLoading] = useState(true)
  const [stage, setStage] = useState<Stage>('select')
  const [queueCount, setQueueCount] = useState(0)
  const [waitTime, setWaitTime] = useState(0)
  const [currentMatch, setCurrentMatch] = useState<any>(null)
  const waitInterval = useRef<any>(null)
  const matchSub = useRef<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }
      const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      if (!data) { router.push('/'); return }
      setUser(data)
      setLoading(false)
    }
    getUser()
  }, [router])

  // Watch queue count
  useEffect(() => {
    const channel = supabase
      .channel('queue-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue' }, async () => {
        const { count } = await supabase.from('queue').select('*', { count: 'exact', head: true })
        setQueueCount(count || 0)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Watch for match
  const watchForMatch = (userId: string) => {
    matchSub.current = supabase
      .channel('match-watch')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `player1_id=eq.${userId}`,
      }, (payload) => {
        handleMatched(payload.new)
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `player2_id=eq.${userId}`,
      }, (payload) => {
        handleMatched(payload.new)
      })
      .subscribe()
  }

  const handleMatched = (match: any) => {
    setCurrentMatch(match)
    setStage('matched')
    clearInterval(waitInterval.current)
    // Go to pre-battle after 2 seconds
    setTimeout(() => {
      router.push(`/battle/pre?prompt=${encodeURIComponent(match.prompt)}&model=${encodeURIComponent(selectedModel)}&matchId=${match.id}`)
    }, 2000)
  }

  const enterQueue = async () => {
    if (!selectedModel || !user) return
    setStage('waiting')

    // Start wait timer
    waitInterval.current = setInterval(() => setWaitTime(t => t + 1), 1000)

    // Watch for match via realtime
    watchForMatch(user.id)

    // Call matchmaking API
    const res = await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, model: selectedModel }),
    })
    const data = await res.json()

    if (data.status === 'matched') {
      handleMatched(data.match)
    }
    // If 'waiting' — realtime will fire when opponent joins
  }

  const leaveQueue = async () => {
    if (!user) return
    clearInterval(waitInterval.current)
    if (matchSub.current) supabase.removeChannel(matchSub.current)
    await fetch('/api/match', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
    setStage('select')
    setWaitTime(0)
  }

  const formatWait = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  if (loading) return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <p style={{ color: '#555' }}>Loading...</p>
    </div>
  )

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <span style={styles.logo} onClick={() => router.push('/dashboard')}>Vibe Arena</span>
        <div style={styles.navLinks}>
          <a href="/dashboard" style={styles.navLink}>Dashboard</a>
          <a href="/leaderboard" style={styles.navLink}>Leaderboard</a>
        </div>
        <div style={styles.userBtn}>
          <span style={{ color: '#aaa', fontSize: '13px' }}>{user?.username}</span>
        </div>
      </nav>

      <main style={styles.main}>

        {/* SELECT STAGE */}
        {stage === 'select' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: '800', margin: '0 0 8px' }}>
                Choose Your AI
              </h1>
              <p style={{ color: '#555', fontSize: '15px', margin: '0 0 8px' }}>
                Pick the model you'll use to build. Choose wisely.
              </p>
              {queueCount > 0 && (
                <p style={{ color: '#00bfff', fontSize: '13px', margin: 0 }}>
                  {queueCount} player{queueCount !== 1 ? 's' : ''} in queue
                </p>
              )}
            </div>

            <div style={styles.modelsGrid}>
              {MODELS.map(m => (
                <div
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  style={{
                    ...styles.modelCard,
                    border: selectedModel === m.id ? `2px solid ${m.color}` : '2px solid #1a1a1a',
                    cursor: 'pointer',
                  }}
                >
                  {selectedModel === m.id && (
                    <div style={{ ...styles.selectedBadge, background: m.color }}>SELECTED</div>
                  )}
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: m.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    <span style={{ color: m.color, fontSize: '20px', fontWeight: '800' }}>{m.name.charAt(0)}</span>
                  </div>
                  <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: '700', margin: '0 0 4px' }}>{m.name}</h3>
                  <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>{m.provider}</p>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <button
                onClick={enterQueue}
                disabled={!selectedModel}
                style={{
                  ...styles.enterBtn,
                  opacity: selectedModel ? 1 : 0.4,
                  cursor: selectedModel ? 'pointer' : 'not-allowed',
                }}
              >
                Find Opponent →
              </button>
              {!selectedModel && (
                <p style={{ color: '#333', fontSize: '13px', marginTop: '1rem' }}>Select a model to continue</p>
              )}
            </div>
          </>
        )}

        {/* WAITING STAGE */}
        {stage === 'waiting' && (
          <div style={styles.waitingScreen}>
            <div style={styles.spinner} />
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '700', margin: '2rem 0 8px' }}>
              Finding an opponent...
            </h2>
            <p style={{ color: '#555', fontSize: '14px', margin: '0 0 8px' }}>
              Wait time: <span style={{ color: '#aaa' }}>{formatWait(waitTime)}</span>
            </p>
            <p style={{ color: '#333', fontSize: '13px', margin: '0 0 2rem' }}>
              {queueCount} player{queueCount !== 1 ? 's' : ''} in queue
            </p>
            <div style={styles.modelPill}>
              Your model: <span style={{ color: '#00bfff' }}>
                {MODELS.find(m => m.id === selectedModel)?.name}
              </span>
            </div>
            <button onClick={leaveQueue} style={styles.leaveBtn}>
              Leave Queue
            </button>
          </div>
        )}

        {/* MATCHED STAGE */}
        {stage === 'matched' && (
          <div style={styles.waitingScreen}>
            <div style={{ fontSize: '64px', marginBottom: '1rem' }}>⚔️</div>
            <h2 style={{ color: '#00bfff', fontSize: '28px', fontWeight: '800', margin: '0 0 8px' }}>
              Opponent Found!
            </h2>
            <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>
              Starting battle in 2 seconds...
            </p>
          </div>
        )}

      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#0a0a0a', fontFamily: 'sans-serif' },
  navbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', height: '60px', borderBottom: '1px solid #1a1a1a',
    background: '#0a0a0a', position: 'sticky', top: 0, zIndex: 100,
  },
  logo: { color: '#00bfff', fontWeight: '800', fontSize: '18px', cursor: 'pointer' },
  navLinks: { display: 'flex', gap: '2rem' },
  navLink: { color: '#666', textDecoration: 'none', fontSize: '14px' },
  userBtn: {
    display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
    padding: '6px 12px', borderRadius: '8px', border: '1px solid #222', background: '#111',
  },
  main: { padding: '3rem 2rem', maxWidth: '800px', width: '100%', margin: '0 auto' },
  modelsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' },
  modelCard: {
    background: '#111', borderRadius: '16px', padding: '1.5rem',
    position: 'relative', transition: 'border-color 0.15s',
  },
  selectedBadge: {
    position: 'absolute', top: '12px', right: '12px',
    color: '#000', fontSize: '10px', fontWeight: '700',
    padding: '3px 8px', borderRadius: '4px',
  },
  enterBtn: {
    background: '#00bfff', color: '#000', border: 'none',
    borderRadius: '12px', padding: '16px 48px',
    fontSize: '17px', fontWeight: '800',
  },
  waitingScreen: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '60vh', textAlign: 'center',
  },
  spinner: {
    width: '48px', height: '48px', border: '3px solid #1a1a1a',
    borderTop: '3px solid #00bfff', borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  modelPill: {
    background: '#111', border: '1px solid #1a1a1a', borderRadius: '999px',
    padding: '8px 20px', color: '#555', fontSize: '13px', marginBottom: '1.5rem',
  },
  leaveBtn: {
    background: 'transparent', border: '1px solid #2a2a2a',
    color: '#555', borderRadius: '8px', padding: '10px 24px',
    fontSize: '13px', cursor: 'pointer',
  },
}