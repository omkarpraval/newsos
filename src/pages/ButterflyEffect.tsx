import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBehaviorStore } from '../store/useBehaviorStore'

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
}

interface EffectGraph {
  event: string
  nodes: CausalNode[]
  sentimentShift: { week: number; value: number }[]
  contrarian: string
  confidence: number
}

const NODES: CausalNode[] = [
  { id: 'evt', label: 'Semi-conductor Fab Deal', type: '1st', impact: 'positive', magnitude: 92, sector: 'STRATEGY', description: 'Karnataka govt signs major $10B plant deal.' },
  { id: 'rent', label: 'Ancillary Manufacturing', type: '2nd', impact: 'positive', magnitude: 65, sector: 'INDUSTRIAL', description: 'Local component ecosystem projected to grow by 240%.' },
  { id: 'vendor', label: 'Real Estate Appreciation', type: '2nd', impact: 'positive', magnitude: 45, sector: 'PROPERTY', description: 'Tier-2 cities near the hub see 40% spike in commercial interests.' },
  { id: 'comp', label: 'Import Dependency Reset', type: '2nd', impact: 'positive', magnitude: 28, sector: 'MACRO', description: 'National trade deficit impacts reduced by 2.4% over 5 years.' },
  { id: 'bank', label: 'Skilled Talent Flight', type: '3rd', impact: 'negative', magnitude: 15, sector: 'EDUCATION', description: 'Talent wars between tech hubs may increase salary inflation.' },
  { id: 'lending', label: 'Power Grid Stress', type: '3rd', impact: 'negative', magnitude: 30, sector: 'UTILITIES', description: 'High-intensity fab operations require 2GW grid upgrade.' },
]

const DEMO_GRAPH: EffectGraph = {
  event: 'Major Semi-conductor Fab plant announced in Karnataka hub',
  confidence: 89,
  contrarian: 'While the deal is historic, the environmental impact on groundwater in the arid regions could become a significant 5th-order political crisis by 2032.',
  sentimentShift: [
    { week: -4, value: 42 }, { week: -3, value: 45 }, { week: -2, value: 48 },
    { week: -1, value: 52 }, { week: 0, value: 89 }, { week: 1, value: 82 },
    { week: 2, value: 78 }, { week: 3, value: 81 },
  ],
  nodes: NODES,
}

const IMPACT_COLORS: Record<Impact, string> = { positive: '#22c55e', negative: '#ef4444', neutral: '#6b7280' }
const TYPE_CONFIG: Record<Tier, { label: string; color: string; border: string }> = {
  '1st': { label: 'Primary Resonance', color: 'text-purple-500', border: 'border-purple-500/20' },
  '2nd': { label: 'Ripple Effects', color: 'text-blue-500', border: 'border-blue-500/20' },
  '3rd': { label: 'Causal Chain', color: 'text-white/20', border: 'border-white/10' },
}

