'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type RankEntry = {
  username: string
  wins: number
  losses: number
  win_rate: number
  total_earnings: number
}

type Tab = 'wins' | 'winrate' | 'earnings'

export default function LeaderboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [tab, setTab] = useState<Tab>('wins')
  const [rankings, setRankings] = useState<RankEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }
      const { data: userData } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      setUser(userData)

      // Fetch rankings joined with usernames
      const { data } = await supabase
        .from('season_rankings')
        .select(`
          wins, losses, win_rate, total_earnings,
          users (username)
        `)
        .order('wins', { ascending: false })
        .limit(100)

      const formatted = (data || []).map((r: any) => ({
        username: r.users?.username || 'unknown',
        wins: r.wins,
        losses: r.losses,
        win_rate: r.win_rate,
        total_earnings: r.total_earnings,
      }))

      setRankings(formatted)
      setLoading(false)
    }
    init()
  }, [router])

  const sorted = [...rankings].sort((a, b) => {
    if (tab === 'wins') return b.wins - a.wins
    if (tab === 'winrate') return b.win_rate - a.win_rate
    return b.total_earnings - a.total_earnings
  })

  const medalColor = (i: number) => {
    if (i === 0) return '#FFD700'
    if (i === 1) return '#C0C0C0'
    if (i === 2) return '#CD7F32'
    return '#333'
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
          <a href="/leaderboard" style={{ ...styles.navLink, color: '#00bfff' }}>Leaderboard</a>
        </div>
        <div style={styles.userBtn} onClick={() => router.push('/profile')}>
          <span style={{ color: '#aaa', fontSize: '13px' }}>{user?.username}</span>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ color: '#fff', fontSize: '32px', fontWeight: '800', margin: '0 0 8px' }}>
            Leaderboard
          </h1>
          <p style={{ color: '#555', fontSize: '14px', margin: 0 }}>Season 1 Rankings</p>
        </div>

        {/* TABS */}
        <div style={styles.tabs}>
          {([
            { id: 'wins', label: 'Most Wins' },
            { id: 'winrate', label: 'Best Win Rate' },
            { id: 'earnings', label: 'Highest Earnings' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                ...styles.tab,
                background: tab === t.id ? '#00bfff' : '#111',
                color: tab === t.id ? '#000' : '#555',
                border: tab === t.id ? 'none' : '1px solid #1a1a1a',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TABLE */}
        <div style={styles.table}>

          {/* HEADER */}
          <div style={styles.tableHeader}>
            <span style={{ width: '48px' }}>#</span>
            <span style={{ flex: 1 }}>Player</span>
            <span style={styles.col}>Wins</span>
            <span style={styles.col}>Losses</span>
            <span style={styles.col}>Win Rate</span>
            <span style={styles.col}>Earned</span>
          </div>

          {/* ROWS */}
          {sorted.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ color: '#333', fontSize: '14px', margin: 0 }}>
                No battles yet. Be the first to compete.
              </p>
            </div>
          ) : sorted.map((entry, i) => (
            <div
              key={entry.username}
              style={{
                ...styles.row,
                background: entry.username === user?.username ? '#001a0f' : i % 2 === 0 ? '#0a0a0a' : '#0a0a0a',
                border: entry.username === user?.username ? '1px solid #00bfff20' : '1px solid transparent',
              }}
            >
              <span style={{ width: '48px', color: medalColor(i), fontWeight: '700', fontSize: '14px' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </span>
              <span style={{ flex: 1, color: entry.username === user?.username ? '#00bfff' : '#fff', fontSize: '14px', fontWeight: '500' }}>
                {entry.username}
                {entry.username === user?.username && (
                  <span style={{ color: '#333', fontSize: '11px', marginLeft: '8px' }}>you</span>
                )}
              </span>
              <span style={styles.col}>{entry.wins}</span>
              <span style={styles.col}>{entry.losses}</span>
              <span style={styles.col}>{entry.win_rate.toFixed(1)}%</span>
              <span style={{ ...styles.col, color: '#00bfff' }}>{entry.total_earnings.toFixed(3)} SOL</span>
            </div>
          ))}
        </div>
      </main>
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
  main: { padding: '2rem', maxWidth: '900px', width: '100%', margin: '0 auto' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '1.5rem' },
  tab: {
    padding: '8px 20px', borderRadius: '8px',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  table: {
    background: '#111', border: '1px solid #1a1a1a',
    borderRadius: '12px', overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex', alignItems: 'center', padding: '12px 16px',
    borderBottom: '1px solid #1a1a1a', background: '#0a0a0a',
    color: '#444', fontSize: '11px', fontWeight: '500',
    textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  row: {
    display: 'flex', alignItems: 'center',
    padding: '14px 16px', borderRadius: '4px',
  },
  col: {
    width: '100px', color: '#555', fontSize: '13px', textAlign: 'right' as const,
  },
  emptyState: {
    padding: '4rem', textAlign: 'center',
  },
}