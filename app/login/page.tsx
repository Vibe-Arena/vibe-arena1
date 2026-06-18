'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#00f5a0', fontSize: '28px', fontWeight: '800', margin: 0 }}>
            Vibe Arena
          </h1>
          <p style={styles.subtitle}>Log in to your account</p>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          onClick={handleLogin}
          disabled={!email || !password || loading}
          style={{
            ...styles.button,
            opacity: email && password && !loading ? 1 : 0.4,
            cursor: email && password && !loading ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>

        <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', marginTop: '1.5rem' }}>
          No account?{' '}
          <a href="/" style={{ color: '#00f5a0' }}>Sign up</a>
        </p>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh', background: '#0a0a0a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '2rem', fontFamily: 'sans-serif',
  },
  card: {
    background: '#111', border: '1px solid #222',
    borderRadius: '16px', padding: '2.5rem',
    width: '100%', maxWidth: '420px',
  },
  subtitle: { color: '#666', fontSize: '14px', margin: '0.5rem 0 0' },
  field: { marginBottom: '1.25rem' },
  label: { display: 'block', color: '#aaa', fontSize: '13px', marginBottom: '6px' },
  input: {
    width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: '8px', padding: '10px 14px', color: '#fff',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const,
  },
  button: {
    width: '100%', background: '#00f5a0', color: '#000',
    border: 'none', borderRadius: '8px', padding: '12px',
    fontSize: '15px', fontWeight: '700',
  },
  error: { color: '#ff4d4d', fontSize: '13px', marginBottom: '1rem' },
}