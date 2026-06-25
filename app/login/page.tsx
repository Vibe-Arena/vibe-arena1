'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { AlertCircle, ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import styles from '../auth.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = Boolean(email && password && !loading)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    setLoading(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    setLoading(false)
  }

  return (
    <main className={styles.page}>
      <section className={styles.storyPanel} aria-label="Vibe Arena">
        <Link className={styles.logo} href="/">
          <span>VA</span>
          Vibe Arena
        </Link>

        <div className={styles.storyContent}>
          <p className={styles.eyebrow}>Battle ready</p>
          <h1>Jump back into the arena.</h1>
          <p>
            Track battles, climb the board, and keep your profile ready for the next
            head-to-head challenge.
          </p>
        </div>

        <div className={styles.featureGrid}>
          <div>
            <Sparkles size={18} />
            <strong>Fast rounds</strong>
            <span>Get matched and compete without friction.</span>
          </div>
          <div>
            <ShieldCheck size={18} />
            <strong>Protected account</strong>
            <span>Your session is handled through Supabase auth.</span>
          </div>
        </div>
      </section>

      <section className={styles.formPanel} aria-label="Log in">
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.iconBadge}>
              <LockKeyhole size={20} />
            </span>
            <div>
              <p className={styles.eyebrow}>Welcome back</p>
              <h2>Log in to your account</h2>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleLogin}>
            <label className={styles.field}>
              <span>Email</span>
              <div className={styles.inputWrap}>
                <Mail size={18} />
                <input
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </label>

            <label className={styles.field}>
              <span>Password</span>
              <div className={styles.inputWrap}>
                <LockKeyhole size={18} />
                <input
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </label>

            {error ? (
              <div className={styles.error} role="alert">
                <AlertCircle size={17} />
                {error}
              </div>
            ) : null}

            <button className={styles.primaryButton} disabled={!canSubmit} type="submit">
              {loading ? 'Logging in...' : 'Log in'}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className={styles.switchText}>
            No account yet? <Link href="/signup">Create one</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
