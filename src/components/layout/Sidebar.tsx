import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useUserStore } from '../../store/useUserStore'
import type { UserRole } from '../../store/useUserStore'

const links = [
  { to: '/dashboard', label: 'Intelligence Studio', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { to: '/charcha', label: 'News Pe Charcha', icon: '🎙' },
  { to: '/world', label: 'Global World', icon: '🌐' },
  { to: '/briefing', label: 'Deep Briefings', icon: '📄', minRole: 'premium' },
  { to: '/video', label: 'Video Studio', icon: '🎬' },
  { to: '/butterfly', label: 'Causal Mapper', icon: '🦋' },
  { to: '/shadow-board', label: 'Shadow Board', icon: '⚔️' },
  { to: '/fiscal-machine', label: 'Fiscal Machine', icon: '🔮' },
  { to: '/devils-advocate', label: "Advocate AI", icon: '😈' },
  { to: '/blog', label: 'Intelligence Blog', icon: '✍️' },
  { to: '/arc', label: 'Arc Tracker', icon: '⤴', minRole: 'admin' },
  { to: '/vernacular', label: 'Vernacular', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg> },
  { to: '/persona-demo', label: 'Persona Architect', icon: '⚡' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]

export function Sidebar() {
  const navigate = useNavigate()
  const [hover, setHover] = useState(false)
  const { role, logout } = useUserStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <motion.aside
      className="relative z-20 hidden shrink-0 border-r border-white/5 bg-[#0a0b0c] md:block"
      animate={{ width: hover ? 240 : 72 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="Primary navigation"
    >
      <div className="flex h-full flex-col py-6">
        <div className="mb-10 flex h-10 items-center px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#0a0b0c] shadow-lg shadow-white/5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
          <AnimatePresence>
            {hover && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="ml-3 font-display text-lg font-black tracking-tight text-white uppercase"
              >
                NewsOS<span className="text-white/20">.</span>
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <nav className="flex flex-1 flex-col gap-1.5 px-3 overflow-y-auto custom-scrollbar">
          {links
            .filter((l) => {
              if (!l.minRole) return true
              const roleOrder = { basic: 0, premium: 1, admin: 2 }
              return roleOrder[role as UserRole || 'basic'] >= roleOrder[l.minRole as UserRole]
            })
            .map((l: any) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `flex items-center gap-4 rounded-xl px-4 py-3.5 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white/10 text-white shadow-lg shadow-white/5'
                      : 'text-white/30 hover:bg-white/5 hover:text-white'
                  }`
                }
                end={l.to === '/dashboard'}
              >
                <div className="flex w-5 shrink-0 justify-center text-lg">
                  {l.icon}
                </div>
                {hover && <span className="whitespace-nowrap tracking-wider">{l.label}</span>}
              </NavLink>
            ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 px-3 pt-6 border-t border-white/5">
          <button
            type="button"
            className="group flex w-full items-center gap-4 rounded-xl bg-white/[0.03] p-3 text-xs font-bold text-white/50 transition-all hover:bg-white/10 hover:text-white"
          >
            <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 p-0.5">
               <div className="h-full w-full rounded-[6px] bg-[#0a0b0c] flex items-center justify-center">👤</div>
            </div>
            {hover && <div className="flex flex-col items-start translate-x-0 group-hover:translate-x-1 transition-transform">
               <span className="whitespace-nowrap text-white/80">Intelligence Pilot</span>
               <span className="text-[10px] text-white/20 uppercase tracking-widest">{role || 'Basic'}</span>
            </div>}
          </button>
          
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-4 rounded-xl px-3.5 py-3 text-xs font-bold text-red-500/30 transition-all hover:bg-red-500/10 hover:text-red-500"
          >
            <div className="flex w-5 shrink-0 justify-center">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            {hover && <span className="whitespace-nowrap tracking-widest uppercase">Terminate</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
