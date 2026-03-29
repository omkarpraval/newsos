import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { fetchTopHeadlines } from '../services/newsapi'
import type { NewsArticle } from '../types'

/* ─── Hook: scroll reveal ───────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    let obs: IntersectionObserver
    const raf = requestAnimationFrame(() => {
      const els = document.querySelectorAll('.reveal')
      obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target) }
          })
        },
        { threshold: 0.1 },
      )
      els.forEach((el) => obs.observe(el))
    })
    return () => { cancelAnimationFrame(raf); obs?.disconnect() }
  }, [])
}

/* ─── Globe (THREE.js) ──────────────────────────────────── */
function GlobeCanvas({ onLiveCount }: { onLiveCount?: (n: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    } catch (e) {
      console.warn('WebGL initialization failed:', e)
      return
    }
    renderer.setPixelRatio(window.devicePixelRatio)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.z = 2.8

    const geo = new THREE.SphereGeometry(1, 64, 64)
    const mat = new THREE.MeshPhongMaterial({ color: 0x1a1a3e, emissive: 0x080820, shininess: 15, transparent: true, opacity: 0.95 })
    const globe = new THREE.Mesh(geo, mat)
    scene.add(globe)

    const wmat = new THREE.MeshBasicMaterial({ color: 0x3730a3, wireframe: true, transparent: true, opacity: 0.12 })
    const wglobe = new THREE.Mesh(new THREE.SphereGeometry(1.002, 22, 22), wmat)
    scene.add(wglobe)

    const atm = new THREE.Mesh(
      new THREE.SphereGeometry(1.09, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x4f46e5, transparent: true, opacity: 0.07, side: THREE.BackSide }),
    )
    scene.add(atm)

    scene.add(new THREE.AmbientLight(0x404080, 0.6))
    const dl = new THREE.DirectionalLight(0x8080ff, 1.3); dl.position.set(5, 3, 5); scene.add(dl)
    const bl = new THREE.DirectionalLight(0x4040cc, 0.3); bl.position.set(-5, -3, -5); scene.add(bl)

    const locs = [
      [51.5,-0.1],[40.7,-74],[35.7,139.7],[48.9,2.3],[-33.9,151.2],[19.1,72.9],[37.8,-122.4],
      [55.8,37.6],[-23.5,-46.6],[1.3,103.8],[52.5,13.4],[41,28.9],[30,31.2],[-1.3,36.8],
      [34,-118.2],[45.5,-73.6],[59.9,10.7],[25.2,55.3],[13.8,100.5],[-26.2,28],
    ]
    const colors = [0x7c3aed,0x3b82f6,0x22c55e,0xec4899,0xeab308,0xf97316,0x06b6d4]

    function ll2v(lat: number, lon: number, r: number) {
      const phi = ((90 - lat) * Math.PI) / 180
      const theta = ((lon + 180) * Math.PI) / 180
      return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta))
    }

    const dotG = new THREE.Group()
    scene.add(dotG)

    locs.forEach(([lat, lon], i) => {
      const c = colors[i % colors.length]
      const sz = 0.024 + Math.random() * 0.018
      const dot = new THREE.Mesh(new THREE.SphereGeometry(sz, 8, 8), new THREE.MeshBasicMaterial({ color: c }))
      const pos = ll2v(lat, lon, 1.013)
      dot.position.copy(pos)
      dotG.add(dot)
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(sz * 1.6, sz * 2.8, 14),
        new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
      )
      ring.position.copy(pos)
      ring.lookAt(new THREE.Vector3(0, 0, 0))
      ring.userData.phase = Math.random() * Math.PI * 2
      dotG.add(ring)
    })

    let rafId = 0; let t = 0; let liveCount = 66
    function rsz() {
      if (!canvas) return
      const parent = canvas.parentElement
      if (!parent) return
      const w = parent.clientWidth; const h = parent.clientHeight
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix()
    }
    rsz()
    const onResize = () => rsz()
    window.addEventListener('resize', onResize)

    function anim() {
      rafId = requestAnimationFrame(anim)
      t += 0.009
      globe.rotation.y += 0.0045; wglobe.rotation.y += 0.0045; dotG.rotation.y += 0.0045
      dotG.children.forEach((child) => {
        if (child.userData.phase !== undefined) {
          ;(child as any).material.opacity = Math.sin(t * 2 + child.userData.phase) * 0.3 + 0.35
          const s = 1 + Math.sin(t * 1.5 + child.userData.phase) * 0.3
          child.scale.set(s, s, s)
        }
      })
      renderer.render(scene, camera)
    }
    anim()
    const countId = setInterval(() => {
      liveCount += Math.floor(Math.random() * 5) - 2
      liveCount = Math.max(40, Math.min(100, liveCount))
      onLiveCount?.(liveCount)
    }, 3000)
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', onResize); clearInterval(countId); renderer.dispose() }
  }, [onLiveCount])

  return <canvas id="globe-canvas" ref={canvasRef} />
}

