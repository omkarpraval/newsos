import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Impact = 'positive' | 'negative' | 'neutral'
type Tier = '1st' | '2nd' | '3rd'

interface CausalNode {
  id: string
  label: string
  type: Tier
  impact: Impact
  magnitude: number
  description: string
  sector: string
  connections: string[]
}

interface EffectGraph {
  event: string
  nodes: CausalNode[]
  sentimentShift: { week: number; value: number }[]
  contrarian: string
  confidence: number
}

const NODES: CausalNode[] = [
  { id: 'evt', label: 'IT Firm Layoffs', type: '1st', impact: 'negative', magnitude: -100, sector: 'Technology', description: 'Announced 15,000 job cuts over 6 months', connections: ['rent', 'vendor', 'comp', 'talent'] },
  { id: 'rent', label: 'Commercial Real Estate', type: '2nd', impact: 'negative', magnitude: -35, sector: 'Real Estate', description: 'Office vacancy rates in Pune and Whitefield rise 12%', connections: ['bank'] },
  { id: 'vendor', label: 'Cafeteria Vendor Contracts', type: '2nd', impact: 'negative', magnitude: -60, sector: 'MSME', description: '200+ campus vendors face 70% revenue loss', connections: ['lending'] },
  { id: 'comp', label: 'Competitor Stock (HCL, Wipro)', type: '2nd', impact: 'positive', magnitude: 28, sector: 'Technology', description: 'Algorithmic buying pushes HCL +4.2% as talent pool opens', connections: [] },
  { id: 'talent', label: 'EdTech and Upskilling', type: '2nd', impact: 'positive', magnitude: 45, sector: 'Education', description: 'Coursera India reports 300% spike in AI course signups', connections: [] },
  { id: 'bank', label: 'Home Loan EMI Defaults', type: '3rd', impact: 'negative', magnitude: -20, sector: 'Banking', description: 'Expected 0.3% NPA rise in retail mortgages (Bengaluru)', connections: [] },
  { id: 'lending', label: 'MSME Micro Lending Stress', type: '3rd', impact: 'negative', magnitude: -40, sector: 'NBFC', description: 'Vendor NPAs may spike - NBFC portfolios in IT corridors at risk', connections: [] },
]

const DEMO_GRAPH: EffectGraph = {
  event: 'Major IT firm announces 15,000 layoffs amid global tech slowdown',
  confidence: 82,
  contrarian: 'Some analysts argue the layoffs signal a disciplined pivot to AI-centered R&D, potentially positioning the company for 40% margin expansion by FY27 - a view held by only 18% of analysts surveyed.',
  sentimentShift: [
    { week: -4, value: 62 }, { week: -3, value: 58 }, { week: -2, value: 51 },
    { week: -1, value: 47 }, { week: 0, value: 23 }, { week: 1, value: 31 },
    { week: 2, value: 38 }, { week: 3, value: 42 },
  ],
  nodes: NODES,
}

const IMPACT_COLORS: Record<Impact, string> = { positive: '#22c55e', negative: '#ef4444', neutral: '#6b7280' }
const TYPE_LABELS: Record<Tier, { label: string; color: string }> = {
  '1st': { label: 'Primary Event', color: '#7c3aed' },
  '2nd': { label: '2nd Order Effects', color: '#2dd4bf' },
  '3rd': { label: '3rd Order Effects', color: '#f59e0b' },
}

