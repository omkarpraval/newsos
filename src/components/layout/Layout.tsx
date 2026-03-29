import { Link, Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function Layout() {
  return (
    <div className="flex min-h-screen bg-[var(--bg-main)]">
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-[var(--max-content)] px-4 py-12 lg:px-12">
            <Outlet />
          </div>
        </main>
      </div>
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-white/10 bg-[#0f1012] px-2 py-2 md:hidden"
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