/* ─── MiniChart ─────────────────────────────────────────── */
function MiniChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ptsRef = useRef([0.55,0.75,0.65,0.5,0.4,0.5,0.35,0.3,0.45,0.55,0.4,0.5,0.65,0.8,0.9,0.72,0.62,0.78,1,0.88,0.65])
  const revRef = useRef([0.2,0.1,0.15,0.3,0.2,0.1,0.08,0.22,0.35,0.15,0.1,0.28,0.4,0.5,0.3,0.2,0.15,0.35,0.75,0.85,0.55])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1

    function resize() {
      const w = canvas!.offsetWidth; const h = canvas!.offsetHeight
      canvas!.width = w * dpr; canvas!.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    function draw() {
      const w = canvas!.offsetWidth; const h = canvas!.offsetHeight
      ctx.clearRect(0, 0, w, h)
      function line(ps: number[], stroke: string, fill: string) {
        const step = w / (ps.length - 1)
        ctx.beginPath()
        ps.forEach((p, i) => {
          const x = i * step; const y = h - p * h * 0.83 - h * 0.05
          if (!i) ctx.moveTo(x, y)
          else {
            const px = (i - 1) * step; const py = h - ps[i - 1] * h * 0.83 - h * 0.05
            ctx.bezierCurveTo(px + step / 3, py, x - step / 3, y, x, y)
          }
        })
        ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke()
        ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fillStyle = fill; ctx.fill()
      }
      line(ptsRef.current, 'rgba(167,139,250,.85)', 'rgba(167,139,250,.1)')
      line(revRef.current, 'rgba(34,197,94,.9)', 'rgba(34,197,94,.1)')
      const lx = w * 0.85
      ctx.beginPath(); ctx.setLineDash([3, 3]); ctx.moveTo(lx, 0); ctx.lineTo(lx, h)
      ctx.strokeStyle = 'rgba(255,255,255,.1)'; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([])
      ctx.beginPath(); ctx.arc(lx, h - 0.88 * h * 0.83 - h * 0.05, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#22C55E'; ctx.fill()
    }
    resize(); draw()
    const onRes = () => { resize(); draw() }
    window.addEventListener('resize', onRes)
    const id = setInterval(() => {
      ptsRef.current = ptsRef.current.map((p) => Math.max(0.1, Math.min(1, p + (Math.random() - 0.5) * 0.06)))
      revRef.current = revRef.current.map((p) => Math.max(0.05, Math.min(1, p + (Math.random() - 0.5) * 0.04)))
      draw()
    }, 1200)
    return () => { window.removeEventListener('resize', onRes); clearInterval(id) }
  }, [])
  return <canvas id="miniChart" ref={canvasRef} />
}

/* ─── LiveBars ──────────────────────────────────────────── */
function LiveBars({ onLiveCount }: { onLiveCount?: (n: number) => void }) {
  const N = 16
  const rndBar = () => { const h = Math.random() * 40 + 4; return { height: h, background: h > 30 ? '#7C3AED' : '#C4B5FD' } }
  const [bars, setBars] = useState(() => Array.from({ length: N }, rndBar))
  useEffect(() => {
    const id = setInterval(() => {
      setBars(Array.from({ length: N }, () => { const h = Math.random() * 44 + 4; return { height: h, background: h > 32 ? '#7C3AED' : '#C4B5FD' } }))
      onLiveCount?.(Math.floor(Math.random() * 10) + 20)
    }, 800)
    return () => clearInterval(id)
  }, [onLiveCount])
  return (
    <div className="live-bars-wrap" id="liveBars">
      {bars.map((b, i) => <div key={i} className="lbar" style={{ height: `${b.height}px`, background: b.background }} />)}
    </div>
  )
}

