'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Tab = 'overview' | 'users' | 'matches' | 'flags'

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMatches: 0,
    activeMatches: 0,
    totalFlags: 0,
  })
  const [users, setUsers] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [flags, setFlags] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }

      // Check admin
      if (authUser.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        router.push('/dashboard')
        return
      }

      setAuthorized(true)
      await loadAll()
      setLoading(false)
    }
    init()
  }, [router])

  const loadAll = async () => {
    const [
      { count: totalUsers },
      { count: totalMatches },
      { count: activeMatches },
      { count: totalFlags },
      { data: usersData },
      { data: matchesData },
      { data: flagsData },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('flags').select('*', { count: 'exact', head: true }).eq('resolved', false),
      supabase.from('users').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('matches').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('flags').select('*').eq('resolved', false).order('created_at', { ascending: false }),
    ])

    setStats({
      totalUsers: totalUsers || 0,
      totalMatches: totalMatches || 0,
      activeMatches: activeMatches || 0,
      totalFlags: totalFlags || 0,
    })
    setUsers(usersData || [])
    setMatches(matchesData || [])
    setFlags(flagsData || [])
  }

  const suspendUser = async (userId: string, suspended: boolean) => {
    await supabase.from('users').update({ is_suspended: !suspended }).eq('id', userId)
    await loadAll()
  }

  const resolveFlag = async (flagId: string) => {
    await supabase.from('flags').update({ resolved: true }).eq('id', flagId)
    await loadAll()
  }

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  if (loading) return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <p style={{ color: '#555' }}>Loading...</p>
    </div>
  )

  if (!authorized) return null

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <span style={{ color: '#ff4d4d', fontWeight: '800', fontSize: '18px' }}>⚡ Admin</span>
        <span style={{ color: '#333', fontSize: '13px' }}>Vibe Arena Control Panel</span>
        <button onClick={() => router.push('/dashboard')} style={styles.backBtn}>← Back to App</button>
      </nav>

      <div style={styles.layout}>

        {/* SIDEBAR */}
        <div style={styles.sidebar}>
          {([
            { id: 'overview', label: '📊 Overview' },
            { id: 'users', label: '👥 Users' },
            { id: 'matches', label: '⚔️ Matches' },
            { id: 'flags', label: `🚩 Flags ${stats.totalFlags > 0 ? `(${stats.totalFlags})` : ''}` },
          ] as const).map(t => (
            <div
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                ...styles.sideItem,
                background: tab === t.id ? '#1a1a1a' : 'transparent',
                color: tab === t.id ? '#fff' : '#555',
              }}
            >
              {t.label}
            </div>
          ))}
        </div>

        {/* CONTENT */}
        <div style={styles.content}>

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <>
              <h2 style={styles.pageTitle}>Overview</h2>
              <div style={styles.statsGrid}>
                {[
                  { label: 'Total Users', value: stats.totalUsers, color: '#00bfff' },
                  { label: 'Total Matches', value: stats.totalMatches, color: '#7B61FF' },
                  { label: 'Active Matches', value: stats.activeMatches, color: '#f5a623' },
                  { label: 'Unresolved Flags', value: stats.totalFlags, color: '#ff4d4d' },
                ].map(s => (
                  <div key={s.label} style={styles.statCard}>
                    <div style={{ color: s.color, fontSize: '36px', fontWeight: '800' }}>{s.value}</div>
                    <div style={{ color: '#444', fontSize: '12px', marginTop: '4px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* USERS */}
          {tab === 'users' && (
            <>
              <h2 style={styles.pageTitle}>Users</h2>
              <input
                style={styles.search}
                placeholder="Search by username or email..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
              <div style={styles.tableWrap}>
                <div style={styles.tableHead}>
                  <span style={{ flex: 1 }}>Username</span>
                  <span style={{ flex: 1 }}>Email</span>
                  <span style={{ width: '100px' }}>Joined</span>
                  <span style={{ width: '120px' }}>Actions</span>
                </div>
                {filteredUsers.map(u => (
                  <div key={u.id} style={styles.tableRow}>
                    <span style={{ flex: 1, color: '#fff', fontSize: '13px' }}>{u.username}</span>
                    <span style={{ flex: 1, color: '#555', fontSize: '13px' }}>{u.email}</span>
                    <span style={{ width: '100px', color: '#333', fontSize: '12px' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </span>
                    <span style={{ width: '120px' }}>
                      <button
                        onClick={() => suspendUser(u.id, u.is_suspended)}
                        style={{
                          ...styles.actionBtn,
                          color: u.is_suspended ? '#00bfff' : '#ff4d4d',
                          borderColor: u.is_suspended ? '#00bfff40' : '#ff4d4d40',
                        }}
                      >
                        {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* MATCHES */}
          {tab === 'matches' && (
            <>
              <h2 style={styles.pageTitle}>Matches</h2>
              <div style={styles.tableWrap}>
                <div style={styles.tableHead}>
                  <span style={{ width: '120px' }}>Status</span>
                  <span style={{ flex: 1 }}>Prompt</span>
                  <span style={{ width: '100px' }}>Date</span>
                </div>
                {matches.map(m => (
                  <div key={m.id} style={styles.tableRow}>
                    <span style={{ width: '120px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px',
                        background: m.status === 'completed' ? '#001a0f' : m.status === 'active' ? '#1a1a00' : '#1a0a0a',
                        color: m.status === 'completed' ? '#00bfff' : m.status === 'active' ? '#f5a623' : '#ff4d4d',
                      }}>
                        {m.status}
                      </span>
                    </span>
                    <span style={{ flex: 1, color: '#555', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.prompt || '—'}
                    </span>
                    <span style={{ width: '100px', color: '#333', fontSize: '12px' }}>
                      {new Date(m.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {matches.length === 0 && (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#333', fontSize: '13px' }}>
                    No matches yet.
                  </div>
                )}
              </div>
            </>
          )}

          {/* FLAGS */}
          {tab === 'flags' && (
            <>
              <h2 style={styles.pageTitle}>Unresolved Flags</h2>
              <div style={styles.tableWrap}>
                <div style={styles.tableHead}>
                  <span style={{ width: '120px' }}>Type</span>
                  <span style={{ flex: 1 }}>Description</span>
                  <span style={{ width: '100px' }}>Date</span>
                  <span style={{ width: '100px' }}>Action</span>
                </div>
                {flags.map(f => (
                  <div key={f.id} style={styles.tableRow}>
                    <span style={{ width: '120px', color: '#ff4d4d', fontSize: '12px', fontWeight: '600' }}>{f.type}</span>
                    <span style={{ flex: 1, color: '#555', fontSize: '13px' }}>{f.description || '—'}</span>
                    <span style={{ width: '100px', color: '#333', fontSize: '12px' }}>
                      {new Date(f.created_at).toLocaleDateString()}
                    </span>
                    <span style={{ width: '100px' }}>
                      <button onClick={() => resolveFlag(f.id)} style={{ ...styles.actionBtn, color: '#00bfff', borderColor: '#00bfff40' }}>
                        Resolve
                      </button>
                    </span>
                  </div>
                ))}
                {flags.length === 0 && (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#333', fontSize: '13px' }}>
                    No unresolved flags. All clear.
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#0a0a0a', fontFamily: 'sans-serif' },
  navbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', height: '60px', borderBottom: '1px solid #1a1a1a',
    background: '#0a0a0a',
  },
  backBtn: {
    background: 'transparent', border: '1px solid #2a2a2a',
    color: '#555', borderRadius: '8px', padding: '6px 14px',
    fontSize: '13px', cursor: 'pointer',
  },
  layout: { display: 'flex', minHeight: 'calc(100vh - 60px)' },
  sidebar: { width: '200px', borderRight: '1px solid #1a1a1a', padding: '1rem 0', flexShrink: 0 },
  sideItem: {
    padding: '10px 1.5rem', fontSize: '13px', cursor: 'pointer',
    borderRadius: '6px', margin: '2px 8px', transition: 'all 0.15s',
  },
  content: { flex: 1, padding: '2rem', overflowY: 'auto' as const },
  pageTitle: { color: '#fff', fontSize: '22px', fontWeight: '700', margin: '0 0 1.5rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' },
  statCard: {
    background: '#111', border: '1px solid #1a1a1a',
    borderRadius: '12px', padding: '1.5rem', textAlign: 'center',
  },
  search: {
    width: '100%', background: '#111', border: '1px solid #2a2a2a',
    borderRadius: '8px', padding: '10px 14px', color: '#fff',
    fontSize: '13px', outline: 'none', marginBottom: '1rem',
    boxSizing: 'border-box' as const,
  },
  tableWrap: { background: '#111', border: '1px solid #1a1a1a', borderRadius: '12px', overflow: 'hidden' },
  tableHead: {
    display: 'flex', alignItems: 'center', padding: '10px 16px',
    borderBottom: '1px solid #1a1a1a', background: '#0a0a0a',
    color: '#444', fontSize: '11px', fontWeight: '500', textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  tableRow: {
    display: 'flex', alignItems: 'center', padding: '12px 16px',
    borderBottom: '1px solid #0a0a0a',
  },
  actionBtn: {
    background: 'transparent', border: '1px solid',
    borderRadius: '6px', padding: '4px 10px',
    fontSize: '11px', fontWeight: '600', cursor: 'pointer',
  },
}