'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  username: string
  email: string
  phantom_wallet: string
  email_notifications: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [notifications, setNotifications] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }
      const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      if (!data) { router.push('/'); return }
      setUser(data)
      setUsername(data.username)
      setNotifications(data.email_notifications)
      setLoading(false)
    }
    getUser()
  }, [router])

  const saveUsername = async () => {
    setSaving(true)
    setError('')
    const { data: existing } = await supabase
      .from('users').select('id').eq('username', username).single()
    if (existing && existing.id !== user?.id) {
      setError('Username already taken.')
      setSaving(false)
      return
    }
    await supabase.from('users').update({ username }).eq('id', user?.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  const saveNotifications = async (val: boolean) => {
    setNotifications(val)
    await supabase.from('users').update({ email_notifications: val }).eq('id', user?.id)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div style={styles.container}><p style={{ color: '#94a3b8' }}>Loading...</p></div>

  return (
    <div style={styles.container}>

      {/* NAVBAR */}
      <nav style={styles.navbar}>
        <span style={styles.logo} onClick={() => router.push('/dashboard')}>Vibe Arena</span>
        <div style={styles.navLinks}>
          <a href="/dashboard" style={styles.navLink}>Dashboard</a>
          <a href="/leaderboard" style={styles.navLink}>Leaderboard</a>
        </div>
        <div style={styles.userBtn} onClick={() => router.push('/profile')}>
          <span style={{ color: '#64748b', fontSize: '13px' }}>{user?.username}</span>
        </div>
      </nav>

      <main style={styles.main}>
        <h1 style={{ color: '#0f172a', fontSize: '24px', fontWeight: '700', marginBottom: '2rem' }}>Settings</h1>

        {/* USERNAME */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Username</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <input
              style={styles.input}
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
              placeholder="username"
            />
            <button
              onClick={saveUsername}
              disabled={saving || username === user?.username}
              style={{
                ...styles.saveBtn,
                opacity: saving || username === user?.username ? 0.4 : 1,
                background: saved ? '#1a3a2a' : '#00bfff',
                color: saved ? '#00bfff' : '#000',
              }}
            >
              {saved ? 'Saved ✓' : saving ? 'Saving...' : 'Save'}
            </button>
          </div>
          {error && <p style={{ color: '#ff4d4d', fontSize: '13px', marginTop: '8px' }}>{error}</p>}
        </div>

        {/* EMAIL */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Email</h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px' }}>{user?.email}</p>
          <p style={{ color: '#cbd5e1', fontSize: '12px', margin: 0 }}>To change your email contact support.</p>
        </div>

        {/* WALLET */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Phantom Wallet</h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 8px' }}>
            {user?.phantom_wallet || 'No wallet connected yet.'}
          </p>
          <p style={{ color: '#cbd5e1', fontSize: '12px', margin: 0 }}>Wallet is connected during queue entry.</p>
        </div>

        {/* NOTIFICATIONS */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Email Notifications</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <div
              onClick={() => saveNotifications(!notifications)}
              style={{
                width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer',
                background: notifications ? '#00bfff' : '#222', position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                position: 'absolute', top: '3px', transition: 'left 0.2s',
                left: notifications ? '23px' : '3px',
              }} />
            </div>
            <span style={{ color: '#64748b', fontSize: '13px' }}>
              {notifications ? 'Battle window reminders on' : 'Notifications off'}
            </span>
          </div>
        </div>

        {/* SIGN OUT */}
        <div style={styles.section}>
          <button onClick={handleSignOut} style={styles.signOutBtn}>Sign Out</button>
        </div>

      </main>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' },
  navbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', height: '60px', borderBottom: '1px solid #f1f5f9',
    background: '#f8fafc', position: 'sticky', top: 0, zIndex: 100,
  },
  logo: { color: '#00bfff', fontWeight: '800', fontSize: '18px', cursor: 'pointer' },
  navLinks: { display: 'flex', gap: '2rem' },
  navLink: { color: '#64748b', textDecoration: 'none', fontSize: '14px' },
  userBtn: {
    display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
    padding: '6px 12px', borderRadius: '8px', border: '1px solid #222', background: '#ffffff',
  },
  main: { padding: '2rem', maxWidth: '600px', width: '100%', margin: '0 auto' },
  section: {
    background: '#ffffff', border: '1px solid #f1f5f9',
    borderRadius: '12px', padding: '1.5rem', marginBottom: '1rem',
  },
  sectionTitle: {
    color: '#444', fontSize: '12px', fontWeight: '500',
    textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px',
  },
  input: {
    flex: 1, background: '#f1f5f9', border: '1px solid #e2e8f0',
    borderRadius: '8px', padding: '10px 14px', color: '#0f172a',
    fontSize: '14px', outline: 'none',
  },
  saveBtn: {
    border: 'none', borderRadius: '8px', padding: '10px 20px',
    fontSize: '14px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  signOutBtn: {
    background: 'transparent', border: '1px solid #e2e8f0',
    color: '#ff4d4d', borderRadius: '8px', padding: '10px 20px',
    fontSize: '14px', cursor: 'pointer',
  },
}