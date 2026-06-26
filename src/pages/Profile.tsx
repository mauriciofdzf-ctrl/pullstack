import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const AVATAR_COLORS = [
  'from-amber-500 to-orange-600',
  'from-purple-500 to-pink-600',
  'from-blue-500 to-cyan-600',
  'from-green-500 to-teal-600',
  'from-red-500 to-pink-600',
]

function getColor(str: string) {
  let h = 0; for (const c of str) h = c.charCodeAt(0) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}


const ACTIVITY = [
  { type: 'bid',     desc: 'Pujaste en Topps Basketball Hobby Box',          time: 'hace 2h',   amount: '$380' },
  { type: 'raffle',  desc: 'Compraste 3 tickets — Rifa Cooper Flagg RC Auto', time: 'hace 1d',   amount: '$75' },
  { type: 'market',  desc: 'Guardaste en favoritos: Lamine Yamal Refractor',  time: 'hace 2d',   amount: null },
  { type: 'comment', desc: 'Comentaste en la comunidad: "Esa Prizm está 🔥"', time: 'hace 3d',   amount: null },
]

export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [editing, setEditing]         = useState(false)
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [bio, setBio]                 = useState(profile?.bio || '')
  const [saving, setSaving]           = useState(false)
  const [activeTab, setActiveTab]     = useState<'activity' | 'collection' | 'settings'>('activity')
  const [avatarEdit, setAvatarEdit]   = useState(false)
  const [avatarUrl, setAvatarUrl]     = useState(profile?.avatar_url || '')
  const [avatarSaving, setAvatarSaving] = useState(false)
  const [avatarPreviewError, setAvatarPreviewError] = useState(false)

  useEffect(() => {
    setDisplayName(profile?.display_name || '')
    setBio(profile?.bio || '')
    setAvatarUrl(profile?.avatar_url || '')
  }, [profile])

  const handleSaveAvatar = async () => {
    if (!user) return
    setAvatarSaving(true)
    await supabase.from('profiles').update({ avatar_url: avatarUrl.trim() || null }).eq('id', user.id)
    await refreshProfile()
    setAvatarSaving(false)
    setAvatarEdit(false)
  }

  const initials = (profile?.display_name || user?.email || 'U').slice(0, 2).toUpperCase()
  const color = getColor(user?.id || 'x')

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    await supabase.from('profiles').update({ display_name: displayName, bio }).eq('id', user.id)
    await refreshProfile()
    setSaving(false)
    setEditing(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">

        {/* Header card */}
        <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden mb-6">
          {/* Banner */}
          <div className={`h-32 bg-gradient-to-r ${color} opacity-30`} />

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-4">
              {/* Avatar */}
              <div className="relative group">
                {profile?.avatar_url ? (
                  <div className="w-24 h-24 rounded-2xl border-4 border-[#111] shadow-xl overflow-hidden">
                    <img src={profile.avatar_url} alt={initials} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                ) : (
                  <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-3xl font-black text-white border-4 border-[#111] shadow-xl`}>
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => setAvatarEdit(true)}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-500 hover:bg-amber-400 rounded-full flex items-center justify-center text-black transition-all shadow-lg opacity-0 group-hover:opacity-100"
                  title="Cambiar foto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>

              <div className="flex gap-2 mt-4">
                {!editing ? (
                  <button onClick={() => setEditing(true)}
                    className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 hover:border-amber-500/30 text-gray-300 hover:text-amber-400 px-4 py-2 rounded-lg text-sm font-bold transition-all">
                    ✏️ Editar perfil
                  </button>
                ) : (
                  <>
                    <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-400 border border-white/10 hover:border-white/20 transition-all">Cancelar</button>
                    <button onClick={handleSave} disabled={saving}
                      className="px-4 py-2 rounded-lg text-sm font-bold bg-amber-500 hover:bg-amber-400 text-black transition-all disabled:opacity-60 flex items-center gap-1.5">
                      {saving && <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                      Guardar
                    </button>
                  </>
                )}
              </div>
            </div>

            {editing ? (
              <div className="space-y-3">
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500/50" />
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                  placeholder="Cuéntanos sobre tu colección..."
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500/50 resize-none" />
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-white font-black text-2xl">{profile?.display_name || 'Coleccionista'}</h1>
                  {profile?.role === 'admin' && (
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">Admin</span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mb-2">@{profile?.username || user?.email?.split('@')[0]}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{profile?.bio || 'Sin bio todavía — edita tu perfil para agregar una.'}</p>
              </div>
            )}

            {/* Stats row */}
            <div className="flex gap-6 mt-4 pt-4 border-t border-white/5">
              {[{ n: 0, label: 'Cartas' }, { n: 0, label: 'Compras' }, { n: 0, label: 'Rifas' }].map((s) => (
                <div key={s.label}>
                  <div className="text-white font-black text-xl">{s.n}</div>
                  <div className="text-gray-600 text-xs">{s.label}</div>
                </div>
              ))}
              <div className="ml-auto text-right">
                <div className="text-gray-600 text-xs">Miembro desde</div>
                <div className="text-gray-400 text-xs font-bold">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es', { month: 'long', year: 'numeric' }) : '—'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#111] border border-white/5 rounded-xl p-1">
          {(['activity', 'collection', 'settings'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all capitalize ${activeTab === tab ? 'bg-amber-500 text-black' : 'text-gray-500 hover:text-gray-300'}`}>
              {tab === 'activity' ? 'Actividad' : tab === 'collection' ? 'Colección' : 'Ajustes'}
            </button>
          ))}
        </div>

        {/* Activity */}
        {activeTab === 'activity' && (
          <div className="bg-[#111] border border-white/5 rounded-2xl divide-y divide-white/5">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="w-9 h-9 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-lg shrink-0">
                  {a.type === 'bid' ? '🔥' : a.type === 'raffle' ? '🎟️' : a.type === 'market' ? '❤️' : '💬'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">{a.desc}</p>
                  <p className="text-gray-600 text-xs mt-0.5">{a.time}</p>
                </div>
                {a.amount && <span className="text-amber-400 font-black text-sm shrink-0">{a.amount}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Collection */}
        {activeTab === 'collection' && (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🃏</div>
            <h3 className="text-white font-bold text-lg mb-2">Mi Colección</h3>
            <p className="text-gray-500 text-sm mb-6">Gestiona todas las cartas que has guardado, ve su valor estimado total y filtra por deporte.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button onClick={() => navigate('/wallet')} className="bg-amber-500 hover:bg-amber-400 text-black font-black px-6 py-2.5 rounded-xl transition-all text-sm">
                Ver mi colección completa
              </button>
              <button onClick={() => navigate('/marketplace')} className="bg-[#1a1a1a] border border-white/10 hover:border-amber-500/30 text-gray-300 font-bold px-6 py-2.5 rounded-xl transition-all text-sm">
                Explorar cartas
              </button>
            </div>
          </div>
        )}

        {/* Modal avatar */}
        {avatarEdit && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-4">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-white font-black text-lg mb-4">Cambiar foto de perfil</h3>

              <div className="mb-4">
                <label className="block text-gray-400 text-sm font-medium mb-1.5">URL de la imagen</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => { setAvatarUrl(e.target.value); setAvatarPreviewError(false) }}
                  placeholder="https://... (Unsplash, Cloudinary, Imgur)"
                  className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-500/50 font-mono"
                />
              </div>

              {avatarUrl && !avatarPreviewError && (
                <div className="mb-4 flex justify-center">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-500/30">
                    <img
                      src={avatarUrl}
                      alt="preview"
                      className="w-full h-full object-cover"
                      onError={() => setAvatarPreviewError(true)}
                    />
                  </div>
                </div>
              )}
              {avatarPreviewError && (
                <p className="text-red-400 text-xs mb-4 text-center">URL inválida o imagen no accesible</p>
              )}

              <p className="text-gray-600 text-xs mb-4">Usa imágenes de Unsplash, Cloudinary o Imgur. Google Drive y WhatsApp no funcionan.</p>

              <div className="flex gap-3">
                <button onClick={() => setAvatarEdit(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-gray-400 border border-white/10 hover:border-white/20 transition-all">
                  Cancelar
                </button>
                {avatarUrl && (
                  <button
                    onClick={() => { setAvatarUrl(''); handleSaveAvatar() }}
                    className="py-2.5 px-3 rounded-xl text-sm font-bold text-gray-500 border border-white/10 hover:text-red-400 hover:border-red-500/30 transition-all"
                    title="Quitar foto"
                  >
                    ✕
                  </button>
                )}
                <button
                  onClick={handleSaveAvatar}
                  disabled={avatarSaving || avatarPreviewError}
                  className="flex-1 py-2.5 rounded-xl text-sm font-black bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-60 transition-all flex items-center justify-center gap-1.5"
                >
                  {avatarSaving && <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="text-white font-bold">Cuenta</h3>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                  <p className="text-white text-sm font-medium">Email</p>
                  <p className="text-gray-500 text-xs">{user?.email}</p>
                </div>
                <span className="text-xs text-gray-600 bg-[#1a1a1a] px-2 py-1 rounded-lg">Verificado</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white text-sm font-medium">Contraseña</p>
                  <p className="text-gray-500 text-xs">Cambia tu contraseña</p>
                </div>
                <button className="text-amber-500 hover:text-amber-400 text-xs font-bold transition-colors">Cambiar</button>
              </div>
            </div>

            {profile?.role === 'admin' && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                <h3 className="text-amber-400 font-bold mb-1">Panel de Administrador</h3>
                <p className="text-gray-500 text-sm mb-4">Tienes acceso completo a la plataforma.</p>
                <button onClick={() => navigate('/admin')} className="bg-amber-500 hover:bg-amber-400 text-black font-black px-4 py-2 rounded-lg text-sm transition-all">
                  Ir al Admin Panel →
                </button>
              </div>
            )}

            <div className="bg-[#111] border border-red-500/10 rounded-2xl p-6">
              <h3 className="text-red-400 font-bold mb-1">Cerrar sesión</h3>
              <p className="text-gray-500 text-sm mb-4">Se cerrará tu sesión en este dispositivo.</p>
              <button onClick={handleSignOut} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold px-4 py-2 rounded-lg text-sm transition-all">
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
