import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { supabase } from './supabaseClient'
import { useUserId, useDarkMode, useIsPWA } from './hooks/useUser'

// Pages
import Schedule from './pages/Schedule'
import Standings from './pages/Standings'
import Teams from './pages/Teams'
import TeamDetail from './pages/TeamDetail'
import Vote from './pages/Vote'
import Recap from './pages/Recap'
import Admin from './pages/Admin'

// Components
import InstallBanner from './components/InstallBanner'

// Context
const AppContext = createContext()
export const useApp = () => useContext(AppContext)

export default function App() {
  const userId = useUserId()
  const [darkMode, toggleDark] = useDarkMode()
  const isPWA = useIsPWA()

  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch initial data
  useEffect(() => {
    async function load() {
      const [teamsRes, playersRes] = await Promise.all([
        supabase.from('teams').select('*').order('id'),
        supabase.from('players').select('*').order('name')
      ])
      if (teamsRes.data) setTeams(teamsRes.data)
      if (playersRes.data) setPlayers(playersRes.data)
      setLoading(false)
    }
    load()

    // Check admin status
    if (localStorage.getItem('qba_admin') === 'true') {
      setIsAdmin(true)
    }
  }, [])

  const handleAdminLogin = async (pin) => {
    // Check PIN from database
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'admin_pin')
      .single()

    const correctPin = data?.value || '1234'

    if (pin === correctPin) {
      localStorage.setItem('qba_admin', 'true')
      setIsAdmin(true)
      setShowAdminModal(false)
      return true
    }
    return false
  }

  const handleAdminLogout = () => {
    localStorage.removeItem('qba_admin')
    setIsAdmin(false)
  }

  const ctx = {
    userId,
    teams,
    players,
    isAdmin,
    darkMode,
    toggleDark,
    isPWA
  }

  return (
    <AppContext.Provider value={ctx}>
      <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-primary-500 dark:bg-primary-700 text-white px-4 py-4 safe-top">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">QBA</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleDark}
                className="w-9 h-9 rounded-full flex items-center justify-center 
                         bg-white/10 hover:bg-white/20 transition-colors"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <button
                onClick={() => isAdmin ? handleAdminLogout() : setShowAdminModal(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center
                         bg-white/10 hover:bg-white/20 transition-colors text-sm"
              >
                {isAdmin ? '🔓' : '🔐'}
              </button>
            </div>
          </div>
        </header>

        {/* Install banner */}
        <InstallBanner />

        {/* Admin modal */}
        {showAdminModal && (
          <AdminModal onSubmit={handleAdminLogin} onClose={() => setShowAdminModal(false)} />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              <div className="skeleton h-10 w-48" />
              <div className="skeleton h-32" />
              <div className="skeleton h-32" />
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Schedule />} />
              <Route path="/standings" element={<Standings />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/teams/:id" element={<TeamDetail />} />
              <Route path="/vote" element={<Vote />} />
              <Route path="/recap" element={<Recap />} />
              {isAdmin && <Route path="/admin" element={<Admin />} />}
            </Routes>
          )}
        </main>

        {/* Bottom nav */}
        <nav className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex safe-bottom">
          <NavItem to="/" icon="📅" label="Games" />
          <NavItem to="/standings" icon="🏆" label="Standings" />
          <NavItem to="/teams" icon="👥" label="Teams" />
          <NavItem to="/vote" icon="⭐" label="Vote" />
          {isAdmin && <NavItem to="/admin" icon="⚙️" label="Admin" />}
        </nav>
      </div>
    </AppContext.Provider>
  )
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-xs mt-0.5">{label}</span>
    </NavLink>
  )
}

function AdminModal({ onSubmit, onClose }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!onSubmit(pin)) {
      setError(true)
      setPin('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-xs animate-slide-up">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Admin Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => { setPin(e.target.value); setError(false) }}
            placeholder="Enter PIN"
            className={`input text-center text-2xl tracking-[0.5em] ${error ? 'input-error' : ''}`}
            autoFocus
          />
          {error && <p className="text-red-500 text-sm mt-2">Incorrect PIN</p>}
          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
