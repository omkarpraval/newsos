import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Agent { name: string; stance: string; argument: string }
interface BoardResult {
  bull: Agent; bear: Agent; regulator: Agent
  verdict: string; confidenceScore: number
  error?: string
}

export function ShadowBoard() {
  const [topic, setTopic] = useState('')
  const [result, setResult] = useState<BoardResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeAgent, setActiveAgent] = useState<'bull' | 'bear' | 'regulator'>('bull')

  const run = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/shadow-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })
      const data = await res.json()
      setResult(data)
      setActiveAgent('bull')
    } catch (e: any) {
      setResult({ bull: { name: '', stance: '', argument: '' }, bear: { name: '', stance: '', argument: '' }, regulator: { name: '', stance: '', argument: '' }, verdict: '', confidenceScore: 0, error: e.message })
    } finally {
      setLoading(false)
    }
  }

  const agentConfig = {
    bull: { label: 'The Bull 🐂', color: 'bg-green-500', ring: 'ring-green-200', text: 'text-green-700', bg: 'bg-green-50' },
    bear: { label: 'The Bear 🐻', color: 'bg-red-500', ring: 'ring-red-200', text: 'text-red-700', bg: 'bg-red-50' },
    regulator: { label: 'The Regulator ⚖️', color: 'bg-blue-500', ring: 'ring-blue-200', text: 'text-blue-700', bg: 'bg-blue-50' },
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500">
          ET-IQ Intelligence
        </div>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-[var(--text-primary)]">Shadow Board</h1>
        <p className="mt-3 text-[var(--text-secondary)]">Three AI agents debate any business news story — Bull, Bear, and Regulator perspectives.</p>
      </header>

      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
        <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">News Topic or Headline</label>
        <textarea
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="e.g. RBI raises repo rate by 50bps to control inflation..."
          rows={3}
          className="w-full resize-none rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 py-4 text-sm font-medium text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--accent-gold)] focus:ring-4 focus:ring-[var(--accent-gold)]/10"
        />
        <button
          onClick={run}
          disabled={loading || !topic.trim()}
          className="mt-4 w-full rounded-2xl bg-[var(--accent-gold)] py-4 text-sm font-black text-black transition-all hover:opacity-90 disabled:opacity-40"
        >
          {loading ? '⚔️ Debating…' : '⚔️ Start Shadow Board Debate'}
        </button>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
            <div className="mx-auto mb-6 flex gap-2 justify-center">
              {['🐂', '🐻', '⚖️'].map((e, i) => (
                <div key={i} className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-3xl animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}>{e}</div>
              ))}
            </div>
            <p className="text-sm font-bold text-[var(--text-secondary)] animate-pulse">Agents are debating...</p>
          </motion.div>
        )}

        {result && !result.error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Agent Selector */}
            <div className="flex gap-2">
              {(Object.keys(agentConfig) as Array<'bull' | 'bear' | 'regulator'>).map(a => (
                <button
                  key={a}
                  onClick={() => setActiveAgent(a)}
                  className={`flex-1 rounded-2xl py-3 text-xs font-black transition-all ${activeAgent === a ? `${agentConfig[a].bg} ${agentConfig[a].text} ring-2 ${agentConfig[a].ring}` : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'}`}
                >
                  {agentConfig[a].label}
                </button>
              ))}
            </div>

            {/* Active Agent Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeAgent}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`rounded-3xl p-8 ${agentConfig[activeAgent].bg}`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${agentConfig[activeAgent].color} text-white text-2xl shadow-lg`}>
                    {activeAgent === 'bull' ? '🐂' : activeAgent === 'bear' ? '🐻' : '⚖️'}
                  </div>
                  <div>
                    <div className={`text-lg font-black ${agentConfig[activeAgent].text}`}>{result[activeAgent].name}</div>
                    <div className="text-xs font-bold text-gray-500">{result[activeAgent].stance}</div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed font-medium text-gray-700">{result[activeAgent].argument}</p>
              </motion.div>
            </AnimatePresence>

            {/* Verdict */}
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">AI Synthesis Verdict</div>
              <p className="text-base font-bold text-[var(--text-primary)]">{result.verdict}</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--accent-gold)]" style={{ width: `${result.confidenceScore}%` }} />
                </div>
                <span className="text-xs font-black text-[var(--accent-gold)]">{result.confidenceScore}% confidence</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
