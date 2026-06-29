'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Blocks,
  ChevronDown,
  Clock3,
  Code2,
  Crown,
  Flame,
  Gauge,
  Layers3,
  LogOut,
  Medal,
  Play,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  Wallet,
  Zap,
} from 'lucide-react'

type User = {
  id: string
  username: string
  email: string
  sol_balance: number
}

type BattleWindow = {
  name: string
  region: string
  start: string
  end: string
  timezone: string
  status: 'Open' | 'Soon' | 'Closed'
}

const WINDOWS: BattleWindow[] = [
  { name: 'EU Prime', region: 'Europe', start: '18:00', end: '20:00', timezone: 'CET', status: 'Soon' },
  { name: 'US East', region: 'Americas', start: '19:00', end: '21:00', timezone: 'EST', status: 'Closed' },
  { name: 'Asia Night', region: 'Asia', start: '20:00', end: '22:00', timezone: 'JST', status: 'Closed' },
]

const STATS = [
  { label: 'Matches', value: '0', hint: 'Season total', icon: Code2, color: '#0ea5e9' },
  { label: 'Wins', value: '0', hint: 'Clean victories', icon: Trophy, color: '#f59e0b' },
  { label: 'Win Rate', value: '0%', hint: 'Ranked arena', icon: Gauge, color: '#10b981' },
  { label: 'Streak', value: '0', hint: 'Current run', icon: Flame, color: '#f97316' },
]

const MODELS = [
  { name: 'Llama 3.1', provider: 'Meta', accent: '#7B61FF', winRate: 51, style: 'Balanced' },
  { name: 'Mistral 7B', provider: 'Mistral', accent: '#FF6B35', winRate: 48, style: 'Fast' },
  { name: 'Gemma 2', provider: 'Google', accent: '#4285F4', winRate: 46, style: 'Precise' },
]

const ACTIVITY = [
  { title: 'No ranked battles yet', detail: 'Your first completed arena match will appear here.', icon: Activity },
  { title: 'Season 1 ready', detail: 'Queue opens during the next battle window.', icon: Crown },
  { title: 'Judging stack online', detail: 'Multi-judge scoring is prepared for match results.', icon: ShieldCheck },
]

