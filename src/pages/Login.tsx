import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { LogoIcon } from '../components/Logo'

function translateSignInError(msg: string): { text: string; type: 'confirm' | 'credentials' | 'rate' | 'generic' } {
  if (msg.includes('not confirmed') || msg.includes('email_not_confirmed'))
    return { text: 'Confirma tu email antes de iniciar sesión. Revisa tu bandeja de entrada (y spam).', type: 'confirm' }
  if (msg.includes('Invalid login') || msg.includes('invalid_credentials'))
    return { text: 'Email o contraseña incorrectos.', type: 'credentials' }
  if (msg.includes('rate limit') || msg.includes('too many'))
    return { text: 'Demasiados intentos. Espera unos minutos.', type: 'rate' }
  return { text: 'Error al iniciar sesión. Intenta de nuevo.', type: 'generic' }
}

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || '/'

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const [errorType, setErrorType] = useState<'confirm' | 'credentials' | 'rate' | 'generic' | null>(null)
  const [loading, setLoading]     = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setErrorType(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      const translated = translateSignInError(error.message)
      setError(translated.text)
      setErrorType(translated.type)
      return
    }
    navigate(from, { replace: true })
  }

  const handleForgotPassword = async () => {
    if (!email) { setError('Ingresa tu email primero'); setErrorType('generic'); return }
    setError('')
    setErrorType(null)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetSent(true)
  }

  const handleResendConfirmation = async () => {
    if (!email) return
    await supabase.auth.resend({ type: 'signup', email })
    setResendSent(true)
  }

  return (
    <div className="min-h-screen bg-[#111128] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <LogoIcon size={40} />
            <span className="text-white font-black text-2xl">PullStack</span>
          </Link>
          <h1 className="text-3xl font-black text-white mb-2">Bienvenido de vuelta</h1>
          <p className="text-gray-500 text-sm">Inicia sesión para continuar en la plataforma</p>
        </div>

        <div className="bg-[#1a1a36] border border-white/5 rounded-2xl p-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="tu@email.com"
                className="w-full bg-[#21213e] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-gray-400 text-sm font-medium">Contraseña</label>
                <button type="button" onClick={handleForgotPassword}
                  className={`text-xs font-bold transition-colors ${resetSent ? 'text-green-400' : 'text-violet-400 hover:text-violet-400'}`}>
                  {resetSent ? '✓ Link enviado — revisa tu email' : '¿Olvidaste tu contraseña?'}
                </button>
              </div>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full bg-[#21213e] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 space-y-2">
                <p className="text-red-400 text-sm">{error}</p>
                {errorType === 'confirm' && (
                  <button type="button" onClick={handleResendConfirmation}
                    className={`text-xs font-bold transition-colors ${resendSent ? 'text-green-400' : 'text-violet-400 hover:text-violet-300 underline'}`}>
                    {resendSent ? '✓ Email reenviado' : 'Reenviar email de confirmación →'}
                  </button>
                )}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-violet-500/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              Iniciar sesión
            </button>
          </form>

          <div className="border-t border-white/5 pt-4">
            <p className="text-center text-gray-600 text-xs">
              ¿Problemas para entrar?{' '}
              <span className="text-gray-500">Revisa spam o usa "¿Olvidaste tu contraseña?"</span>
            </p>
          </div>
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-violet-400 hover:text-violet-400 font-bold transition-colors">Crear cuenta gratis</Link>
        </p>
      </div>
    </div>
  )
}
