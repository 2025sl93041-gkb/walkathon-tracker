import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getConfig } from '../services/api'

const MEMBER_NAV = (cfg) => [
  { to: '/dashboard',   label: '🏠 Dashboard' },
  cfg?.groupingTabEnabled  && { to: '/grouping',    label: '🎲 Chit Draw' },
  cfg?.challengeTabEnabled && { to: '/daily-log',   label: '👟 Daily Log' },
  { to: '/leaderboard', label: '🏆 Leaderboard' },
  cfg?.resultsPublished    && { to: '/results',     label: '🎉 Results' },
].filter(Boolean)

const ADMIN_NAV = [
  { to: '/admin',            label: '🏠 Dashboard' },
  { to: '/admin/event',      label: '⚙️ Event Config' },
  { to: '/admin/users',      label: '👥 Users' },
  { to: '/admin/grouping',   label: '🎲 Grouping' },
  { to: '/admin/logs',       label: '📋 Daily Logs' },
  { to: '/admin/leaderboard', label: '🏆 Leaderboard' },
  { to: '/admin/results',    label: '🎉 Results' },
]

function NavLinks({ items, onClick }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/admin' || item.to === '/dashboard'}
          onClick={onClick}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [cfg, setCfg] = useState(null)

  useEffect(() => {
    getConfig().then(r => setCfg(r.data.data)).catch(() => {})
  }, [])

  const nav = user?.role === 'admin' ? ADMIN_NAV : MEMBER_NAV(cfg)

  function handleLogout() {
    signOut()
    navigate('/login')
  }

  const Inner = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🚶</span>
          <div>
            <div className="font-bold text-white text-sm leading-tight">Walkathon Tracker</div>
            <div className="text-blue-300 text-xs">Team Walking Challenge</div>
          </div>
        </div>
      </div>

      {/* User */}
      <div className="px-5 py-3 border-b border-blue-800">
        <div className="text-white text-sm font-medium truncate">{user?.fullName}</div>
        <div className="text-blue-300 text-xs capitalize">{user?.role}</div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3">
        <NavLinks items={nav} onClick={() => setOpen(false)} />
      </div>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-blue-800">
        <button
          onClick={handleLogout}
          className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
        >
          🚪 Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-blue-900 min-h-screen fixed left-0 top-0 z-30">
        <Inner />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-blue-900 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚶</span>
          <span className="text-white font-bold text-sm">Walkathon 2026</span>
        </div>
        <button onClick={() => setOpen(!open)} className="text-white text-2xl p-1">
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-blue-900 flex flex-col">
            <Inner />
          </aside>
        </div>
      )}
    </>
  )
}
