import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const links = [
    { to: '/marketplace', label: 'Marketplace' },
    { to: '/shop', label: 'Tienda' },
    { to: '/live', label: 'En Vivo', live: true },
    { to: '/community', label: 'Comunidad' },
    { to: '/raffles', label: 'Rifas & Breaks' },
    { to: '/messages', label: 'Mensajes' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/30">
              <span className="text-black font-black text-sm">PS</span>
            </div>
            <span className="text-white font-black text-xl tracking-tight">PullStack</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.to)
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.live && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <button className="text-gray-400 hover:text-white text-sm font-medium transition-colors px-3 py-2">
              Iniciar sesión
            </button>
            <button className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-black px-4 py-2 rounded-lg transition-all hover:shadow-lg hover:shadow-amber-500/20">
              Crear cuenta
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden text-gray-400 hover:text-amber-400 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
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
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.to)
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.live && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}
                {link.label}
              </Link>
            ))}
            <div className="flex gap-3 pt-3 mt-1 border-t border-white/5">
              <button className="text-gray-400 hover:text-white text-sm font-medium">Iniciar sesión</button>
              <button className="bg-amber-500 hover:bg-amber-400 text-black text-sm font-black px-4 py-2 rounded-lg">Crear cuenta</button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
