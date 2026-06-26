import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function translateError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('already been registered'))
    return 'Este email ya tiene una cuenta registrada'
  if (msg.includes('Password should') || msg.includes('password'))
    return 'La contraseña debe tener al menos 6 caracteres'
  if (msg.includes('invalid') || msg.includes('valid'))
    return 'Email inválido'
  if (msg.includes('rate limit') || msg.includes('too many'))
    return 'Demasiados intentos. Espera unos minutos.'
  return 'Error al crear la cuenta. Intenta de nuevo.'
}

export default function Register() {
  const { signUp } = useAuth()

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setLoading(true)
    const { error } = await signUp(email, password, name)
    setLoading(false)
    if (error) { setError(translateError(error.message)); return }
    setSuccess(true)
  }

  if (success) return (
    <div className="min-h-screen bg-[#111128] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-violet-500/10 border border-violet-500/20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✉️</div>
        <h2 className="text-2xl font-black text-white mb-3">¡Revisa tu email!</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-2">
          Enviamos un link de confirmación a <strong className="text-white">{email}</strong>.
        </p>
        <p className="text-gray-400 text-sm leading-relaxed mb-5">
          Haz clic en "Confirm your email" para activar tu cuenta. Si no lo ves,{' '}
          <strong className="text-violet-400">revisa la carpeta spam</strong>.
        </p>
        <div className="bg-[#1a1a36] border border-white/5 rounded-xl p-4 text-left mb-6 space-y-2">
          {['Abre tu bandeja de entrada', 'Busca email de "noreply@mail.app.supabase.io"', 'Haz clic en "Confirm your email"', 'Listo — ya puedes iniciar sesión'].map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
              <span className="text-violet-400 font-black shrink-0">{i + 1}.</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
        <Link to="/login" className="inline-block bg-violet-600 hover:bg-violet-500 text-white font-black px-6 py-3 rounded-xl transition-all">
          Ir a iniciar sesión
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#111128] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-black font-black text-base">PS</span>
            </div>
            <span className="text-white font-black text-2xl">PullStack</span>
          </Link>
          <h1 className="text-3xl font-black text-white mb-2">Únete a PullStack</h1>
          <p className="text-gray-500 text-sm">La plataforma de trading cards de LATAM</p>
        </div>

        <div className="bg-[#1a1a36] border border-white/5 rounded-2xl p-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1.5">Nombre</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                placeholder="Tu nombre"
                className="w-full bg-[#21213e] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="tu@email.com"
                className="w-full bg-[#21213e] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1.5">Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-[#21213e] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1.5">Confirmar contraseña</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                placeholder="••••••••"
                className="w-full bg-[#21213e] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-violet-500/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              Crear cuenta gratis
            </button>

            <p className="text-gray-600 text-xs text-center">
              Al registrarte aceptas nuestros{' '}
              <span className="text-violet-400 cursor-pointer">Términos de servicio</span>
              {' '}y{' '}
              <span className="text-violet-400 cursor-pointer">Política de privacidad</span>
            </p>
          </form>
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-400 font-bold transition-colors">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}