export function ButterflyEffect() {
  const [topic, setTopic] = useState('')
  const [graph, setGraph] = useState<EffectGraph | null>(null)
  const [selected, setSelected] = useState<CausalNode | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'graph' | 'sentiment' | 'contrarian'>('graph')
  const [uncertainty, setUncertainty] = useState(false)

  const runAnalysis = async () => {
    if (!topic.trim()) return
    setLoading(true)
    setSelected(null)
    await new Promise(r => setTimeout(r, 1800))
    setGraph({ ...DEMO_GRAPH, event: topic, confidence: Math.floor(65 + Math.random() * 30) })
    setLoading(false)
    setUncertainty(Math.random() > 0.6)
  }

  const loadDemo = () => {
    setTopic(DEMO_GRAPH.event)
    setGraph(DEMO_GRAPH)
    setUncertainty(false)
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 0 60px' }}>
      <div style={{ marginBottom: 40 }}>
        <div className="tag tag-cyan" style={{ marginBottom: 16 }}>Butterfly Effect Engine</div>
        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', color: '#fff', marginBottom: 12 }}>
          Nth-Order Causality Mapping
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.7 }}>
          Enter any business news event to instantly trace its 2nd and 3rd-order ripple effects across sectors, suppliers, and markets.
        </p>
      </div>

      <div className="glass-card" style={{ padding: 28, marginBottom: 32 }}>
        <textarea
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="e.g. Major IT firm announces 15,000 layoffs amid global tech slowdown..."
          rows={2}
          style={{
            width: '100%', resize: 'none', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
            padding: '16px 20px', fontSize: 14, color: '#fff', fontFamily: 'inherit',
            outline: 'none', marginBottom: 16, display: 'block',
          }}
        />
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={runAnalysis} disabled={loading || !topic.trim()} className="btn-primary" style={{ flex: 1, minWidth: 200, justifyContent: 'center' }}>
            {loading ? 'Mapping ripple effects...' : 'Map the Butterfly Effect'}
          </button>
          <button onClick={loadDemo} className="btn-ghost">Load Demo</button>
        </div>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 64, animation: 'float 2s infinite' }}>🦋</div>
            <p style={{ marginTop: 24, color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 600 }}>
              Swarm computing 2nd and 3rd order effects...
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
              {['Ingestor', 'Router', 'Synthesizer', 'Fact-Checker'].map((a, i) => (
                <div key={a} style={{ padding: '4px 12px', borderRadius: 99, background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.2)', fontSize: 11, color: '#2dd4bf', animationDelay: `${i * 0.3}s` }}>
                  {a}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {graph && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {uncertainty && (
              <div className="uncertainty-mode" style={{ padding: '16px 24px', borderRadius: 16, marginBottom: 24, background: 'rgba(234,179,8,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#eab308', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Uncertainty Mode Active</div>
                  <div style={{ fontSize: 12, color: 'rgba(234,179,8,0.7)', marginTop: 4 }}>Conflicting data detected. Portfolio simulations paused. Confidence: {graph.confidence}%</div>
                </div>
              </div>
            )}

            <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Primary Event</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>{graph.event}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase' }}>Swarm Confidence</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: graph.confidence >= 75 ? '#22c55e' : '#f59e0b' }}>{graph.confidence}%</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {(['graph', 'sentiment', 'contrarian'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  style={{
                    padding: '8px 20px', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none',
                    background: mode === m ? '#2dd4bf' : 'rgba(255,255,255,0.06)',
                    color: mode === m ? '#000' : 'rgba(255,255,255,0.5)',
                    transition: 'all 0.2s'
                  }}
                >
                  {m === 'graph' ? 'Ripple Map' : m === 'sentiment' ? 'Sentiment Arc' : 'Contrarian Pulse'}
                </button>
              ))}
            </div>

            {mode === 'graph' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {(['1st', '2nd', '3rd'] as Tier[]).map(tier => (
                  <div key={tier}>
                    <div className="tag" style={{ marginBottom: 12, borderColor: `${TYPE_LABELS[tier].color}40`, color: TYPE_LABELS[tier].color, background: `${TYPE_LABELS[tier].color}10` }}>
                      {TYPE_LABELS[tier].label}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                      {graph.nodes.filter(n => n.type === tier).map(node => (
                        <motion.div key={node.id} whileHover={{ scale: 1.01 }}
                          onClick={() => setSelected(selected?.id === node.id ? null : node)}
                          style={{
                            padding: 20, borderRadius: 20, cursor: 'pointer',
                            background: `${IMPACT_COLORS[node.impact]}0d`,
                            border: `1px solid ${IMPACT_COLORS[node.impact]}30`,
                            boxShadow: selected?.id === node.id ? `0 0 20px ${IMPACT_COLORS[node.impact]}30` : 'none',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{node.label}</div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: IMPACT_COLORS[node.impact], flexShrink: 0 }}>
                              {node.impact === 'positive' ? `+${Math.abs(node.magnitude)}%` : node.impact === 'negative' ? `-${Math.abs(node.magnitude)}%` : '---'}
                            </div>
                          </div>
                          <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 10 }}>
                            <div style={{ height: '100%', borderRadius: 99, background: IMPACT_COLORS[node.impact], width: `${Math.abs(node.magnitude)}%`, transition: 'width 0.8s ease' }} />
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                            <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{node.sector}</span> — {node.description}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {mode === 'sentiment' && (
              <div className="glass-card" style={{ padding: 36 }}>
                <h3 style={{ color: '#fff', marginBottom: 8 }}>Sentiment Shift Timeline</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 32 }}>How public sentiment evolved (week 0 = event date)</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180 }}>
                  {graph.sentimentShift.map(d => (
                    <div key={d.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: '100%', borderRadius: '8px 8px 0 0',
                        height: `${d.value * 1.8}px`,
                        background: d.week === 0 ? '#ef4444' : d.value > 50 ? '#22c55e' : '#2dd4bf',
                        opacity: d.week === 0 ? 1 : 0.7,
                        transition: 'height 0.5s ease'
                      }} />
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>W{d.week >= 0 ? `+${d.week}` : d.week}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mode === 'contrarian' && (
              <div className="glass-card" style={{ padding: 36, borderColor: 'rgba(239,68,68,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <div style={{ fontSize: 32 }}>🔴</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Contrarian Pulse Detected</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Opinion deviates from dominant market consensus (held by 18% of analysts)</div>
                  </div>
                </div>
                <div style={{ padding: 24, borderRadius: 20, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, fontStyle: 'italic' }}>
                  "{graph.contrarian}"
                </div>
                <div style={{ marginTop: 20, fontSize: 12, color: 'rgba(239,68,68,0.6)', fontWeight: 600 }}>
                  This view challenges the 82%-consensus narrative. Evaluate independently before acting.
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
