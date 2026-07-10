import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [tokenReady, setTokenReady] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setTokenReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6)  { setError('Mínimo 6 caracteres'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError('Link inválido o expirado. Solicita uno nuevo.'); return }
    setSuccess(true)
    setTimeout(() => navigate('/login'), 3500)
  }

  if (success) return (
    <div className="min-h-screen bg-[#0c0a1e] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✓</div>
        <h2 className="text-2xl font-black text-white mb-3">¡Contraseña actualizada!</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-2">Tu nueva contraseña está activa. Redirigiendo al login...</p>
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mt-4" />
      </div>
    </div>
  )

  if (!tokenReady) return (
    <div className="min-h-screen bg-[#0c0a1e] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-gray-400 text-sm">Verificando link de recuperación...</p>
        <p className="text-gray-600 text-xs mt-3">
          Si esto tarda más de 5 segundos,{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-400">vuelve al login</Link>
          {' '}y solicita un nuevo link.
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0c0a1e] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-black font-black text-base">PS</span>
            </div>
            <span className="text-white font-black text-2xl">PullStack</span>
          </Link>
          <h1 className="text-3xl font-black text-white mb-2">Nueva contraseña</h1>
          <p className="text-gray-500 text-sm">Elige una contraseña segura para tu cuenta</p>
        </div>

        <div className="bg-[#1c1835] border border-white/5 rounded-2xl p-8 space-y-5">
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1.5">Nueva contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-[#26213d] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-1.5">Confirmar contraseña</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                placeholder="••••••••"
                className="w-full bg-[#26213d] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-violet-500/20 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              Guardar nueva contraseña
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          <Link to="/login" className="text-violet-400 hover:text-violet-400 font-bold transition-colors">← Volver al login</Link>
        </p>
      </div>
    </div>
  )
}
