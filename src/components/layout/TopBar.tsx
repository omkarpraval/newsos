import { Link, useNavigate } from 'react-router-dom'
import { LanguageSelector } from '../ui/LanguageSelector'
import { useUserStore } from '../../store/useUserStore'

export function TopBar() {
  const { token, persona, role, logout } = useUserStore()
  const navigate = useNavigate()
  const isLoggedIn = !!token

  const personaLabel = { trader: '📊 CFO', founder: '🚀 Founder', learner: '🌱 Investor' }[persona] || '🌱 Investor'
  const roleColors: Record<string, string> = { admin: 'bg-purple-100 text-purple-700', premium: 'bg-amber-100 text-amber-700', basic: 'bg-gray-100 text-gray-500' }
  
  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="font-display text-xl text-[var(--text-primary)]" aria-label="NewsOS home">
          News<span className="text-[var(--accent-gold)]">OS</span>
        </Link>
        <span className="hidden rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)] lg:inline">
          ET-IQ Intelligence Platform
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1 rounded-full border border-[var(--border-subtle)] px-2 py-1 text-[10px] text-[var(--text-muted)] sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-green)]" />
          LIVE
        </span>
        <LanguageSelector />
        
        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            <span className="hidden text-[11px] font-bold text-[var(--text-secondary)] sm:block">{personaLabel}</span>
            <span className={`hidden rounded-full px-2 py-0.5 text-[10px] font-black uppercase sm:block ${roleColors[role] || roleColors.basic}`}>{role}</span>
            <button
              onClick={handleLogout}
              className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-[11px] font-bold text-[var(--text-secondary)] transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Logout
            </button>
            <Link to="/settings">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--accent-gold)] text-[11px] font-black text-black" aria-label="Avatar">
                {persona?.[0]?.toUpperCase() || 'U'}
              </div>
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-[11px] font-bold text-[var(--text-secondary)] transition-all hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]">
              Login
            </Link>
            <Link to="/register" className="rounded-full bg-[var(--accent-gold)] px-3 py-1.5 text-[11px] font-black text-black transition-all hover:opacity-90">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
