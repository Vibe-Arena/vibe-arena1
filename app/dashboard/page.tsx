'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Activity,
  ArrowRight,
  ChevronDown,
  Clock3,
  Code2,
  Crown,
  Gauge,
  LogOut,
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
  { label: 'Matches', value: '0', hint: 'Season total', icon: Code2 },
  { label: 'Wins', value: '0', hint: 'Clean victories', icon: Trophy },
  { label: 'Win Rate', value: '0%', hint: 'Ranked arena', icon: Gauge },
  { label: 'Streak', value: '0', hint: 'Current run', icon: Zap },
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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.45; transform: scale(0.82); } }
        @keyframes driftIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .dash-enter { animation: driftIn 0.45s ease both; }
        .dash-card { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .dash-card:hover { transform: translateY(-3px); box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08); border-color: #cffafe; }
        .aqua-button { transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease; }
        .aqua-button:hover { transform: translateY(-2px); filter: brightness(1.04); box-shadow: 0 16px 30px rgba(0, 210, 255, 0.28); }
        @media (max-width: 980px) {
          .dashboard-shell { padding: 0 18px 36px !important; }
          .hero-grid, .content-grid, .stats-grid, .model-grid { grid-template-columns: 1fr !important; }
          .nav-links { display: none !important; }
          .hero-title { font-size: 42px !important; }
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
        <section className="hero-grid dash-enter" style={styles.heroGrid}>
          <div style={styles.hero}>
            <div style={styles.heroTopline}>
              <span style={styles.liveDot} />
              Next battle window
            </div>
            <h1 className="hero-title" style={styles.heroTitle}>
              {nextWindow.name}
              <span style={styles.heroTitleAccent}> opens soon.</span>
            </h1>
            <p style={styles.heroCopy}>
              Jump into a 15-minute AI build duel, ship the cleanest interface, and climb Season 1.
            </p>

            <div style={styles.heroMeta}>
              <div style={styles.metaItem}>
                <Clock3 size={16} />
                {nextWindow.start}-{nextWindow.end} {nextWindow.timezone}
              </div>
              <div style={styles.metaItem}>
                <Code2 size={16} />
                Frontend sprint
              </div>
              <div style={styles.metaItem}>
                <ShieldCheck size={16} />
                AI judged
              </div>
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

          <aside style={styles.readinessPanel}>
            <div style={styles.panelHeader}>
              <span style={styles.kicker}>Arena Readiness</span>
              <span style={styles.statusPill}>Season 1</span>
            </div>
            <div style={styles.scoreRing}>
              <div style={styles.scoreInner}>
                <span style={styles.scoreValue}>0</span>
                <span style={styles.scoreLabel}>rank pts</span>
              </div>
            </div>
            <div style={styles.readinessList}>
              {['Account ready', 'Model selection unlocked', 'Replay history empty'].map((item, i) => (
                <div key={item} style={styles.checkRow}>
                  <span style={{ ...styles.checkMark, background: i < 2 ? '#dcfce7' : '#f8fafc', color: i < 2 ? '#16a34a' : '#94a3b8' }}>
                    {i < 2 ? 'OK' : '-'}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="stats-grid dash-enter" style={styles.statsGrid}>
          {STATS.map(({ label, value, hint, icon: Icon }) => (
            <div className="dash-card" key={label} style={styles.statCard}>
              <div style={styles.statIcon}><Icon size={18} /></div>
              <div>
                <div style={styles.statValue}>{value}</div>
                <div style={styles.statLabel}>{label}</div>
                <div style={styles.statHint}>{hint}</div>
              </div>
            </div>
          ))}
        </section>

        <section className="content-grid" style={styles.contentGrid}>
          <div style={styles.leftColumn}>
            <div className="dash-card" style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <p style={styles.kicker}>Battle Windows</p>
                  <h2 style={styles.sectionTitle}>Today&apos;s schedule</h2>
                </div>
                <Clock3 size={18} color="#06b6d4" />
              </div>

              <div style={styles.windowList}>
                {WINDOWS.map(window => (
                  <div key={window.name} style={styles.windowRow}>
                    <div style={styles.windowLeft}>
                      <span style={styles.windowBadge}>{window.region}</span>
                      <div>
                        <p style={styles.windowName}>{window.name}</p>
                        <p style={styles.windowTime}>{window.start}-{window.end} {window.timezone}</p>
                      </div>
                    </div>
                    <span style={{
                      ...styles.windowStatus,
                      background: window.status === 'Soon' ? '#ecfeff' : '#f8fafc',
                      color: window.status === 'Soon' ? '#0891b2' : '#94a3b8',
                    }}>
                      {window.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="dash-card" style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <p style={styles.kicker}>Model Intel</p>
                  <h2 style={styles.sectionTitle}>Pick your weapon</h2>
                </div>
                <Sparkles size={18} color="#06b6d4" />
              </div>

              <div className="model-grid" style={styles.modelGrid}>
                {MODELS.map(model => (
                  <div key={model.name} style={styles.modelCard}>
                    <div style={{ ...styles.modelOrb, background: `${model.accent}18`, color: model.accent }}>
                      {model.name.slice(0, 1)}
                    </div>
                    <p style={styles.modelName}>{model.name}</p>
                    <p style={styles.modelProvider}>{model.provider} / {model.style}</p>
                    <div style={styles.modelMeter}>
                      <div style={{ ...styles.modelMeterFill, width: `${model.winRate}%`, background: model.accent }} />
                    </div>
                    <p style={styles.modelRate}>{model.winRate}% test win rate</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.rightColumn}>
            <div className="dash-card" style={styles.walletCard}>
              <p style={styles.kicker}>Wallet</p>
              <div style={styles.walletAmount}>{balance.toFixed(4)} SOL</div>
              <p style={styles.walletSub}>Approx. $0.00 USD</p>
              <button style={styles.withdrawBtn}>Withdraw</button>
            </div>

            <div className="dash-card" style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <p style={styles.kicker}>Activity</p>
                  <h2 style={styles.sectionTitle}>Latest signals</h2>
                </div>
                <Activity size={18} color="#06b6d4" />
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

const styles: Record<string, React.CSSProperties> = {
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
    maxWidth: '1220px',
    margin: '0 auto',
    padding: '32px 28px 56px',
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.65fr) minmax(320px, 0.8fr)',
    gap: '18px',
    marginBottom: '18px',
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
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
    maxWidth: '740px',
    color: '#0f172a',
    fontSize: '58px',
    fontWeight: 900,
    lineHeight: 0.96,
    letterSpacing: '-0.03em',
    margin: '0 0 20px',
  },
  heroTitleAccent: {
    color: '#06b6d4',
  },
  heroCopy: {
    maxWidth: '620px',
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
    marginBottom: '30px',
  },
  metaItem: {
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
  heroActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  queueBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
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
  readinessPanel: {
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
  scoreRing: {
    width: '190px',
    height: '190px',
    borderRadius: '50%',
    padding: '12px',
    margin: '0 auto 24px',
    background: 'conic-gradient(#00d2ff 0deg, #3a7bd5 32deg, #e2e8f0 32deg 360deg)',
  },
  scoreInner: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #f1f5f9',
  },
  scoreValue: {
    color: '#0f172a',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '46px',
    fontWeight: 900,
    lineHeight: 1,
  },
  scoreLabel: {
    color: '#94a3b8',
    fontSize: '11px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginTop: '8px',
  },
  readinessList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  checkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#475569',
    fontSize: '13px',
    fontWeight: 700,
  },
  checkMark: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 900,
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
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '18px',
    padding: '18px',
    boxShadow: '0 18px 50px rgba(15, 23, 42, 0.04)',
  },
  statIcon: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    background: '#ecfeff',
    color: '#0891b2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statValue: {
    color: '#0f172a',
    fontSize: '26px',
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
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.45fr) minmax(300px, 0.72fr)',
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
  card: {
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
    fontSize: '22px',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    margin: '6px 0 0',
  },
  windowList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  windowRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '14px',
    padding: '14px',
    border: '1px solid #f1f5f9',
    borderRadius: '16px',
    background: '#fbfdff',
  },
  windowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  windowBadge: {
    minWidth: '72px',
    textAlign: 'center',
    color: '#0891b2',
    background: '#ecfeff',
    border: '1px solid #cffafe',
    borderRadius: '999px',
    padding: '7px 10px',
    fontSize: '11px',
    fontWeight: 900,
  },
  windowName: {
    color: '#0f172a',
    fontSize: '14px',
    fontWeight: 900,
    margin: '0 0 3px',
  },
  windowTime: {
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: 700,
    margin: 0,
  },
  windowStatus: {
    borderRadius: '999px',
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: 900,
  },
  modelGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '12px',
  },
  modelCard: {
    border: '1px solid #f1f5f9',
    background: '#fbfdff',
    borderRadius: '16px',
    padding: '16px',
  },
  modelOrb: {
    width: '42px',
    height: '42px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 900,
    marginBottom: '14px',
  },
  modelName: {
    color: '#0f172a',
    fontSize: '14px',
    fontWeight: 900,
    margin: '0 0 4px',
  },
  modelProvider: {
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: 700,
    margin: '0 0 14px',
  },
  modelMeter: {
    height: '5px',
    background: '#e2e8f0',
    borderRadius: '999px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  modelMeterFill: {
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
    background: 'linear-gradient(160deg, #0f172a 0%, #13334a 58%, #0e7490 100%)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 24px 70px rgba(14, 116, 144, 0.2)',
  },
  walletAmount: {
    color: '#ffffff',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '36px',
    fontWeight: 900,
    margin: '16px 0 4px',
  },
  walletSub: {
    color: '#a5f3fc',
    fontSize: '13px',
    fontWeight: 700,
    margin: '0 0 22px',
  },
  withdrawBtn: {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.12)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    borderRadius: '12px',
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
    padding: '12px',
    border: '1px solid #f1f5f9',
    borderRadius: '14px',
    background: '#fbfdff',
  },
  activityIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ecfeff',
    color: '#0891b2',
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
    fontWeight: 700,
    lineHeight: 1.5,
    margin: 0,
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
