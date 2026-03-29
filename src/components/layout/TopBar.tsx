import { Link, useNavigate } from 'react-router-dom'
import { useUserStore } from '../../store/useUserStore'

export function TopBar() {
  const navigate = useNavigate()
  const { token, setToken, setPersona, setRole } = useUserStore()

  const handleLogout = () => {
    setToken(null)
    setPersona('learner')
    setRole('basic')
    navigate('/')
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between border-b border-white/10 bg-[var(--bg-primary)]/80 backdrop-blur-md px-8">
      <div className="flex items-center gap-12">
        <Link 
          to="/" 
          className="group flex items-center gap-2.5"
        >
           <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#0a0b0c] shadow-lg shadow-white/5 transition-transform group-hover:scale-105">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
           </div>
           <span className="font-display text-xl font-black tracking-tight text-white">NewsOS</span>
        </Link>
        <div className="hidden items-center gap-8 lg:flex">
          <Link to="/world" className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
            3D Showroom
          </Link>
          <Link to="/charcha" className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
            News Pe Charcha
          </Link>
          <Link to="/arc" className="text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">
            Arc Tracker
          </Link>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        {!token ? (
          <>
            <Link to="/login" className="text-sm font-bold text-white/70 hover:text-white">
              Log in
            </Link>
            <Link to="/login" className="rounded-full bg-white px-6 py-2.5 text-xs font-black text-[#0a0b0c] transition-transform hover:scale-105 active:scale-95">
              Launch Studio — Free
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className="text-sm font-bold text-white/70 hover:text-white">
              Dashboard
            </Link>
            <button onClick={handleLogout} className="rounded-full border border-white/20 px-6 py-2.5 text-xs font-black text-white hover:bg-white/5">
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  )
}
