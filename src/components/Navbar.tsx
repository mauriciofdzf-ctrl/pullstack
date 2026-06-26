import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const AVATAR_COLORS = [
  'from-violet-500 to-fuchsia-700',
  'from-purple-500 to-pink-600',
  'from-blue-500 to-cyan-600',
  'from-green-500 to-teal-600',
  'from-red-500 to-pink-600',
]
function getColor(str: string) {
  let h = 0; for (const c of str) h = c.charCodeAt(0) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, profile, isAdmin, signOut } = useAuth()

  const links = [
    { to: '/marketplace', label: 'Mercado' },
    { to: '/aprende',     label: 'Aprende' },
    { to: '/grading',     label: 'Grading',   grading: true },
    { to: '/live',        label: 'En Vivo',   live: true },
    { to: '/community',   label: 'Comunidad' },
    { to: '/raffles',     label: 'Rifas' },
    { to: '/messages',    label: 'Mensajes' },
  ]

  const isActive = (path: string) => location.pathname === path

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    setDropOpen(false)
    await signOut()
    navigate('/')
  }

  const initials = (profile?.display_name || user?.email || 'U').slice(0, 2).toUpperCase()
  const color = getColor(user?.id || 'x')

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#06060f]/95 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-white font-black text-sm">PS</span>
            </div>
            <span className="text-white font-black text-xl tracking-tight">PullStack</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {links.map((link) => (
              <Link key={link.to} to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  link.grading
                    ? isActive(link.to)
                      ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                      : 'text-violet-400 hover:bg-violet-500/10 border border-violet-500/20'
                    : isActive(link.to)
                    ? 'bg-violet-500/10 text-violet-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                {link.live && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right: auth */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {user ? (
              <div className="relative" ref={dropRef}>
                <button onClick={() => setDropOpen(!dropOpen)}
                  className="flex items-center gap-2.5 hover:bg-white/5 px-2 py-1.5 rounded-xl transition-all">
                  <div className={`w-8 h-8 rounded-lg overflow-hidden shadow-md ${profile?.avatar_url ? '' : `bg-gradient-to-br ${color} flex items-center justify-center text-white font-black text-xs`}`}>
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt={initials} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      : initials
                    }
                  </div>
                  <div className="text-left hidden xl:block">
                    <div className="text-white text-sm font-bold leading-tight">{profile?.display_name || 'Coleccionista'}</div>
                    {isAdmin && <div className="text-violet-400 text-[10px] font-bold">Admin</div>}
                  </div>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${dropOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-[#0e0e1e] border border-white/10 rounded-xl shadow-2xl py-1 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/5">
                      <div className="text-white font-bold text-sm truncate">{profile?.display_name || 'Coleccionista'}</div>
                      <div className="text-gray-500 text-xs truncate">{user.email}</div>
                    </div>
                    <button onClick={() => { setDropOpen(false); navigate('/profile') }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2.5">
                      <span>👤</span> Mi perfil
                    </button>
                    <button onClick={() => { setDropOpen(false); navigate('/wallet') }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2.5">
                      <span>🃏</span> Mi portfolio
                    </button>
                    <button onClick={() => { setDropOpen(false); navigate('/chat') }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2.5">
                      <span>💬</span> Chat en vivo
                    </button>
                    {isAdmin && (
                      <button onClick={() => { setDropOpen(false); navigate('/admin') }}
                        className="w-full text-left px-4 py-2.5 text-sm text-violet-400 hover:bg-violet-500/10 transition-colors flex items-center gap-2.5">
                        <span>⚙️</span> Admin Panel
                      </button>
                    )}
                    <button onClick={() => { setDropOpen(false); navigate('/messages') }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2.5">
                      <span>💬</span> Mensajes
                    </button>
                    <div className="border-t border-white/5 mt-1 pt-1">
                      <button onClick={handleSignOut}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2.5">
                        <span>🚪</span> Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="text-gray-400 hover:text-white text-sm font-medium transition-colors px-3 py-2">
                  Iniciar sesión
                </Link>
                <Link to="/register" className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-black px-4 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-violet-500/20">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="lg:hidden text-gray-400 hover:text-violet-400 transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-white/5 py-4 flex flex-col gap-1">
            {links.map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.to) ? 'bg-violet-500/10 text-violet-400' : 'text-gray-400 hover:text-white'
                }`}>
                {link.live && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
                {link.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-3 mt-1 border-t border-white/5">
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMenuOpen(false)}
                    className="flex-1 text-center bg-[#161628] border border-white/10 text-gray-300 text-sm font-bold py-2 rounded-lg">
                    Mi perfil
                  </Link>
                  <button onClick={() => { setMenuOpen(false); handleSignOut() }}
                    className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold py-2 rounded-lg">
                    Salir
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-white text-sm font-medium">Iniciar sesión</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-black px-4 py-2 rounded-lg">Crear cuenta</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
