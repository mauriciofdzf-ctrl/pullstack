import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  IMAGE_SECTIONS, getOverrides, saveImage, resetImages,
  IMAGE_DEFAULTS, IMAGE_LABELS, type ImageKey,
} from '../lib/imageConfig'

// ─── Tipos ────────────────────────────────────────────────────────────────────
type AdminUser    = { id: string; display_name: string | null; role: string; created_at: string }
type AdminListing = { id: number; user_id: string; display_name: string; title: string; sport: string; txn_type: string; price: string | null; active: boolean; created_at: string }
type AdminOrder   = { id: number; contact_name: string; total: string; status: string; created_at: string }

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent }: { label: string; value: number | string; icon: string; accent: string }) {
  return (
    <div className={`bg-[#1a1a36] border ${accent} rounded-2xl p-5 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-black text-white tabular-nums">{value}</span>
      </div>
      <p className="text-gray-500 text-xs font-medium">{label}</p>
    </div>
  )
}

function ImageSlot({ imgKey }: { imgKey: ImageKey }) {
  const overrides = getOverrides()
  const isCustom   = imgKey in overrides
  const base       = isCustom ? overrides[imgKey]! : IMAGE_DEFAULTS[imgKey]
  const [input,   setInput]   = useState(base)
  const [preview, setPreview] = useState(base)
  const [saved,   setSaved]   = useState(false)
  const [err,     setErr]     = useState(false)
  const [custom,  setCustom]  = useState(isCustom)

  const save = () => {
    if (!input.trim()) return
    saveImage(imgKey, input.trim()); setCustom(true); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  const reset = () => {
    const o = getOverrides(); delete o[imgKey]
    localStorage.setItem('pullstack_images_v1', JSON.stringify(o))
    setInput(IMAGE_DEFAULTS[imgKey]); setPreview(IMAGE_DEFAULTS[imgKey])
    setCustom(false); setErr(false)
  }

  return (
    <div className={`bg-[#16162e] rounded-2xl overflow-hidden border transition-all ${custom ? 'border-violet-500/40' : 'border-white/5'}`}>
      <div className="relative h-40 bg-[#1a1a36]">
        {err
          ? <div className="w-full h-full flex items-center justify-center text-gray-700"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
          : <img key={preview} src={preview} alt={IMAGE_LABELS[imgKey]} className="w-full h-full object-cover" onError={() => setErr(true)} />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        {custom && <span className="absolute top-2 right-2 bg-violet-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">✓ Custom</span>}
        <span className="absolute bottom-2 left-3 text-white text-xs font-bold drop-shadow">{IMAGE_LABELS[imgKey]}</span>
      </div>
      <div className="p-3 space-y-2">
        <input type="text" value={input}
          onChange={e => { setInput(e.target.value); setPreview(e.target.value); setErr(false) }}
          placeholder="https://... URL pública de imagen"
          className="w-full bg-[#1a1a36] border border-white/10 text-white placeholder-gray-700 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-violet-500/50 font-mono"
        />
        <div className="flex gap-2">
          <button onClick={save} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${saved ? 'bg-green-500 text-white' : 'bg-violet-600 hover:bg-violet-500 text-white'}`}>
            {saved ? '✓ Guardado' : 'Guardar'}
          </button>
          {custom && <button onClick={reset} className="px-3 py-2 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5 transition-all">↩ Reset</button>}
        </div>
      </div>
    </div>
  )
}

// ─── SQL de configuración ─────────────────────────────────────────────────────
const SETUP_SQL = `-- 1. Tu cuenta como admin
update profiles set role = 'admin'
  where id = (select id from auth.users where email = 'mauriciofdzf@gmail.com');

-- 2. Admins pueden ver todos los perfiles
create policy "admins_see_profiles" on profiles
  for select using ((select role from profiles where id = auth.uid()) = 'admin');

-- 3. Admins gestionan todos los anuncios
create policy "admins_manage_listings" on listings
  for all using ((select role from profiles where id = auth.uid()) = 'admin');

-- 4. Admins gestionan todos los pedidos
create policy "admins_manage_orders" on orders
  for all using ((select role from profiles where id = auth.uid()) = 'admin');`

const ORDER_STATUS  = ['pending','confirmed','paid','shipped','delivered','cancelled']
const STATUS_CSS: Record<string, string> = {
  pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  paid:      'bg-violet-600/15 text-violet-400 border-violet-500/30',
  shipped:   'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
}
const TXN_CSS: Record<string, string> = {
  sale:    'text-emerald-400',
  auction: 'text-red-400',
  trade:   'text-blue-400',
}

type Tab = 'overview' | 'users' | 'listings' | 'orders' | 'images'

// ─── Panel principal ──────────────────────────────────────────────────────────
export default function Admin() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')
  const [copied, setCopied] = useState(false)

  // Stats
  const [stats, setStats] = useState({ users: 0, listings: 0, orders: 0, grading: 0 })

  // Users
  const [users, setUsers]           = useState<AdminUser[]>([])
  const [usersLoading, setUL]       = useState(false)
  const [userSearch, setUserSearch] = useState('')

  // Listings
  const [listings, setListings]     = useState<AdminListing[]>([])
  const [listingsLoading, setLL]    = useState(false)

  // Orders
  const [orders, setOrders]         = useState<AdminOrder[]>([])
  const [ordersLoading, setOL]      = useState(false)

  // Images
  const [imgSection, setImgSection]   = useState(IMAGE_SECTIONS[0].label)
  const [overridesCount, setOvCount]  = useState(Object.keys(getOverrides()).length)
  const [resetDone, setResetDone]     = useState(false)

  useEffect(() => { loadStats() }, [])

  useEffect(() => {
    if (tab === 'users')    loadUsers()
    if (tab === 'listings') loadListings()
    if (tab === 'orders')   loadOrders()
  }, [tab])

  const loadStats = async () => {
    const [u, l, o, g] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('grading_submissions').select('id', { count: 'exact', head: true }),
    ])
    setStats({ users: u.count || 0, listings: l.count || 0, orders: o.count || 0, grading: g.count || 0 })
  }

  const loadUsers = async () => {
    setUL(true)
    const { data } = await supabase.from('profiles').select('id, display_name, role, created_at').order('created_at', { ascending: false }).limit(200)
    setUsers((data || []) as AdminUser[])
    setUL(false)
  }

  const setUserRole = async (id: string, role: 'user' | 'admin') => {
    await supabase.from('profiles').update({ role }).eq('id', id)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
  }

  const loadListings = async () => {
    setLL(true)
    const { data } = await supabase.from('listings').select('id, user_id, display_name, title, sport, txn_type, price, active, created_at').order('created_at', { ascending: false }).limit(300)
    setListings((data || []) as AdminListing[])
    setLL(false)
  }

  const deleteListing = async (id: number) => {
    if (!confirm('¿Eliminar este anuncio?')) return
    await supabase.from('listings').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.id !== id))
  }

  const toggleListing = async (id: number, active: boolean) => {
    await supabase.from('listings').update({ active }).eq('id', id)
    setListings(prev => prev.map(l => l.id === id ? { ...l, active } : l))
  }

  const loadOrders = async () => {
    setOL(true)
    const { data } = await supabase.from('orders').select('id, contact_name, total, status, created_at').order('created_at', { ascending: false }).limit(300)
    setOrders((data || []) as AdminOrder[])
    setOL(false)
  }

  const updateOrderStatus = async (id: number, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  const copySQL = () => {
    navigator.clipboard.writeText(SETUP_SQL)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const filteredUsers = users.filter(u =>
    !userSearch || (u.display_name || '').toLowerCase().includes(userSearch.toLowerCase())
  )

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview',  label: 'Resumen',   icon: '📊' },
    { id: 'users',     label: 'Usuarios',  icon: '👥' },
    { id: 'listings',  label: 'Anuncios',  icon: '🏷️' },
    { id: 'orders',    label: 'Pedidos',   icon: '📦' },
    { id: 'images',    label: 'Imágenes',  icon: '🖼️' },
  ]

  return (
    <div className="min-h-screen bg-[#111128] pt-20 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Admin</span>
            <span className="text-gray-600 text-xs">PullStack · Panel de Control</span>
          </div>
          <h1 className="text-3xl font-black text-white">Panel Admin</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestión completa de la plataforma</p>
        </div>

        {/* SQL setup notice */}
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-xl shrink-0 mt-0.5">⚠️</span>
              <div>
                <p className="text-yellow-300 font-bold text-sm mb-1">Primera vez: ejecuta este SQL en Supabase → SQL Editor</p>
                <pre className="text-[10px] text-gray-400 bg-black/30 rounded-lg p-3 overflow-x-auto whitespace-pre leading-relaxed">{SETUP_SQL}</pre>
              </div>
            </div>
            <button onClick={copySQL} className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${copied ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10'}`}>
              {copied ? '✓ Copiado' : '📋 Copiar'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
                tab === t.id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-[#1a1a36] border border-white/10 text-gray-400 hover:border-violet-500/30 hover:text-violet-400'
              }`}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Usuarios"         value={stats.users}    icon="👤" accent="border-violet-500/20" />
              <StatCard label="Anuncios activos" value={stats.listings}  icon="🏷️" accent="border-blue-500/20" />
              <StatCard label="Pedidos totales"  value={stats.orders}   icon="📦" accent="border-emerald-500/20" />
              <StatCard label="Grading requests" value={stats.grading}  icon="🔬" accent="border-yellow-500/20" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-[#1a1a36] border border-white/5 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-4 text-sm">Accesos rápidos</h3>
                <div className="space-y-2">
                  {TABS.filter(t => t.id !== 'overview').map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className="w-full text-left px-4 py-2.5 bg-white/3 hover:bg-violet-600/10 border border-white/5 hover:border-violet-500/30 rounded-xl text-sm text-gray-400 hover:text-white transition-all flex items-center gap-2.5">
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                      <svg className="w-3.5 h-3.5 ml-auto opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#1a1a36] border border-white/5 rounded-2xl p-5">
                <h3 className="text-white font-bold mb-4 text-sm">Tu sesión actual</h3>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-black text-sm shrink-0">M</div>
                  <div>
                    <p className="text-white font-bold text-sm">Mauricio Fernández</p>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">👑 Propietario · Admin</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <p className="font-mono">ID: {user?.id?.slice(0, 20)}...</p>
                  <p>Email: mauriciofdzf@gmail.com</p>
                </div>
                <button onClick={() => navigate('/')} className="mt-4 w-full text-xs font-bold py-2 rounded-xl bg-white/3 hover:bg-white/6 border border-white/8 text-gray-500 hover:text-gray-300 transition-all">
                  ← Ir a la app
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── USUARIOS ── */}
        {tab === 'users' && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-1 max-w-sm">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="Buscar usuario..."
                  className="w-full bg-[#1a1a36] border border-white/10 text-white placeholder-gray-600 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-violet-500/50" />
              </div>
              <span className="text-gray-600 text-sm shrink-0">{filteredUsers.length} usuarios</span>
            </div>

            {usersLoading
              ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/></div>
              : filteredUsers.length === 0
              ? <div className="text-center py-16"><p className="text-5xl mb-3">👥</p><p className="text-gray-500 text-sm">Sin datos — ejecuta el SQL de configuración primero</p></div>
              : (
                <div className="space-y-2">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="flex items-center gap-3 bg-[#1a1a36] border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition-all">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${u.role === 'admin' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white' : 'bg-white/5 text-gray-500'}`}>
                        {(u.display_name || 'U').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{u.display_name || 'Sin nombre'}</p>
                        <p className="text-gray-700 text-[10px] font-mono">{u.id.slice(0, 14)}...</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${u.role === 'admin' ? 'bg-red-500/15 border-red-500/30 text-red-400' : 'bg-white/5 border-white/10 text-gray-500'}`}>
                          {u.role === 'admin' ? '👑 Admin' : 'Usuario'}
                        </span>
                        {u.id !== user?.id && (
                          <button onClick={() => setUserRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10 text-gray-500 hover:border-violet-500/30 hover:text-violet-400 transition-all">
                            {u.role === 'admin' ? '↓ Quitar' : '↑ Admin'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* ── ANUNCIOS ── */}
        {tab === 'listings' && (
          <div>
            <p className="text-gray-600 text-sm mb-5">{listings.length} anuncios cargados</p>
            {listingsLoading
              ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/></div>
              : listings.length === 0
              ? <div className="text-center py-16"><p className="text-5xl mb-3">🏷️</p><p className="text-gray-500 text-sm">Sin datos — ejecuta el SQL de configuración primero</p></div>
              : (
                <div className="space-y-2">
                  {listings.map(l => (
                    <div key={l.id} className={`flex items-center gap-3 bg-[#1a1a36] border rounded-xl px-4 py-3 transition-all ${l.active ? 'border-white/5' : 'border-red-500/10 opacity-50'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{l.title}</p>
                        <p className="text-gray-600 text-[10px]">
                          {l.display_name} · {l.sport} ·
                          <span className={` font-bold ml-1 ${TXN_CSS[l.txn_type] || 'text-gray-400'}`}>{l.txn_type}</span>
                          {l.price && <span className="text-emerald-400 font-bold ml-2">{l.price}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${l.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                          {l.active ? '● Activo' : '○ Pausado'}
                        </span>
                        <button onClick={() => toggleListing(l.id, !l.active)}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/10 text-gray-500 hover:border-white/20 hover:text-white transition-all">
                          {l.active ? 'Pausar' : 'Activar'}
                        </button>
                        <button onClick={() => deleteListing(l.id)}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all">
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* ── PEDIDOS ── */}
        {tab === 'orders' && (
          <div>
            <p className="text-gray-600 text-sm mb-5">{orders.length} pedidos</p>
            {ordersLoading
              ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/></div>
              : orders.length === 0
              ? <div className="text-center py-16"><p className="text-5xl mb-3">📦</p><p className="text-gray-500 text-sm">Sin pedidos — ejecuta el SQL de configuración para verlos</p></div>
              : (
                <div className="space-y-2">
                  {orders.map(o => (
                    <div key={o.id} className="bg-[#1a1a36] border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition-all flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{o.contact_name || 'Sin nombre'}</p>
                        <p className="text-gray-600 text-[10px]">Pedido #{o.id} · <span className="text-emerald-400 font-bold">{o.total}</span></p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CSS[o.status] || STATUS_CSS.pending}`}>
                          {o.status}
                        </span>
                        <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}
                          className="bg-[#21213e] border border-white/10 text-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none cursor-pointer">
                          {ORDER_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* ── IMÁGENES ── */}
        {tab === 'images' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-gray-600 text-sm">{overridesCount} imágenes personalizadas</p>
              <button onClick={() => { if (!confirm('¿Resetear TODAS las imágenes?')) return; resetImages(); setResetDone(true); setOvCount(0); setTimeout(() => setResetDone(false), 2500) }}
                className={`text-xs font-bold px-4 py-2 rounded-lg border transition-all ${resetDone ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'border-white/10 text-gray-500 hover:border-red-500/30 hover:text-red-400'}`}>
                {resetDone ? '✓ Reseteado' : '↩ Reset todo'}
              </button>
            </div>
            <div className="flex gap-2 flex-wrap mb-6">
              {IMAGE_SECTIONS.map(s => {
                const cnt = s.keys.filter(k => k in getOverrides()).length
                return (
                  <button key={s.label} onClick={() => setImgSection(s.label)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${imgSection === s.label ? 'bg-violet-600 text-white' : 'bg-[#1a1a36] border border-white/10 text-gray-400 hover:border-violet-500/30 hover:text-violet-400'}`}>
                    {s.label}{cnt > 0 && <span className="ml-1.5 text-[10px] opacity-70">{cnt}✓</span>}
                  </button>
                )
              })}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {IMAGE_SECTIONS.find(s => s.label === imgSection)!.keys.map(k => <ImageSlot key={k} imgKey={k} />)}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
