'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const BATTLE_DURATION = 15 * 60 // 15 minutes in seconds

type Message = {
  role: 'user' | 'assistant'
  content: string
}

function BattleContent() {
    const currentCodeRef = useRef('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const prompt = searchParams.get('prompt') || 'Build a beautiful todo app with priority levels'
  const model = searchParams.get('model') || 'meta-llama/llama-3.1-8b-instruct:free'
  const modelName = model.split('/')[1]?.split(':')[0] || model

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentCode, setCurrentCode] = useState('')
  const [view, setView] = useState<'code' | 'preview'>('preview')
  const [timeLeft, setTimeLeft] = useState(BATTLE_DURATION)
  const [locked, setLocked] = useState(false)
  const [promptCount, setPromptCount] = useState(0)
  const [tokenCount, setTokenCount] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Timer
  useEffect(() => {
    if (locked) return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setLocked(true)
// Navigate to results after 2 seconds
setTimeout(() => {
  const params = new URLSearchParams({
    prompt: prompt,
    code: currentCodeRef.current,
  })
  router.push(`/results?${params.toString()}`)
}, 2000)
return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [locked])

  // Tab close warning
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!locked) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [locked])

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const timerColor = timeLeft <= 30 ? '#ff4d4d' : timeLeft <= 120 ? '#f5a623' : '#00bfff'

  const extractCode = (text: string) => {
    const match = text.match(/<!DOCTYPE html>[\s\S]*<\/html>/i)
    return match ? match[0] : ''
  }

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || locked) return

    const userMessage: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setPromptCount(p => p + 1)
    setIsStreaming(true)

    let fullResponse = ''
    const assistantMessage: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const res = await fetch('/api/battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, model }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            const token = parsed.choices?.[0]?.delta?.content || ''
            fullResponse += token
            setTokenCount(prev => prev + token.length)
            setMessages(prev => {
              const updated = [...prev]
              updated[updated.length - 1] = { role: 'assistant', content: fullResponse }
              return updated
            })
          } catch { }
        }
      }

      const code = extractCode(fullResponse)
      if (code) setCurrentCode(code)
        if (code) currentCodeRef.current = code

    } catch (err) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: 'Something went wrong. Try again.' }
        return updated
      })
    }

    setIsStreaming(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={styles.container}>

      {/* TOP BAR */}
      <div style={styles.topBar}>
        <div style={styles.topLeft}>
          <span style={{ color: '#00bfff', fontWeight: '700', fontSize: '14px' }}>Vibe Arena</span>
          <span style={{ color: '#333', fontSize: '12px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {prompt}
          </span>
        </div>

        <div style={{ ...styles.timer, color: timerColor, animation: timeLeft <= 30 ? 'pulse 1s infinite' : 'none' }}>
          {locked ? 'LOCKED' : formatTime(timeLeft)}
        </div>

        <div style={styles.topRight}>
          <span style={{ color: '#444', fontSize: '12px' }}>Model: <span style={{ color: '#aaa' }}>{modelName}</span></span>
        </div>
      </div>

      {locked && (
        <div style={styles.lockBanner}>
          🔒 Time's up! Your last build has been submitted.
        </div>
      )}

      {/* MAIN */}
      <div style={styles.main}>

        {/* CHAT PANEL */}
        <div style={styles.chatPanel}>
          <div style={styles.chatMessages}>
            {messages.length === 0 && (
              <div style={styles.emptyChat}>
                <p style={{ color: '#333', fontSize: '14px', textAlign: 'center' }}>
                  Start building! Describe what you want to create.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{
                ...styles.message,
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? '#00bfff20' : '#1a1a1a',
                border: m.role === 'user' ? '1px solid #00bfff40' : '1px solid #222',
              }}>
                <p style={{ color: m.role === 'user' ? '#00bfff' : '#ccc', fontSize: '13px', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {m.content}
                  {isStreaming && i === messages.length - 1 && m.role === 'assistant' && (
                    <span style={{ color: '#00bfff', animation: 'pulse 1s infinite' }}>▊</span>
                  )}
                </p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* CHAT STATS */}
          <div style={styles.chatStats}>
            <span style={{ color: '#333', fontSize: '11px' }}>Prompts: {promptCount}</span>
            <span style={{ color: '#333', fontSize: '11px' }}>Tokens: {tokenCount.toLocaleString()}</span>
            {tokenCount > 90000 && <span style={{ color: '#f5a623', fontSize: '11px' }}>⚠ Approaching limit</span>}
          </div>

          {/* INPUT */}
          <div style={styles.inputWrap}>
            <textarea
              ref={inputRef}
              style={{
                ...styles.input,
                opacity: locked ? 0.4 : 1,
              }}
              placeholder={locked ? 'Battle locked' : 'Describe what to build or change...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={locked || isStreaming}
              rows={3}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming || locked}
              style={{
                ...styles.sendBtn,
                opacity: !input.trim() || isStreaming || locked ? 0.4 : 1,
              }}
            >
              {isStreaming ? '...' : '↑'}
            </button>
          </div>
        </div>

        {/* CODE/PREVIEW PANEL */}
        <div style={styles.rightPanel}>

          {/* TOGGLE */}
          <div style={styles.toggleBar}>
            <button
              style={{ ...styles.toggleBtn, background: view === 'preview' ? '#00bfff' : 'transparent', color: view === 'preview' ? '#000' : '#555' }}
              onClick={() => setView('preview')}
            >
              Preview
            </button>
            <button
              style={{ ...styles.toggleBtn, background: view === 'code' ? '#00bfff' : 'transparent', color: view === 'code' ? '#000' : '#555' }}
              onClick={() => setView('code')}
            >
              Code
            </button>
          </div>

          {/* CONTENT */}
          <div style={styles.rightContent}>
            {currentCode === '' ? (
              <div style={styles.emptyPreview}>
                <p style={{ color: '#333', fontSize: '14px', textAlign: 'center' }}>
                  Your build will appear here
                </p>
              </div>
            ) : view === 'preview' ? (
              <iframe
                srcDoc={currentCode}
                style={styles.iframe}
                sandbox="allow-scripts"
                title="preview"
              />
            ) : (
              <pre style={styles.codeView}>{currentCode}</pre>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  )
}

export default function BattlePage() {
  return (
    <Suspense fallback={<div style={{ background: '#0a0a0a', minHeight: '100vh' }} />}>
      <BattleContent />
    </Suspense>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: { height: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', overflow: 'hidden' },
  topBar: {
    height: '48px', background: '#0a0a0a', borderBottom: '1px solid #1a1a1a',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 1.5rem', flexShrink: 0,
  },
  topLeft: { display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 },
  topRight: { flex: 1, display: 'flex', justifyContent: 'flex-end' },
  timer: { fontSize: '20px', fontWeight: '800', fontVariantNumeric: 'tabular-nums', flexShrink: 0 },
  lockBanner: {
    background: '#1a0a0a', borderBottom: '1px solid #3a1a1a',
    color: '#ff4d4d', fontSize: '13px', textAlign: 'center', padding: '8px',
  },
  main: { display: 'flex', flex: 1, overflow: 'hidden' },
  chatPanel: {
    width: '50%', borderRight: '1px solid #1a1a1a',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  chatMessages: {
    flex: 1, overflowY: 'auto', padding: '1rem',
    display: 'flex', flexDirection: 'column', gap: '10px',
  },
  emptyChat: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' },
  message: { maxWidth: '85%', borderRadius: '10px', padding: '10px 14px' },
  chatStats: {
    display: 'flex', gap: '1rem', padding: '6px 1rem',
    borderTop: '1px solid #1a1a1a', background: '#0a0a0a',
  },
  inputWrap: {
    padding: '1rem', borderTop: '1px solid #1a1a1a',
    display: 'flex', gap: '8px', alignItems: 'flex-end',
  },
  input: {
    flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: '8px', padding: '10px 14px', color: '#fff',
    fontSize: '13px', outline: 'none', resize: 'none', fontFamily: 'sans-serif',
  },
  sendBtn: {
    width: '40px', height: '40px', background: '#00bfff', color: '#000',
    border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: '700',
    cursor: 'pointer', flexShrink: 0,
  },
  rightPanel: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  toggleBar: {
    display: 'flex', gap: '4px', padding: '8px',
    borderBottom: '1px solid #1a1a1a', background: '#0a0a0a',
  },
  toggleBtn: {
    padding: '4px 16px', borderRadius: '6px', border: 'none',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  rightContent: { flex: 1, overflow: 'hidden', position: 'relative' },
  emptyPreview: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  iframe: { width: '100%', height: '100%', border: 'none', background: '#fff' },
  codeView: {
    margin: 0, padding: '1rem', color: '#aaa', fontSize: '12px',
    fontFamily: 'monospace', overflowY: 'auto', height: '100%',
    background: '#0a0a0a', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
  },
}