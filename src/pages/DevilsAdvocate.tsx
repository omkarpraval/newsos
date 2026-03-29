import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DevilResult {
  stock: string
  bullReadingTime: number // minutes simulated
  bearBriefing: {
    headline: string
    risks: { title: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; detail: string }[]
    keyStats: { label: string; value: string; trend: 'down' | 'up' | 'flat' }[]
    bearCase: string
    recommendedAction: string
  }
  error?: string
}

const DEMO_RESULT: DevilResult = {
  stock: 'IndiGo (InterGlobe Aviation)',
  bullReadingTime: 22,
  bearBriefing: {
    headline: "You've spent 22 minutes reading bullish IndiGo content. Here's what the bulls aren't telling you.",
    risks: [
      { title: 'Jet fuel price spike risk', severity: 'HIGH', detail: 'Aviation turbine fuel constitutes 35% of IndiGo operating costs. A 15% crude rally would wipe FY26 PAT by ₹1,200 Cr.' },
      { title: 'Pilot shortage crisis', severity: 'HIGH', detail: 'India faces a shortage of 1,000+ qualified pilots by 2026. IndiGo growth plans assume 30 new aircraft — unsustainable without crew.' },
      { title: 'Airport fee hikes', severity: 'MEDIUM', detail: 'AERA has proposed 20% airport development fees across T1/T2. Direct P&L impact: ₹400 Cr annually.' },
      { title: 'Forex EMI exposure', severity: 'MEDIUM', detail: '242 aircraft leased in USD. INR depreciation by 3% adds ₹900 Cr to lease costs — rarely discussed in bull case articles.' },
      { title: 'Competition from Air India', severity: 'LOW', detail: 'TATA-backed Air India 2.0 targeting exactly IndiGo\'s profitable metro routes with a superior loyalty program.' },
    ],
    keyStats: [
      { label: 'Debt/Equity Ratio', value: '8.2x', trend: 'up' },
      { label: 'Return on Equity', value: '4.1%', trend: 'down' },
      { label: 'Load Factor YoY', value: '-2.3%', trend: 'down' },
      { label: 'ATF Cost Share', value: '35.8%', trend: 'up' },
    ],
    bearCase: 'If crude oil rises 20% and pilot shortages constrain Q3 capacity, Street consensus EPS estimates could face a 40% downward revision — implying the stock is currently priced for perfection at 32x FY27 PE.',
    recommendedAction: 'Consider a hedge: Long IndiGo position protected with a 5% OTM put option expiring in 3 months. Cost: ~1.8% of position value.',
  }
}