/* ─── Ticker ────────────────────────────────────────────── */
const visitors = [
  { emoji: '🦊', name: 'Olivia Patel', act: 'reading Markets briefing', amt: 'CFO' },
  { emoji: '🐳', name: 'Sarah Mitchell', act: 'upgraded to Pro', amt: 'Founder' },
  { emoji: '🦁', name: 'James Chen', act: 'joined Shadow Board', amt: 'Trader' },
  { emoji: '🦄', name: 'Emma Rodriguez', act: 'deep-briefing India policy', amt: 'Investor' },
]
function Ticker() {
  const [idx, setIdx] = useState(0)
  const [phase, setPhase] = useState('in')
  const [boot, setBoot] = useState(false)
  useEffect(() => { const t = setTimeout(() => setBoot(true), 2000); return () => clearTimeout(t) }, [])
  useEffect(() => {
    const id = setInterval(() => { setPhase('out'); setTimeout(() => { setIdx((i) => (i + 1) % visitors.length); setPhase('in') }, 300) }, 5000)
    return () => clearInterval(id)
  }, [])
  const v = visitors[idx]
  const opacity = !boot ? 0 : phase === 'in' ? 1 : 0
  const transform = !boot ? 'translateX(60px)' : phase === 'in' ? 'translateX(0)' : 'translateX(40px)'
  return (
    <div className="ticker" style={{ opacity, transform, transition: 'opacity .5s ease, transform .5s ease' }}>
      <div className="tick-av" style={{ background: 'linear-gradient(135deg,#f472b6,#fb923c)' }}>{v.emoji}</div>
      <div>
        <div className="tick-name">{v.name}</div>
        <div className="tick-act">{v.amt ? `${v.act} • ${v.amt}` : v.act}</div>
        <div className="tick-t">just now</div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   LANDING PAGE — NEWSROOM (RESTORED CLEAN LAYOUT)
   ═══════════════════════════════════════════════════════════ */
export function Landing() {
  useScrollReveal()

  const [activeTab, setActiveTab] = useState('Dashboard')
  const TABS = ['Dashboard', 'Shadow Board', 'Charcha', 'World', 'Realtime']

  const [people, setPeople] = useState(2369)
  const [rev, setRev] = useState(390)
  const [views, setViews] = useState(9102)
  const [livePeople, setLivePeople] = useState(28)
  const [rnG, setRnG] = useState(2341)
  const [rnD, setRnD] = useState(1892)
  const [globeCount, setGlobeCount] = useState(66)
  const [news, setNews] = useState<NewsArticle[]>([])
  const [tickerNews, setTickerNews] = useState<string>('Syncing Global Intelligence Loop...')

  const onGlobeLive = useCallback((n: number) => setGlobeCount(n), [])
  const onLiveCount = useCallback((n: number) => setLivePeople(n), [])

  useEffect(() => {
    let ppl = 2369; let r = 390; let v = 9102
    const id = setInterval(() => {
      ppl += Math.floor(Math.random() * 3) - 1
      if (Math.random() > 0.7) r += Math.floor(Math.random() * 40) + 10
      v += Math.floor(Math.random() * 8) + 1
      setPeople(ppl); setRev(r); setViews(v)
    }, 2200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => { setRnG(2341 + Math.floor(Math.random() * 5)); setRnD(1892 + Math.floor(Math.random() * 4)) }, 2200)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    fetchTopHeadlines('business', 10).then(res => {
      if (res.articles && res.articles.length > 0) {
        setNews(res.articles.slice(0, 6))
        setTickerNews(res.articles[0].title)
      }
    })
  }, [])

  return (
    <div className="bg-[#0a0b0c]">
      {/* NAV */}
      <div className="landing-nav-wrap">
        <nav className="landing-nav">
          <div className="nav-logo">
            <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" stroke="#000" strokeWidth="1.5" fill="none" /><circle cx="8" cy="8" r="3" fill="#000" /></svg>
          </div>
          <div className="nav-links">
            <div className="dd-wrap">
              <button type="button" className="nav-link">Features ▾</button>
              <div className="dd-menu">
                <div className="dd-item">
                  <div className="dd-icon">💰</div>
                  <div className="dd-text-wrap">
                    <div className="dd-title">Shadow Board</div>
                    <div className="dd-desc">3-way AI debates on news</div>
                  </div>
                </div>
                <div className="dd-item">
                  <div className="dd-icon">🌐</div>
                  <div className="dd-text-wrap">
                    <div className="dd-title">3D Showroom</div>
                    <div className="dd-desc">Immersive news exhibition</div>
                  </div>
                </div>
                <div className="dd-item">
                  <div className="dd-icon">⚡</div>
                  <div className="dd-text-wrap">
                    <div className="dd-title">Deep Briefing</div>
                    <div className="dd-desc">AI intelligence reports</div>
                  </div>
                </div>
              </div>
            </div>
            <a className="nav-link" href="#hiw">How it works</a>
            <a className="nav-link" href="#features">Features</a>
          </div>
          <Link className="nav-login" to="/login">Login</Link>
          <Link className="nav-reg" to="/login">Register</Link>
        </nav>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">
          <span className="badge-new">NEW</span>
          <span className="badge-text">Cognitive News Engine</span>
          <span className="badge-arrow">›</span>
        </div>
        <h1 className="hero-title text-white">Intelligence-first{'\n'}news engine</h1>
        <p className="hero-sub text-white/50">Witness the moment news becomes actionable intelligence in realtime.</p>
        <div className="hero-ctas">
          <Link to="/login" className="btn-p">Log In to Pilot Dashboard</Link>
          <Link to="/world" className="btn-s">Explore 3D Nexus</Link>
        </div>

        <div className="logo-strip opacity-50">
          <div className="ls-item"><div className="ls-icon">⚡</div> Fast</div>
          <div className="ls-item"><div className="ls-icon" style={{ background: '#2D2D2D', color: '#fff', borderRadius: '50%' }}>●</div> News</div>
          <div className="ls-item"><div className="ls-icon">◈</div> Nexus</div>
          <div className="ls-item"><div className="ls-icon" style={{ background: '#2D2D2D', color: '#fff' }}>▶</div> Studio</div>
        </div>
        <div className="tabs">
          {TABS.map((label) => (
            <button key={label} type="button" className={`tab${activeTab === label ? ' on' : ''}`} onClick={() => setActiveTab(label)}>{label}</button>
          ))}
        </div>
      </section>

      {/* DASHBOARD PREVIEW - ROOT RESOLUTION */}
      <div className="dash-bg">
        <div className="dash-wrap">
          <div className="dash-card reveal border border-white/10 bg-[#0c0d0e] backdrop-blur-3xl shadow-2xl overflow-hidden">
            <div className="dash-topbar border-b border-white/5 bg-white/[0.03] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="logo-dot h-3 w-3" />
                <div className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase">Sovereign Protocol v3.1</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full flex items-center gap-2">
                 <div className="status-dot w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                 <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Master Node Live</span>
              </div>
            </div>
            
            <div className="dash-body">
              {/* Sidebar Simulation */}
              <div className="dash-sidebar flex flex-col gap-6">
                 <div>
                   <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3">Intelligence Units</div>
                   <div className="flex flex-col gap-2">
                      <div className="px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-xs text-purple-300 font-bold">● Global Markets</div>
                      <div className="px-3 py-2 text-xs text-white/30 hover:text-white/60 transition-colors">○ Sentiment Cloud</div>
                      <div className="px-3 py-2 text-xs text-white/30 hover:text-white/60 transition-colors">○ Policy Oracle</div>
                   </div>
                 </div>
                 <div className="mt-auto">
                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-center">
                       <div className="text-[10px] text-white/40 font-bold uppercase mb-1">Signal Health</div>
                       <div className="text-lg font-black text-white italic tracking-tighter">99.9%</div>
                    </div>
                 </div>
              </div>

              {/* Main Preview Content */}
              <div className="flex-1">
                <div className="bg-purple-950/20 border border-purple-500/10 rounded-xl px-4 py-2 mb-8 flex items-center gap-3">
                   <div className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Update</div>
                   <div className="text-[11px] text-purple-200/60 font-medium truncate flex-1">{tickerNews}</div>
                </div>

                <div className="ds-grid">
                  <div className="ds p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Active Pilots</div>
                    <div className="text-2xl font-black text-white tracking-tight">{people.toLocaleString()}</div>
                    <div className="text-[10px] font-medium text-green-500 mt-2">+12% vs last 24h</div>
                  </div>
                  <div className="ds p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Compute Yield</div>
                    <div className="text-2xl font-black text-white tracking-tight">₹{rev}k</div>
                    <div className="text-[10px] font-medium text-green-500 mt-2">+42% efficiency</div>
                  </div>
                  <div className="ds p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Intelligence Feed</div>
                    <div className="text-2xl font-black text-white tracking-tight">Realtime</div>
                    <div className="text-[10px] font-medium text-purple-400 mt-2">Active Streaming</div>
                  </div>
                </div>

                <div className="chart-wrap h-[180px] mb-8 bg-white/[0.01] rounded-2xl overflow-hidden border border-white/5"><MiniChart /></div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                     <div className="flex justify-between items-center mb-4">
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none">Latency</div>
                        <div className="text-[10px] text-purple-400 font-bold tracking-widest leading-none uppercase">Optimized</div>
                     </div>
                     <div className="text-xl font-black text-white mb-2">14ms</div>
                     <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 w-[94%]" />
                     </div>
                  </div>
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-6">
                     <div className="score-ring-wrap">
                        <svg width="50" height="50" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" /><circle cx="25" cy="25" r="20" fill="none" stroke="#7C3AED" strokeWidth="5" strokeDasharray="125.6" strokeDashoffset="0" strokeLinecap="round" /></svg>
                        <div className="score-txt text-xs font-black text-white">100</div>
                     </div>
                     <div>
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Logic Score</div>
                        <div className="text-lg font-black text-white italic tracking-tighter leading-none mt-1">Sovereign Alpha</div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VALUE PROPS */}
      <div className="vp-section">
        <div className="reveal"><div className="vp-icon">⏱</div><p className="vp-text"><strong>Zero Latency.</strong> Fully optimized engine delivering intelligence in 40ms.</p></div>
        <div className="reveal"><div className="vp-icon">🕐</div><p className="vp-text"><strong>Fast Setup.</strong> Initialize your pilot cluster in seconds.</p></div>
        <div className="reveal"><div className="vp-icon">◈</div><p className="vp-text"><strong>Sovereign.</strong> Built for analysts, by analysts.</p></div>
      </div>

      {/* FEATURES - ROOT RESOLUTION */}
      <section className="feat-section bg-[#0a0b0c]" id="features">
        <div className="max-w-6xl mx-auto px-6">
          <div className="feat-label">Intelligence Stack</div>
          <h2 className="feat-title reveal text-white mb-20">Cognitive Control</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
            <div className="feat-card reveal bg-white/[0.02] border border-white/5 p-10 rounded-[32px] hover:bg-white/[0.05] transition-all group">
              <div className="feat-icon g scale-125 mb-8">💰</div>
              <div className="feat-tag g text-xs font-black tracking-widest mb-4">Shadow Board</div>
              <div className="feat-head text-white text-2xl font-black italic tracking-tighter mb-4 leading-tight">Quantify narratives with{'\n'}AI-driven cross-debates.</div>
              <p className="text-sm text-white/30 leading-relaxed mb-8">Process conflicting reports through a multi-agent logic cluster to extract verified signal.</p>
              <ul className="feat-list text-xs opacity-60">
                <li className="flex items-center gap-2"><span>●</span> Groq-Powered Synthesis</li>
                <li className="flex items-center gap-2"><span>●</span> Sentiment Volatility Mapping</li>
              </ul>
            </div>
            
            <div className="feat-card reveal bg-white/[0.02] border border-white/5 p-10 rounded-[32px] hover:bg-white/[0.05] transition-all group">
              <div className="feat-icon b scale-125 mb-8">🌐</div>
              <div className="feat-tag b text-xs font-black tracking-widest mb-4">3D Nexus</div>
              <div className="feat-head text-white text-2xl font-black italic tracking-tighter mb-4 leading-tight">Visualizing the Global{'\n'}Intelligence Flow.</div>
              <p className="text-sm text-white/30 leading-relaxed mb-6">Realtime geospatial monitoring of emerging events across the sovereign intelligence network.</p>
              <div className="globe-wrap h-[160px] opacity-80 group-hover:opacity-100 transition-opacity"><GlobeCanvas onLiveCount={onGlobeLive} /></div>
            </div>
          </div>

          {/* LATEST NEWS - ROOT RESOLUTION */}
          {news.length > 0 && (
            <div className="pt-32 border-t border-white/5">
               <div className="text-center mb-16">
                  <div className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-4">Live Pipeline</div>
                  <h2 className="text-4xl font-black text-white italic tracking-tighter">Intelligence Stream</h2>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {news.map((item, idx) => (
                    <div key={idx} className="reveal group cursor-pointer bg-white/[0.01] border border-white/5 rounded-3xl p-8 hover:border-purple-500/40 hover:bg-white/[0.03] transition-all">
                       <div className="flex items-center justify-between mb-6">
                          <div className="bg-white/5 px-3 py-1 rounded-full text-[9px] font-black tracking-widest text-white/40 uppercase">{item.source?.name || 'Signals'}</div>
                          <div className="text-[9px] text-white/20 font-bold uppercase tracking-widest">{new Date(item.publishedAt || '').toLocaleDateString()}</div>
                       </div>
                       <h3 className="text-xl font-black text-white group-hover:text-purple-300 transition-colors leading-tight mb-4">{item.title}</h3>
                       <p className="text-xs text-white/30 line-clamp-3 leading-relaxed">{item.description}</p>
                    </div>
                  ))}
               </div>
               
               <div className="text-center mt-20">
                  <Link to="/login" className="inline-flex items-center gap-4 bg-white text-black px-10 py-4 rounded-full text-xs font-black hover:bg-purple-400 transition-all uppercase tracking-widest">INITIALIZE FULL STREAM ACCESS <span className="text-lg">→</span></Link>
               </div>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER - ROOT RESOLUTION */}
      <footer className="border-t border-white/5 pt-32 pb-20 bg-[#0a0b0c]">
        <div className="max-w-7xl mx-auto px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center mix-blend-exclusion"><div className="h-4 w-4 bg-black rounded-full" /></div>
              <span className="font-black text-2xl text-white uppercase tracking-tighter italic">NewsOS</span>
            </div>
            <p className="text-white/20 text-sm leading-relaxed max-w-sm">The world's first cognitive news engine. Processing global intelligence into actionable alpha for sovereign data pilots.</p>
            <div className="mt-12 flex gap-4">
               <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/5" />
               <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/5" />
               <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/5" />
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
             <div className="text-xs font-black text-white/50 uppercase tracking-[0.2em] mb-4">Command Center</div>
             <Link to="/dashboard" className="text-white/30 hover:text-white transition-colors text-xs font-bold">Pilot Hub ↻</Link>
             <Link to="/world" className="text-white/30 hover:text-white transition-colors text-xs font-bold">3D World Grid</Link>
             <Link to="/video" className="text-white/30 hover:text-white transition-colors text-xs font-bold">VEO Studio</Link>
             <Link to="/charcha" className="text-white/30 hover:text-white transition-colors text-xs font-bold">Charcha Loop</Link>
          </div>
          
          <div className="flex flex-col gap-4">
             <div className="text-xs font-black text-white/50 uppercase tracking-[0.2em] mb-4">Intelligence</div>
             <Link to="/blog" className="text-white/30 hover:text-white transition-colors text-xs font-bold">Protocol Logs</Link>
             <a href="#" className="text-white/30 hover:text-white transition-colors text-xs font-bold">API Documentation</a>
             <a href="#" className="text-white/30 hover:text-white transition-colors text-xs font-bold">Privacy Core</a>
             <div className="mt-8 p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
                <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Status</div>
                <div className="text-[10px] text-white/40 font-bold">All Systems Nominal</div>
             </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-10 mt-32 pt-8 border-t border-white/5 flex justify-between items-center text-[10px] font-black text-white/10 uppercase tracking-widest">
           <div>© 2026 Sovereign News Protocol</div>
           <div className="flex gap-8"><span>Encrypted Connection</span> <span>Zero Knowledge</span></div>
        </div>
      </footer>

      <Ticker />
    </div>
  )
}

export default Landing
