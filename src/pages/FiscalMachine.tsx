import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '../store/useUserStore'

interface SimResult {
  impactSummary: string
  portfolioImpact: { estimatedChange: number; rupeeAmount: number; direction: 'positive' | 'negative' | 'neutral'; confidence: string }
  affectedSectors: { sector: string; impact: number; reason: string }[]
  recommendations: string[]
  disclaimer: string
  error?: string
}

export function FiscalMachine() {
  const { persona } = useUserStore()
  const [headline, setHeadline] = useState('')
  const [portfolio, setPortfolio] = useState(100000)
  const [result, setResult] = useState<SimResult | null>(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    if (!headline.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsHeadline: headline, portfolioValue: portfolio, persona }),
      })
      setResult(await res.json())
    } catch (e: any) {
      setResult({ impactSummary: '', portfolioImpact: { estimatedChange: 0, rupeeAmount: 0, direction:'neutral', confidence:'low' }, affectedSectors: [], recommendations: [], disclaimer: '', error: e.message })
    } finally {
      setLoading(false)
    }
  }

  const dir = result?.portfolioImpact.direction
  const isNeg = dir === 'negative'
  const isPos = dir === 'positive'

  return (
    <div className="mx-auto max-w-3xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-500">ET-IQ Innovation</div>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-[var(--text-primary)]">Fiscal Time Machine</h1>
        <p className="mt-3 text-[var(--text-secondary)]">Enter a news headline and simulate the projected impact on your portfolio in seconds.</p>
      </header>

      <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 space-y-5">
        <div>
          <label className="block text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">News Headline</label>
          <textarea
            value={headline}
            onChange={e => setHeadline(e.target.value)}
            placeholder="e.g. RBI hikes repo rate by 50 bps to 6.5% to fight inflation..."
            rows={3}
            className="w-full resize-none rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 py-4 text-sm font-medium text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--accent-gold)] focus:ring-4 focus:ring-[var(--accent-gold)]/10"
          />
        </div>
        <div>
          <label className="mb-3 flex items-center justify-between text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">
            Portfolio Size
            <span className="text-[var(--accent-gold)]">₹{portfolio.toLocaleString('en-IN')}</span>
          </label>
          <input
            type="range" min="10000" max="10000000" step="10000"
            value={portfolio}
            onChange={e => setPortfolio(parseInt(e.target.value))}
            className="w-full h-2 cursor-pointer appearance-none rounded-full bg-[var(--border-subtle)] accent-[var(--accent-gold)]"
          />
          <div className="mt-2 flex justify-between text-[10px] font-bold text-[var(--text-muted)]">
            <span>₹10K</span><span>₹10L</span><span>₹1Cr</span>
          </div>
        </div>
        <button
          onClick={run}
          disabled={loading || !headline.trim()}
          className="w-full rounded-2xl bg-[var(--accent-gold)] py-4 text-sm font-black text-black transition-all hover:opacity-90 disabled:opacity-40"
        >
          {loading ? '🔮 Running simulation...' : '🔮 Run the News'}
        </button>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
            <div className="text-6xl mb-8 animate-spin-slow">🔮</div>
            <p className="text-sm font-bold text-[var(--text-secondary)] animate-pulse">Time Machine processing...</p>
          </motion.div>
        )}

        {result && !result.error && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Impact Hero Card */}
            <div className={`rounded-3xl p-8 text-white ${isNeg ? 'bg-red-600' : isPos ? 'bg-green-600' : 'bg-gray-700'}`}>
              <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-4">Estimated Portfolio Impact</div>
              <div className="flex items-baseline gap-3">
                <div className="text-6xl font-black tracking-tight">
                  {isNeg ? '↓' : isPos ? '↑' : '→'} {Math.abs(result.portfolioImpact.estimatedChange).toFixed(1)}%
                </div>
                <div className="text-2xl font-black opacity-60">
                  ₹{Math.abs(result.portfolioImpact.rupeeAmount).toLocaleString('en-IN')}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-1.5 flex-1 rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white" style={{ width: result.portfolioImpact.confidence === 'high' ? '80%' : result.portfolioImpact.confidence === 'medium' ? '55%' : '35%' }} />
                </div>
                <span className="text-[10px] font-black uppercase opacity-60">{result.portfolioImpact.confidence} confidence</span>
              </div>
              <p className="mt-6 text-sm font-medium leading-relaxed opacity-90">{result.impactSummary}</p>
            </div>

            {/* Affected Sectors */}
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-5">Affected Sectors</h3>
              <div className="space-y-4">
                {result.affectedSectors.map(s => (
                  <div key={s.sector}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-bold text-[var(--text-primary)]">{s.sector}</span>
                      <span className={`text-xs font-black ${s.impact < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {s.impact > 0 ? '+' : ''}{s.impact.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[var(--border-subtle)] overflow-hidden">
                      <div className={`h-full rounded-full ${s.impact < 0 ? 'bg-red-400' : 'bg-green-400'}`} style={{ width: `${Math.abs(s.impact * 10)}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">{s.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-5">AI Recommendations</h3>
              <ul className="space-y-3">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm font-medium text-[var(--text-primary)]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-gold)]/10 text-[10px] font-black text-[var(--accent-gold)]">{i + 1}</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs font-medium text-[var(--text-muted)] text-center">{result.disclaimer}</p>
          </motion.div>
        )}

        {result?.error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-red-50 px-6 py-4 text-sm font-bold text-red-600">
            Error: {result.error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
