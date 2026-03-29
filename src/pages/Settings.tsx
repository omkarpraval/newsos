import { useState } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '../store/useUserStore'

export function Settings() {
  const { role, preferences, setPreferences, setRole } = useUserStore()
  const [success, setSuccess] = useState(false)

  const topics = [
    { id: 'markets', label: 'Stock Markets', icon: '📈' },
    { id: 'politics', label: 'Policy & Politics', icon: '🏛' },
    { id: 'startup', label: 'Startup & Venture', icon: '🚀' },
    { id: 'tech', label: 'Technology & AI', icon: '⚡' },
    { id: 'economy', label: 'Macro Economy', icon: '📊' },
    { id: 'world', label: 'Global Affairs', icon: '🌍' },
  ]

  const toggleTopic = (id: string) => {
    if (preferences.includes(id)) {
      setPreferences(preferences.filter(p => p !== id))
    } else {
      setPreferences([...preferences, id])
    }
  }

  const handleSave = () => {
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  return (
    <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="mt-2 text-[var(--text-secondary)]">Manage your role and content preferences.</p>
      </header>

      <section className="space-y-12">
        {/* RBAC: Role Selection */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Account Role (RBAC)</h2>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">Your role determines which agentic features you can access.</p>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { id: 'basic', label: 'Basic', desc: 'Standard News & Persona Framing' },
              { id: 'premium', label: 'Premium', desc: 'Deep Briefings & Video Generation' },
              { id: 'admin', label: 'Admin', desc: 'Full System Control & Arc Access' },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id as any)}
                className={`relative flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                  role === r.id 
                    ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/5 ring-1 ring-[var(--accent-gold)]' 
                    : 'border-[var(--border-subtle)] hover:bg-white/5'
                }`}
              >
                <span className={`text-sm font-bold ${role === r.id ? 'text-[var(--accent-gold)]' : 'text-[var(--text-primary)]'}`}>
                  {r.label}
                </span>
                <span className="mt-1 text-[11px] text-[var(--text-secondary)] leading-tight">{r.desc}</span>
                {role === r.id && (
                  <motion.div layoutId="role-check" className="absolute right-3 top-3 text-[var(--accent-gold)] text-xs">✓</motion.div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Choice: Data Preferences */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Data as Your Choice</h2>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">Select the topics you want to see in your personalized dashboard.</p>
          
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTopic(t.id)}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                  preferences.includes(t.id)
                    ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/5'
                    : 'border-[var(--border-subtle)] bg-black/20 hover:bg-black/40'
                }`}
              >
                <span className="text-lg">{t.icon}</span>
                <span className="text-xs font-semibold text-[var(--text-primary)]">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleSave}
            className="rounded-xl bg-[var(--accent-gold)] px-8 py-3 text-sm font-bold text-black transition-transform active:scale-95 disabled:opacity-50"
          >
            {success ? 'Saved!' : 'Save Preferences'}
          </button>
          {success && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="text-xs font-medium text-[var(--accent-green)]"
            >
              Changes applied across NewsOS
            </motion.p>
          )}
        </div>
      </section>
    </div>
  )
}
