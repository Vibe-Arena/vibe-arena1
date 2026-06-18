'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [ageChecked, setAgeChecked] = useState(false)
  const [termsChecked, setTermsChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = email && password && username && ageChecked && termsChecked && !loading

  const handleSignUp = async () => {
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    // Check username not taken
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (existing) {
      setError('Username already taken.')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } }
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email,
        username,
      })
      router.push('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ color: '#00f5a0', fontSize: '28px', fontWeight: '800', margin: 0 }}>
            Vibe Arena
          </h1>
          <p style={styles.subtitle}>Create your account</p>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            type="text"
            placeholder="your handle"
            value={username}
            onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="min 6 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <div style={styles.checkRow}>
          <input
            type="checkbox"
            id="age"
            checked={ageChecked}
            onChange={e => setAgeChecked(e.target.checked)}
            style={styles.checkbox}
          />
          <label htmlFor="age" style={styles.checkLabel}>
            I confirm I am 18 years or older
          </label>
        </div>

        <div style={styles.checkRow}>
          <input
            type="checkbox"
            id="terms"
            checked={termsChecked}
            onChange={e => setTermsChecked(e.target.checked)}
            style={styles.checkbox}
          />
          <label htmlFor="terms" style={styles.checkLabel}>
            I agree to the{' '}
            <a href="/terms" style={{ color: '#00f5a0' }}>Terms of Battle</a>
            {' '}and{' '}
            <a href="/privacy" style={{ color: '#00f5a0' }}>Privacy Policy</a>
          </label>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          onClick={handleSignUp}
          disabled={!canSubmit}
          style={{
            ...styles.button,
            opacity: canSubmit ? 1 : 0.4,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color: '#00f5a0' }}>Log in</a>
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
  checkRow: { display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '1rem' },
  checkbox: { marginTop: '2px', accentColor: '#00f5a0', flexShrink: 0 },
  checkLabel: { color: '#888', fontSize: '13px', lineHeight: '1.5' },
  button: {
    width: '100%', background: '#00f5a0', color: '#000',
    border: 'none', borderRadius: '8px', padding: '12px',
    fontSize: '15px', fontWeight: '700', marginTop: '0.5rem',
  },
  error: { color: '#ff4d4d', fontSize: '13px', marginBottom: '1rem' },
}