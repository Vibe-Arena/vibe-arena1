'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Bot,
  CheckCircle2,
  Clock3,
  Code2,
  Columns3,
  Eye,
  FileCode2,
  Gauge,
  Lock,
  Maximize2,
  MessageSquareText,
  Minimize2,
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

type ViewMode = 'preview' | 'split' | 'code'

type StreamResponse = {
  choices?: Array<{
    delta?: {
      content?: string
    }
  }>
}

function BattleContent() {
  const currentCodeRef = useRef('')
  const studioRef = useRef<HTMLElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [studioFocus, setStudioFocus] = useState(false)

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
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === studioRef.current)
      if (document.fullscreenElement === studioRef.current) {
        setStudioFocus(false)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

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

  const toggleFullscreen = async () => {
    if (!studioRef.current) return

    if (studioFocus) {
      setStudioFocus(false)
      return
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }

    try {
      await studioRef.current.requestFullscreen()
    } catch {
      setStudioFocus(true)
    }
  }

  const minutesUsed = Math.max(0, Math.round((BATTLE_DURATION - timeLeft) / 60))
  const timeProgress = ((BATTLE_DURATION - timeLeft) / BATTLE_DURATION) * 100
  const timerTone = timeLeft <= 30 ? 'danger' : timeLeft <= 120 ? 'warning' : 'live'
  const codeReady = currentCode.length > 0
  const codeLines = currentCode.split('\n')

  return (
    <div className="battle-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

        * { box-sizing: border-box; }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.42; transform: scale(0.82); }
        }

        .battle-page {
          --ink: #111827;
          --muted: #6b7280;
          --line: #e5e7eb;
          --soft: #f5f7fb;
          --panel: #ffffff;
          --accent: #0ea5a4;
          --accent-ink: #0f766e;
          --hot: #ef4444;
          --warn: #d97706;
          min-height: 100vh;
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background:
            radial-gradient(circle at top left, rgba(14, 165, 164, 0.14), transparent 30%),
            linear-gradient(180deg, #fbfcff 0%, #eef2f7 100%);
          color: var(--ink);
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .topbar {
          min-height: 72px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 16px;
          padding: 12px 18px;
          border-bottom: 1px solid rgba(229, 231, 235, 0.9);
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(18px);
          flex-shrink: 0;
        }

        .brand {
          display: flex;
          align-items: center;
          min-width: 0;
          gap: 12px;
        }

        .mark {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 12px;
          color: white;
          background: #111827;
          box-shadow: 0 12px 26px rgba(17, 24, 39, 0.18);
        }

        .live-label,
        .eyebrow {
          display: flex;
          align-items: center;
          gap: 7px;
          margin: 0;
          color: var(--accent-ink);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #22c55e;
          animation: pulseDot 1.35s ease infinite;
        }

        .prompt-line {
          max-width: 760px;
          margin: 4px 0 0;
          overflow: hidden;
          color: var(--ink);
          font-size: 14px;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .timer {
          min-width: 200px;
        }

        .timer-readout {
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: white;
          color: var(--accent-ink);
          font: 800 22px/1 'JetBrains Mono', monospace;
          font-variant-numeric: tabular-nums;
        }

        .timer-readout.warning { color: var(--warn); }
        .timer-readout.danger { color: var(--hot); }

        .progress {
          height: 4px;
          margin-top: 7px;
          overflow: hidden;
          border-radius: 999px;
          background: #e5e7eb;
        }

        .progress span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: var(--accent);
          transition: width 0.28s ease;
        }

        .model-pill,
        .status-pill,
        .stat-pill {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: white;
          color: #4b5563;
          font-size: 12px;
          font-weight: 800;
        }

        .model-pill {
          max-width: 230px;
          padding: 10px 13px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .lock-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 9px 12px;
          border-bottom: 1px solid #fecaca;
          background: #fef2f2;
          color: #dc2626;
          font-size: 13px;
          font-weight: 800;
        }

        .arena {
          min-height: 0;
          flex: 1;
          display: grid;
          grid-template-columns: minmax(330px, 0.78fr) minmax(0, 1.22fr);
          gap: 14px;
          padding: 14px;
          overflow: hidden;
        }

        .console,
        .studio {
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 14px;
          background: var(--panel);
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.07);
        }

        .panel-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          padding: 16px 16px 12px;
          border-bottom: 1px solid #f0f2f5;
        }

        .title {
          margin: 4px 0 0;
          color: var(--ink);
          font-size: 20px;
          line-height: 1.15;
          font-weight: 800;
        }

        .stat-pill {
          padding: 7px 10px;
          color: var(--accent-ink);
          font-family: 'JetBrains Mono', monospace;
        }

        .brief {
          margin: 14px 16px;
          padding: 12px;
          border: 1px solid #dcebea;
          border-radius: 12px;
          background: #f8fffe;
        }

        .brief span {
          display: block;
          margin-bottom: 7px;
          color: var(--accent-ink);
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .brief p {
          margin: 0;
          color: #1f2937;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.5;
        }

        .messages {
          min-height: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
          padding: 0 16px 14px;
        }

        .empty-chat,
        .empty-preview {
          min-height: 240px;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 28px;
          color: var(--muted);
        }

        .empty-icon {
          width: 50px;
          height: 50px;
          display: grid;
          place-items: center;
          margin-bottom: 14px;
          border-radius: 14px;
          background: #111827;
          color: white;
        }

        .empty-chat h3,
        .empty-preview h3 {
          margin: 0 0 7px;
          color: var(--ink);
          font-size: 17px;
          font-weight: 800;
        }

        .empty-chat p,
        .empty-preview p {
          max-width: 350px;
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.65;
        }

        .message {
          max-width: 90%;
          padding: 11px 12px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: #f9fafb;
        }

        .message.user {
          align-self: flex-end;
          border-color: #bee3e1;
          background: #f1fbfa;
        }

        .message.assistant {
          align-self: flex-start;
        }

        .message-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
          color: #8a94a3;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .message p {
          margin: 0;
          color: #4b5563;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.62;
          white-space: pre-wrap;
        }

        .message.user p { color: #0f766e; }

        .cursor {
          display: inline-block;
          margin-left: 2px;
          color: var(--accent);
          font-weight: 800;
          animation: pulseDot 1s ease infinite;
        }

        .console-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          padding: 10px 16px;
          border-top: 1px solid #f0f2f5;
          background: #fbfcfe;
          color: #6b7280;
          font-size: 11px;
          font-weight: 800;
        }

        .console-stats span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }

        .composer {
          display: flex;
          align-items: flex-end;
          gap: 10px;
          padding: 14px 16px 16px;
          border-top: 1px solid #f0f2f5;
          background: white;
        }

        textarea {
          width: 100%;
          min-height: 84px;
          max-height: 160px;
          resize: vertical;
          outline: none;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: #f8fafc;
          color: var(--ink);
          padding: 12px 13px;
          font: 600 13px/1.55 'Plus Jakarta Sans', sans-serif;
        }

        textarea:focus {
          border-color: #99d6d3;
          box-shadow: 0 0 0 3px rgba(14, 165, 164, 0.12);
        }

        button {
          font-family: inherit;
        }

        .icon-button,
        .send-button,
        .mode-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          cursor: pointer;
          transition: transform 0.18s ease, background 0.18s ease, color 0.18s ease;
        }

        .icon-button:hover,
        .send-button:hover:not(:disabled),
        .mode-button:hover {
          transform: translateY(-1px);
        }

        .send-button {
          width: 48px;
          height: 48px;
          flex: 0 0 auto;
          border-radius: 12px;
          background: #111827;
          color: white;
        }

        .send-button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }

        .studio {
          position: relative;
        }

        .studio:fullscreen,
        .studio.focus-mode {
          width: 100vw;
          height: 100vh;
          border: 0;
          border-radius: 0;
          background: white;
        }

        .studio.focus-mode {
          position: fixed;
          inset: 0;
          z-index: 80;
        }

        .studio-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 9px;
          flex-wrap: wrap;
        }

        .status-pill {
          padding: 8px 10px;
        }

        .status-pill.ready {
          border-color: #bbf7d0;
          background: #f0fdf4;
          color: #15803d;
        }

        .mode-switch {
          display: flex;
          gap: 4px;
          padding: 4px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: #f8fafc;
        }

        .mode-button {
          min-width: 38px;
          height: 34px;
          gap: 7px;
          padding: 0 10px;
          border-radius: 9px;
          background: transparent;
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
        }

        .mode-button.active {
          background: #111827;
          color: white;
        }

        .icon-button {
          width: 42px;
          height: 42px;
          flex: 0 0 auto;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: white;
          color: #374151;
        }

        .studio-meta {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          padding: 10px 16px;
          border-bottom: 1px solid #f0f2f5;
          background: #fbfcfe;
        }

        .metric {
          min-width: 0;
          padding: 9px 10px;
          border: 1px solid #eef1f4;
          border-radius: 10px;
          background: white;
        }

        .metric span {
          display: block;
          margin-bottom: 4px;
          color: #8a94a3;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .metric strong {
          display: block;
          overflow: hidden;
          color: var(--ink);
          font-size: 13px;
          font-weight: 800;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .workspace {
          min-height: 0;
          flex: 1;
          position: relative;
          overflow: hidden;
          background: #eef2f7;
        }

        .workspace.split {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 1px;
          background: #d8dee8;
        }

        .preview-frame,
        .code-frame {
          min-width: 0;
          min-height: 0;
          height: 100%;
          background: white;
        }

        iframe {
          width: 100%;
          height: 100%;
          border: 0;
          background: white;
        }

        .code-frame {
          overflow: auto;
          background: #0b1220;
          color: #dbeafe;
          font-family: 'JetBrains Mono', monospace;
        }

        .code-row {
          display: grid;
          grid-template-columns: 54px minmax(0, 1fr);
          min-height: 22px;
          font-size: 12px;
          line-height: 1.7;
        }

        .code-row:first-child { padding-top: 14px; }
        .code-row:last-child { padding-bottom: 18px; }

        .line-number {
          padding-right: 14px;
          color: #64748b;
          text-align: right;
          user-select: none;
        }

        .line-code {
          min-width: max-content;
          padding-right: 22px;
          white-space: pre;
        }

        .empty-preview {
          background:
            linear-gradient(#ffffff, #ffffff) padding-box,
            repeating-linear-gradient(90deg, rgba(17,24,39,0.06) 0 1px, transparent 1px 34px),
            repeating-linear-gradient(0deg, rgba(17,24,39,0.06) 0 1px, transparent 1px 34px);
        }

        @media (max-width: 1050px) {
          .battle-page {
            height: auto;
            min-height: 100vh;
            overflow: auto;
          }

          .topbar,
          .arena,
          .workspace.split {
            grid-template-columns: 1fr;
          }

          .topbar {
            align-items: stretch;
          }

          .timer,
          .model-pill {
            width: 100%;
            max-width: none;
          }

          .arena {
            overflow: visible;
          }

          .console,
          .studio {
            min-height: 640px;
          }

          .prompt-line {
            white-space: normal;
          }
        }

        @media (max-width: 680px) {
          .arena {
            padding: 10px;
          }

          .panel-head,
          .studio-actions,
          .composer {
            align-items: stretch;
            flex-direction: column;
          }

          .studio-meta {
            grid-template-columns: 1fr;
          }

          .mode-switch {
            width: 100%;
          }

          .mode-button {
            flex: 1;
          }

          .icon-button {
            width: 100%;
          }
        }
      `}</style>

      <header className="topbar">
        <div className="brand">
          <div className="mark">
            <Swords size={20} />
          </div>
          <div>
            <p className="live-label"><span className="dot" /> Live battle</p>
            <p className="prompt-line">{prompt}</p>
          </div>
        </div>

        <div className="timer">
          <div className={`timer-readout ${timerTone}`}>
            <Clock3 size={18} />
            <span>{locked ? 'LOCKED' : formatTime(timeLeft)}</span>
          </div>
          <div className="progress">
            <span style={{ width: `${timeProgress}%` }} />
          </div>
        </div>

        <div className="model-pill" title={modelName}>
          <Bot size={16} />
          <span>{modelName}</span>
        </div>
      </header>

      {locked && (
        <div className="lock-banner">
          <Lock size={16} />
          Time is up. Your last generated build has been submitted.
        </div>
      )}

      <main className="arena">
        <aside className="console">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Prompt console</p>
              <h2 className="title">Build commands</h2>
            </div>
            <div className="stat-pill">
              <MessageSquareText size={15} />
              {promptCount}
            </div>
          </div>

          <div className="brief">
            <span>Match prompt</span>
            <p>{prompt}</p>
          </div>

          <div className="messages">
            {messages.length === 0 && (
              <div className="empty-chat">
                <div className="empty-icon"><Sparkles size={23} /></div>
                <h3>Start the sprint</h3>
                <p>Ask for the first version, then iterate hard. The latest complete HTML build is what gets submitted.</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
                <div className="message-meta">
                  {message.role === 'user' ? <Zap size={12} /> : <Bot size={12} />}
                  {message.role === 'user' ? 'You' : 'Model'}
                </div>
                <p>
                  {message.content}
                  {isStreaming && index === messages.length - 1 && message.role === 'assistant' && (
                    <span className="cursor">|</span>
                  )}
                </p>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="console-stats">
            <span><MessageSquareText size={13} /> Prompts {promptCount}</span>
            <span><Gauge size={13} /> Tokens {tokenCount.toLocaleString()}</span>
            <span><Timer size={13} /> {minutesUsed}m used</span>
          </div>

          <div className="composer">
            <textarea
              placeholder={locked ? 'Battle locked' : 'Describe what to build or change...'}
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={locked || isStreaming}
              rows={4}
            />
            <button
              className="send-button"
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming || locked}
              aria-label="Send build prompt"
              title="Send"
            >
              {isStreaming ? <Radio size={20} /> : <Send size={20} />}
            </button>
          </div>
        </aside>

        <section className={`studio ${studioFocus ? 'focus-mode' : ''}`} ref={studioRef}>
          <div className="panel-head">
            <div>
              <p className="eyebrow">Submission studio</p>
              <h2 className="title">Live build</h2>
            </div>

            <div className="studio-actions">
              <span className={`status-pill ${codeReady ? 'ready' : ''}`}>
                {codeReady ? <CheckCircle2 size={14} /> : <FileCode2 size={14} />}
                {codeReady ? 'Build ready' : 'Awaiting code'}
              </span>

              <div className="mode-switch" aria-label="View mode">
                <button
                  className={`mode-button ${view === 'preview' ? 'active' : ''}`}
                  onClick={() => setView('preview')}
                  title="Preview"
                >
                  <Eye size={15} />
                  Preview
                </button>
                <button
                  className={`mode-button ${view === 'split' ? 'active' : ''}`}
                  onClick={() => setView('split')}
                  title="Split"
                >
                  <Columns3 size={15} />
                  Split
                </button>
                <button
                  className={`mode-button ${view === 'code' ? 'active' : ''}`}
                  onClick={() => setView('code')}
                  title="Code"
                >
                  <Code2 size={15} />
                  Code
                </button>
              </div>

              <button
                className="icon-button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen || studioFocus ? 'Exit fullscreen' : 'Enter fullscreen'}
                title={isFullscreen || studioFocus ? 'Exit fullscreen' : 'Fullscreen studio'}
              >
                {isFullscreen || studioFocus ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </div>

          <div className="studio-meta">
            <div className="metric">
              <span>Mode</span>
              <strong>{view === 'preview' ? 'Preview' : view === 'split' ? 'Split view' : 'Source'}</strong>
            </div>
            <div className="metric">
              <span>Code size</span>
              <strong>{currentCode.length.toLocaleString()} chars</strong>
            </div>
            <div className="metric">
              <span>Submit rule</span>
              <strong>Latest build</strong>
            </div>
          </div>

          {currentCode === '' ? (
            <div className="workspace">
              <div className="empty-preview">
                <div className="empty-icon"><Trophy size={25} /></div>
                <h3>Your build will appear here</h3>
                <p>Once the model returns a full HTML app, this studio turns into your preview, code view, or both at once.</p>
              </div>
            </div>
          ) : (
            <div className={`workspace ${view === 'split' ? 'split' : ''}`}>
              {(view === 'preview' || view === 'split') && (
                <div className="preview-frame">
                  <iframe
                    srcDoc={currentCode}
                    sandbox="allow-scripts"
                    title="Vibe Arena build preview"
                  />
                </div>
              )}

              {(view === 'code' || view === 'split') && (
                <div className="code-frame" aria-label="Generated code">
                  {codeLines.map((line, index) => (
                    <div className="code-row" key={`${index}-${line.slice(0, 12)}`}>
                      <span className="line-number">{index + 1}</span>
                      <code className="line-code">{line || ' '}</code>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
