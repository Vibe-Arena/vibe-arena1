'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  username: string
  email: string
  sol_balance: number
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }
      const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      setUser(data)
      setLoading(false)
    }
    getUser()
  }, [router])

  if (loading) return <div style={styles.container}><p style={{ color: '#555' }}>Loading...</p></div>

  return (
    <div style={styles.container}>

      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <span style={styles.logo} onClick={() => router.push('/dashboard')}>Vibe Arena</span>
        <div style={styles.navLinks}>
          <a href="/dashboard" style={styles.navLink}>Dashboard</a>
          <a href="/leaderboard" style={styles.navLink}>Leaderboard</a>
        </div>
        <div style={styles.userBtn} onClick={() => router.push('/settings')}>
          <span style={{ color: '#aaa', fontSize: '13px' }}>{user?.username}</span>
        </div>
      </nav>

      <main style={styles.main}>

        {/* HEADER */}
        <div style={styles.profileHeader}>
          <div style={styles.avatar}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', margin: '0 0 4px' }}>
              {user?.username}
            </h1>
            <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>
              Joined {new Date(user?.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button style={styles.editBtn} onClick={() => router.push('/settings')}>
            Edit Profile
          </button>
        </div>

        {/* STATS */}
        <div style={styles.statsRow}>
          {[
            { label: 'Matches Played', value: '0' },
            { label: 'Wins', value: '0' },
            { label: 'Losses', value: '0' },
            { label: 'Win Rate', value: '0%' },
            { label: 'Total Earned', value: '0 SOL' },
          ].map(s => (
            <div key={s.label} style={styles.statCard}>
              <div style={{ color: '#fff', fontSize: '22px', fontWeight: '700' }}>{s.value}</div>
              <div style={{ color: '#555', fontSize: '12px', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* BADGES */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Badges & Trophies</h3>
          <div style={{ color: '#333', fontSize: '13px', marginTop: '1rem', textAlign: 'center', padding: '2rem 0' }}>
            No badges yet. Win your first battle to earn one.
          </div>
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
  profileHeader: {
    display: 'flex', alignItems: 'center', gap: '1.5rem',
    background: '#111', border: '1px solid #1a1a1a', borderRadius: '16px',
    padding: '2rem', marginBottom: '1.5rem',
  },
  avatar: {
    width: '64px', height: '64px', borderRadius: '50%',
    background: '#00bfff', color: '#000', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    fontSize: '28px', fontWeight: '800', flexShrink: 0,
  },
  editBtn: {
    marginLeft: 'auto', background: 'transparent', border: '1px solid #2a2a2a',
    color: '#aaa', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer',
  },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '12px', marginBottom: '1.5rem',
  },
  statCard: {
    background: '#111', border: '1px solid #1a1a1a',
    borderRadius: '12px', padding: '1.25rem', textAlign: 'center',
  },
  card: {
    background: '#111', border: '1px solid #1a1a1a',
    borderRadius: '12px', padding: '1.5rem',
  },
  cardTitle: {
    color: '#444', fontSize: '12px', fontWeight: '500',
    textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0,
  },
}