'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AlertTriangle,
  Bot,
  Braces,
  CheckCircle2,
  Clock3,
  Code2,
  Eye,
  FileCode2,
  Gauge,
  Lock,
  MessageSquareText,
  Radio,
  Send,
  Sparkles,
  Swords,
  Timer,
  Trophy,
  Zap,
} from 'lucide-react'

const BATTLE_DURATION = 15 * 60

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type ViewMode = 'code' | 'preview'

type StreamResponse = {
  choices?: Array<{
    delta?: {
      content?: string
    }
  }>
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
  const [view, setView] = useState<ViewMode>('preview')
  const [timeLeft, setTimeLeft] = useState(BATTLE_DURATION)
  const [locked, setLocked] = useState(false)
  const [promptCount, setPromptCount] = useState(0)
  const [tokenCount, setTokenCount] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (locked) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setLocked(true)

          setTimeout(() => {
            const params = new URLSearchParams({
              prompt,
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
  }, [locked, prompt, router])

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!locked) {
        event.preventDefault()
        event.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [locked])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60).toString().padStart(2, '0')
    const seconds = (secs % 60).toString().padStart(2, '0')
    return `${minutes}:${seconds}`
  }

  const extractCode = (text: string) => {
    const mdMatch = text.match(/```(?:html)?\s*(<!DOCTYPE[\s\S]*?<\/html>)\s*```/i)
    if (mdMatch) return mdMatch[1]

    const rawMatch = text.match(/<!DOCTYPE html>[\s\S]*<\/html>/i)
    if (rawMatch) return rawMatch[0]

    return ''
  }

  const parseStreamToken = (data: string) => {
    try {
      const parsed = JSON.parse(data) as StreamResponse
      return parsed.choices?.[0]?.delta?.content || ''
    } catch {
      return ''
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isStreaming || locked) return

    const userMessage: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setPromptCount(prev => prev + 1)
    setIsStreaming(true)

    let fullResponse = ''
    const assistantMessage: Message = { role: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const response = await fetch('/api/battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, model }),
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') break

          const token = parseStreamToken(data)
          if (!token) continue

          fullResponse += token
          setTokenCount(prev => prev + token.length)
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: fullResponse }
            return updated
          })
        }
      }

      const code = extractCode(fullResponse)
      if (code) {
        setCurrentCode(code)
        currentCodeRef.current = code
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'The arena connection dropped. Try sending the prompt again.',
        }
        return updated
      })
    }

    setIsStreaming(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  const minutesUsed = Math.max(0, Math.round((BATTLE_DURATION - timeLeft) / 60))
  const timeProgress = ((BATTLE_DURATION - timeLeft) / BATTLE_DURATION) * 100
  const isDanger = timeLeft <= 30
  const isWarning = timeLeft <= 120
  const timerTone = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#06b6d4'
  const codeReady = currentCode.length > 0

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.82); } }
        @keyframes driftIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes timerPulse { 0%, 100% { box-shadow: 0 0 0 rgba(239, 68, 68, 0); } 50% { box-shadow: 0 0 28px rgba(239, 68, 68, 0.24); } }
        .arena-enter { animation: driftIn 0.38s ease both; }
        .arena-button { transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease; }
        .arena-button:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.04); box-shadow: 0 16px 34px rgba(0, 210, 255, 0.28); }
        .arena-panel { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .arena-panel:hover { border-color: #cffafe; box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08); }
        @media (max-width: 980px) {
          .arena-shell { padding: 14px !important; }
          .arena-main { grid-template-columns: 1fr !important; overflow: auto !important; }
          .arena-top { height: auto !important; align-items: flex-start !important; flex-direction: column !important; }
          .prompt-text { max-width: 100% !important; }
        }
      `}</style>

      <header className="arena-top" style={styles.topBar}>
        <div style={styles.topLeft}>
          <div style={styles.brandMark}>
            <Swords size={20} />
          </div>
          <div>
            <div style={styles.brandLine}>
              <span style={styles.liveDot} />
              Live battle
            </div>
            <p className="prompt-text" style={styles.promptText}>{prompt}</p>
          </div>
        </div>

        <div style={styles.timerCluster}>
          <div style={{
            ...styles.timerCard,
            color: timerTone,
            borderColor: isDanger ? '#fecaca' : isWarning ? '#fed7aa' : '#cffafe',
            animation: isDanger ? 'timerPulse 1s ease infinite' : 'none',
          }}>
            <Clock3 size={18} />
            <span>{locked ? 'LOCKED' : formatTime(timeLeft)}</span>
          </div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${timeProgress}%`, background: timerTone }} />
          </div>
        </div>

        <div style={styles.modelPill}>
          <Bot size={16} />
          <span>{modelName}</span>
        </div>
      </header>

      {locked && (
        <div style={styles.lockBanner}>
          <Lock size={16} />
          Time is up. Your last generated build has been submitted.
        </div>
      )}

      <main className="arena-shell" style={styles.shell}>
        <section className="arena-main" style={styles.main}>
          <aside className="arena-panel arena-enter" style={styles.leftPanel}>
            <div style={styles.panelHeader}>
              <div>
                <p style={styles.kicker}>Prompt Console</p>
                <h2 style={styles.panelTitle}>Build commands</h2>
              </div>
              <div style={styles.statBadge}>
                <MessageSquareText size={15} />
                {promptCount}
              </div>
            </div>

            <div style={styles.promptCard}>
              <span style={styles.promptBadge}>Match prompt</span>
              <p style={styles.promptBody}>{prompt}</p>
            </div>

            <div style={styles.chatMessages}>
              {messages.length === 0 && (
                <div style={styles.emptyChat}>
                  <div style={styles.emptyIcon}><Sparkles size={24} /></div>
                  <h3 style={styles.emptyTitle}>Start the sprint</h3>
                  <p style={styles.emptyText}>
                    Describe the first version you want. Keep it specific: layout, theme, interactions, and scoring details.
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  style={{
                    ...styles.message,
                    alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                    background: message.role === 'user' ? '#ecfeff' : '#f8fafc',
                    borderColor: message.role === 'user' ? '#bae6fd' : '#e2e8f0',
                  }}
                >
                  <div style={styles.messageMeta}>
                    {message.role === 'user' ? <Zap size={12} /> : <Bot size={12} />}
                    {message.role === 'user' ? 'You' : 'Model'}
                  </div>
                  <p style={{
                    ...styles.messageText,
                    color: message.role === 'user' ? '#155e75' : '#475569',
                  }}>
                    {message.content}
                    {isStreaming && index === messages.length - 1 && message.role === 'assistant' && (
                      <span style={styles.cursor}>|</span>
                    )}
                  </p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div style={styles.chatStats}>
              <span><Braces size={13} /> Prompts: {promptCount}</span>
              <span><Gauge size={13} /> Tokens: {tokenCount.toLocaleString()}</span>
              <span><Timer size={13} /> {minutesUsed}m used</span>
              {tokenCount > 90000 && <span style={styles.warningText}><AlertTriangle size={13} /> Token limit close</span>}
            </div>

            <div style={styles.inputWrap}>
              <textarea
                ref={inputRef}
                style={styles.input}
                placeholder={locked ? 'Battle locked' : 'Describe what to build or change...'}
                value={input}
                onChange={event => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={locked || isStreaming}
                rows={4}
              />
              <button
                className="arena-button"
                onClick={sendMessage}
                disabled={!input.trim() || isStreaming || locked}
                style={{
                  ...styles.sendBtn,
                  opacity: !input.trim() || isStreaming || locked ? 0.45 : 1,
                  cursor: !input.trim() || isStreaming || locked ? 'not-allowed' : 'pointer',
                }}
                aria-label="Send build prompt"
              >
                {isStreaming ? <Radio size={20} /> : <Send size={20} />}
              </button>
            </div>
          </aside>

          <section className="arena-panel arena-enter" style={styles.rightPanel}>
            <div style={styles.previewHeader}>
              <div>
                <p style={styles.kicker}>Submission Studio</p>
                <h2 style={styles.panelTitle}>Live build</h2>
              </div>

              <div style={styles.headerActions}>
                <span style={{
                  ...styles.readyPill,
                  color: codeReady ? '#16a34a' : '#94a3b8',
                  background: codeReady ? '#dcfce7' : '#f8fafc',
                  borderColor: codeReady ? '#bbf7d0' : '#e2e8f0',
                }}>
                  {codeReady ? <CheckCircle2 size={14} /> : <FileCode2 size={14} />}
                  {codeReady ? 'Build ready' : 'Awaiting code'}
                </span>

                <div style={styles.toggleBar}>
                  <button
                    style={{
                      ...styles.toggleBtn,
                      background: view === 'preview' ? '#0f172a' : 'transparent',
                      color: view === 'preview' ? '#ffffff' : '#64748b',
                    }}
                    onClick={() => setView('preview')}
                  >
                    <Eye size={15} /> Preview
                  </button>
                  <button
                    style={{
                      ...styles.toggleBtn,
                      background: view === 'code' ? '#0f172a' : 'transparent',
                      color: view === 'code' ? '#ffffff' : '#64748b',
                    }}
                    onClick={() => setView('code')}
                  >
                    <Code2 size={15} /> Code
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.workspaceMeta}>
              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>Mode</span>
                <strong>{view === 'preview' ? 'Visual QA' : 'Source audit'}</strong>
              </div>
              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>Chars</span>
                <strong>{currentCode.length.toLocaleString()}</strong>
              </div>
              <div style={styles.metricCard}>
                <span style={styles.metricLabel}>Submit rule</span>
                <strong>Last build</strong>
              </div>
            </div>

            <div style={styles.workspace}>
              {currentCode === '' ? (
                <div style={styles.emptyPreview}>
                  <div style={styles.emptyPreviewFrame}>
                    <Trophy size={30} />
                    <h3>Your build will appear here</h3>
                    <p>Send a prompt on the left. The generated single-file app will render instantly in this studio.</p>
                  </div>
                </div>
              ) : view === 'preview' ? (
                <iframe
                  srcDoc={currentCode}
                  style={styles.iframe}
                  sandbox="allow-scripts"
                  title="Vibe Arena build preview"
                />
              ) : (
                <pre style={styles.codeView}>{currentCode}</pre>
              )}
            </div>
          </section>
        </section>
      </main>
    </div>
  )
}

