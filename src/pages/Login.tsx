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

  // Load and initialize Google Sign-In
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
      setSuccess('Welcome back!')
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
        setSuccess('Account created! Logging you in...')
        // Auto-login after register
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
        setSuccess('Welcome back!')
      }
      setTimeout(() => navigate('/dashboard'), 800)
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Panel - Branding */}
      <div className="hidden w-1/2 flex-col items-center justify-center bg-[#0a0a0a] p-16 lg:flex">
        <div className="max-w-md">
          <Link to="/" className="flex items-center gap-3 mb-16">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-black">
              <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">NewsOS</span>
          </Link>
          
          <h2 className="text-4xl font-black text-white leading-tight tracking-tight">
            Intelligence that<br />
            <span className="text-[#7c3aed]">adapts to you.</span>
          </h2>
          <p className="mt-6 text-lg text-white/50 leading-relaxed">
            Join thousands of traders, founders, and investors who read smarter with AI-native briefings.
          </p>
          
          <div className="mt-16 space-y-6">
            {[
              { icon: '📊', label: 'Persona-adaptive news', desc: 'Content reframed for your role' },
              { icon: '🤖', label: 'AI Chatbot with memory', desc: 'Context-aware conversation' },
              { icon: '⚔️', label: 'Shadow Board debates', desc: 'Bull vs Bear vs Regulator' },
              { icon: '🔮', label: 'Fiscal Time Machine', desc: 'Simulate portfolio impact' },
            ].map(f => (
              <div key={f.label} className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-lg">{f.icon}</div>
                <div>
                  <div className="text-sm font-bold text-white">{f.label}</div>
                  <div className="text-xs text-white/40">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-1 mb-10">
            <button
              onClick={() => { setMode('login'); setErr('') }}
              className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all ${mode === 'login' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setErr('') }}
              className={`rounded-full px-6 py-2.5 text-sm font-bold transition-all ${mode === 'register' ? 'bg-black text-white shadow-lg' : 'text-gray-400 hover:text-black'}`}
            >
              Create Account
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <h1 className="text-3xl font-black tracking-tight text-black mb-2">
                {mode === 'login' ? 'Welcome back' : 'Get started free'}
              </h1>
              <p className="text-sm text-gray-400 mb-10">
                {mode === 'login' ? 'Sign in to your ET-IQ account' : 'Create your personalized newsroom'}
              </p>

              {/* Google Sign-In */}
              <div className="mb-6">
                <div ref={googleBtnRef} className="w-full" />
                {!GOOGLE_CLIENT_ID && (
                  <button
                    className="w-full flex items-center justify-center gap-3 rounded-full border-2 border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-black shadow-sm transition-all hover:border-gray-400 hover:shadow-md"
                    onClick={() => setErr('Google Sign-In not configured. Please use email.')}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </button>
                )}
              </div>

              <div className="relative my-6 flex items-center">
                <div className="flex-1 border-t border-gray-100" />
                <span className="mx-4 text-xs font-bold uppercase tracking-widest text-gray-300">or</span>
                <div className="flex-1 border-t border-gray-100" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-2xl border-2 border-gray-100 px-5 py-3.5 text-sm font-medium text-black outline-none transition-all focus:border-[#7c3aed] focus:ring-4 focus:ring-purple-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full rounded-2xl border-2 border-gray-100 px-5 py-3.5 text-sm font-medium text-black outline-none transition-all focus:border-[#7c3aed] focus:ring-4 focus:ring-purple-50"
                  />
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Your Role</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'trader', label: 'CFO / Trader', icon: '📊' },
                        { id: 'founder', label: 'Founder', icon: '🚀' },
                        { id: 'learner', label: 'Investor', icon: '🌱' },
                      ].map(p => (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => setPersonaLocal(p.id)}
                          className={`flex flex-col items-center rounded-2xl border-2 p-4 text-xs font-bold transition-all ${persona === p.id ? 'border-[#7c3aed] bg-purple-50 text-[#7c3aed]' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                        >
                          <span className="text-2xl mb-2">{p.icon}</span>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {err && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                      {err}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl bg-green-50 px-4 py-3 text-sm font-bold text-green-600">
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#7c3aed] py-4 text-sm font-black text-white shadow-xl transition-all hover:bg-[#6d28d9] hover:shadow-purple-200 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <p className="mt-8 text-center text-xs text-gray-400">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-bold text-[#7c3aed] hover:underline">
                  {mode === 'login' ? 'Sign up free' : 'Sign in'}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
