'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  username: string
  email: string
  sol_balance: number
}

type Window = {
  name: string
  start: string
  end: string
  timezone: string
}

const WINDOWS: Window[] = [
  { name: 'EU', start: '18:00', end: '20:00', timezone: 'CET' },
  { name: 'USA', start: '19:00', end: '21:00', timezone: 'EST' },
  { name: 'ASIA', start: '20:00', end: '22:00', timezone: 'JST' },
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

  if (loading) {
    return (
      <div style={{ ...styles.container, justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#555' }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>

      {/* NAVBAR */}
<nav style={styles.navbar}>
  
  {/* THIS IS YOUR NEW LOGO CODE */}
  <img src="/Logo.png" alt="c:\Users\darin\Logo.png" style={styles.logo} />
  
  <div style={styles.navLinks}>
    <a href="/dashboard" style={styles.navLink}>Dashboard</a>
          <a href="/leaderboard" style={styles.navLink}>Leaderboard</a>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={styles.userBtn} onClick={() => setDropdownOpen(!dropdownOpen)}>
            <span style={{ color: '#00bfff', fontSize: '13px' }}>◎ {user?.sol_balance?.toFixed(3)} SOL</span>
            <span style={{ color: '#aaa', fontSize: '13px' }}>{user?.username}</span>
            <span style={{ color: '#555', fontSize: '11px' }}>▼</span>
          </div>
          {dropdownOpen && (
            <div style={styles.dropdown}>
              <div style={styles.dropItem} onClick={() => router.push('/profile')}>Profile</div>
              <div style={styles.dropItem} onClick={() => router.push('/settings')}>Settings</div>
              <div style={{ ...styles.dropItem, color: '#ff4d4d' }} onClick={handleSignOut}>Sign Out</div>
            </div>
          )}
        </div>
      </nav>

      {/* MAIN */}
      <main style={styles.main}>

        {/* HERO — window status */}
        <div style={styles.hero}>
          <p style={{ color: '#555', fontSize: '13px', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Next Battle Window
          </p>
          <h2 style={{ color: '#00bfff', fontSize: '48px', fontWeight: '800', margin: '0 0 0.5rem' }}>
            EU Window
          </h2>
          <p style={{ color: '#666', fontSize: '15px', margin: 0 }}>
            Opens at 18:00 CET · 1v1 · $12.50 entry · Winner takes $20
          </p>
          <button style={styles.queueBtn} onClick={() => router.push('/queue')}>
            Enter Queue →
          </button>
        </div>

        {/* STATS ROW */}
        <div style={styles.statsRow}>
          {[
            { label: 'Matches Played', value: '0' },
            { label: 'Wins', value: '0' },
            { label: 'Win Rate', value: '0%' },
            { label: 'Total Earned', value: '0 SOL' },
          ].map(s => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ color: '#fff', fontSize: '24px', fontWeight: '700' }}>{s.value}</div>
              <div style={{ color: '#555', fontSize: '12px', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* BOTTOM ROW */}
        <div style={styles.bottomRow}>

          {/* WALLET CARD */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Your Wallet</h3>
            <div style={{ color: '#00bfff', fontSize: '32px', fontWeight: '700', margin: '1rem 0 0.25rem' }}>
              {user?.sol_balance?.toFixed(4)} SOL
            </div>
            <div style={{ color: '#555', fontSize: '13px', marginBottom: '1.5rem' }}>≈ $0.00 USD</div>
            <button style={styles.withdrawBtn}>Withdraw</button>
          </div>

          {/* WINDOWS SCHEDULE */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Battle Windows</h3>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {WINDOWS.map(w => (
                <div key={w.name} style={styles.windowRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={styles.windowBadge}>{w.name}</span>
                    <span style={{ color: '#aaa', fontSize: '13px' }}>{w.start} – {w.end} {w.timezone}</span>
                  </div>
                  <span style={{ color: '#333', fontSize: '12px' }}>Closed</span>
                </div>
              ))}
            </div>
          </div>

          {/* SEASON CARD */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Current Season</h3>
            <div style={{ color: '#fff', fontSize: '20px', fontWeight: '700', margin: '1rem 0 0.25rem' }}>
              Season 1
            </div>
            <div style={{ color: '#555', fontSize: '13px', marginBottom: '1rem' }}>Your rank: —</div>
            <a href="/leaderboard" style={{ color: '#00bfff', fontSize: '13px', textDecoration: 'none' }}>
              View Leaderboard →
            </a>
          </div>

        </div>
      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0a',
    fontFamily: 'sans-serif',
    display: 'flex',
    flexDirection: 'column',
  },
  navbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2rem',
    height: '60px',
    borderBottom: '1px solid #1a1a1a',
    background: '#0d0d0d',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    height: '120px',       // This controls how tall your logo will be in the navbar
    width: 'auto',        // This keeps it from stretching out of shape
    objectFit: 'contain',
    marginTop: '65px',
  },
  navLinks: {
    display: 'flex',
    gap: '2rem',
  },
  navLink: {
    color: '#666',
    textDecoration: 'none',
    fontSize: '14px',
  },
  userBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid #222',
    background: '#111',
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: '110%',
    background: '#111',
    border: '1px solid #222',
    borderRadius: '8px',
    minWidth: '150px',
    zIndex: 200,
    overflow: 'hidden',
  },
  dropItem: {
    padding: '10px 16px',
    color: '#aaa',
    fontSize: '13px',
    cursor: 'pointer',
  },
  main: {
    padding: '2rem',
    maxWidth: '1100px',
    width: '100%',
    margin: '0 auto',
  },
  hero: {
    background: '#111',
    border: '1px solid #1a1a1a',
    borderRadius: '16px',
    padding: '2.5rem',
    marginBottom: '1.5rem',
  },
  queueBtn: {
    marginTop: '1.5rem',
    background: '#00bfff',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 28px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    marginBottom: '1.5rem',
  },
  statCard: {
    background: '#111',
    border: '1px solid #1a1a1a',
    borderRadius: '12px',
    padding: '1.25rem',
    textAlign: 'center',
  },
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
  },
  card: {
    background: '#111',
    border: '1px solid #1a1a1a',
    borderRadius: '12px',
    padding: '1.5rem',
  },
  cardTitle: {
    color: '#444',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    margin: 0,
  },
  windowRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #1a1a1a',
  },
  windowBadge: {
    background: '#1a1a1a',
    color: '#555',
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  withdrawBtn: {
    background: 'transparent',
    border: '1px solid #2a2a2a',
    color: '#aaa',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '13px',
    cursor: 'pointer',
    width: '100%',
  },
}