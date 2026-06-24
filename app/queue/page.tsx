'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Code2,
  Cpu,
  Gauge,
  LogOut,
  Radio,
  Settings,
  ShieldCheck,
  Sparkles,
  Swords,
  UserRound,
  Wallet,
  X,
  Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type User = {
  id: string
  username: string
  email?: string
  sol_balance?: number
}

type ModelOption = {
  id: string
  name: string
  provider: string
  color: string
  style: string
  speed: string
  strength: string
}

type Match = {
  id: string
  prompt: string
}

type Stage = 'select' | 'waiting' | 'matched'

const MODELS: ModelOption[] = [
  {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1',
    provider: 'Meta',
    color: '#7B61FF',
    style: 'Balanced',
    speed: 'Steady',
    strength: 'Reasoning',
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B',
    provider: 'Mistral',
    color: '#FF6B35',
    style: 'Fast',
    speed: 'Quick',
    strength: 'Iteration',
  },
  {
    id: 'google/gemma-2-9b-it:free',
    name: 'Gemma 2',
    provider: 'Google',
    color: '#4285F4',
    style: 'Precise',
    speed: 'Measured',
    strength: 'Structure',
  },
  {
    id: 'qwen/qwen-2-7b-instruct:free',
    name: 'Qwen 2',
    provider: 'Alibaba',
    color: '#FF6900',
    style: 'Creative',
    speed: 'Rapid',
    strength: 'Range',
  },
]

const RULES = [
  '15 minute build sprint',
  'Frontend only: HTML, CSS, and JavaScript',
  'Final generated build is submitted',
  'AI judges score design, code, prompt fit, and completeness',
]

