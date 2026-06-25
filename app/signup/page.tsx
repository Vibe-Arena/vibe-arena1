'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  AlertCircle,
  ArrowRight,
  AtSign,
  CheckCircle2,
  LockKeyhole,
  Mail,
  Trophy,
  UserRound,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import styles from '../auth.module.css'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [ageChecked, setAgeChecked] = useState(false)
  const [termsChecked, setTermsChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const passwordReady = password.length >= 6
  const cleanUsername = username.trim().toLowerCase()
  const canSubmit = Boolean(
    email && passwordReady && cleanUsername && ageChecked && termsChecked && !loading,
  )

  const usernamePreview = useMemo(() => cleanUsername || 'your-handle', [cleanUsername])

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit) {
      if (!passwordReady) {
        setError('Password must be at least 6 characters.')
      }
      return
    }

    setLoading(true)
    setError('')

    const { data: existing, error: lookupError } = await supabase
      .from('users')
      .select('id')
      .eq('username', cleanUsername)
      .maybeSingle()

    if (lookupError) {
      setError(lookupError.message)
      setLoading(false)
      return
    }

    if (existing) {
      setError('Username already taken.')
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: cleanUsername } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        email,
        username: cleanUsername,
      })

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }

      router.push('/dashboard')
    }

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
          <p className={styles.eyebrow}>Create your fighter card</p>
          <h1>Start clean. Compete sharp.</h1>
          <p>
            Claim a handle, enter the arena, and build a record across every match
            you take on.
          </p>
        </div>

        <div className={styles.profilePreview}>
          <span className={styles.previewAvatar}>
            {usernamePreview.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <strong>@{usernamePreview}</strong>
            <p>New challenger profile</p>
          </div>
          <Trophy size={20} />
        </div>
      </section>

      <section className={styles.formPanel} aria-label="Create account">
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.iconBadge}>
              <UserRound size={20} />
            </span>
            <div>
              <p className={styles.eyebrow}>Join Vibe Arena</p>
              <h2>Create your account</h2>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSignUp}>
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
              <span>Username</span>
              <div className={styles.inputWrap}>
                <AtSign size={18} />
                <input
                  autoComplete="username"
                  placeholder="yourhandle"
                  type="text"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value.toLowerCase().replace(/\s/g, ''))
                  }
                />
              </div>
            </label>

            <label className={styles.field}>
              <span>Password</span>
              <div className={styles.inputWrap}>
                <LockKeyhole size={18} />
                <input
                  autoComplete="new-password"
                  placeholder="Minimum 6 characters"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </label>

            <div className={styles.requirements}>
              <Requirement active={passwordReady} label="6+ character password" />
              <Requirement active={Boolean(cleanUsername)} label="Unique public handle" />
            </div>

            <label className={styles.checkRow}>
              <input
                checked={ageChecked}
                type="checkbox"
                onChange={(event) => setAgeChecked(event.target.checked)}
              />
              <span>I confirm I am 18 years or older</span>
            </label>

            <label className={styles.checkRow}>
              <input
                checked={termsChecked}
                type="checkbox"
                onChange={(event) => setTermsChecked(event.target.checked)}
              />
              <span>
                I agree to the <Link href="/terms">Terms of Battle</Link> and{' '}
                <Link href="/privacy">Privacy Policy</Link>
              </span>
            </label>

            {error ? (
              <div className={styles.error} role="alert">
                <AlertCircle size={17} />
                {error}
              </div>
            ) : null}

            <button className={styles.primaryButton} disabled={!canSubmit} type="submit">
              {loading ? 'Creating account...' : 'Create account'}
              <ArrowRight size={18} />
            </button>
          </form>

          <p className={styles.switchText}>
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </div>
      </section>
    </main>
  )
}

function Requirement({ active, label }: { active: boolean; label: string }) {
  return (
    <div className={active ? styles.requirementActive : styles.requirement}>
      <CheckCircle2 size={15} />
      <span>{label}</span>
    </div>
  )
}
