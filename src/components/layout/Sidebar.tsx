import { AnimatePresence, motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { usePersonalizationStore } from '../../store/usePersonalizationStore'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '▦' },
  { to: '/charcha', label: 'News Pe Charcha', icon: '📻' },
  { to: '/world', label: 'World', icon: '◉' },
  { to: '/briefing', label: 'Briefings', icon: '☷' },
  { to: '/video', label: 'Video Studio', icon: '▷' },
  { to: '/arc', label: 'Arc Tracker', icon: '⤴' },
  { to: '/vernacular', label: 'Vernacular', icon: 'भ' },
]

export function Sidebar() {
  const [hover, setHover] = useState(false)
  const { isPersonalized, interestScores, resetPersonalization } = usePersonalizationStore()
  const zoneMeta: Record<string, { name: string; color: string }> = {
    markets: { name: 'Markets Plaza', color: '#f0a500' },
    parliament: { name: 'Parliament Hall', color: '#3a86ff' },
    startup: { name: 'Startup District', color: '#8b5cf6' },
    world: { name: 'World Events Arena', color: '#2ec4b6' },
    bharat: { name: 'Bharat Corner', color: '#ff6b35' },
    breaking: { name: 'Daily Prophet HQ', color: '#e63946' },
  }

  return (
    <motion.aside
      className="relative z-20 hidden shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-secondary)] md:block"
      animate={{ width: hover ? 240 : 72 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="Primary navigation"
    >
      <div className="flex h-full flex-col py-4">
        <div className="mb-6 flex h-10 items-center justify-center px-2">
          <span className="font-display text-lg text-[var(--accent-gold)]">N</span>
          <AnimatePresence>
            {hover && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="ml-2 font-display text-sm text-[var(--text-primary)]"
              >
                NewsOS
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-[var(--bg-elevated)] ${
                  isActive
                    ? 'border-l-2 border-[var(--accent-gold)] bg-[var(--bg-card)] text-[var(--text-primary)]'
                    : 'border-l-2 border-transparent text-[var(--text-secondary)]'
                }`
              }
              end={l.to === '/dashboard'}
              style={({ isActive }) =>
                l.to === '/charcha'
                  ? {
                      color: '#f0a500',
                      background: isActive ? 'rgba(240,165,0,0.12)' : 'rgba(240,165,0,0.04)',
                      border: isActive ? '1px solid rgba(240,165,0,0.3)' : '1px solid rgba(240,165,0,0.12)',
                    }
                  : undefined
              }
            >
              <span className="w-6 text-center text-base" aria-hidden>
                {l.icon}
              </span>
              {hover && <span>{l.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-[var(--border-subtle)] px-2 pt-4">
          {isPersonalized && hover && (
            <div className="mb-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3">
              <div className="mb-2 text-[10px] tracking-[0.1em] text-[var(--text-muted)]">YOUR INTERESTS</div>
              {Object.entries(interestScores)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([zoneId, score]) => {
                  const zone = zoneMeta[zoneId]
                  return (
                    <div key={zoneId} className="mb-2">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                        <span>{zone?.name || zoneId}</span>
                        <span style={{ color: zone?.color || '#f0a500' }}>{score}%</span>
                      </div>
                      <div className="h-[2px] rounded bg-white/10">
                        <div
                          className="h-full rounded"
                          style={{ width: `${score}%`, background: zone?.color || '#f0a500' }}
                        />
                      </div>
                    </div>
                  )
                })}
              <button
                type="button"
                onClick={resetPersonalization}
                className="mt-1 w-full rounded border border-white/10 px-2 py-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Reset interests
              </button>
            </div>
          )}
          <button
            type="button"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
            aria-label="User"
          >
            <span className="h-8 w-8 rounded-full bg-[var(--bg-elevated)]" />
            {hover && <span>Guest</span>}
          </button>
          <button
            type="button"
            className="flex items-center justify-center rounded-lg py-2 text-[var(--text-muted)] hover:text-[var(--accent-gold)]"
            aria-label="Settings"
          >
            ⚙
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
