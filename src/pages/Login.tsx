import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '../store/useUserStore'
import type { UserRole } from '../store/useUserStore'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void
          renderButton: (el: HTMLElement, config: object) => void
          prompt: () => void
        }
      }
    }
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export function Login() {
  const navigate = useNavigate()
  const { setToken, setPersona, setRole, setGuest } = useUserStore()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [persona, setPersonaLocal] = useState('learner')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')
  const googleBtnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      })
      if (googleBtnRef.current) {
        window.google?.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: googleBtnRef.current.offsetWidth || 400,
          text: 'continue_with',
          shape: 'pill',
        })
      }
    }
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [mode])

  const handleGoogleCredential = async (response: { credential: string }) => {
    setLoading(true)
    setErr('')
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Google sign-in failed')
      setToken(data.token)
      setPersona(data.user.persona || 'learner')
      setRole((data.user.role as UserRole) || 'basic')
      setGuest(false)
      setSuccess('Access granted.')
      setTimeout(() => navigate('/dashboard'), 800)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErr('')
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'register'
        ? { email, password, persona: persona }
        : { email, password }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Authentication failed')

      if (mode === 'register') {
        setSuccess('Intelligence node initialized.')
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const loginData = await loginRes.json()
        if (loginRes.ok) {
          setToken(loginData.token)
          setPersona(loginData.user.persona || persona)
          setRole((loginData.user.role as UserRole) || 'basic')
          setGuest(false)
        }
      } else {
        setToken(data.token)
        setPersona(data.user.persona || 'learner')
        setRole((data.user.role as UserRole) || 'basic')
        setGuest(false)
        setSuccess('Welcome back, Pilot.')
      }
      setTimeout(() => navigate('/dashboard'), 800)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0a0b0c] text-white">
      {/* Left Panel - Dark Branding */}
      <div className="hidden w-1/2 flex-col items-center justify-center bg-black p-16 lg:flex border-r border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 opacity-30 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-md relative z-10">
          <Link to="/" className="flex items-center gap-4 mb-24 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black shadow-lg shadow-white/5 transition-transform group-hover:scale-105">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <span className="text-3xl font-black text-white tracking-tighter uppercase">NewsOS<span className="text-white/20">.</span></span>
          </Link>
          
          <h2 className="text-6xl font-black text-white leading-[0.9] tracking-tighter mb-10">
            Intelligence that<br />
            <span className="text-purple-500">adapts to you.</span>
          </h2>
          
          <div className="space-y-3 mb-20">
            <div className="text-[10px] font-black text-white/20 tracking-[0.3em] uppercase mb-6">Autonomous Pilot Accounts</div>
            {[
              { email: 'cfo@newsos.com', role: 'Elite Trader (CFO)', color: '#a78bfa' },
              { email: 'founder@newsos.com', role: 'Ecosystem Expert', color: '#60a5fa' },
              { email: 'student@newsos.com', role: 'First-Gen Investor', color: '#34d399' },
            ].map(user => (
              <button
                key={user.email}
                onClick={() => { setEmail(user.email); setPassword('password123'); setMode('login') }}
                className="w-full flex items-center justify-between gap-4 rounded-2xl bg-white/[0.03] border border-white/5 p-4 transition-all hover:bg-white/[0.08] hover:border-white/20"
              >
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: user.color, boxShadow: `0 0 10px ${user.color}` }} />
                  <div className="text-left font-display">
                    <div className="text-sm font-black text-white/80">{user.role}</div>
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{user.email}</div>
                  </div>
                </div>
                <span className="text-white/20">→</span>
              </button>
            ))}
          </div>

          <div className="flex gap-12">
            {[
              { label: 'Persona Adaptive', icon: '⚡' },
              { label: 'Causal Intelligence', icon: '🦋' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="text-xl opacity-40">{f.icon}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-white/30">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-12 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 h-64 w-64 bg-blue-500/5 blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10">
          <div className="flex items-center gap-2 mb-12 bg-white/5 p-1 rounded-full w-fit">
            <button
              onClick={() => { setMode('login'); setErr('') }}
              className={`rounded-full px-8 py-3 text-xs font-black uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-white text-black shadow-xl shadow-white/5' : 'text-white/40 hover:text-white'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setErr('') }}
              className={`rounded-full px-8 py-3 text-xs font-black uppercase tracking-widest transition-all ${mode === 'register' ? 'bg-white text-black shadow-xl shadow-white/5' : 'text-white/40 hover:text-white'}`}
            >
              Initialize
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4, ease: "circOut" }}>
              <h1 className="text-5xl font-black tracking-tight text-white mb-3">
                {mode === 'login' ? 'Nexus Login' : 'New Terminal'}
              </h1>
              <p className="text-sm font-bold text-white/30 mb-12 leading-relaxed">
                {mode === 'login' ? 'Resume your intelligence stream.' : 'Create your high-fidelity newsroom instance.'}
              </p>

              {/* Google Sign-In */}
              <div className="mb-8">
                <div ref={googleBtnRef} className="w-full" />
                {!GOOGLE_CLIENT_ID && (
                  <button
                    className="w-full flex items-center justify-center gap-4 rounded-2xl bg-white p-5 text-sm font-black text-black shadow-xl transition-all hover:scale-[1.02] active:scale-95"
                    onClick={() => setErr('Google Sign-In not configured. Use Terminal credentials.')}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continue with Google
                  </button>
                )}
              </div>

              <div className="relative my-10 flex items-center">
                <div className="flex-1 border-t border-white/5" />
                <span className="mx-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/10">Terminal</span>
                <div className="flex-1 border-t border-white/5" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/20 mb-3 ml-1">Access Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="pilot@newsos.intelligence"
                    required
                    className="w-full rounded-2xl bg-white/[0.03] border border-white/5 px-6 py-4 text-sm font-bold text-white outline-none transition-all focus:border-purple-500/50 focus:bg-white/[0.06]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-white/20 mb-3 ml-1">Access Key</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full rounded-2xl bg-white/[0.03] border border-white/5 px-6 py-4 text-sm font-bold text-white outline-none transition-all focus:border-purple-500/50 focus:bg-white/[0.06]"
                  />
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-white/20 mb-3 ml-1">Persona Matrix</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'trader', label: 'CFO', icon: '📊' },
                        { id: 'founder', label: 'Founder', icon: '🚀' },
                        { id: 'learner', label: 'Investor', icon: '🌱' },
                      ].map(p => (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => setPersonaLocal(p.id)}
                          className={`flex flex-col items-center rounded-2xl border transition-all p-4 ${persona === p.id ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-white/5 bg-white/[0.02] text-white/30 hover:border-white/20'}`}
                        >
                          <span className="text-xl mb-2">{p.icon}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {err && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-4 text-xs font-black text-red-500 uppercase tracking-widest">
                      [Error] {err}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-purple-500/10 border border-purple-500/20 px-4 py-4 text-xs font-black text-purple-400 uppercase tracking-widest">
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-purple-600 py-5 text-sm font-black text-white hover:bg-purple-500 hover:scale-[1.01] active:scale-95 transition-all shadow-2xl shadow-purple-900/40 disabled:opacity-50"
                >
                  {loading ? 'Transmitting...' : mode === 'login' ? 'Initiate Session' : 'Create Instance'}
                </button>
              </form>

              <p className="mt-12 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                {mode === 'login' ? "No credentials found? " : 'Key already exists? '}
                <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-white hover:text-purple-400 transition-colors">
                  {mode === 'login' ? 'Request Access' : 'Return to Login'}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
