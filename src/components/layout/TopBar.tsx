import { Link } from 'react-router-dom'
import { LanguageSelector } from '../ui/LanguageSelector'

export function TopBar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="font-display text-xl text-[var(--text-primary)]" aria-label="NewsOS home">
          News<span className="text-[var(--accent-gold)]">OS</span>
        </Link>
        <span className="hidden rounded-full border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)] lg:inline">
          Bloomberg Terminal meets sci-fi newsroom
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden items-center gap-1 rounded-full border border-[var(--border-subtle)] px-2 py-1 text-[10px] text-[var(--text-muted)] sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-green)]" />
          LIVE
        </span>
        <LanguageSelector />
        <div
          className="h-9 w-9 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
          aria-label="Avatar"
          role="img"
        />
      </div>
    </header>
  )
}
