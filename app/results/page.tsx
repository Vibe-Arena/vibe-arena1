'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function ResultsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [judging, setJudging] = useState(true)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'yours' | 'opponent' | 'prompts'>('yours')
  const [view, setView] = useState<'preview' | 'code'>('preview')

  const prompt = searchParams.get('prompt') || ''
  const myCode = searchParams.get('code') || ''
  const opponentCode = searchParams.get('opponentCode') || ''

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/login'); return }
      const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      setUser(data)
      runJudging()
    }
    init()
  }, [])

  const runJudging = async () => {
    try {
      const res = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          player1Code: myCode,
          player2Code: opponentCode || '<!-- No opponent code -->',
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
    } catch {
      setError('Judging failed. Please try again.')
    }
    setJudging(false)
  }

  const iWon = result?.winner === 'player1'

  if (judging) return (
    <div style={styles.container}>
      <div style={styles.judgingScreen}>
        <div style={styles.judgeIcons}>
          {['⚖️', '🤖', '🧠'].map((icon, i) => (
            <div key={i} style={{ ...styles.judgeIcon, animationDelay: `${i * 0.3}s` }}>{icon}</div>
          ))}
        </div>
        <h2 style={{ color: '#0f172a', fontSize: '22px', fontWeight: '700', margin: '0 0 8px' }}>
          Judges are reviewing your builds...
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 2rem' }}>
          3 AI judges are scoring your submission
        </p>
        <div style={styles.progressBar}>
          <div style={styles.progressFill} />
        </div>
      </div>
    </div>
  )

  if (error) return (
    <div style={styles.container}>
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: '#ff4d4d', fontSize: '16px' }}>{error}</p>
        <button onClick={() => router.push('/dashboard')} style={styles.backBtn}>Back to Dashboard</button>
      </div>
    </div>
  )

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <span style={styles.logo} onClick={() => router.push('/dashboard')}>Vibe Arena</span>
        <button onClick={() => router.push('/dashboard')} style={styles.backBtn}>← Dashboard</button>
      </nav>

      <main style={styles.main}>

        {/* WINNER BANNER */}
        <div style={{
          ...styles.winnerBanner,
          background: iWon ? '#001a0f' : '#1a0a0a',
          border: `1px solid ${iWon ? '#00bfff40' : '#ff4d4d40'}`,
        }}>
          <div style={{ fontSize: '48px', marginBottom: '0.5rem' }}>{iWon ? '🏆' : '💀'}</div>
          <h1 style={{ color: iWon ? '#00bfff' : '#ff4d4d', fontSize: '36px', fontWeight: '800', margin: '0 0 8px' }}>
            {iWon ? 'You Won!' : 'You Lost'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 1rem' }}>{result?.reasoning}</p>
          <div style={styles.scoreRow}>
            <div style={styles.scoreItem}>
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>Your Score</span>
              <span style={{ color: '#0f172a', fontSize: '24px', fontWeight: '700' }}>{result?.player1?.total}/100</span>
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '20px', fontWeight: '800' }}>VS</div>
            <div style={styles.scoreItem}>
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>Opponent Score</span>
              <span style={{ color: '#0f172a', fontSize: '24px', fontWeight: '700' }}>{result?.player2?.total}/100</span>
            </div>
          </div>
        </div>

        {/* JUDGE BREAKDOWN */}
        <div style={styles.breakdown}>
          <h3 style={styles.sectionTitle}>Judge Breakdown</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Category', 'Weight', 'Your Score', 'Opponent'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'UI Design', weight: '25pts', mine: result?.player1?.ui, theirs: result?.player2?.ui },
                { label: 'Code Quality', weight: '25pts', mine: result?.player1?.code, theirs: result?.player2?.code },
                { label: 'Prompt Fulfillment', weight: '30pts', mine: result?.player1?.prompt, theirs: result?.player2?.prompt },
                { label: 'Completeness', weight: '20pts', mine: result?.player1?.completeness, theirs: result?.player2?.completeness },
              ].map(row => (
                <tr key={row.label}>
                  <td style={styles.td}>{row.label}</td>
                  <td style={{ ...styles.td, color: '#444' }}>{row.weight}</td>
                  <td style={{ ...styles.td, color: '#00bfff', fontWeight: '600' }}>{row.mine}</td>
                  <td style={{ ...styles.td, color: '#ff4d4d' }}>{row.theirs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABS */}
        <div style={styles.tabs}>
          {(['yours', 'opponent', 'prompts'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.tab,
                background: activeTab === tab ? '#00bfff' : 'transparent',
                color: activeTab === tab ? '#000' : '#555',
              }}
            >
              {tab === 'yours' ? 'Your Build' : tab === 'opponent' ? 'Opponent Build' : 'All Prompts'}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        {activeTab !== 'prompts' ? (
          <div style={styles.buildView}>
            <div style={styles.toggleBar}>
              {(['preview', 'code'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    ...styles.toggleBtn,
                    background: view === v ? '#00bfff' : 'transparent',
                    color: view === v ? '#000' : '#555',
                  }}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            {view === 'preview' ? (
              <iframe
                srcDoc={activeTab === 'yours' ? myCode : opponentCode}
                style={styles.iframe}
                sandbox="allow-scripts"
                title="build preview"
              />
            ) : (
              <pre style={styles.codeView}>
                {activeTab === 'yours' ? myCode : opponentCode || 'No code submitted'}
              </pre>
            )}
          </div>
        ) : (
          <div style={styles.promptsView}>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Prompt history coming in multiplayer mode.</p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button onClick={() => router.push('/queue')} style={styles.rematchBtn}>
            Play Again →
          </button>
        </div>

      </main>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes fill { 0% { width: 0%; } 100% { width: 100%; } }
      `}</style>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div style={{ background: '#f8fafc', minHeight: '100vh' }} />}>
      <ResultsContent />
    </Suspense>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'sans-serif' },
  judgingScreen: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '2rem',
  },
  judgeIcons: { display: 'flex', gap: '1.5rem', marginBottom: '2rem' },
  judgeIcon: {
    fontSize: '48px', animation: 'bounce 1s infinite',
  },
  progressBar: {
    width: '300px', height: '4px', background: '#f1f5f9',
    borderRadius: '2px', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', background: '#00bfff',
    animation: 'fill 3s ease-in-out infinite',
  },
  navbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', height: '60px', borderBottom: '1px solid #f1f5f9',
    background: '#f8fafc', position: 'sticky', top: 0, zIndex: 100,
  },
  logo: { color: '#00bfff', fontWeight: '800', fontSize: '18px', cursor: 'pointer' },
  main: { padding: '2rem', maxWidth: '900px', width: '100%', margin: '0 auto' },
  winnerBanner: {
    borderRadius: '16px', padding: '2.5rem', textAlign: 'center', marginBottom: '1.5rem',
  },
  scoreRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3rem' },
  scoreItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
  breakdown: {
    background: '#ffffff', border: '1px solid #f1f5f9',
    borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem',
  },
  sectionTitle: {
    color: '#444', fontSize: '12px', fontWeight: '500',
    textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 1rem',
  },
  th: { color: '#444', fontSize: '12px', textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid #f1f5f9' },
  td: { color: '#64748b', fontSize: '13px', padding: '10px 12px', borderBottom: '1px solid #f8fafc' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '1rem' },
  tab: {
    padding: '8px 20px', borderRadius: '8px', border: 'none',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  buildView: {
    background: '#ffffff', border: '1px solid #f1f5f9',
    borderRadius: '12px', overflow: 'hidden', height: '500px',
    display: 'flex', flexDirection: 'column',
  },
  toggleBar: {
    display: 'flex', gap: '4px', padding: '8px',
    borderBottom: '1px solid #f1f5f9', background: '#f8fafc',
  },
  toggleBtn: {
    padding: '4px 16px', borderRadius: '6px', border: 'none',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  iframe: { flex: 1, border: 'none', background: '#fff' },
  codeView: {
    flex: 1, margin: 0, padding: '1rem', color: '#64748b', fontSize: '12px',
    fontFamily: 'monospace', overflowY: 'auto', background: '#f8fafc',
    whiteSpace: 'pre-wrap', wordBreak: 'break-all',
  },
  promptsView: { background: '#ffffff', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '2rem' },
  backBtn: {
    background: 'transparent', border: '1px solid #e2e8f0',
    color: '#64748b', borderRadius: '8px', padding: '8px 16px',
    fontSize: '13px', cursor: 'pointer',
  },
  rematchBtn: {
    background: '#00bfff', color: '#000', border: 'none',
    borderRadius: '12px', padding: '14px 40px',
    fontSize: '16px', fontWeight: '800', cursor: 'pointer',
  },
}