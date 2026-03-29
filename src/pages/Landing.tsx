import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Globe } from '../components/ui/Globe'
import { ChevronRight, Globe2, BrainCircuit, Activity, LineChart, MessageSquare, Briefcase, Zap } from 'lucide-react'

const CARDS = [
  {
    tag: 'CAUSALITY MAPPING',
    title: 'Butterfly Effect Engine',
    desc: 'When a bank collapses, instantly trace the 2nd and 3rd-order ripple effects across your suppliers, competitors, and regional markets.',
    icon: <Globe2 className="w-5 h-5" />,
    link: '/butterfly',
    color: '#2dd4bf'
  },
  {
    tag: 'PORTFOLIO STRESS-TEST',
    title: 'Fiscal Time Machine',
    desc: 'Stop reading news in a vacuum. Type your portfolio size and let the engine simulate exact P&L impacts based on breaking headlines.',
    icon: <LineChart className="w-5 h-5" />,
    link: '/fiscal-machine',
    color: '#f59e0b'
  },
  {
    tag: 'MULTI-AGENT DEBATE',
    title: 'Shadow Board',
    desc: 'Three AI agents — Bull, Bear, and Regulator — debate every major headline live so you never make a biased decision again.',
    icon: <Briefcase className="w-5 h-5" />,
    link: '/shadow-board',
    color: '#7c3aed'
  },
  {
    tag: 'BIAS GUARDRAIL',
    title: "Devil's Advocate",
    desc: 'Spent 20 minutes reading bullish articles? The system autonomously compiles a custom bearish briefing of everything you missed.',
    icon: <Activity className="w-5 h-5" />,
    link: '/devils-advocate',
    color: '#ef4444'
  },
  {
    tag: 'HYPER-PERSONALIZATION',
    title: 'Fluid Reality UI',
    desc: 'Visual learners get diagrams. Data quants get Jupyter notebooks. The UI physically restsructures for your thinking style.',
    icon: <BrainCircuit className="w-5 h-5" />,
    link: '/dashboard',
    color: '#3b82f6'
  },
  {
    tag: 'AMBIENT INTELLIGENCE',
    title: 'Omniscient RAG Chat',
    desc: 'A floating agent that remembers your past debates, investments, and risk tolerance across every news article you read.',
    icon: <MessageSquare className="w-5 h-5" />,
    link: '/chat',
    color: '#22c55e'
  }
]