export default function QueuePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [selectedModel, setSelectedModel] = useState('')
  const [loading, setLoading] = useState(true)
  const [stage, setStage] = useState<Stage>('select')
  const [queueCount, setQueueCount] = useState(0)
  const [waitTime, setWaitTime] = useState(0)
  const [error, setError] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const waitInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const matchSub = useRef<{ unsubscribe: () => void } | null>(null)

  const selected = MODELS.find(model => model.id === selectedModel)
  const balance = user?.sol_balance ?? 0

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single()

      if (!data) {
        const { data: newUser } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            username: authUser.email?.split('@')[0] || 'player',
          })
          .select()
          .single()

        setUser(newUser)
        setLoading(false)
        return
      }

      setUser(data)
      setLoading(false)
    }

    getUser()
  }, [router])

  useEffect(() => {
    const refreshQueueCount = async () => {
      const { count } = await supabase.from('queue').select('*', { count: 'exact', head: true })
      setQueueCount(count || 0)
    }

    refreshQueueCount()

    const channel = supabase
      .channel('queue-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue' }, refreshQueueCount)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (waitInterval.current) clearInterval(waitInterval.current)
      if (matchSub.current) matchSub.current.unsubscribe()
    }
  }, [])

  const formatWait = (secs: number) => {
    const minutes = Math.floor(secs / 60)
    const seconds = secs % 60
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
  }

  const handleMatched = (match: Match) => {
    setStage('matched')
    if (waitInterval.current) clearInterval(waitInterval.current)

    setTimeout(() => {
      router.push(`/battle/pre?prompt=${encodeURIComponent(match.prompt)}&model=${encodeURIComponent(selectedModel)}&matchId=${match.id}`)
    }, 2000)
  }

  const watchForMatch = (userId: string) => {
    const joinedAt = new Date().toISOString()

    const pollInterval = setInterval(async () => {
      const { data: match } = await supabase
        .from('matches')
        .select('*')
        .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
        .eq('status', 'active')
        .gte('created_at', joinedAt)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (match) {
        clearInterval(pollInterval)
        handleMatched(match)
      }
    }, 2000)

    matchSub.current = { unsubscribe: () => clearInterval(pollInterval) }
  }

  const enterQueue = async () => {
    if (!selectedModel) return

    setError('')
    let currentUser = user

    if (!currentUser) {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      if (!data) {
        router.push('/login')
        return
      }

      currentUser = data
      setUser(data)
    }

    setWaitTime(0)
    setStage('waiting')
    waitInterval.current = setInterval(() => setWaitTime(time => time + 1), 1000)
    watchForMatch(currentUser.id)

    try {
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, model: selectedModel }),
      })
      const data = await response.json()

      if (data.status === 'matched') {
        handleMatched(data.match)
      }
    } catch {
      if (waitInterval.current) clearInterval(waitInterval.current)
      if (matchSub.current) matchSub.current.unsubscribe()
      setStage('select')
      setError('Could not enter the queue. Try again in a moment.')
    }
  }

  const leaveQueue = async () => {
    if (!user) return

    if (waitInterval.current) clearInterval(waitInterval.current)
    if (matchSub.current) matchSub.current.unsubscribe()

    await fetch('/api/match', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })

    setStage('select')
    setWaitTime(0)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{ ...styles.container, alignItems: 'center', justifyContent: 'center' }}>
        <div style={styles.loadingOrb}>
          <Sparkles size={22} />
        </div>
        <p style={styles.loadingText}>Loading queue...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes driftIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.45; transform: scale(0.82); } }
        @keyframes orbit { to { transform: rotate(360deg); } }
        .queue-enter { animation: driftIn 0.42s ease both; }
        .queue-card { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .queue-card:hover { transform: translateY(-3px); box-shadow: 0 24px 64px rgba(15, 23, 42, 0.08); }
        .model-button { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .model-button:hover { transform: translateY(-3px); box-shadow: 0 24px 64px rgba(15, 23, 42, 0.08); }
        .aqua-button { transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease; }
        .aqua-button:hover { transform: translateY(-2px); filter: brightness(1.04); box-shadow: 0 16px 30px rgba(0, 210, 255, 0.28); }
        @media (max-width: 980px) {
          .queue-shell { padding: 24px 18px 40px !important; }
          .hero-grid, .model-grid, .status-grid { grid-template-columns: 1fr !important; }
          .nav-links { display: none !important; }
          .queue-title { font-size: 42px !important; }
          .user-name { display: none !important; }
        }
      `}</style>

      <nav style={styles.navbar}>
        <button style={styles.brand} onClick={() => router.push('/dashboard')} aria-label="Vibe Arena dashboard">
          <Image src="/Logo.png" alt="Vibe Arena" width={42} height={42} style={styles.logo} priority />
          <span style={styles.brandText}>VIBE<span style={styles.brandAccent}>ARENA</span></span>
        </button>

        <div className="nav-links" style={styles.navLinks}>
          <a href="/dashboard" style={styles.navLink}>Dashboard</a>
          <a href="/leaderboard" style={styles.navLink}>Leaderboard</a>
          <a href="/queue" style={{ ...styles.navLink, color: '#0f172a' }}>Queue</a>
        </div>

        <div style={{ position: 'relative' }}>
          <button style={styles.userBtn} onClick={() => setDropdownOpen(!dropdownOpen)}>
            <span style={styles.balancePill}>
              <Wallet size={14} />
              {balance.toFixed(3)} SOL
            </span>
            <span className="user-name" style={styles.userName}>{user?.username}</span>
            <ChevronDown size={14} color="#94a3b8" />
          </button>

          {dropdownOpen && (
            <div style={styles.dropdown}>
              <button style={styles.dropItem} onClick={() => router.push('/profile')}><UserRound size={15} /> Profile</button>
              <button style={styles.dropItem} onClick={() => router.push('/settings')}><Settings size={15} /> Settings</button>
              <button style={{ ...styles.dropItem, color: '#ef4444' }} onClick={handleSignOut}><LogOut size={15} /> Sign out</button>
            </div>
          )}
        </div>
      </nav>

      <main className="queue-shell" style={styles.main}>
        {stage === 'select' && (
          <>
            <section className="hero-grid queue-enter" style={styles.heroGrid}>
              <div style={styles.hero}>
                <div style={styles.heroTopline}>
                  <span style={styles.liveDot} />
                  Matchmaking online
                </div>
                <h1 className="queue-title" style={styles.heroTitle}>
                  Choose your model and enter the arena.
                </h1>
                <p style={styles.heroCopy}>
                  Pick the AI you want beside you for the next 15-minute frontend sprint.
                </p>
                <div style={styles.heroMeta}>
                  <span style={styles.metaPill}><Radio size={15} /> {queueCount} in queue</span>
                  <span style={styles.metaPill}><Clock3 size={15} /> 15 minute battle</span>
                  <span style={styles.metaPill}><ShieldCheck size={15} /> AI judged</span>
                </div>
              </div>

              <aside style={styles.queuePanel}>
                <div style={styles.panelHeader}>
                  <span style={styles.kicker}>Ready Check</span>
                  <span style={styles.statusPill}>Season 1</span>
                </div>
                <div style={styles.readyIcon}>
                  <Swords size={34} />
                </div>
                <h2 style={styles.panelTitle}>{selected ? selected.name : 'No model selected'}</h2>
                <p style={styles.panelCopy}>
                  {selected
                    ? `${selected.provider} is locked in for a ${selected.style.toLowerCase()} build style.`
                    : 'Select a model below to unlock matchmaking.'}
                </p>
              </aside>
            </section>

            <section className="model-grid queue-enter" style={styles.modelsGrid}>
              {MODELS.map(model => {
                const isSelected = selectedModel === model.id

                return (
                  <button
                    className="model-button"
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    style={{
                      ...styles.modelCard,
                      borderColor: isSelected ? model.color : '#e2e8f0',
                      boxShadow: isSelected ? `0 24px 70px ${model.color}22` : '0 18px 50px rgba(15, 23, 42, 0.04)',
                    }}
                  >
                    <div style={styles.modelTop}>
                      <span style={{ ...styles.modelOrb, background: `${model.color}18`, color: model.color }}>
                        {model.name.slice(0, 1)}
                      </span>
                      <span style={{ ...styles.selectedBadge, opacity: isSelected ? 1 : 0 }}>
                        <Check size={13} />
                        Selected
                      </span>
                    </div>
                    <h3 style={styles.modelName}>{model.name}</h3>
                    <p style={styles.modelProvider}>{model.provider} / {model.style}</p>
                    <div style={styles.modelStats}>
                      <span><Zap size={13} /> {model.speed}</span>
                      <span><Cpu size={13} /> {model.strength}</span>
                    </div>
                  </button>
                )
              })}
            </section>

            <section className="status-grid queue-enter" style={styles.statusGrid}>
              <div className="queue-card" style={styles.rulesCard}>
                <div style={styles.cardHeader}>
                  <div>
                    <p style={styles.kicker}>Rules</p>
                    <h2 style={styles.sectionTitle}>Before you queue</h2>
                  </div>
                  <Code2 size={18} color="#06b6d4" />
                </div>
                <div style={styles.ruleList}>
                  {RULES.map(rule => (
                    <div key={rule} style={styles.ruleRow}>
                      <span style={styles.checkIcon}><Check size={14} /></span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="queue-card" style={styles.enterCard}>
                <p style={styles.kicker}>Queue Status</p>
                <div style={styles.queueCount}>{queueCount}</div>
                <p style={styles.queueCopy}>
                  player{queueCount === 1 ? '' : 's'} currently waiting for a ranked battle.
                </p>
                {error && <p style={styles.errorText}>{error}</p>}
                <button
                  className="aqua-button"
                  onClick={enterQueue}
                  disabled={!selectedModel}
                  style={{
                    ...styles.enterBtn,
                    opacity: selectedModel ? 1 : 0.45,
                    cursor: selectedModel ? 'pointer' : 'not-allowed',
                  }}
                >
                  Find Opponent <ArrowRight size={18} />
                </button>
              </div>
            </section>
          </>
        )}

        {stage === 'waiting' && (
          <section className="queue-enter" style={styles.waitingScreen}>
            <div style={styles.orbitWrap}>
              <div style={styles.orbitRing} />
              <div style={styles.waitingCore}>
                <Radio size={34} />
              </div>
            </div>
            <h1 style={styles.stateTitle}>Finding an opponent...</h1>
            <p style={styles.stateCopy}>
              Wait time <span style={styles.monoValue}>{formatWait(waitTime)}</span> / {queueCount} in queue
            </p>
            <div style={styles.selectedModelPill}>
              <Cpu size={15} />
              {selected?.name || 'Selected model'}
            </div>
            <button onClick={leaveQueue} style={styles.leaveBtn}>
              <X size={16} />
              Leave Queue
            </button>
          </section>
        )}

        {stage === 'matched' && (
          <section className="queue-enter" style={styles.waitingScreen}>
            <div style={styles.matchedIcon}>
              <Swords size={42} />
            </div>
            <h1 style={{ ...styles.stateTitle, color: '#0891b2' }}>Opponent found</h1>
            <p style={styles.stateCopy}>Starting battle setup in 2 seconds...</p>
            <div style={styles.selectedModelPill}>
              <Gauge size={15} />
              Preparing prompt and arena
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 42%, #eef9ff 100%)',
    color: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  navbar: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    height: '76px',
    padding: '0 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255, 255, 255, 0.84)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(226, 232, 240, 0.85)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: 0,
  },
  logo: {
    width: '42px',
    height: '42px',
    objectFit: 'contain',
  },
  brandText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '16px',
    fontWeight: 800,
    letterSpacing: '0.02em',
    color: '#0f172a',
  },
  brandAccent: {
    color: '#06b6d4',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '30px',
  },
  navLink: {
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  userBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    borderRadius: '999px',
    padding: '6px 8px 6px 6px',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
  },
  balancePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#0891b2',
    background: '#ecfeff',
    border: '1px solid #cffafe',
    borderRadius: '999px',
    padding: '7px 10px',
    fontSize: '12px',
    fontWeight: 800,
    fontFamily: "'JetBrains Mono', monospace",
  },
  userName: {
    color: '#475569',
    fontSize: '13px',
    fontWeight: 700,
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: 'calc(100% + 10px)',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    minWidth: '174px',
    zIndex: 200,
    overflow: 'hidden',
    boxShadow: '0 24px 70px rgba(15, 23, 42, 0.12)',
    padding: '6px',
  },
  dropItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    padding: '10px 12px',
    color: '#475569',
    background: 'transparent',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'left',
  },
  main: {
    width: '100%',
    maxWidth: '1220px',
    margin: '0 auto',
    padding: '32px 28px 56px',
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.55fr) minmax(300px, 0.72fr)',
    gap: '18px',
    marginBottom: '18px',
  },
  hero: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f0fdff 48%, #eaf6ff 100%)',
    border: '1px solid #dff7fb',
    borderRadius: '24px',
    padding: '42px',
    boxShadow: '0 30px 80px rgba(15, 23, 42, 0.06)',
  },
  heroTopline: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '9px',
    color: '#0891b2',
    background: 'rgba(236, 254, 255, 0.8)',
    border: '1px solid #cffafe',
    borderRadius: '999px',
    padding: '8px 12px',
    fontSize: '11px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: '26px',
  },
  liveDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#22c55e',
    animation: 'pulseDot 1.4s ease infinite',
  },
  heroTitle: {
    maxWidth: '780px',
    color: '#0f172a',
    fontSize: '58px',
    fontWeight: 900,
    lineHeight: 0.96,
    letterSpacing: '-0.03em',
    margin: '0 0 20px',
  },
  heroCopy: {
    maxWidth: '650px',
    color: '#64748b',
    fontSize: '17px',
    fontWeight: 600,
    lineHeight: 1.7,
    margin: '0 0 26px',
  },
  heroMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  metaPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#475569',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '999px',
    padding: '9px 12px',
    fontSize: '12px',
    fontWeight: 800,
  },
  queuePanel: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 24px 70px rgba(15, 23, 42, 0.05)',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '24px',
  },
  kicker: {
    color: '#06b6d4',
    fontSize: '11px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    margin: 0,
  },
  statusPill: {
    color: '#475569',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '999px',
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: 800,
  },
  readyIcon: {
    width: '92px',
    height: '92px',
    borderRadius: '28px',
    background: 'linear-gradient(135deg, #ecfeff, #eff6ff)',
    color: '#0891b2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '22px',
  },
  panelTitle: {
    color: '#0f172a',
    fontSize: '28px',
    fontWeight: 900,
    margin: '0 0 10px',
  },
  panelCopy: {
    color: '#64748b',
    fontSize: '14px',
    fontWeight: 700,
    lineHeight: 1.7,
    margin: 0,
  },
  modelsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '14px',
    marginBottom: '18px',
  },
  modelCard: {
    appearance: 'none',
    textAlign: 'left',
    background: '#ffffff',
    border: '2px solid #e2e8f0',
    borderRadius: '20px',
    padding: '18px',
    cursor: 'pointer',
  },
  modelTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '18px',
  },
  modelOrb: {
    width: '46px',
    height: '46px',
    borderRadius: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 900,
    fontFamily: "'JetBrains Mono', monospace",
  },
  selectedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    color: '#0891b2',
    background: '#ecfeff',
    border: '1px solid #cffafe',
    borderRadius: '999px',
    padding: '6px 8px',
    fontSize: '10px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  modelName: {
    color: '#0f172a',
    fontSize: '18px',
    fontWeight: 900,
    margin: '0 0 5px',
  },
  modelProvider: {
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: 800,
    margin: '0 0 18px',
  },
  modelStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 800,
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.3fr) minmax(300px, 0.7fr)',
    gap: '18px',
  },
  rulesCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    padding: '22px',
    boxShadow: '0 18px 50px rgba(15, 23, 42, 0.04)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '18px',
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: '24px',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    margin: '6px 0 0',
  },
  ruleList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '10px',
  },
  ruleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#475569',
    background: '#fbfdff',
    border: '1px solid #f1f5f9',
    borderRadius: '14px',
    padding: '12px',
    fontSize: '13px',
    fontWeight: 800,
  },
  checkIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#dcfce7',
    color: '#16a34a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  enterCard: {
    background: 'linear-gradient(160deg, #0f172a 0%, #13334a 58%, #0e7490 100%)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 24px 70px rgba(14, 116, 144, 0.2)',
  },
  queueCount: {
    color: '#ffffff',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '64px',
    fontWeight: 900,
    lineHeight: 1,
    margin: '18px 0 8px',
  },
  queueCopy: {
    color: '#a5f3fc',
    fontSize: '13px',
    fontWeight: 700,
    lineHeight: 1.6,
    margin: '0 0 22px',
  },
  errorText: {
    color: '#fecaca',
    fontSize: '13px',
    fontWeight: 800,
    lineHeight: 1.5,
    margin: '0 0 14px',
  },
  enterBtn: {
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '14px',
    padding: '15px 18px',
    fontSize: '14px',
    fontWeight: 900,
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  waitingScreen: {
    minHeight: 'calc(100vh - 160px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  orbitWrap: {
    position: 'relative',
    width: '168px',
    height: '168px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '28px',
  },
  orbitRing: {
    position: 'absolute',
    inset: 0,
    borderRadius: '50%',
    border: '2px solid #cffafe',
    borderTopColor: '#06b6d4',
    animation: 'orbit 1.2s linear infinite',
  },
  waitingCore: {
    width: '112px',
    height: '112px',
    borderRadius: '34px',
    background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 24px 58px rgba(0, 210, 255, 0.24)',
  },
  matchedIcon: {
    width: '126px',
    height: '126px',
    borderRadius: '36px',
    background: 'linear-gradient(135deg, #ecfeff, #eff6ff)',
    color: '#0891b2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '28px',
  },
  stateTitle: {
    color: '#0f172a',
    fontSize: '42px',
    fontWeight: 900,
    letterSpacing: '-0.03em',
    margin: '0 0 12px',
  },
  stateCopy: {
    color: '#64748b',
    fontSize: '15px',
    fontWeight: 700,
    margin: '0 0 18px',
  },
  monoValue: {
    color: '#0891b2',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 900,
  },
  selectedModelPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#0891b2',
    background: '#ffffff',
    border: '1px solid #cffafe',
    borderRadius: '999px',
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: 900,
    marginBottom: '22px',
  },
  leaveBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    color: '#64748b',
    borderRadius: '12px',
    padding: '12px 18px',
    fontSize: '13px',
    fontWeight: 900,
    cursor: 'pointer',
  },
  loadingOrb: {
    width: '52px',
    height: '52px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 16px 34px rgba(0, 210, 255, 0.25)',
    marginBottom: '14px',
  },
  loadingText: {
    color: '#64748b',
    fontSize: '14px',
    fontWeight: 800,
  },
}