export default function BattlePage() {
  return (
    <Suspense fallback={<div style={{ background: '#f8fafc', minHeight: '100vh' }} />}>
      <BattleContent />
    </Suspense>
  )
}

const styles: Record<string, CSSProperties> = {
  container: {
    height: '100vh',
    background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 42%, #eef9ff 100%)',
    color: '#0f172a',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    overflow: 'hidden',
  },
  topBar: {
    minHeight: '82px',
    background: 'rgba(255, 255, 255, 0.88)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '18px',
    padding: '14px 22px',
    flexShrink: 0,
    zIndex: 20,
  },
  topLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    minWidth: 0,
    flex: 1,
  },
  brandMark: {
    width: '46px',
    height: '46px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 16px 32px rgba(0, 210, 255, 0.24)',
    flexShrink: 0,
  },
  brandLine: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#0891b2',
    fontSize: '11px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    marginBottom: '5px',
  },
  liveDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#22c55e',
    animation: 'pulseDot 1.4s ease infinite',
  },
  promptText: {
    color: '#0f172a',
    fontSize: '14px',
    fontWeight: 800,
    margin: 0,
    maxWidth: '560px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  timerCluster: {
    width: '230px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
  },
  timerCard: {
    height: '46px',
    border: '1px solid #cffafe',
    background: '#ffffff',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '24px',
    fontWeight: 900,
    fontVariantNumeric: 'tabular-nums',
    boxShadow: '0 14px 32px rgba(15, 23, 42, 0.05)',
  },
  progressTrack: {
    height: '5px',
    background: '#e2e8f0',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.3s ease, background 0.3s ease',
  },
  modelPill: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '9px',
    color: '#475569',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '999px',
    padding: '11px 14px',
    fontSize: '12px',
    fontWeight: 900,
    minWidth: '170px',
    maxWidth: '240px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  lockBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: '#fef2f2',
    borderBottom: '1px solid #fecaca',
    color: '#dc2626',
    fontSize: '13px',
    fontWeight: 800,
    padding: '10px',
    flexShrink: 0,
  },
  shell: {
    flex: 1,
    overflow: 'hidden',
    padding: '18px',
  },
  main: {
    height: '100%',
    display: 'grid',
    gridTemplateColumns: 'minmax(360px, 0.82fr) minmax(0, 1.18fr)',
    gap: '18px',
    overflow: 'hidden',
  },
  leftPanel: {
    minHeight: 0,
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 24px 70px rgba(15, 23, 42, 0.06)',
  },
  rightPanel: {
    minHeight: 0,
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 24px 70px rgba(15, 23, 42, 0.06)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '22px 22px 14px',
  },
  kicker: {
    color: '#06b6d4',
    fontSize: '11px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    margin: 0,
  },
  panelTitle: {
    color: '#0f172a',
    fontSize: '22px',
    fontWeight: 900,
    letterSpacing: '-0.02em',
    margin: '6px 0 0',
  },
  statBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    color: '#0891b2',
    background: '#ecfeff',
    border: '1px solid #cffafe',
    borderRadius: '999px',
    padding: '7px 10px',
    fontSize: '12px',
    fontWeight: 900,
    fontFamily: "'JetBrains Mono', monospace",
  },
  promptCard: {
    margin: '0 22px 14px',
    padding: '14px',
    background: 'linear-gradient(135deg, #f0fdff 0%, #ffffff 100%)',
    border: '1px solid #cffafe',
    borderRadius: '16px',
  },
  promptBadge: {
    display: 'inline-flex',
    color: '#0891b2',
    background: '#ecfeff',
    borderRadius: '999px',
    padding: '5px 8px',
    fontSize: '10px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: '8px',
  },
  promptBody: {
    color: '#0f172a',
    fontSize: '13px',
    fontWeight: 800,
    lineHeight: 1.55,
    margin: 0,
  },
  chatMessages: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '0 22px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyChat: {
    flex: 1,
    minHeight: '240px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '24px',
    border: '1px dashed #cbd5e1',
    borderRadius: '18px',
    background: '#fbfdff',
  },
  emptyIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '18px',
    background: 'linear-gradient(135deg, #00d2ff, #3a7bd5)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '14px',
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: '18px',
    fontWeight: 900,
    margin: '0 0 8px',
  },
  emptyText: {
    color: '#64748b',
    fontSize: '13px',
    fontWeight: 600,
    lineHeight: 1.65,
    maxWidth: '330px',
    margin: 0,
  },
  message: {
    maxWidth: '88%',
    border: '1px solid',
    borderRadius: '16px',
    padding: '12px 14px',
  },
  messageMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#94a3b8',
    fontSize: '10px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: '7px',
  },
  messageText: {
    fontSize: '13px',
    fontWeight: 600,
    lineHeight: 1.65,
    whiteSpace: 'pre-wrap',
    margin: 0,
  },
  cursor: {
    display: 'inline-block',
    color: '#06b6d4',
    fontWeight: 900,
    animation: 'pulseDot 1s ease infinite',
    marginLeft: '2px',
  },
  chatStats: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    padding: '10px 22px',
    borderTop: '1px solid #f1f5f9',
    background: '#fbfdff',
    color: '#94a3b8',
    fontSize: '11px',
    fontWeight: 800,
  },
  warningText: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    color: '#f59e0b',
  },
  inputWrap: {
    padding: '16px 18px 18px',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-end',
    background: '#ffffff',
  },
  input: {
    flex: 1,
    minHeight: '82px',
    maxHeight: '160px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '13px 14px',
    color: '#0f172a',
    fontSize: '13px',
    fontWeight: 600,
    lineHeight: 1.55,
    outline: 'none',
    resize: 'vertical',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  sendBtn: {
    width: '50px',
    height: '50px',
    background: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '16px',
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  previewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    padding: '22px 22px 14px',
    borderBottom: '1px solid #f1f5f9',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  readyPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    border: '1px solid',
    borderRadius: '999px',
    padding: '8px 10px',
    fontSize: '11px',
    fontWeight: 900,
  },
  toggleBar: {
    display: 'flex',
    gap: '4px',
    padding: '4px',
    border: '1px solid #e2e8f0',
    borderRadius: '999px',
    background: '#f8fafc',
  },
  toggleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '8px 12px',
    borderRadius: '999px',
    border: 'none',
    fontSize: '12px',
    fontWeight: 900,
    cursor: 'pointer',
  },
  workspaceMeta: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '10px',
    padding: '14px 22px',
    background: '#fbfdff',
    borderBottom: '1px solid #f1f5f9',
  },
  metricCard: {
    background: '#ffffff',
    border: '1px solid #f1f5f9',
    borderRadius: '14px',
    padding: '10px 12px',
  },
  metricLabel: {
    display: 'block',
    color: '#94a3b8',
    fontSize: '10px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: '5px',
  },
  workspace: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    overflow: 'hidden',
    background: '#f8fafc',
  },
  emptyPreview: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '28px',
  },
  emptyPreviewFrame: {
    width: '100%',
    maxWidth: '460px',
    minHeight: '280px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    color: '#06b6d4',
    background: '#ffffff',
    border: '1px dashed #bae6fd',
    borderRadius: '22px',
    padding: '34px',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    background: '#ffffff',
  },
  codeView: {
    margin: 0,
    padding: '22px',
    color: '#cbd5e1',
    fontSize: '12px',
    fontFamily: "'JetBrains Mono', monospace",
    lineHeight: 1.7,
    overflowY: 'auto',
    height: '100%',
    background: '#0f172a',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
}