export function ButterflyEffect() {
  const [topic, setTopic] = useState('')
  const [graph, setGraph] = useState<EffectGraph | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'graph' | 'sentiment' | 'contrarian'>('graph')
  const { track } = useBehaviorStore()

  const runAnalysis = async () => {
    if (!topic.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/butterfly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })
      const data = await res.json()
      setGraph(data)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
      track({ type: 'charcha_mention', topic, category: 'causal' })
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-20">
         <div className="text-[10px] font-black tracking-[0.4em] text-purple-500 uppercase mb-6">Autonomous Causal Engine</div>
         <h1 className="text-7xl font-black text-white tracking-tighter uppercase leading-[0.8] mb-8 italic">
           Ripple<br/><span className="text-white/10">Architecture.</span>
         </h1>
         <p className="text-xl font-bold text-white/30 max-w-xl leading-relaxed">
           Trace how a single news signal triggers 2nd and 3rd-order shifts across global sectors and sentiment.
         </p>
      </motion.div>

      <div className="mb-24 rounded-[48px] bg-white/[0.03] border border-white/5 p-12 backdrop-blur-3xl shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 h-96 w-96 bg-purple-600/5 blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <textarea
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="Inject a News Event (e.g. RBI Rate Pivot...)"
          className="w-full bg-transparent text-4xl font-black text-white placeholder:text-white/10 outline-none resize-none mb-12 uppercase italic tracking-tighter"
          rows={2}
        />
        <div className="flex gap-6">
          <button 
            onClick={runAnalysis} 
            disabled={loading || !topic.trim()}
            className="flex-1 rounded-3xl bg-white py-6 text-sm font-black text-black hover:scale-[1.01] active:scale-95 transition-all shadow-xl disabled:opacity-50"
          >
            {loading ? 'SIMULATING ENTROPY...' : 'MAP CAUSALITY CHAIN'}
          </button>
          <button onClick={() => { setTopic(DEMO_GRAPH.event); setGraph(DEMO_GRAPH) }} className="px-10 rounded-3xl bg-white/5 border border-white/10 text-xs font-black text-white/40 hover:text-white hover:bg-white/10 transition-all">RECENT DATA</button>
        </div>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-40">
             <div className="text-7xl mb-12 animate-pulse">🦋</div>
             <div className="text-[10px] font-black text-white/20 tracking-[0.5em] uppercase">Swarm Intelligence Processing</div>
          </motion.div>
        )}

        {graph && !loading && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-24">
            <div className="flex gap-4 border-b border-white/5 pb-8">
              {(['graph', 'sentiment', 'contrarian'] as const).map(m => (
                <button 
                  key={m} 
                  onClick={() => setMode(m)}
                  className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === m ? 'bg-white text-black' : 'text-white/30 hover:text-white'}`}
                >
                  {m === 'graph' ? 'Ripple Map' : m === 'sentiment' ? 'Sentiment Arc' : 'Contrarian Pulse'}
                </button>
              ))}
            </div>

            {mode === 'graph' && (
              <div className="grid gap-20">
                {(['1st', '2nd', '3rd'] as Tier[]).map(tier => (
                  <div key={tier}>
                    <div className={`text-[10px] font-black uppercase tracking-[0.4em] mb-12 pl-6 border-l-2 ${TYPE_CONFIG[tier].color} ${TYPE_CONFIG[tier].border}`}>
                      {TYPE_CONFIG[tier].label}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {graph.nodes.filter(n => n.type === tier).map(node => (
                        <motion.div 
                          key={node.id} 
                          whileHover={{ y: -8 }}
                          className={`relative overflow-hidden rounded-[32px] bg-white/[0.02] border border-white/5 p-10 group hover:bg-white/[0.05] transition-all`}
                        >
                          <div className="absolute top-0 right-0 px-6 py-4 bg-white/5 text-[10px] font-black text-white/40 tracking-widest italic">
                            NODE {node.id.toUpperCase()}
                          </div>
                          <div className="text-[10px] font-black text-purple-500 mb-4 tracking-[0.2em]">{node.sector}</div>
                          <h3 className="text-2xl font-black text-white mb-6 uppercase tracking-tight italic">{node.label}</h3>
                          <p className="text-sm font-bold text-white/60 leading-relaxed group-hover:text-white transition-colors uppercase">{node.description}</p>
                          <div className="mt-8 h-px w-full bg-white/5" />
                          <div className="mt-8 flex items-center justify-between">
                             <div className="flex gap-1">
                                {[1,2,3,4,5].map(s => <div key={s} className={`h-1 w-4 rounded-full ${s <= (node.magnitude/20) ? 'bg-purple-500' : 'bg-white/5'}`} />)}
                             </div>
                             <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{node.impact}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {mode === 'sentiment' && (
              <div className="rounded-[48px] bg-white/[0.02] border border-white/5 p-20">
                <h3 className="text-3xl font-black text-white mb-4 uppercase italic">Sentiment Arc</h3>
                <p className="text-sm font-bold text-white/30 mb-20 uppercase tracking-widest">Algorithmic trajectory of the global market pulse.</p>
                <div className="flex items-end gap-4 h-[300px]">
                  {graph.sentimentShift.map(d => (
                    <div key={d.week} className="flex-1 flex flex-col items-center gap-6">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${d.value * 2.5}px` }}
                        className={`w-full rounded-2xl ${d.week === 0 ? 'bg-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.3)]' : 'bg-white/5'}`} 
                      />
                      <span className="text-[10px] font-black text-white/20 uppercase tabular-nums">W{d.week >= 0 ? `+${d.week}` : d.week}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mode === 'contrarian' && (
              <div className="rounded-[40px] bg-purple-600/5 border border-purple-500/10 p-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-[400px] w-[400px] bg-purple-500/5 blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                   <div className="text-[10px] font-black text-purple-500 mb-12 tracking-[0.4em] uppercase underline decoration-purple-500/20 underline-offset-8 decoration-2">Contrarian Pulse Detected</div>
                   <div className="text-5xl font-black text-white leading-tight mb-8 italic tracking-tighter uppercase max-w-4xl">
                     "{graph.contrarian}"
                   </div>
                   <p className="text-xl font-bold text-white/20 uppercase leading-relaxed max-w-2xl">This perspective challenges consensus derived from autonomous entropy checks.</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