const LANES = [
  { label: 'Queue', value: 'Stand by', icon: Play },
  { label: 'Build', value: '15 min', icon: Blocks },
  { label: 'Judging', value: 'AI panel', icon: Sparkles },
  { label: 'Rank', value: '+ points', icon: Medal },
]

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }

      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      setUser(data)
      setLoading(false)
    }
    getUser()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const balance = user?.sol_balance ?? 0
  const nextWindow = WINDOWS[0]

  if (loading) {
    return (
      <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center' }}>
        <div style={styles.loadingOrb}>
          <Sparkles size={22} />
        </div>
        <p style={styles.loadingText}>Loading arena...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes riseIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.45; transform: scale(0.82); } }
        @keyframes scanLine { 0% { transform: translateY(-80%); opacity: 0; } 20%, 80% { opacity: 1; } 100% { transform: translateY(360%); opacity: 0; } }
        @keyframes floatCard { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        .dash-enter { animation: riseIn 0.48s ease both; }
        .control-card { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .control-card:hover { transform: translateY(-3px); box-shadow: 0 24px 70px rgba(15, 23, 42, 0.1); border-color: rgba(14, 165, 233, 0.32); }
        .arena-scan:after {
          content: '';
          position: absolute;
          left: 18px;
          right: 18px;
          top: 22%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.75), transparent);
          animation: scanLine 3.4s ease-in-out infinite;
        }
        .float-one { animation: floatCard 4.6s ease-in-out infinite; }
        .float-two { animation: floatCard 5.2s ease-in-out infinite 0.4s; }
        .aqua-button { transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease; }
        .aqua-button:hover { transform: translateY(-2px); filter: brightness(1.04); box-shadow: 0 18px 36px rgba(14, 165, 233, 0.28); }
        @media (max-width: 980px) {
          .dashboard-shell { padding: 20px 18px 40px !important; }
          .command-grid, .lower-grid, .stats-grid, .intel-grid { grid-template-columns: 1fr !important; }
          .nav-links { display: none !important; }
          .hero-title { font-size: 42px !important; }
          .arena-visual { min-height: 380px !important; }
        }
        @media (max-width: 620px) {
          .hero-panel, .arena-visual, .control-panel { padding: 22px !important; }
          .hero-title { font-size: 34px !important; }
          .lane-strip { grid-template-columns: 1fr 1fr !important; }
          .user-name { display: none !important; }
        }
      `}</style>

      <nav style={styles.navbar}>
        <button 
  style={styles.brand} 
  onClick={() => router.push('/dashboard')} 
  aria-label="Vibe Arena dashboard"
>
  <Image 
  src="/Logo234.png" 
  alt="Vibe Arena" 
  width={70} 
  height={70} 
  style={styles.logo} 
  priority 
/>
</button>

        <div className="nav-links" style={styles.navLinks}>
          <a href="/dashboard" style={{ ...styles.navLink, color: '#0f172a' }}>Dashboard</a>
          <a href="/leaderboard" style={styles.navLink}>Leaderboard</a>
          <a href="/queue" style={styles.navLink}>Queue</a>
        </div>

        <div style={{ position: 'relative' }}>
          <button style={styles.userBtn} onClick={() => setDropdownOpen(!dropdownOpen)}>
            <span style={styles.balancePill}>
              <Wallet size={14} />
              {balance.toFixed(3)} SOL
            </span>
            <span style={styles.userName}>{user?.username}</span>
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

      <main className="dashboard-shell" style={styles.main}>
        <section className="command-grid dash-enter" style={styles.commandGrid}>
          <div className="hero-panel" style={styles.heroPanel}>
            <div style={styles.eyebrowRow}>
              <span style={styles.liveBadge}>
                <span style={styles.liveDot} />
                Mission control
              </span>
              <span style={styles.windowPill}>{nextWindow.start}-{nextWindow.end} {nextWindow.timezone}</span>
            </div>

            <h1 className="hero-title" style={styles.heroTitle}>
              Welcome back, {user?.username || 'builder'}.
              <span style={styles.heroAccent}> Your arena is warming up.</span>
            </h1>

            <p style={styles.heroCopy}>
              A cleaner command center for the next sprint: watch the next window, check your season state, and jump straight into matchmaking.
            </p>

            <div className="lane-strip" style={styles.laneStrip}>
              {LANES.map(({ label, value, icon: Icon }) => (
                <div key={label} style={styles.laneItem}>
                  <span style={styles.laneIcon}><Icon size={16} /></span>
                  <div>
                    <p style={styles.laneLabel}>{label}</p>
                    <p style={styles.laneValue}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.heroActions}>
              <button className="aqua-button" style={styles.queueBtn} onClick={() => router.push('/queue')}>
                Enter Queue <ArrowRight size={18} />
              </button>
              <button style={styles.secondaryBtn} onClick={() => router.push('/leaderboard')}>
                View rankings
              </button>
            </div>
          </div>

          <aside className="arena-visual arena-scan" style={styles.arenaVisual}>
            <div style={styles.visualTop}>
              <div>
                <p style={styles.kicker}>Next Window</p>
                <h2 style={styles.visualTitle}>{nextWindow.name}</h2>
              </div>
              <span style={styles.soonPill}>{nextWindow.status}</span>
            </div>

            <div style={styles.radar}>
              <div style={styles.radarCore}>
                <Zap size={32} />
              </div>
              <span style={{ ...styles.radarNode, top: '18%', left: '18%' }} />
              <span style={{ ...styles.radarNode, top: '26%', right: '16%' }} />
              <span style={{ ...styles.radarNode, bottom: '21%', left: '24%' }} />
              <span style={{ ...styles.radarNode, bottom: '16%', right: '22%' }} />
            </div>

            <div className="float-one" style={{ ...styles.floatChip, left: 22, bottom: 28 }}>
              <Clock3 size={15} />
              {nextWindow.start} launch
            </div>
            <div className="float-two" style={{ ...styles.floatChip, right: 22, bottom: 88 }}>
              <ShieldCheck size={15} />
              AI judged
            </div>
          </aside>
        </section>

        <section className="stats-grid dash-enter" style={styles.statsGrid}>
          {STATS.map(({ label, value, hint, icon: Icon, color }) => (
            <div className="control-card" key={label} style={styles.statCard}>
              <span style={{ ...styles.statIcon, background: `${color}16`, color }}>
                <Icon size={18} />
              </span>
              <div>
                <div style={styles.statValue}>{value}</div>
                <div style={styles.statLabel}>{label}</div>
                <div style={styles.statHint}>{hint}</div>
              </div>
            </div>
          ))}
        </section>

        <section className="lower-grid dash-enter" style={styles.lowerGrid}>
          <div style={styles.leftColumn}>
            <div className="control-card control-panel" style={styles.controlPanel}>
              <div style={styles.panelHeader}>
                <div>
                  <p style={styles.kicker}>Today&apos;s Route</p>
                  <h2 style={styles.sectionTitle}>Battle windows</h2>
                </div>
                <BarChart3 size={18} color="#0ea5e9" />
              </div>

              <div style={styles.timeline}>
                {WINDOWS.map((window, index) => (
                  <div key={window.name} style={styles.timelineRow}>
                    <div style={styles.timelineTrack}>
                      <span style={{
                        ...styles.timelineDot,
                        background: window.status === 'Soon' ? '#22c55e' : '#cbd5e1',
                        boxShadow: window.status === 'Soon' ? '0 0 0 6px rgba(34, 197, 94, 0.12)' : 'none',
                      }} />
                      {index < WINDOWS.length - 1 && <span style={styles.timelineLine} />}
                    </div>
                    <div style={styles.windowCard}>
                      <div>
                        <span style={styles.windowRegion}>{window.region}</span>
                        <h3 style={styles.windowName}>{window.name}</h3>
                        <p style={styles.windowTime}>{window.start}-{window.end} {window.timezone}</p>
                      </div>
                      <span style={{
                        ...styles.windowStatus,
                        background: window.status === 'Soon' ? '#dcfce7' : '#f1f5f9',
                        color: window.status === 'Soon' ? '#15803d' : '#94a3b8',
                      }}>
                        {window.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="control-card control-panel" style={styles.controlPanel}>
              <div style={styles.panelHeader}>
                <div>
                  <p style={styles.kicker}>Model Lab</p>
                  <h2 style={styles.sectionTitle}>Arena picks</h2>
                </div>
                <Layers3 size={18} color="#0ea5e9" />
              </div>

              <div className="intel-grid" style={styles.intelGrid}>
                {MODELS.map(model => (
                  <div key={model.name} style={styles.modelTile}>
                    <div style={styles.modelTop}>
                      <span style={{ ...styles.modelMark, background: `${model.accent}18`, color: model.accent }}>
                        {model.name.slice(0, 1)}
                      </span>
                      <span style={styles.modelStyle}>{model.style}</span>
                    </div>
                    <h3 style={styles.modelName}>{model.name}</h3>
                    <p style={styles.modelProvider}>{model.provider}</p>
                    <div style={styles.modelMeter}>
                      <span style={{ ...styles.modelMeterFill, width: `${model.winRate}%`, background: model.accent }} />
                    </div>
                    <p style={styles.modelRate}>{model.winRate}% practice signal</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.rightColumn}>
            <div className="control-card" style={styles.walletCard}>
              <div style={styles.walletHeader}>
                <p style={styles.darkKicker}>Wallet</p>
                <Wallet size={18} color="#a5f3fc" />
              </div>
              <div style={styles.walletAmount}>{balance.toFixed(4)} SOL</div>
              <p style={styles.walletSub}>Ready for prizes, payouts, and entry flows.</p>
              <button style={styles.withdrawBtn}>Withdraw</button>
            </div>

            <div className="control-card control-panel" style={styles.controlPanel}>
              <div style={styles.panelHeader}>
                <div>
                  <p style={styles.kicker}>Signals</p>
                  <h2 style={styles.sectionTitle}>Latest activity</h2>
                </div>
                <Activity size={18} color="#0ea5e9" />
              </div>

              <div style={styles.activityList}>
                {ACTIVITY.map(({ title, detail, icon: Icon }) => (
                  <div key={title} style={styles.activityItem}>
                    <span style={styles.activityIcon}><Icon size={16} /></span>
                    <div>
                      <p style={styles.activityTitle}>{title}</p>
                      <p style={styles.activityDetail}>{detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at 12% 12%, rgba(14, 165, 233, 0.12), transparent 30%), radial-gradient(circle at 92% 18%, rgba(245, 158, 11, 0.1), transparent 28%), linear-gradient(180deg, #ffffff 0%, #f8fafc 45%, #eef9ff 100%)',
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
    width: '70px',
    height: '70px',
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
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '32px 28px 56px',
  },
  commandGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(360px, 0.8fr)',
    gap: '18px',
    marginBottom: '18px',
  },
  heroPanel: {
    position: 'relative',
    overflow: 'hidden',
    background: 'rgba(255, 255, 255, 0.78)',
    border: '1px solid rgba(203, 213, 225, 0.78)',
    borderRadius: '28px',
    padding: '42px',
    boxShadow: '0 30px 90px rgba(15, 23, 42, 0.08)',
  },
  eyebrowRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '28px',
  },
  liveBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '9px',
    color: '#0369a1',
    background: '#e0f2fe',
    border: '1px solid #bae6fd',
    borderRadius: '999px',
    padding: '8px 12px',
    fontSize: '11px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
  },
  liveDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#22c55e',
    animation: 'pulseDot 1.4s ease infinite',
  },
  windowPill: {
    color: '#475569',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '999px',
    padding: '8px 12px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    fontWeight: 900,
  },
  heroTitle: {
    maxWidth: '780px',
    color: '#0f172a',
    fontSize: '58px',
    fontWeight: 900,
    lineHeight: 0.97,
    margin: '0 0 20px',
  },
  heroAccent: {
    color: '#0ea5e9',
  },
  heroCopy: {
    maxWidth: '680px',
    color: '#64748b',
    fontSize: '17px',
    fontWeight: 650,
    lineHeight: 1.7,
    margin: '0 0 28px',
  },
  laneStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '10px',
    marginBottom: '30px',
  },
  laneItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '12px',
  },
  laneIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '12px',
    background: '#f0f9ff',
    color: '#0284c7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  laneLabel: {
    color: '#94a3b8',
    fontSize: '10px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    margin: '0 0 3px',
  },
  laneValue: {
    color: '#0f172a',
    fontSize: '13px',
    fontWeight: 900,
    margin: 0,
  },
  heroActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  queueBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    background: 'linear-gradient(135deg, #0284c7 0%, #22d3ee 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '14px',
    padding: '15px 24px',
    fontSize: '14px',
    fontWeight: 900,
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  secondaryBtn: {
    background: '#ffffff',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '15px 22px',
    fontSize: '14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  arenaVisual: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: '430px',
    background: 'linear-gradient(155deg, #0f172a 0%, #164e63 58%, #0e7490 100%)',
    border: '1px solid rgba(255, 255, 255, 0.16)',
    borderRadius: '28px',
    padding: '26px',
    boxShadow: '0 30px 90px rgba(14, 116, 144, 0.24)',
    color: '#ffffff',
  },
  visualTop: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '14px',
  },
  kicker: {
    color: '#0284c7',
    fontSize: '11px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    margin: 0,
  },
  darkKicker: {
    color: '#a5f3fc',
    fontSize: '11px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    margin: 0,
  },
  visualTitle: {
    fontSize: '28px',
    fontWeight: 900,
    margin: '6px 0 0',
  },
  soonPill: {
    color: '#cffafe',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: '999px',
    padding: '7px 11px',
    fontSize: '11px',
    fontWeight: 900,
  },
  radar: {
    position: 'absolute',
    inset: '98px 32px 68px',
    borderRadius: '50%',
    border: '1px solid rgba(207, 250, 254, 0.22)',
    background: 'repeating-radial-gradient(circle, rgba(207, 250, 254, 0.13) 0 1px, transparent 1px 44px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCore: {
    width: '96px',
    height: '96px',
    borderRadius: '32px',
    background: 'linear-gradient(135deg, #22d3ee, #2563eb)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 20px 44px rgba(34, 211, 238, 0.32)',
  },
  radarNode: {
    position: 'absolute',
    width: '13px',
    height: '13px',
    borderRadius: '50%',
    background: '#facc15',
    boxShadow: '0 0 0 8px rgba(250, 204, 21, 0.12)',
  },
  floatChip: {
    position: 'absolute',
    zIndex: 3,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: '#cffafe',
    background: 'rgba(15, 23, 42, 0.54)',
    border: '1px solid rgba(207, 250, 254, 0.18)',
    borderRadius: '999px',
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: 900,
    backdropFilter: 'blur(14px)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '14px',
    marginBottom: '18px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    background: 'rgba(255, 255, 255, 0.82)',
    border: '1px solid rgba(226, 232, 240, 0.9)',
    borderRadius: '20px',
    padding: '18px',
    boxShadow: '0 18px 50px rgba(15, 23, 42, 0.05)',
  },
  statIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statValue: {
    color: '#0f172a',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '28px',
    fontWeight: 900,
    lineHeight: 1,
  },
  statLabel: {
    color: '#475569',
    fontSize: '12px',
    fontWeight: 900,
    marginTop: '6px',
  },
  statHint: {
    color: '#94a3b8',
    fontSize: '11px',
    fontWeight: 700,
    marginTop: '2px',
  },
  lowerGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.36fr) minmax(310px, 0.72fr)',
    gap: '18px',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  controlPanel: {
    background: 'rgba(255, 255, 255, 0.86)',
    border: '1px solid rgba(226, 232, 240, 0.95)',
    borderRadius: '22px',
    padding: '22px',
    boxShadow: '0 18px 50px rgba(15, 23, 42, 0.05)',
  },
  panelHeader: {
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
    margin: '6px 0 0',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  timelineRow: {
    display: 'grid',
    gridTemplateColumns: '28px minmax(0, 1fr)',
    gap: '14px',
    minHeight: '90px',
  },
  timelineTrack: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    paddingTop: '23px',
  },
  timelineDot: {
    position: 'relative',
    zIndex: 2,
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  timelineLine: {
    position: 'absolute',
    top: '36px',
    bottom: '-28px',
    width: '2px',
    background: '#e2e8f0',
  },
  windowCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
    background: '#fbfdff',
    border: '1px solid #eef2f7',
    borderRadius: '18px',
    padding: '15px',
    marginBottom: '12px',
  },
  windowRegion: {
    display: 'inline-flex',
    color: '#0284c7',
    background: '#e0f2fe',
    borderRadius: '999px',
    padding: '5px 8px',
    fontSize: '10px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '8px',
  },
  windowName: {
    color: '#0f172a',
    fontSize: '16px',
    fontWeight: 900,
    margin: '0 0 4px',
  },
  windowTime: {
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: 800,
    margin: 0,
  },
  windowStatus: {
    borderRadius: '999px',
    padding: '7px 10px',
    fontSize: '11px',
    fontWeight: 900,
    flexShrink: 0,
  },
  intelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '12px',
  },
  modelTile: {
    background: '#fbfdff',
    border: '1px solid #eef2f7',
    borderRadius: '18px',
    padding: '16px',
  },
  modelTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '14px',
  },
  modelMark: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '17px',
    fontWeight: 900,
  },
  modelStyle: {
    color: '#64748b',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '999px',
    padding: '5px 8px',
    fontSize: '10px',
    fontWeight: 900,
  },
  modelName: {
    color: '#0f172a',
    fontSize: '15px',
    fontWeight: 900,
    margin: '0 0 4px',
  },
  modelProvider: {
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: 800,
    margin: '0 0 14px',
  },
  modelMeter: {
    height: '6px',
    background: '#e2e8f0',
    borderRadius: '999px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  modelMeterFill: {
    display: 'block',
    height: '100%',
    borderRadius: '999px',
  },
  modelRate: {
    color: '#64748b',
    fontSize: '11px',
    fontWeight: 800,
    margin: 0,
  },
  walletCard: {
    background: 'linear-gradient(160deg, #111827 0%, #134e4a 56%, #0f766e 100%)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '22px',
    padding: '24px',
    boxShadow: '0 24px 70px rgba(15, 118, 110, 0.22)',
  },
  walletHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
  },
  walletAmount: {
    color: '#ffffff',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '38px',
    fontWeight: 900,
    margin: '18px 0 8px',
  },
  walletSub: {
    color: '#ccfbf1',
    fontSize: '13px',
    fontWeight: 750,
    lineHeight: 1.6,
    margin: '0 0 22px',
  },
  withdrawBtn: {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.22)',
    color: '#ffffff',
    borderRadius: '13px',
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: 900,
    cursor: 'pointer',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  activityItem: {
    display: 'flex',
    gap: '12px',
    padding: '13px',
    border: '1px solid #eef2f7',
    borderRadius: '16px',
    background: '#fbfdff',
  },
  activityIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#e0f2fe',
    color: '#0284c7',
    flexShrink: 0,
  },
  activityTitle: {
    color: '#0f172a',
    fontSize: '13px',
    fontWeight: 900,
    margin: '0 0 4px',
  },
  activityDetail: {
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: 750,
    lineHeight: 1.5,
    margin: 0,
  },
  loadingOrb: {
    width: '52px',
    height: '52px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, #0284c7, #22d3ee)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 16px 34px rgba(14, 165, 233, 0.25)',
    marginBottom: '14px',
  },
  loadingText: {
    color: '#64748b',
    fontSize: '14px',
    fontWeight: 800,
  },
}