export function DevilsAdvocate() {
  const [stock, setStock] = useState('')
  const [readingTime, setReadingTime] = useState(20)
  const [result, setResult] = useState<DevilResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const runAdvocate = async () => {
    if (!stock.trim()) return
    setLoading(true)
    setResult(null)
    setRevealed(false)
    
    try {
      // Call the backend to generate a custom devil's advocate briefing
      const res = await fetch('/api/shadow-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: `${stock} — generate a bear case / devil's advocate analysis` }),
      })
      const data = await res.json()
      // Synthesize into our format
      setResult({
        stock,
        bullReadingTime: readingTime,
        bearBriefing: {
          headline: `You've spent ${readingTime} minutes in bull content on ${stock}. Here's what you're missing.`,
          risks: [
            { title: 'Primary Bear Case', severity: 'HIGH', detail: data.bear?.argument || 'Unable to generate.' },
            { title: 'Regulatory Risk', severity: 'MEDIUM', detail: data.regulator?.argument || 'No regulatory analysis available.' },
          ],
          keyStats: [],
          bearCase: data.verdict || 'Balanced view required before taking a position.',
          recommendedAction: `Confidence Score: ${data.confidenceScore || 70}%. Run a Shadow Board debate for deeper analysis.`,
        }
      })
    } catch {
      setResult({ ...DEMO_RESULT, stock, bullReadingTime: readingTime })
    } finally {
      setLoading(false)
    }
  }

  const loadDemo = () => {
    setStock('IndiGo (InterGlobe Aviation)')
    setReadingTime(22)
    setResult(DEMO_RESULT)
    setRevealed(false)
  }

  const SEVERITY_CONFIG = {
    HIGH: { label: 'HIGH RISK', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
    MEDIUM: { label: 'MEDIUM', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
    LOW: { label: 'LOW', color: '#6b7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.25)' },
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 0 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div className="tag tag-amber" style={{ marginBottom: 16 }}>Confirmation Bias Guard</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', marginBottom: 12 }}>
          😈 Devil's Advocate Protocol
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.7 }}>
          Enter a stock or asset you've been reading bullish content on. The AI compiles a custom risk briefing highlighting every bear case, supply chain vulnerability, and hidden risk the bulls ignored.
        </p>
      </div>

      {/* Input */}
      <div className="glass-card" style={{ padding: 32, marginBottom: 32 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'start' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
              Stock / Asset / Sector
            </label>
            <input
              value={stock}
              onChange={e => setStock(e.target.value)}
              placeholder="e.g. IndiGo, Paytm, EV Sector, Bitcoin..."
              style={{
                width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16, padding: '14px 18px', fontSize: 15, color: '#fff', fontFamily: 'inherit', outline: 'none'
              }}
              onFocus={e => e.target.style.borderColor = '#f59e0b'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
            <span>Simulated bull reading time</span>
            <span style={{ color: '#f59e0b', fontSize: 18, fontWeight: 900 }}>{readingTime} min</span>
          </label>
          <input type="range" min={5} max={60} value={readingTime} onChange={e => setReadingTime(+e.target.value)}
            style={{ width: '100%', accentColor: '#f59e0b' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
            <span>5 min — mild</span><span>30 min — moderate</span><span>60 min — deep bias</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
          <button onClick={runAdvocate} disabled={loading || !stock.trim()}
            style={{ flex: 1, minWidth: 200, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 9999, background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 800, border: 'none', cursor: 'pointer', transition: 'all 0.2s', opacity: (loading || !stock.trim()) ? 0.4 : 1 }}>
            {loading ? 'Compiling bear case...' : 'Activate Devil advocacy'}
          </button>
          <button onClick={loadDemo} className="btn-ghost">Load Demo (IndiGo)</button>
        </div>
      </div>

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>😈</div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: 700 }}>Compiling bear case against consensus...</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 8 }}>Scanning supply chains, analyst dissent, and regulatory filings</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Dramatic reveal */}
            {!revealed ? (
              <div className="glass-card" style={{ padding: 48, textAlign: 'center', borderColor: 'rgba(239,68,68,0.4)' }}>
                <div style={{ fontSize: 64, marginBottom: 24 }}>⚠️</div>
                <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 900, marginBottom: 16 }}>Bear briefing ready.</h2>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
                  After {result.bullReadingTime} minutes reading bullish content on <strong style={{ color: '#fff' }}>{result.stock}</strong>, the Devil's Advocate has compiled what you're overlooking.
                </p>
                <button onClick={() => setRevealed(true)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 99, padding: '16px 36px', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}>
                  Show me the risks →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Headline */}
                <div style={{ padding: 28, borderRadius: 24, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Devil's Advocate Alert</div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.5 }}>{result.bearBriefing.headline}</p>
                </div>

                {/* Risks */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {result.bearBriefing.risks.map((risk, i) => {
                    const cfg = SEVERITY_CONFIG[risk.severity]
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                        style={{ padding: 24, borderRadius: 20, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: cfg.color, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 99, background: `${cfg.color}18`, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{risk.title}</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{risk.detail}</p>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Key Stats */}
                {result.bearBriefing.keyStats.length > 0 && (
                  <div className="glass-card" style={{ padding: 28 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>Bear-Case Financial Metrics</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                      {result.bearBriefing.keyStats.map(s => (
                        <div key={s.label} style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>{s.label}</div>
                          <div style={{ fontSize: 22, fontWeight: 900, color: s.trend === 'down' ? '#ef4444' : s.trend === 'up' ? '#22c55e' : '#fff' }}>
                            {s.trend === 'down' ? '↓ ' : s.trend === 'up' ? '↑ ' : ''}{s.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bear Case Summary */}
                <div style={{ padding: 28, borderRadius: 24, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Worst-Case Scenario</div>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>{result.bearBriefing.bearCase}</p>
                </div>

                {/* Recommended Action */}
                <div style={{ padding: 24, borderRadius: 20, background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>🛡️</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#2dd4bf', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>AI Mitigation Strategy</div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{result.bearBriefing.recommendedAction}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
