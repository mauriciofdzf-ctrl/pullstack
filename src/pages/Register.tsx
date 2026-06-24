import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [gLoading, setGLoading] = useState(false)
  const [success, setSuccess]   = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    const { error } = await signUp(email, password, name)
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess(true)
  }

  const handleGoogle = async () => {
    setGLoading(true)
    const { error } = await signInWithGoogle()
    if (error) { setError('Error al conectar con Google'); setGLoading(false) }
  }

  if (success) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✉️</div>
        <h2 className="text-2xl font-black text-white mb-3">¡Revisa tu email!</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
          Te enviamos un link de confirmación a <strong className="text-white">{email}</strong>. Haz clic en el link para activar tu cuenta.
        </p>
        <Link to="/login" className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-black px-6 py-3 rounded-xl transition-all">
          Ir a iniciar sesión
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
              <span className="text-black font-black text-base">PS</span>
            </div>
            <span className="text-white font-black text-2xl">PullStack</span>
          </Link>
          <h1 className="text-3xl font-black text-white mb-2">Únete a PullStack</h1>
          <p className="text-gray-500 text-sm">La plataforma de trading cards de LATAM</p>
        </div>

        <div className="bg-[#111] border border-white/5 rounded-2xl p-8 space-y-5">
          {/* Google */}
          <button onClick={handleGoogle} disabled={gLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-4 rounded-xl transition-all hover:shadow-lg disabled:opacity-60">
            {gLoading
              ? <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              : <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            }
            Registrarse con Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-gray-600 text-xs">o con email</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1.5">Nombre</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                placeholder="Tu nombre"
                className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="tu@email.com"
                className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1.5">Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1.5">Confirmar contraseña</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                placeholder="••••••••"
                className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              Crear cuenta gratis
            </button>

            <p className="text-gray-600 text-xs text-center">
              Al registrarte aceptas nuestros{' '}
              <span className="text-amber-500 cursor-pointer">Términos de servicio</span>
              {' '}y{' '}
              <span className="text-amber-500 cursor-pointer">Política de privacidad</span>
            </p>
          </form>
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-amber-500 hover:text-amber-400 font-bold transition-colors">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
