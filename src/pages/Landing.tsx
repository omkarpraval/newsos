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

      {/* DASHBOARD PREVIEW */}
      <div className="dash-bg">
        <div className="dash-wrap">
          <div className="dash-card reveal border border-white/10 bg-black/40 backdrop-blur-3xl overflow-hidden">
            <div className="dash-topbar border-b border-white/5 bg-white/5">
              <div className="topbar-left text-white/70"><div className="logo-dot" /> HOME DASHBOARD <div className="status-dot" style={{ marginLeft: 4 }} /></div>
              <div style={{ fontSize: 13, color: '#9CA3AF' }}>Live ↻</div>
              <div className="avatar-circle" />
            </div>
            
            {/* ADDED NEWS TICKER IN DASHBOARD PREVIEW */}
            <div className="bg-purple-950/20 border-b border-purple-500/10 px-6 py-3 flex items-center gap-4">
               <div className="bg-purple-500 text-[9px] font-black text-white px-2 py-0.5 rounded uppercase tracking-widest">Breaking</div>
               <div className="text-[11px] font-bold text-purple-200/80 line-clamp-1 flex-1 marquee-scroll">{tickerNews}</div>
            </div>

            <div className="dash-body">
              <div className="dash-stats">
                <div className="ds"><div className="ds-lbl">Active Pilots</div><div className="ds-val text-white">{people.toLocaleString()}</div><div className="ds-chg pos">+12%</div></div>
                <div className="ds"><div className="ds-lbl">Sector Yield</div><div className="ds-val text-white">₹{rev}k</div><div className="ds-chg pos">+42%</div></div>
                <div className="ds"><div className="ds-lbl">Total Views</div><div className="ds-val text-white">{views.toLocaleString()}</div><div className="ds-chg pos">+84%</div></div>
              </div>
              <div className="chart-wrap"><MiniChart /></div>
              <div className="dash-bottom">
                <div className="db-card bg-white/5 border border-white/5">
                  <div className="db-title"><span>{livePeople} active in last 30m</span><span className="rt-badge">LATEST ›</span></div>
                  <LiveBars onLiveCount={onLiveCount} />
                </div>
                <div className="db-card bg-white/5 border border-white/5 flex items-center justify-between">
                   <div><div className="db-title">Intelligence Latency</div><div className="text-xl font-black text-white">14ms</div></div>
                   <div className="score-ring-wrap">
                      <svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" /><circle cx="28" cy="28" r="22" fill="none" stroke="var(--green)" strokeWidth="6" strokeDasharray="138.2" strokeDashoffset="0" strokeLinecap="round" /></svg>
                      <div className="score-txt text-white">100</div>
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

      {/* FEATURES - MAKE IT SMALL AND VISIBLE */}
      <section className="feat-section" id="features">
        <div className="feat-label">Technical Hub</div>
        <h2 className="feat-title reveal text-white">Cognitive Control</h2>
        <div className="feat-grid max-w-5xl">
          <div className="feat-card reveal bg-white/5 border border-white/5 p-8 rounded-3xl hover:bg-white/[0.08] transition-all">
            <div className="feat-icon g">💰</div>
            <div className="feat-tag g">Shadow Board</div>
            <div className="feat-head text-white text-xl">Analyze narratives with AI debates.</div>
            <ul className="feat-list text-xs opacity-60"><li>Groq Analysis</li><li>Sentiment Mapping</li></ul>
          </div>
          <div className="feat-card reveal bg-white/5 border border-white/5 p-8 rounded-3xl hover:bg-white/[0.08] transition-all">
            <div className="feat-icon b">🌐</div>
            <div className="feat-tag b">3D Nexus</div>
            <div className="feat-head text-white text-xl">Watch global flows in realtime.</div>
            <div className="globe-wrap h-[120px] mt-4"><GlobeCanvas onLiveCount={onGlobeLive} /></div>
          </div>
        </div>

        {/* LATEST NEWS AT LAST SECTION - MAKE IT VISIBLE */}
        {news.length > 0 && (
          <div className="mt-20 pt-20 border-t border-white/5">
             <div className="feat-label italic mb-10 text-center">Intelligence Stream Feed</div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-6">
                {news.map((item, idx) => (
                  <div key={idx} className="reveal group cursor-pointer bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 hover:bg-white/[0.06] transition-all">
                     <div className="flex items-center justify-between mb-4">
                        <div className="text-[9px] font-black tracking-widest text-purple-400 uppercase">{item.source?.name || 'Intelligence'}</div>
                        <div className="text-[9px] text-white/20 font-bold uppercase">{new Date(item.publishedAt || '').toLocaleDateString()}</div>
                     </div>
                     <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors leading-snug mb-3">{item.title}</h3>
                     <p className="text-xs text-white/40 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                ))}
             </div>
             <div className="text-center mt-12">
                <Link to="/login" className="bg-white/5 border border-white/10 px-8 py-3 rounded-full text-xs font-black text-white/40 hover:text-white hover:border-white/30 transition-all">INITIALIZE FULL STREAM ACCESS →</Link>
             </div>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 pt-16 pb-12">
        <div className="foot-inner">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center mix-blend-exclusion"><div className="h-3 w-3 bg-black rounded-full" /></div>
              <span className="font-black text-lg text-white uppercase tracking-tighter italic">NewsOS</span>
            </div>
            <p className="foot-desc text-white/20 max-w-xs">High-fidelity intelligence engine for data pilots.</p>
          </div>
          <div><div className="foot-col-h text-white/40">Nexus</div><Link to="/dashboard" className="foot-link">Pilot Hub</Link><Link to="/world" className="foot-link">3D World</Link></div>
          <div><div className="foot-col-h text-white/40">Connect</div><Link to="/blog" className="foot-link">Intelligence Log</Link><a href="#" className="foot-link">Privacy</a></div>
        </div>
      </footer>

      <Ticker />
    </div>
  )
}

export default Landing