export function Landing() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const cb = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', cb)
    return () => window.removeEventListener('scroll', cb)
  }, [])

  return (
    <div className="bg-black min-h-screen text-white font-sans overflow-x-hidden selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Navbar exactly like visitors.now */}
      <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-2 py-2 rounded-full border transition-all duration-300 ${
        scrolled ? 'w-[720px] bg-black/80 backdrop-blur-xl border-white/10 shadow-2xl shadow-black' : 'w-[800px] bg-transparent border-transparent'
      }`}>
        <div className="flex items-center gap-6 px-4">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight text-white hover:opacity-80 transition-opacity">
            <div className="w-5 h-5 rounded-full border border-white/20 flex flex-center bg-gradient-to-tr from-zinc-800 to-zinc-950 items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
            NewsOS
          </Link>
          <div className="h-4 w-px bg-white/10"></div>
          <a href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-4 py-2 rounded-full hover:bg-white/5">Log in</Link>
          <Link to="/register" className="text-sm font-semibold bg-white text-black px-4 py-2 rounded-full hover:scale-105 active:scale-95 transition-transform flex items-center gap-1 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            Start completely free <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-20 px-6 max-w-5xl mx-auto text-center z-10">
        
        {/* Release Pill */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-8 hover:bg-white/10 transition-colors cursor-pointer group"
        >
          <div className="px-2 py-0.5 rounded-full bg-white text-black text-[10px] font-bold uppercase tracking-wider">v2.0 Beta</div>
          <span className="text-sm font-medium text-zinc-300">Introducing Cognitive Reality Engine</span>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
        </motion.div>

        {/* Headline exactly like visitors.now */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-8xl font-bold tracking-tighter leading-[1.05] text-white"
          style={{ textShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
        >
          News that<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-600">understands your</span><br />
          reality.
        </motion.h1>

        {/* Subhead */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
        >
          Stop reading static articles. ET-IQ is an ambient intelligence layer that anticipates your needs, simulates financial futures, and morphs its UI to exactly match your cognitive style.
        </motion.p>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/register" className="h-12 px-8 rounded-full bg-white text-black text-base font-semibold flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.15)]">
            Get Started Now
          </Link>
          <Link to="/shadow-board" className="h-12 px-8 rounded-full bg-zinc-900 border border-zinc-800 text-white text-base font-medium flex items-center justify-center hover:bg-zinc-800 transition-colors group">
            <Zap className="w-4 h-4 mr-2 text-yellow-500 group-hover:scale-110 transition-transform" /> Try Sandbox
          </Link>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="mt-4 text-xs text-zinc-500 font-medium tracking-wide uppercase"
        >
          No credit card required · Free 14-day trial
        </motion.p>
      </section>

      {/* The Globe section */}
      <section className="relative w-full max-w-4xl mx-auto pt-10 pb-32 min-h-[500px] pointer-events-auto">
        {/* Glow behind globe */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
        <Globe />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-teal-500/50 to-transparent" />
      </section>

      {/* Analytics integration "marquee" - visitors.now style trusted by */}
      <section className="border-y border-zinc-900 bg-zinc-950/50 py-10 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-zinc-500 tracking-[0.2em] mb-8 uppercase">Intelligence Sourced Autonomously From</p>
          <div className="flex items-center justify-center gap-8 md:gap-20 opacity-40 grayscale flex-wrap">
            {['REUTERS', 'BLOOMBERG', 'FINANCIAL TIMES', 'BSE INDIA', 'MONEYCONTROL'].map(b => (
              <span key={b} className="text-xl md:text-2xl font-black tracking-tighter mix-blend-plus-lighter">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-32 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Built for algorithmic thinkers.</h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Traditional news feeds are dead. ET-IQ uses an autonomous swarm architecture to cross-examine data, map causality, and protect you from confirmation bias.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CARDS.map((card, i) => (
            <motion.div 
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="group relative rounded-3xl p-8 overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ backgroundImage: `linear-gradient(to bottom right, ${card.color}, transparent)` }} />
              
              <div className="flex items-center gap-3 mb-6">
                <div style={{ color: card.color }} className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
                  {card.icon}
                </div>
                <div className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">{card.tag}</div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4">{card.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                {card.desc}
              </p>

              <Link to={card.link} className="inline-flex items-center gap-1 mt-6 text-sm font-semibold opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" style={{ color: card.color }}>
                Experience feature <ChevronRight className="w-3 h-3" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Agent Architecture Deep Dive */}
      <section className="py-32 border-t border-zinc-900 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-zinc-900 to-transparent opacity-50 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-[10px] font-bold tracking-widest text-teal-500 uppercase mb-4 px-3 py-1 bg-teal-500/10 border border-teal-500/20 inline-block rounded-full">Swarm Intelligence</div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Zero-hallucination guardrails.</h2>
            <p className="text-lg text-zinc-400 leading-relaxed mb-8">
              We don't just prompt an LLM. When you query a topic, our proprietary multi-agent Swarm spins up:
            </p>
            
            <div className="space-y-6">
              {[
                { title: 'Ingestor Swarm', desc: 'Parallel scrapes 200+ primary sources instantly.' },
                { title: 'Hallucination Slayer', desc: 'Cross-tabulates every claim against raw SEC filings.' },
                { title: 'Multi-Modal Synthesizer', desc: 'Generates final UI formatting exactly as you prefer it.' }
              ].map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0 mt-1">
                    0{i+1}
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-1">{step.title}</h4>
                    <p className="text-sm text-zinc-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Swarm Visualization UI */}
          <div className="relative aspect-square md:aspect-auto md:h-[600px] w-full bg-zinc-950 rounded-3xl border border-zinc-900 overflow-hidden flex items-center justify-center group">
             <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-px bg-zinc-800" />
             <div className="absolute inset-y-8 left-1/2 -translate-x-1/2 w-px bg-zinc-800" />
             
             {/* Agents */}
             <div className="absolute top-[20%] left-[20%] w-3 h-3 rounded-full bg-teal-500 shadow-[0_0_20px_rgba(45,212,191,0.5)] animate-pulse" />
             <div className="absolute top-[20%] right-[20%] w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-pulse" style={{ animationDelay: '0.5s' }} />
             <div className="absolute bottom-[20%] right-[30%] w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] animate-pulse" style={{ animationDelay: '1s' }} />
             <div className="absolute bottom-[30%] left-[30%] w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse" style={{ animationDelay: '1.5s' }} />
             
             {/* Fake code block in center */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl z-10 scale-90 group-hover:scale-100 transition-transform duration-500 w-64">
                <div className="flex gap-1.5 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <div className="font-mono text-[10px] text-zinc-400 leading-relaxed">
                  <span className="text-teal-400">await</span> Swarm.execute({`{`}<br/>
                  &nbsp;&nbsp;task: <span className="text-green-400">"Macro impact"</span>,<br/>
                  &nbsp;&nbsp;guardrails: [<span className="text-purple-400">Strict</span>],<br/>
                  &nbsp;&nbsp;ui: <span className="text-blue-400">user.pref</span><br/>
                  {`}`})<br/>
                  <span className="text-zinc-600">// Compiling insights...</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="py-32 bg-zinc-950 text-center border-t border-zinc-900">
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-8">Ready to upgrade your reality?</h2>
        <Link to="/register" className="inline-block h-14 px-10 rounded-full bg-white text-black text-lg font-bold flex items-center justify-center hover:scale-105 transition-transform mx-auto w-max max-w-full">
          Get Started for Free
        </Link>
      </section>
      
      {/* Super minimal footer */}
      <footer className="py-8 border-t border-zinc-900 text-center text-sm text-zinc-600">
        <p>© 2026 ET-IQ Platform. All rights reserved.</p>
      </footer>
    </div>
  )
}
