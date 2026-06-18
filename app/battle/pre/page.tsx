'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const RULES = [
  'You have exactly 15 minutes to build',
  'Frontend only — HTML, CSS, and JavaScript',
  'No outside resources or pre-built templates',
  'Your last generated build is your final submission',
]

function PreBattleContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)

  const prompt = searchParams.get('prompt') || 'Build a beautiful todo app with priority levels'
  const model = searchParams.get('model') || 'meta-llama/llama-3.1-8b-instruct:free'
  const modelName = model.split('/')[1]?.split(':')[0] || model

  useEffect(() => {
    if (countdown <= 0) {
      router.push(`/battle?prompt=${encodeURIComponent(prompt)}&model=${encodeURIComponent(model)}`)
      return
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, router, prompt, model])

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* COUNTDOWN */}
        <div style={styles.countdownWrap}>
          <div style={styles.countdown}>{countdown}</div>
          <p style={{ color: '#555', fontSize: '13px', margin: 0 }}>Battle starts in</p>
        </div>

        {/* PROMPT */}
        <div style={styles.promptBox}>
          <p style={{ color: '#555', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>
            Your Prompt
          </p>
          <p style={{ color: '#fff', fontSize: '20px', fontWeight: '700', margin: 0, lineHeight: 1.4 }}>
            {prompt}
          </p>
        </div>

        {/* MODEL */}
        <div style={styles.modelRow}>
          <div style={styles.modelCard}>
            <p style={{ color: '#555', fontSize: '11px', margin: '0 0 4px' }}>YOUR MODEL</p>
            <p style={{ color: '#00bfff', fontSize: '14px', fontWeight: '600', margin: 0 }}>{modelName}</p>
          </div>
          <div style={styles.vs}>VS</div>
          <div style={styles.modelCard}>
            <p style={{ color: '#555', fontSize: '11px', margin: '0 0 4px' }}>OPPONENT</p>
            <p style={{ color: '#aaa', fontSize: '14px', fontWeight: '600', margin: 0 }}>Waiting...</p>
          </div>
        </div>

        {/* RULES */}
        <div style={styles.rulesBox}>
          <p style={{ color: '#444', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px' }}>
            Rules
          </p>
          {RULES.map((rule, i) => (
            <div key={i} style={styles.ruleRow}>
              <span style={{ color: '#00bfff', fontSize: '13px', flexShrink: 0 }}>✓</span>
              <span style={{ color: '#666', fontSize: '13px' }}>{rule}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default function PreBattlePage() {
  return (
    <Suspense fallback={<div style={{ background: '#0a0a0a', minHeight: '100vh' }} />}>
      <PreBattleContent />
    </Suspense>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'sans-serif',
    padding: '2rem',
  },
  card: {
    background: '#111',
    border: '1px solid #1a1a1a',
    borderRadius: '20px',
    padding: '3rem',
    width: '100%',
    maxWidth: '600px',
  },
  countdownWrap: {
    textAlign: 'center',
    marginBottom: '2.5rem',
  },
  countdown: {
    fontSize: '80px',
    fontWeight: '800',
    color: '#00bfff',
    lineHeight: 1,
    marginBottom: '8px',
  },
  promptBox: {
    background: '#0a0a0a',
    border: '1px solid #1a1a1a',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  modelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  modelCard: {
    flex: 1,
    background: '#0a0a0a',
    border: '1px solid #1a1a1a',
    borderRadius: '10px',
    padding: '1rem',
    textAlign: 'center',
  },
  vs: {
    color: '#333',
    fontSize: '16px',
    fontWeight: '800',
    flexShrink: 0,
  },
  rulesBox: {
    background: '#0a0a0a',
    border: '1px solid #1a1a1a',
    borderRadius: '12px',
    padding: '1.5rem',
  },
  ruleRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    marginBottom: '8px',
  },
}