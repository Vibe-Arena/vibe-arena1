'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowDownWideNarrow,
  ChevronDown,
  Crown,
  Gauge,
  LogOut,
  Medal,
  Settings,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  Wallet,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type User = {
  id: string
  username: string
  email?: string
  sol_balance?: number
}

type RankEntry = {
  username: string
  wins: number
  losses: number
  win_rate: number
  total_earnings: number
}

type Tab = 'wins' | 'winrate' | 'earnings'

const TABS: Array<{
  id: Tab
  label: string
  icon: typeof Trophy
  metric: keyof Pick<RankEntry, 'wins' | 'win_rate' | 'total_earnings'>
}> = [
  { id: 'wins', label: 'Most Wins', icon: Trophy, metric: 'wins' },
  { id: 'winrate', label: 'Best Rate', icon: Gauge, metric: 'win_rate' },
  { id: 'earnings', label: 'Top Earnings', icon: Wallet, metric: 'total_earnings' },
]

const getRankAccent = (index: number) => {
  if (index === 0) return '#f59e0b'
  if (index === 1) return '#64748b'
  if (index === 2) return '#b45309'
  return '#06b6d4'
}

const getInitials = (name: string) =>
  name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || 'VA'

export default function LeaderboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [tab, setTab] = useState<Tab>('wins')
  const [rankings, setRankings] = useState<RankEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login')
        return
      }

      const [{ data: userData }, { data: rankingData }] = await Promise.all([
        supabase.from('users').select('*').eq('id', authUser.id).single(),
        supabase
          .from('season_rankings')
          .select(`
            wins,
            losses,
            win_rate,
            total_earnings,
            users (username)
          `)
          .order('wins', { ascending: false })
          .limit(100),
      ])

      const formatted = (rankingData || []).map((row: any) => ({
        username: row.users?.username || 'unknown',
        wins: Number(row.wins || 0),
        losses: Number(row.losses || 0),
        win_rate: Number(row.win_rate || 0),
        total_earnings: Number(row.total_earnings || 0),
      }))

      setUser(userData)
      setRankings(formatted)
      setLoading(false)
    }

    init()
  }, [router])

  const activeMetric = TABS.find(item => item.id === tab)?.metric || 'wins'

  const sorted = useMemo(() => {
    return [...rankings].sort((a, b) => {
      const primary = Number(b[activeMetric]) - Number(a[activeMetric])
      if (primary !== 0) return primary
      return b.wins - a.wins || b.win_rate - a.win_rate
    })
  }, [activeMetric, rankings])

  const topThree = sorted.slice(0, 3)
  const currentRank = sorted.findIndex(entry => entry.username === user?.username) + 1
  const totalBattles = rankings.reduce((sum, entry) => sum + entry.wins + entry.losses, 0)
  const totalPrize = rankings.reduce((sum, entry) => sum + entry.total_earnings, 0)
  const balance = user?.sol_balance ?? 0

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatMetric = (entry: RankEntry, metric: typeof activeMetric) => {
    if (metric === 'win_rate') return `${entry.win_rate.toFixed(1)}%`
    if (metric === 'total_earnings') return `${entry.total_earnings.toFixed(3)} SOL`
    return entry.wins.toString()
  }

  if (loading) {
    return (
      <div style={{ ...styles.container, alignItems: 'center', justifyContent: 'center' }}>
        <div style={styles.loadingOrb}>
          <Sparkles size={22} />
        </div>
        <p style={styles.loadingText}>Loading rankings...</p>
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
        .leader-enter { animation: driftIn 0.42s ease both; }
        .leader-card { transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
        .leader-card:hover { transform: translateY(-2px); box-shadow: 0 24px 64px rgba(15, 23, 42, 0.08); border-color: #cffafe; }
        .tab-button { transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease; }
        .leader-row { transition: background 0.2s ease, transform 0.2s ease; }
        .leader-row:hover { background: #f8fafc !important; transform: translateX(3px); }
        @media (max-width: 980px) {
          .leader-shell { padding: 24px 18px 40px !important; }
          .hero-grid, .podium-grid, .stats-grid { grid-template-columns: 1fr !important; }
          .nav-links { display: none !important; }
          .leader-title { font-size: 42px !important; }
          .leader-table { min-width: 760px; }
          .table-scroll { overflow-x: auto; }
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
          <a href="/dashboard" style={styles.navLink}>Dashboard</a>
          <a href="/leaderboard" style={{ ...styles.navLink, color: '#0f172a' }}>Leaderboard</a>
          <a href="/queue" style={styles.navLink}>Queue</a>
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

      <main className="leader-shell" style={styles.main}>
        <section className="hero-grid leader-enter" style={styles.heroGrid}>
          <div style={styles.hero}>
            <div style={styles.heroTopline}>
              <span style={styles.liveDot} />
              Season 1 standings
            </div>
            <h1 className="leader-title" style={styles.heroTitle}>
              The arena&apos;s sharpest builders, ranked.
            </h1>
            <p style={styles.heroCopy}>
              Track wins, consistency, and prize earnings across every completed Vibe Arena battle.
            </p>
            <div style={styles.heroActions}>
              <button style={styles.primaryBtn} onClick={() => router.push('/queue')}>
                Enter Queue
              </button>
              <button style={styles.secondaryBtn} onClick={() => router.push('/dashboard')}>
                Dashboard
              </button>
            </div>
          </div>

          <aside style={styles.rankPanel}>
            <div style={styles.panelHeader}>
              <span style={styles.kicker}>Your Rank</span>
              <span style={styles.statusPill}>{currentRank ? `#${currentRank}` : 'Unranked'}</span>
            </div>
            <div style={styles.rankBadge}>
              <Crown size={34} />
            </div>
            <h2 style={styles.rankTitle}>{user?.username || 'Player'}</h2>
            <p style={styles.rankCopy}>
              {currentRank
                ? `You are currently sitting at #${currentRank} out of ${sorted.length} ranked players.`
                : 'Complete a ranked battle to land on the board.'}
            </p>
          </aside>
        </section>

        <section className="stats-grid leader-enter" style={styles.statsGrid}>
          <div className="leader-card" style={styles.statCard}>
            <span style={styles.statIcon}><UserRound size={18} /></span>
            <div>
              <div style={styles.statValue}>{rankings.length}</div>
              <div style={styles.statLabel}>Ranked Players</div>
            </div>
          </div>
          <div className="leader-card" style={styles.statCard}>
            <span style={styles.statIcon}><Target size={18} /></span>
            <div>
              <div style={styles.statValue}>{totalBattles}</div>
              <div style={styles.statLabel}>Recorded Battles</div>
            </div>
          </div>
          <div className="leader-card" style={styles.statCard}>
            <span style={styles.statIcon}><Wallet size={18} /></span>
            <div>
              <div style={styles.statValue}>{totalPrize.toFixed(3)}</div>
              <div style={styles.statLabel}>SOL Earned</div>
            </div>
          </div>
        </section>

        {topThree.length > 0 && (
          <section className="podium-grid leader-enter" style={styles.podiumGrid}>
            {topThree.map((entry, index) => (
              <div className="leader-card" key={entry.username} style={styles.podiumCard}>
                <div style={styles.podiumTop}>
                  <span style={{ ...styles.rankNumber, color: getRankAccent(index), background: `${getRankAccent(index)}18` }}>
                    #{index + 1}
                  </span>
                  <Medal size={20} color={getRankAccent(index)} />
                </div>
                <div style={{ ...styles.avatar, background: `${getRankAccent(index)}18`, color: getRankAccent(index) }}>
                  {getInitials(entry.username)}
                </div>
                <h3 style={styles.podiumName}>{entry.username}</h3>
                <p style={styles.podiumMetric}>{formatMetric(entry, activeMetric)}</p>
                <div style={styles.podiumMeta}>
                  <span>{entry.wins}W</span>
                  <span>{entry.losses}L</span>
                  <span>{entry.win_rate.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="leader-enter" style={styles.board}>
          <div style={styles.boardHeader}>
            <div>
              <p style={styles.kicker}>Leaderboard</p>
              <h2 style={styles.sectionTitle}>Season rankings</h2>
            </div>
            <div style={styles.tabs}>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  className="tab-button"
                  key={id}
                  onClick={() => setTab(id)}
                  style={{
                    ...styles.tab,
                    background: tab === id ? '#0f172a' : '#ffffff',
                    color: tab === id ? '#ffffff' : '#64748b',
                    borderColor: tab === id ? '#0f172a' : '#e2e8f0',
                  }}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="table-scroll" style={styles.tableWrap}>
            <div className="leader-table" style={styles.table}>
              <div style={styles.tableHead}>
                <span style={styles.rankCol}>Rank</span>
                <span style={styles.playerCol}>Player</span>
                <span style={styles.col}>Wins</span>
                <span style={styles.col}>Losses</span>
                <span style={styles.col}>Win Rate</span>
                <span style={styles.col}>Earned</span>
              </div>

              {sorted.length === 0 ? (
                <div style={styles.emptyState}>
                  <Trophy size={34} color="#94a3b8" />
                  <h3 style={styles.emptyTitle}>No rankings yet</h3>
                  <p style={styles.emptyCopy}>The first completed battle will start Season 1&apos;s leaderboard.</p>
                </div>
              ) : (
                sorted.map((entry, index) => {
                  const isCurrentUser = entry.username === user?.username
                  const accent = getRankAccent(index)

                  return (
                    <div
                      className="leader-row"
                      key={`${entry.username}-${index}`}
                      style={{
                        ...styles.row,
                        background: isCurrentUser ? '#ecfeff' : '#ffffff',
                        borderColor: isCurrentUser ? '#67e8f9' : '#f1f5f9',
                      }}
                    >
                      <span style={styles.rankCol}>
                        <span style={{ ...styles.rankChip, color: accent, background: `${accent}16` }}>
                          #{index + 1}
                        </span>
                      </span>
                      <span style={styles.playerCol}>
                        <span style={{ ...styles.smallAvatar, background: `${accent}18`, color: accent }}>
                          {getInitials(entry.username)}
                        </span>
                        <span style={styles.playerName}>{entry.username}</span>
                        {isCurrentUser && <span style={styles.youPill}>You</span>}
                      </span>
                      <span style={styles.col}>{entry.wins}</span>
                      <span style={styles.col}>{entry.losses}</span>
                      <span style={styles.col}>{entry.win_rate.toFixed(1)}%</span>
                      <span style={{ ...styles.col, color: '#0891b2', fontWeight: 900 }}>
                        {entry.total_earnings.toFixed(3)} SOL
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div style={styles.sortNote}>
            <ArrowDownWideNarrow size={15} />
            Sorted by {TABS.find(item => item.id === tab)?.label.toLowerCase()}
          </div>
        </section>
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
    maxWidth: '760px',
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
    margin: '0 0 28px',
  },
  heroActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },
  primaryBtn: {
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
  rankPanel: {
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
  rankBadge: {
    width: '92px',
    height: '92px',
    borderRadius: '28px',
    background: 'linear-gradient(135deg, #fef3c7, #ecfeff)',
    color: '#f59e0b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '22px',
  },
  rankTitle: {
    color: '#0f172a',
    fontSize: '28px',
    fontWeight: 900,
    margin: '0 0 10px',
    wordBreak: 'break-word',
  },
  rankCopy: {
    color: '#64748b',
    fontSize: '14px',
    fontWeight: 700,
    lineHeight: 1.7,
    margin: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
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
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '28px',
    fontWeight: 900,
    lineHeight: 1,
  },
  statLabel: {
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 900,
    marginTop: '7px',
  },
  podiumGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '14px',
    marginBottom: '18px',
  },
  podiumCard: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 18px 50px rgba(15, 23, 42, 0.04)',
  },
  podiumTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '18px',
  },
  rankNumber: {
    borderRadius: '999px',
    padding: '6px 10px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    fontWeight: 900,
  },
  avatar: {
    width: '58px',
    height: '58px',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 900,
    fontFamily: "'JetBrains Mono', monospace",
    marginBottom: '16px',
  },
  podiumName: {
    color: '#0f172a',
    fontSize: '18px',
    fontWeight: 900,
    margin: '0 0 8px',
    wordBreak: 'break-word',
  },
  podiumMetric: {
    color: '#0891b2',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '24px',
    fontWeight: 900,
    margin: '0 0 16px',
  },
  podiumMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 800,
  },
  board: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    boxShadow: '0 18px 50px rgba(15, 23, 42, 0.04)',
    overflow: 'hidden',
  },
  boardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '16px',
    padding: '22px',
    borderBottom: '1px solid #f1f5f9',
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: '24px',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    margin: '6px 0 0',
  },
  tabs: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  tab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    border: '1px solid',
    borderRadius: '999px',
    padding: '9px 13px',
    fontSize: '12px',
    fontWeight: 900,
    cursor: 'pointer',
  },
  tableWrap: {
    width: '100%',
  },
  table: {
    width: '100%',
  },
  tableHead: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '13px 22px',
    background: '#f8fafc',
    color: '#64748b',
    fontSize: '11px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 22px',
    borderTop: '1px solid',
  },
  rankCol: {
    width: '74px',
    flexShrink: 0,
  },
  playerCol: {
    minWidth: 0,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  col: {
    width: '112px',
    flexShrink: 0,
    color: '#475569',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '13px',
    fontWeight: 800,
    textAlign: 'right',
  },
  rankChip: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '46px',
    borderRadius: '999px',
    padding: '6px 9px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    fontWeight: 900,
  },
  smallAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    fontWeight: 900,
    flexShrink: 0,
  },
  playerName: {
    color: '#0f172a',
    fontSize: '14px',
    fontWeight: 900,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  youPill: {
    color: '#0891b2',
    background: '#cffafe',
    borderRadius: '999px',
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  emptyState: {
    minHeight: '260px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '40px 22px',
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: '20px',
    fontWeight: 900,
    margin: '14px 0 6px',
  },
  emptyCopy: {
    color: '#94a3b8',
    fontSize: '14px',
    fontWeight: 700,
    margin: 0,
  },
  sortNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '7px',
    color: '#94a3b8',
    fontSize: '12px',
    fontWeight: 800,
    padding: '14px 22px',
    borderTop: '1px solid #f1f5f9',
    background: '#fbfdff',
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
