import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { callGroq } from '../../services/groq'

type Article = {
  title: string
  description?: string
  urlToImage?: string
  url: string
  source?: { name?: string }
  publishedAt?: string
}

type Zone = {
  id: string
  name: string
  color: string
}

type Props = {
  article: Article
  zone: Zone
  onClose: () => void
}

export function ZoneOverlay({ article, zone, onClose }: Props) {
  const [narration, setNarration] = useState('')
  const [narrating, setNarrating] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([])
  const [chatLoading, setChatLoading] = useState(false)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    async function generateNarration() {
      try {
        const text = await callGroq(
          [
            {
              role: 'user',
              content: `Write a 2-sentence dramatic news narration for this REAL news story.
Start with "Breaking from ${zone.name}...".
Base it ONLY on these real facts - do not invent anything:
Headline: "${article.title}"
Details: "${article.description || ''}"
Source: ${article.source?.name || 'Unknown'}
Make it vivid but factually accurate.`,
            },
          ],
          'You are a dramatic news narrator. Exactly 2 sentences. No markdown. No asterisks. Plain text only.'
        )
        setNarration(text)
        setNarrating(true)
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel()
          const utt = new SpeechSynthesisUtterance(text)
          utt.rate = 0.9
          utt.pitch = 1
          utt.volume = 0.9
          utt.onend = () => setNarrating(false)
          synthRef.current = utt
          window.speechSynthesis.speak(utt)
        }
      } catch (err) {
        const fallback = article.description || article.title
        setNarration(fallback)
        // eslint-disable-next-line no-console
        console.error('Narration failed:', err)
      }
    }
    void generateNarration()
    return () => window.speechSynthesis.cancel()
  }, [article, zone])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const tickerText = useMemo(
    () => `${article.description || article.title} · ${article.title} · Source: ${article.source?.name || 'NewsOS'}`,
    [article]
  )

  async function handleChat() {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = chatInput.trim()
    setChatInput('')
    const newHistory = [...chatMessages, { role: 'user' as const, content: userMsg }]
    setChatMessages(newHistory)
    setChatLoading(true)
    try {
      const reply = await callGroq(
        newHistory.map((m) => ({ role: m.role, content: m.content })),
        `You are a news analyst discussing this article: "${article.title}". Context: ${article.description || ''}. Answer in 2-3 sentences.`
      )
      setChatMessages([...newHistory, { role: 'assistant', content: reply }])
    } catch (err) {
      setChatMessages([...newHistory, { role: 'assistant', content: 'Could not fetch response. Please try again.' }])
      // eslint-disable-next-line no-console
      console.error('Zone chat failed:', err)
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 32, stiffness: 300 }}
      className="absolute inset-x-0 bottom-0 z-[100] flex h-[58%] overflow-hidden border-t bg-[rgba(8,8,8,0.97)] [backdrop-filter:blur(20px)]"
      style={{ borderTopColor: zone.color }}
    >
      <div className="relative w-[280px] shrink-0 overflow-hidden">
        <img
          src={article.urlToImage || ''}
          alt={article.title}
          className="h-full w-full object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[rgba(8,8,8,0.8)]" />
        <div className="absolute bottom-4 left-4">
          <div className="mb-1 text-[10px] uppercase tracking-[0.15em]" style={{ color: zone.color }}>
            {zone.name}
          </div>
          <div className="text-[11px] text-white/50">
            {article.source?.name || 'NewsOS'} · {article.publishedAt ? new Date(article.publishedAt).toLocaleString() : 'Now'}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden p-5">
        <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: zone.color }}>
          {narrating && (
            <span className="flex items-center gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="inline-block h-3 w-[2px] animate-pulse rounded-sm" style={{ background: zone.color }} />
              ))}
            </span>
          )}
          LIVE · {zone.name}
        </div>
        <h2 className="m-0 font-display text-xl leading-tight text-[var(--text-primary)]">{article.title}</h2>
        {narration && <p className="mb-3 mt-2 text-sm leading-relaxed text-white/75">{narration}</p>}
        <div className="mb-3 overflow-hidden rounded bg-white/5 py-1.5">
          <div className="animate-marquee whitespace-nowrap font-mono text-[11px]" style={{ color: zone.color }}>
            {tickerText} · {tickerText} ·
          </div>
        </div>
        <a href={article.url} target="_blank" rel="noreferrer" className="mb-auto text-xs hover:underline" style={{ color: zone.color }}>
          Read full article →
        </a>
      </div>

      <div className="flex w-[280px] shrink-0 flex-col border-l border-white/10 p-4">
        <div className="mb-3 text-[11px] uppercase tracking-[0.1em] text-white/40">Ask about this story</div>
        {chatMessages.length === 0 && (
          <div className="mb-3 flex flex-col gap-1.5">
            {['Explain simply', "What's the impact?", 'Historical context?'].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setChatInput(q)}
                className="rounded border px-2.5 py-1.5 text-left text-[11px] text-white/80"
                style={{ borderColor: `${zone.color}44` }}
              >
                {q}
              </button>
            ))}
          </div>
        )}
        <div className="mb-2 flex-1 space-y-2 overflow-y-auto">
          {chatMessages.map((m, i) => (
            <div
              key={i}
              className="rounded px-2.5 py-2 text-xs leading-relaxed"
              style={{ background: m.role === 'user' ? `${zone.color}22` : 'rgba(255,255,255,0.05)', color: m.role === 'user' ? zone.color : 'rgba(240,237,232,0.85)' }}
            >
              {m.content}
            </div>
          ))}
          {chatLoading && <div className="rounded bg-white/5 px-2.5 py-2 text-xs text-white/50">Thinking...</div>}
        </div>
        <div className="flex gap-1.5">
          <input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleChat()}
            placeholder="Ask anything..."
            className="flex-1 rounded border bg-white/10 px-2.5 py-1.5 text-xs text-white outline-none"
            style={{ borderColor: `${zone.color}44` }}
          />
          <button
            type="button"
            onClick={() => void handleChat()}
            className="rounded px-3 text-xs font-semibold text-black"
            style={{ background: zone.color }}
          >
            →
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 rounded border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/70"
      >
        ESC ✕
      </button>
    </motion.div>
  )
}
