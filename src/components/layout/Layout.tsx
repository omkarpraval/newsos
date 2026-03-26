import { Link, Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { NewsTicker } from '../news/NewsTicker'

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-primary)]">
      <NewsTicker />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="mx-auto w-full max-w-content flex-1 px-4 py-6 pb-24 md:pb-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-2 py-2 md:hidden"
        aria-label="Mobile navigation"
      >
        {[
          ['/dashboard', 'Home'],
          ['/world', 'World'],
          ['/briefing', 'Brief'],
          ['/arc', 'Arc'],
        ].map(([to, label]) => (
          <Link
            key={to}
            to={to}
            className="flex-1 rounded-lg py-2 text-center text-xs text-[var(--text-secondary)]"
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
