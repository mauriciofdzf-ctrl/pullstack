import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { CATALOG } from '../lib/catalog'
import { IMAGE_DEFAULTS, IMAGE_LABELS, IMAGE_SECTIONS, type ImageKey, loadImageOverridesFromDB, saveImageOverridesToDB } from '../lib/imageConfig'

// ─── Tipos ────────────────────────────────────────────────────────────────────
type AdminUser    = { id: string; display_name: string | null; role: string; created_at: string }
type AdminListing = { id: number; user_id: string; display_name: string; title: string; sport: string; txn_type: string; price: string | null; active: boolean; created_at: string }
type AdminOrder   = { id: number; contact_name: string; total: string; status: string; created_at: string }
type AdminTxn     = { id: number; buyer_name: string; seller_name: string; listing_title: string; sale_price: string; commission_pct: number; commission_amt: number; total_paid: number; payment_method: string; payment_reference: string; status: string; created_at: string; tracking_number: string | null; tracking_carrier: string | null; tracking_url: string | null; estimated_delivery: string | null }
type AdminMessage = { id: number; user_id: string; content: string; from_admin: boolean; created_at: string }
type AdminDM      = { id: number; from_user_id: string; to_user_id: string; from_name: string; to_name: string; content: string; listing_title: string | null; action_type: string; created_at: string; read: boolean }

// ─── Tipos ────────────────────────────────────────────────────────────────────
type TrendingItem = { player: string; detail: string; team: string; grade: string; price: string; change: string; sport: string; img: string }
const BLANK_TRENDING: TrendingItem = { player: '', detail: '', team: '', grade: '', price: '', change: '', sport: '⚽ Soccer', img: '' }

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function StatCard({ label, value, icon, accent }: { label: string; value: number | string; icon: string; accent: string }) {
  return (
    <div className={`bg-[#1c1835] border ${accent} rounded-2xl p-5 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-black text-white tabular-nums">{value}</span>
      </div>
      <p className="text-gray-500 text-xs font-medium">{label}</p>
    </div>
  )
}


const ORDER_STATUS  = ['pending','confirmed','paid','shipped','delivered','cancelled']
const TXN_STATUS    = ['pending','verified','completed','cancelled']
const TXN_STATUS_CSS: Record<string, string> = {
  pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  verified:  'bg-blue-500/15 text-blue-400 border-blue-500/30',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
}
const TXN_STATUS_LABEL: Record<string, string> = {
  pending:   '⏳ Pendiente',
  verified:  '✅ Verificado',
  completed: '🎉 Completado',
  cancelled: '❌ Cancelado',
}
const METHOD_LABEL: Record<string, string> = {
  spei: '🏦 SPEI',
  mercadopago: '💳 MercadoPago',
  oxxo: '🏪 OXXO',
  tarjeta: '💰 Tarjeta',
}
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

type Tab = 'overview' | 'users' | 'listings' | 'orders' | 'transactions' | 'pagos' | 'mensajes' | 'catalog' | 'landing'

// ─── Panel principal ──────────────────────────────────────────────────────────
export default function Admin() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')

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

  // Transactions
  const [txns, setTxns]             = useState<AdminTxn[]>([])
  const [txnsLoading, setTL]        = useState(false)
  const [trackingOpen, setTrackingOpen] = useState<number | null>(null)
  const [trackingForm, setTrackingForm] = useState({ tracking_number: '', tracking_carrier: '', tracking_url: '', estimated_delivery: '' })
  const [trackingSaving, setTrackingSaving] = useState(false)

  // Catalog visibility
  const [showCatalog, setShowCatalog] = useState(true)
  const [catalogSaving, setCatalogSaving] = useState(false)

  // Catalog hidden items
  const [hiddenIds,      setHiddenIds]      = useState<Set<number>>(new Set())
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogFilter,  setCatalogFilter]  = useState('Todos')

  // Catalog extra items (admin-added)
  type ExtraItem = { id: number; name: string; detail: string; sport: string; kind: string; txn: string; price: string; sub: string; brand: string; grade: string; badge: string; imageUrl: string; imgKey: string }
  const BLANK_EXTRA: Omit<ExtraItem, 'id'> = { name: '', detail: '', sport: 'NBA', kind: 'card', txn: 'sale', price: '', sub: '', brand: '', grade: '', badge: '', imageUrl: '', imgKey: 'nba1' }
  const [extraItems,   setExtraItems]   = useState<ExtraItem[]>([])
  const [showAddForm,  setShowAddForm]  = useState(false)
  const [addForm,      setAddForm]      = useState(BLANK_EXTRA)
  const [addSaving,    setAddSaving]    = useState(false)

  // Messages
  const [msgs,       setMsgs]      = useState<AdminMessage[]>([])
  const [dms,        setDms]       = useState<AdminDM[]>([])
  const [msgsLoading, setML]       = useState(false)
  const [msgTab,     setMsgTab]    = useState<'support' | 'dms'>('support')

  // Landing tab
  const [landingSubTab, setLandingSubTab] = useState<'trending' | 'images'>('trending')
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([])
  const [trendingLoading, setTrendingLoading] = useState(false)
  const [trendingSaved, setTrendingSaved] = useState(false)
  const [showTrendingForm, setShowTrendingForm] = useState(false)
  const [trendingForm, setTrendingForm] = useState<TrendingItem>(BLANK_TRENDING)
  const [editTrendingIdx, setEditTrendingIdx] = useState<number | null>(null)
  const [imageOverrides, setImageOverrides] = useState<Partial<Record<ImageKey, string>>>({})
  const [imageSaved, setImageSaved] = useState(false)
  const [imageSaving, setImageSaving] = useState(false)

  // Pagos config
  const [payConfig, setPayConfig] = useState({
    spei_banco: '', spei_clabe: '', spei_beneficiario: 'PullStackMX',
    mp_usuario: '', mp_link: '',
    oxxo_link: '',
    tarjeta_link: '',
  })
  const [payLoading, setPL]   = useState(false)
  const [paySaved, setPaySaved] = useState(false)

  useEffect(() => { loadStats() }, [])

  useEffect(() => {
    if (tab === 'users')        loadUsers()
    if (tab === 'listings')     loadListings()
    if (tab === 'orders')       loadOrders()
    if (tab === 'transactions') loadTxns()
    if (tab === 'pagos')        loadPayConfig()
    if (tab === 'mensajes')     loadMessages()
    if (tab === 'catalog')      loadCatalogHidden()
    if (tab === 'landing')      loadLanding()
  }, [tab])

  const loadStats = async () => {
    const [u, l, o, t] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('transactions').select('commission_amt').eq('status', 'completed'),
    ])
    const totalCommission = (t.data || []).reduce((s, r) => s + (r.commission_amt || 0), 0)
    setStats({ users: u.count || 0, listings: l.count || 0, orders: o.count || 0, grading: totalCommission })
  }

  const loadUsers = async () => {
    setUL(true)
    const { data } = await supabase.from('profiles').select('id, display_name, role, created_at').order('created_at', { ascending: false }).limit(200)
    setUsers((data || []) as AdminUser[])
    setUL(false)
  }

  const setUserRole = async (id: string, role: 'user' | 'admin') => {
    const { error } = await supabase.rpc('set_user_role', { target_id: id, new_role: role })
    if (error) { alert('Error: ' + error.message); return }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
  }

  const deleteUser = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la cuenta de "${name}"? Esta acción no se puede deshacer.`)) return
    const { error } = await supabase.rpc('delete_user', { target_id: id })
    if (error) { alert('Error: ' + error.message); return }
    setUsers(prev => prev.filter(u => u.id !== id))
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

  const deleteOrder = async (id: number) => {
    if (!confirm('¿Eliminar este pedido? Esta acción no se puede deshacer.')) return
    await supabase.from('orders').delete().eq('id', id)
    setOrders(prev => prev.filter(o => o.id !== id))
  }

  const loadMessages = async () => {
    setML(true)
    const [m, d] = await Promise.all([
      supabase.from('messages').select('id, user_id, content, from_admin, created_at').order('created_at', { ascending: false }).limit(300),
      supabase.from('direct_messages').select('id, from_user_id, to_user_id, from_name, to_name, content, listing_title, action_type, created_at, read').order('created_at', { ascending: false }).limit(300),
    ])
    setMsgs((m.data || []) as AdminMessage[])
    setDms((d.data || []) as AdminDM[])
    setML(false)
  }

  const loadTxns = async () => {
    setTL(true)
    const { data } = await supabase.from('transactions')
      .select('id, buyer_name, seller_name, listing_title, sale_price, commission_pct, commission_amt, total_paid, payment_method, payment_reference, status, created_at, tracking_number, tracking_carrier, tracking_url, estimated_delivery')
      .order('created_at', { ascending: false })
      .limit(300)
    setTxns((data || []) as AdminTxn[])
    setTL(false)
  }

  const saveTracking = async (id: number, tracking: { tracking_number: string; tracking_carrier: string; tracking_url: string; estimated_delivery: string }) => {
    await supabase.from('transactions').update(tracking).eq('id', id)
    setTxns(prev => prev.map(t => t.id === id ? { ...t, ...tracking } : t))
  }

  const updateTxnStatus = async (id: number, status: string) => {
    await supabase.from('transactions').update({ status, ...(status === 'verified' || status === 'completed' ? { verified_at: new Date().toISOString() } : {}) }).eq('id', id)
    setTxns(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    if (status === 'completed') loadStats()
  }

  const loadPayConfig = async () => {
    setPL(true)
    const { data } = await supabase.from('settings').select('key, value')
    if (data) {
      const map: Record<string, string> = {}
      data.forEach(r => { map[r.key] = r.value || '' })
      setPayConfig(prev => ({ ...prev, ...map }))
      if ('show_catalog' in map) setShowCatalog(map.show_catalog !== 'false')
    }
    setPL(false)
  }

  const toggleCatalog = async (val: boolean) => {
    setCatalogSaving(true)
    setShowCatalog(val)
    await supabase.from('settings').upsert({ key: 'show_catalog', value: String(val), updated_at: new Date().toISOString() })
    setCatalogSaving(false)
  }

  const savePayConfig = async () => {
    const entries = Object.entries(payConfig)
    await Promise.all(entries.map(([key, value]) =>
      supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() })
    ))
    setPaySaved(true)
    setTimeout(() => setPaySaved(false), 2500)
  }

  const loadCatalogHidden = async () => {
    setCatalogLoading(true)
    const [hidden, extra] = await Promise.all([
      supabase.from('settings').select('value').eq('key', 'catalog_hidden').maybeSingle(),
      supabase.from('settings').select('value').eq('key', 'catalog_extra').maybeSingle(),
    ])
    if (hidden.data?.value) {
      try { setHiddenIds(new Set(JSON.parse(hidden.data.value) as number[])) } catch { /* noop */ }
    } else { setHiddenIds(new Set()) }
    if (extra.data?.value) {
      try { setExtraItems(JSON.parse(extra.data.value)) } catch { /* noop */ }
    } else { setExtraItems([]) }
    setCatalogLoading(false)
  }

  const saveExtraItems = async (items: ExtraItem[]) => {
    await supabase.from('settings').upsert({ key: 'catalog_extra', value: JSON.stringify(items), updated_at: new Date().toISOString() })
  }

  const addCatalogItem = async () => {
    if (!addForm.name.trim() || !addForm.price.trim()) return
    setAddSaving(true)
    const newId = Date.now()
    const newItem: ExtraItem = { ...addForm, id: newId }
    const next = [...extraItems, newItem]
    setExtraItems(next)
    await saveExtraItems(next)
    setAddForm(BLANK_EXTRA)
    setShowAddForm(false)
    setAddSaving(false)
  }

  const deleteExtraItem = async (id: number) => {
    const next = extraItems.filter(i => i.id !== id)
    setExtraItems(next)
    await saveExtraItems(next)
  }

  const toggleCatalogItem = async (id: number) => {
    const next = new Set(hiddenIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setHiddenIds(next)
    await supabase.from('settings').upsert({ key: 'catalog_hidden', value: JSON.stringify([...next]), updated_at: new Date().toISOString() })
  }

  const restoreAllCatalog = async () => {
    if (!confirm('¿Restaurar todos los items del catálogo?')) return
    setHiddenIds(new Set())
    await supabase.from('settings').upsert({ key: 'catalog_hidden', value: '[]', updated_at: new Date().toISOString() })
  }

  const loadLanding = async () => {
    setTrendingLoading(true)
    const [tResult, overrides] = await Promise.all([
      supabase.from('settings').select('value').eq('key', 'trending_items').maybeSingle(),
      loadImageOverridesFromDB(),
    ])
    if (tResult.data?.value) {
      try { setTrendingItems(JSON.parse(tResult.data.value)) } catch { setTrendingItems([]) }
    } else { setTrendingItems([]) }
    setImageOverrides(overrides)
    setTrendingLoading(false)
  }

  const saveTrending = async (items: TrendingItem[]) => {
    await supabase.from('settings').upsert({ key: 'trending_items', value: JSON.stringify(items), updated_at: new Date().toISOString() })
    setTrendingItems(items)
    setTrendingSaved(true)
    setTimeout(() => setTrendingSaved(false), 2000)
  }

  const commitTrendingForm = async () => {
    if (!trendingForm.player.trim()) return
    const next = editTrendingIdx !== null
      ? trendingItems.map((item, i) => i === editTrendingIdx ? { ...trendingForm } : item)
      : [...trendingItems, { ...trendingForm }]
    setShowTrendingForm(false)
    setEditTrendingIdx(null)
    setTrendingForm(BLANK_TRENDING)
    await saveTrending(next)
  }

  const deleteTrendingItem = async (idx: number) => {
    await saveTrending(trendingItems.filter((_, i) => i !== idx))
  }

  const saveImages = async () => {
    setImageSaving(true)
    await saveImageOverridesToDB(imageOverrides)
    setImageSaving(false)
    setImageSaved(true)
    setTimeout(() => setImageSaved(false), 2000)
  }

  const filteredUsers = users.filter(u =>
    !userSearch || (u.display_name || '').toLowerCase().includes(userSearch.toLowerCase())
  )

  const pendingTxns = txns.filter(t => t.status === 'pending').length

  const TABS: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'overview',      label: 'Resumen',        icon: '📊' },
    { id: 'users',         label: 'Usuarios',       icon: '👥' },
    { id: 'listings',      label: 'Anuncios',       icon: '🏷️' },
    { id: 'orders',        label: 'Pedidos',        icon: '📦' },
    { id: 'transactions',  label: 'Transacciones',  icon: '💸', badge: pendingTxns },
    { id: 'mensajes',      label: 'Mensajes',        icon: '💬' },
    { id: 'pagos',         label: 'Métodos de Pago', icon: '⚙️' },
    { id: 'catalog',       label: 'Catálogo',        icon: '🗂️', badge: hiddenIds.size || undefined },
    { id: 'landing',       label: 'Landing',          icon: '🏠' },
  ]

  return (
    <div className="min-h-screen bg-[#0c0a1e] pt-20 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-red-500/15 text-red-400 border border-red-500/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Admin</span>
            <span className="text-gray-600 text-xs">PullStackMX · Panel de Control</span>
          </div>
          <h1 className="text-3xl font-black text-white">Panel Admin</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gestión completa de la plataforma</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
                tab === t.id
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-[#1c1835] border border-white/10 text-gray-400 hover:border-amber-500/30 hover:text-amber-400'
              }`}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {(t.badge ?? 0) > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Usuarios"            value={stats.users}    icon="👤" accent="border-violet-500/20" />
              <StatCard label="Anuncios activos"    value={stats.listings} icon="🏷️" accent="border-blue-500/20" />
              <StatCard label="Pedidos totales"     value={stats.orders}   icon="📦" accent="border-emerald-500/20" />
              <StatCard label="Comisiones cobradas" value={`$${stats.grading.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`} icon="💸" accent="border-yellow-500/20" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-[#1c1835] border border-white/5 rounded-2xl p-5">
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

              <div className="bg-[#1c1835] border border-white/5 rounded-2xl p-5">
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
                  className="w-full bg-[#1c1835] border border-white/10 text-white placeholder-gray-600 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-violet-500/50" />
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
                    <div key={u.id} className="flex items-center gap-3 bg-[#1c1835] border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition-all">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${u.role === 'admin' ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-black' : 'bg-white/5 text-gray-500'}`}>
                        {(u.display_name || 'U').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-bold truncate">{u.display_name || 'Sin nombre'}</p>
                          {u.role === 'admin' && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">👑 Admin</span>}
                          {u.id === user?.id && <span className="text-[10px] text-gray-600">(tú)</span>}
                        </div>
                        <p className="text-gray-700 text-[10px] font-mono">{u.id.slice(0, 18)}...</p>
                      </div>
                      {u.id !== user?.id && (
                        <div className="flex items-center gap-2 shrink-0">
                          {u.role === 'admin' ? (
                            <button onClick={() => setUserRole(u.id, 'user')}
                              className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all">
                              ↓ Quitar admin
                            </button>
                          ) : (
                            <button onClick={() => setUserRole(u.id, 'admin')}
                              className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:border-amber-500/30 hover:text-amber-400 transition-all">
                              👑 Hacer admin
                            </button>
                          )}
                          <button onClick={() => deleteUser(u.id, u.display_name || 'Sin nombre')}
                            className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-red-500/20 text-red-500/60 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 transition-all">
                            🗑️
                          </button>
                        </div>
                      )}
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
                    <div key={l.id} className="flex items-center gap-3 bg-[#1c1835] border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition-all">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{l.title}</p>
                        <p className="text-gray-600 text-[10px] mt-0.5">
                          {l.display_name} · {l.sport} ·
                          <span className={`font-bold ml-1 ${TXN_CSS[l.txn_type] || 'text-gray-400'}`}>{l.txn_type}</span>
                          {l.price && <span className="text-emerald-400 font-bold ml-2">{l.price}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${l.active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                          {l.active ? '● Activo' : '○ Pausado'}
                        </span>
                        <button onClick={() => deleteListing(l.id)}
                          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all">
                          🗑️ Eliminar
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
                    <div key={o.id} className="bg-[#1c1835] border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition-all flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium">{o.contact_name || 'Sin nombre'}</p>
                        <p className="text-gray-600 text-[10px]">Pedido #{o.id} · <span className="text-emerald-400 font-bold">{o.total}</span></p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_CSS[o.status] || STATUS_CSS.pending}`}>
                          {o.status}
                        </span>
                        <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}
                          className="bg-[#26213d] border border-white/10 text-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none cursor-pointer">
                          {ORDER_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => deleteOrder(o.id)}
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

        {/* ── TRANSACCIONES ── */}
        {tab === 'transactions' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-gray-600 text-sm">{txns.length} transacciones · {txns.filter(t => t.status === 'pending').length} pendientes</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-lg font-bold">
                  Comisión total: ${txns.filter(t => t.status === 'completed').reduce((s, t) => s + t.commission_amt, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            {txnsLoading
              ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/></div>
              : txns.length === 0
              ? <div className="text-center py-16"><p className="text-5xl mb-3">💸</p><p className="text-gray-500 text-sm">Sin transacciones aún</p></div>
              : (
                <div className="space-y-3">
                  {txns.map(t => (
                    <div key={t.id} className={`bg-[#1c1835] border rounded-2xl p-4 transition-all ${t.status === 'pending' ? 'border-yellow-500/20' : t.status === 'completed' ? 'border-emerald-500/15' : 'border-white/5'}`}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">{t.listing_title}</p>
                          <p className="text-gray-500 text-[10px] mt-0.5">
                            {t.buyer_name} → {t.seller_name} · {new Date(t.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${TXN_STATUS_CSS[t.status] || TXN_STATUS_CSS.pending}`}>
                          {TXN_STATUS_LABEL[t.status] || t.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3 bg-[#26213d] rounded-xl p-3 text-xs">
                        <div>
                          <p className="text-gray-600 mb-0.5">Precio venta</p>
                          <p className="text-white font-bold">{t.sale_price}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-0.5">Comisión {t.commission_pct}%</p>
                          <p className="text-violet-400 font-bold">${t.commission_amt.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-0.5">Total cobrado</p>
                          <p className="text-emerald-400 font-black">${t.total_paid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <span className="bg-[#26213d] px-2 py-1 rounded-lg">{METHOD_LABEL[t.payment_method] || t.payment_method}</span>
                          <span className="font-mono text-gray-600">Ref: PS-{t.payment_reference}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (trackingOpen === t.id) { setTrackingOpen(null); return }
                              setTrackingOpen(t.id)
                              setTrackingForm({
                                tracking_number:   t.tracking_number   || '',
                                tracking_carrier:  t.tracking_carrier  || '',
                                tracking_url:      t.tracking_url      || '',
                                estimated_delivery: t.estimated_delivery || '',
                              })
                            }}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${t.tracking_number ? 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10' : 'border-white/10 text-gray-500 hover:border-cyan-500/30 hover:text-cyan-400'}`}>
                            {t.tracking_number ? '📦 Ver guía' : '📦 Agregar guía'}
                          </button>
                          <select value={t.status} onChange={e => updateTxnStatus(t.id, e.target.value)}
                            className="bg-[#26213d] border border-white/10 text-gray-300 rounded-lg px-2 py-1 text-[10px] focus:outline-none cursor-pointer">
                            {TXN_STATUS.map(s => <option key={s} value={s}>{TXN_STATUS_LABEL[s]}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Tracking form */}
                      {trackingOpen === t.id && (
                        <div className="mt-3 border-t border-white/5 pt-3 space-y-2">
                          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Información de envío</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-gray-600 text-[9px] font-bold uppercase mb-1 block">Número de guía</label>
                              <input value={trackingForm.tracking_number} onChange={e => setTrackingForm(f => ({ ...f, tracking_number: e.target.value }))}
                                placeholder="Ej: 1Z999AA10123456784"
                                className="w-full bg-[#0c0a1e] border border-white/10 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-cyan-500/50 font-mono placeholder-gray-700" />
                            </div>
                            <div>
                              <label className="text-gray-600 text-[9px] font-bold uppercase mb-1 block">Paquetería</label>
                              <input value={trackingForm.tracking_carrier} onChange={e => setTrackingForm(f => ({ ...f, tracking_carrier: e.target.value }))}
                                placeholder="DHL, FedEx, Estafeta..."
                                className="w-full bg-[#0c0a1e] border border-white/10 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-cyan-500/50 placeholder-gray-700" />
                            </div>
                            <div>
                              <label className="text-gray-600 text-[9px] font-bold uppercase mb-1 block">URL de rastreo</label>
                              <input value={trackingForm.tracking_url} onChange={e => setTrackingForm(f => ({ ...f, tracking_url: e.target.value }))}
                                placeholder="https://track.dhl.com/..."
                                className="w-full bg-[#0c0a1e] border border-white/10 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-cyan-500/50 font-mono placeholder-gray-700" />
                            </div>
                            <div>
                              <label className="text-gray-600 text-[9px] font-bold uppercase mb-1 block">Entrega estimada</label>
                              <input value={trackingForm.estimated_delivery} onChange={e => setTrackingForm(f => ({ ...f, estimated_delivery: e.target.value }))}
                                placeholder="Ej: 2-4 días hábiles"
                                className="w-full bg-[#0c0a1e] border border-white/10 text-white px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-cyan-500/50 placeholder-gray-700" />
                            </div>
                          </div>
                          <button
                            disabled={trackingSaving}
                            onClick={async () => {
                              setTrackingSaving(true)
                              await saveTracking(t.id, trackingForm)
                              setTrackingSaving(false)
                              setTrackingOpen(null)
                            }}
                            className="mt-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5">
                            {trackingSaving && <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />}
                            Guardar guía de envío
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        )}

        {/* ── MENSAJES ── */}
        {tab === 'mensajes' && (
          <div>
            <div className="flex gap-2 mb-5">
              <button onClick={() => setMsgTab('support')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${msgTab === 'support' ? 'bg-amber-500 text-black' : 'bg-[#1c1835] border border-white/10 text-gray-400 hover:border-amber-500/30 hover:text-amber-400'}`}>
                💬 Soporte ({msgs.length})
              </button>
              <button onClick={() => setMsgTab('dms')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${msgTab === 'dms' ? 'bg-amber-500 text-black' : 'bg-[#1c1835] border border-white/10 text-gray-400 hover:border-amber-500/30 hover:text-amber-400'}`}>
                📩 Mensajes directos ({dms.length})
              </button>
            </div>
            {msgsLoading
              ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/></div>
              : msgTab === 'support'
              ? (
                msgs.length === 0
                  ? <div className="text-center py-16"><p className="text-5xl mb-3">💬</p><p className="text-gray-500 text-sm">Sin mensajes de soporte aún</p></div>
                  : (
                    <div className="space-y-2">
                      {msgs.map(m => (
                        <div key={m.id} className={`bg-[#1c1835] border rounded-xl px-4 py-3 ${m.from_admin ? 'border-violet-500/20' : 'border-white/5'}`}>
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${m.from_admin ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                                  {m.from_admin ? '🛡️ Admin' : '👤 Usuario'}
                                </span>
                                <span className="text-gray-700 text-[10px]">{new Date(m.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-gray-300 text-sm leading-relaxed">{m.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
              )
              : (
                dms.length === 0
                  ? <div className="text-center py-16"><p className="text-5xl mb-3">📩</p><p className="text-gray-500 text-sm">Sin mensajes directos aún</p></div>
                  : (
                    <div className="space-y-2">
                      {dms.map(d => (
                        <div key={d.id} className={`bg-[#1c1835] border rounded-xl px-4 py-3 ${!d.read ? 'border-blue-500/20' : 'border-white/5'}`}>
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-gray-200 text-xs font-bold">{d.from_name}</span>
                                <span className="text-gray-700 text-xs">→</span>
                                <span className="text-gray-400 text-xs">{d.to_name}</span>
                                {d.listing_title && <span className="bg-[#26213d] text-gray-500 text-[10px] px-2 py-0.5 rounded-full border border-white/5 truncate max-w-[140px]">{d.listing_title}</span>}
                                {!d.read && <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-blue-500/30">Nuevo</span>}
                              </div>
                              <p className="text-gray-300 text-sm leading-relaxed">{d.content}</p>
                              <p className="text-gray-700 text-[10px] mt-1">{new Date(d.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
              )
            }
          </div>
        )}

        {/* ── MÉTODOS DE PAGO ── */}
        {tab === 'pagos' && (
          <div className="max-w-2xl space-y-6">
            {payLoading
              ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/></div>
              : <>
                {/* Catálogo estático */}
                <div className="bg-[#1c1835] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-black">Catálogo de ejemplo</h3>
                      <p className="text-gray-500 text-xs mt-0.5">Las 36 cartas de demo que vienen por defecto en el Mercado</p>
                    </div>
                    <button onClick={() => toggleCatalog(!showCatalog)} disabled={catalogSaving}
                      className={`relative w-12 h-6 rounded-full transition-all ${showCatalog ? 'bg-violet-600' : 'bg-white/10'} disabled:opacity-50`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${showCatalog ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  <p className={`text-xs mt-2 font-bold ${showCatalog ? 'text-violet-400' : 'text-gray-600'}`}>
                    {showCatalog ? '● Visible en el mercado' : '○ Oculto — solo aparecen anuncios de usuarios'}
                  </p>
                </div>

                {/* SPEI */}
                <div className="bg-[#1c1835] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🏦</span>
                    <h3 className="text-white font-black">SPEI / Transferencia</h3>
                  </div>
                  {[
                    { key: 'spei_banco',        label: 'Banco',        placeholder: 'Ej: BBVA, Banorte, HSBC' },
                    { key: 'spei_clabe',         label: 'CLABE (18 dígitos)', placeholder: '012345678901234567' },
                    { key: 'spei_beneficiario',  label: 'Beneficiario', placeholder: 'PullStackMX' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">{f.label}</label>
                      <input value={payConfig[f.key as keyof typeof payConfig]}
                        onChange={e => setPayConfig(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full bg-[#26213d] border border-white/10 text-white placeholder-gray-700 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 font-mono" />
                    </div>
                  ))}
                </div>

                {/* MercadoPago */}
                <div className="bg-[#1c1835] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">💳</span>
                    <h3 className="text-white font-black">MercadoPago</h3>
                  </div>
                  {[
                    { key: 'mp_usuario', label: 'Usuario / alias MP', placeholder: '@pullstack' },
                    { key: 'mp_link',    label: 'Link de cobro MP',   placeholder: 'https://mpago.la/...' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">{f.label}</label>
                      <input value={payConfig[f.key as keyof typeof payConfig]}
                        onChange={e => setPayConfig(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full bg-[#26213d] border border-white/10 text-white placeholder-gray-700 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 font-mono" />
                    </div>
                  ))}
                </div>

                {/* OXXO */}
                <div className="bg-[#1c1835] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">🏪</span>
                    <h3 className="text-white font-black">OXXO Pay</h3>
                  </div>
                  <div>
                    <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">Link para generar ficha OXXO</label>
                    <input value={payConfig.oxxo_link}
                      onChange={e => setPayConfig(p => ({ ...p, oxxo_link: e.target.value }))}
                      placeholder="https://mpago.la/... (lo genera MercadoPago)"
                      className="w-full bg-[#26213d] border border-white/10 text-white placeholder-gray-700 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 font-mono" />
                  </div>
                </div>

                {/* Tarjeta */}
                <div className="bg-[#1c1835] border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">💰</span>
                    <h3 className="text-white font-black">Tarjeta (Stripe / MP)</h3>
                  </div>
                  <div>
                    <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">Link de pago con tarjeta</label>
                    <input value={payConfig.tarjeta_link}
                      onChange={e => setPayConfig(p => ({ ...p, tarjeta_link: e.target.value }))}
                      placeholder="https://buy.stripe.com/... o https://mpago.la/..."
                      className="w-full bg-[#26213d] border border-white/10 text-white placeholder-gray-700 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 font-mono" />
                  </div>
                </div>

                <button onClick={savePayConfig}
                  className={`w-full py-3 rounded-xl font-black text-sm transition-all ${paySaved ? 'bg-emerald-600 text-white' : 'bg-amber-500 hover:bg-amber-400 text-black'}`}>
                  {paySaved ? '✅ Guardado — compradores ya ven tus datos' : 'Guardar configuración de pagos'}
                </button>
              </>
            }
          </div>
        )}

        {/* ── CATÁLOGO ── */}
        {tab === 'catalog' && (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white font-black text-lg">Catálogo PullStackMX</h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  {CATALOG.length - hiddenIds.size + extraItems.length} visibles · {hiddenIds.size} ocultos · {extraItems.length} agregados
                </p>
              </div>
              <div className="flex items-center gap-2">
                {hiddenIds.size > 0 && (
                  <button onClick={restoreAllCatalog}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 text-gray-500 hover:border-emerald-500/30 hover:text-emerald-400 transition-all">
                    ↩ Restaurar todo
                  </button>
                )}
                <button onClick={() => setShowAddForm(v => !v)}
                  className={`text-xs font-bold px-4 py-2 rounded-lg border transition-all ${showAddForm ? 'bg-amber-500 text-black border-amber-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'}`}>
                  {showAddForm ? '✕ Cancelar' : '+ Agregar item'}
                </button>
              </div>
            </div>

            {/* Formulario agregar */}
            {showAddForm && (
              <div className="bg-[#13102a] border border-amber-500/20 rounded-2xl p-5 mb-6 space-y-3">
                <p className="text-amber-400 text-sm font-black mb-1">Nuevo item del catálogo</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Nombre *</label>
                    <input value={addForm.name} onChange={e => setAddForm(f => ({...f, name: e.target.value}))}
                      placeholder="Ej: Luka Dončić RC Auto"
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Precio *</label>
                    <input value={addForm.price} onChange={e => setAddForm(f => ({...f, price: e.target.value}))}
                      placeholder="$1,200"
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Detalle</label>
                    <input value={addForm.detail} onChange={e => setAddForm(f => ({...f, detail: e.target.value}))}
                      placeholder="Ej: 2018-19 Panini Prizm RC Silver"
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Sport</label>
                    <select value={addForm.sport} onChange={e => setAddForm(f => ({...f, sport: e.target.value}))}
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50">
                      {['NBA','NFL','Soccer','MLB','Pokémon','One Piece','General'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Tipo</label>
                    <select value={addForm.kind} onChange={e => setAddForm(f => ({...f, kind: e.target.value}))}
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50">
                      <option value="card">Carta</option>
                      <option value="box">Caja</option>
                      <option value="accessory">Accesorio</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Transacción</label>
                    <select value={addForm.txn} onChange={e => setAddForm(f => ({...f, txn: e.target.value}))}
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50">
                      <option value="sale">Venta</option>
                      <option value="auction">Subasta</option>
                      <option value="trade">Trading</option>
                      <option value="buy">Tienda</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Marca / Set</label>
                    <input value={addForm.brand} onChange={e => setAddForm(f => ({...f, brand: e.target.value}))}
                      placeholder="Panini Prizm 2018"
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Grado (opcional)</label>
                    <input value={addForm.grade} onChange={e => setAddForm(f => ({...f, grade: e.target.value}))}
                      placeholder="PSA 10"
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Badge (opcional)</label>
                    <input value={addForm.badge} onChange={e => setAddForm(f => ({...f, badge: e.target.value}))}
                      placeholder="🔥 Hot"
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Sub-texto</label>
                    <input value={addForm.sub} onChange={e => setAddForm(f => ({...f, sub: e.target.value}))}
                      placeholder="Raw ~$300 · 2 en stock"
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">URL de imagen</label>
                    <input value={addForm.imageUrl} onChange={e => setAddForm(f => ({...f, imageUrl: e.target.value}))}
                      placeholder="https://images.unsplash.com/... (deja vacío para imagen genérica)"
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700 font-mono" />
                  </div>
                </div>
                <button onClick={addCatalogItem} disabled={addSaving || !addForm.name.trim() || !addForm.price.trim()}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black py-2.5 rounded-xl text-sm transition-all mt-1">
                  {addSaving ? 'Guardando...' : '+ Agregar al catálogo'}
                </button>
              </div>
            )}

            {/* Items agregados por admin */}
            {extraItems.length > 0 && (
              <div className="mb-6">
                <p className="text-amber-400 text-[11px] font-black uppercase tracking-widest mb-2">Agregados por admin ({extraItems.length})</p>
                <div className="space-y-2">
                  {extraItems
                    .filter(item => catalogFilter === 'Todos' || item.sport === catalogFilter)
                    .map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl border bg-amber-500/5 border-amber-500/15">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.imageUrl && <img src={item.imageUrl} className="w-10 h-10 rounded-lg object-cover shrink-0" onError={e => { (e.target as HTMLImageElement).style.display='none' }} />}
                          <div className="min-w-0">
                            <p className="text-white font-bold text-sm truncate">{item.name}</p>
                            <p className="text-gray-500 text-[11px] truncate">{item.sport} · {item.kind} · {item.price}</p>
                          </div>
                        </div>
                        <button onClick={() => deleteExtraItem(item.id)}
                          className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all">
                          🗑️ Eliminar
                        </button>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Separador */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[11px] text-gray-600 uppercase tracking-widest font-bold">Catálogo base</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {/* Filtro por sport */}
            <div className="flex gap-2 flex-wrap mb-4">
              {['Todos', 'NBA', 'NFL', 'Soccer', 'MLB', 'Pokémon', 'One Piece', 'General'].map(s => (
                <button key={s} onClick={() => setCatalogFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${catalogFilter === s ? 'bg-amber-500 text-black' : 'bg-[#1c1835] border border-white/10 text-gray-400 hover:border-amber-500/30'}`}>
                  {s}
                </button>
              ))}
            </div>

            {catalogLoading
              ? <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
              : (
                <div className="space-y-2">
                  {CATALOG
                    .filter(item => catalogFilter === 'Todos' || item.sport === catalogFilter)
                    .map(item => {
                      const hidden = hiddenIds.has(item.id)
                      return (
                        <div key={item.id}
                          className={`flex items-center justify-between gap-4 px-4 py-3 rounded-xl border transition-all ${hidden ? 'bg-[#13102a] border-white/5 opacity-40' : 'bg-[#1c1835] border-white/5'}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-gray-600 text-xs font-mono w-5 shrink-0">{item.id}</span>
                            <div className="min-w-0">
                              <p className={`font-bold text-sm truncate ${hidden ? 'text-gray-600 line-through' : 'text-white'}`}>{item.name}</p>
                              <p className="text-gray-600 text-[11px] truncate">{item.sport} · {item.kind} · {item.price}</p>
                            </div>
                          </div>
                          <button onClick={() => toggleCatalogItem(item.id)}
                            className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                              hidden
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                            }`}>
                            {hidden ? '↩ Restaurar' : '🗑️ Eliminar'}
                          </button>
                        </div>
                      )
                    })
                  }
                </div>
              )
            }
          </div>
        )}

        {/* ── LANDING ── */}
        {tab === 'landing' && (
          <div>
            {/* Sub-tabs */}
            <div className="flex gap-2 mb-6">
              <button onClick={() => setLandingSubTab('trending')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${landingSubTab === 'trending' ? 'bg-amber-500 text-black' : 'bg-[#1c1835] border border-white/10 text-gray-400 hover:border-amber-500/30 hover:text-amber-400'}`}>
                🔥 Trending
              </button>
              <button onClick={() => setLandingSubTab('images')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${landingSubTab === 'images' ? 'bg-amber-500 text-black' : 'bg-[#1c1835] border border-white/10 text-gray-400 hover:border-amber-500/30 hover:text-amber-400'}`}>
                🖼️ Imágenes
              </button>
            </div>

            {/* ─ Trending ─ */}
            {landingSubTab === 'trending' && (
              <div>
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h3 className="text-white font-black text-lg">Cartas trending en Landing</h3>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {trendingItems.length === 0 ? 'Sin override — landing usa los 4 items por defecto' : `${trendingItems.length} items guardados`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {trendingSaved && <span className="text-emerald-400 text-xs font-bold">✅ Guardado</span>}
                    {trendingItems.length > 0 && (
                      <button onClick={() => { if (confirm('¿Restaurar los defaults de la landing?')) saveTrending([]) }}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 text-gray-500 hover:border-red-500/30 hover:text-red-400 transition-all">
                        ↩ Restaurar defaults
                      </button>
                    )}
                    <button onClick={() => { setEditTrendingIdx(null); setTrendingForm(BLANK_TRENDING); setShowTrendingForm(v => !v) }}
                      className={`text-xs font-bold px-4 py-2 rounded-lg border transition-all ${showTrendingForm && editTrendingIdx === null ? 'bg-amber-500 text-black border-amber-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'}`}>
                      {showTrendingForm && editTrendingIdx === null ? '✕ Cancelar' : '+ Agregar'}
                    </button>
                  </div>
                </div>

                {/* Formulario agregar/editar */}
                {showTrendingForm && (
                  <div className="bg-[#13102a] border border-amber-500/20 rounded-2xl p-5 mb-5 space-y-3">
                    <p className="text-amber-400 text-sm font-black mb-1">{editTrendingIdx !== null ? 'Editar item' : 'Nuevo item trending'}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-gray-500 text-[10px] uppercase tracking-widest block mb-1">Jugador / Carta *</label>
                        <input value={trendingForm.player} onChange={e => setTrendingForm(f => ({ ...f, player: e.target.value }))}
                          placeholder="Ej: Lamine Yamal"
                          className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                      </div>
                      <div>
                        <label className="text-gray-500 text-[10px] uppercase tracking-widest block mb-1">Precio</label>
                        <input value={trendingForm.price} onChange={e => setTrendingForm(f => ({ ...f, price: e.target.value }))}
                          placeholder="$396,500"
                          className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-gray-500 text-[10px] uppercase tracking-widest block mb-1">Detalle del set</label>
                        <input value={trendingForm.detail} onChange={e => setTrendingForm(f => ({ ...f, detail: e.target.value }))}
                          placeholder="2024 Topps Chrome UEFA Euro · SuperFractor Auto 1/1"
                          className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                      </div>
                      <div>
                        <label className="text-gray-500 text-[10px] uppercase tracking-widest block mb-1">Equipo / Info</label>
                        <input value={trendingForm.team} onChange={e => setTrendingForm(f => ({ ...f, team: e.target.value }))}
                          placeholder="FC Barcelona · Selección España"
                          className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                      </div>
                      <div>
                        <label className="text-gray-500 text-[10px] uppercase tracking-widest block mb-1">Grado</label>
                        <input value={trendingForm.grade} onChange={e => setTrendingForm(f => ({ ...f, grade: e.target.value }))}
                          placeholder="PSA 10"
                          className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                      </div>
                      <div>
                        <label className="text-gray-500 text-[10px] uppercase tracking-widest block mb-1">Tendencia / Cambio</label>
                        <input value={trendingForm.change} onChange={e => setTrendingForm(f => ({ ...f, change: e.target.value }))}
                          placeholder="+585% en ventas / último año"
                          className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                      </div>
                      <div>
                        <label className="text-gray-500 text-[10px] uppercase tracking-widest block mb-1">Deporte (badge)</label>
                        <input value={trendingForm.sport} onChange={e => setTrendingForm(f => ({ ...f, sport: e.target.value }))}
                          placeholder="⚽ Soccer"
                          className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-gray-500 text-[10px] uppercase tracking-widest block mb-1">URL de imagen</label>
                        <input value={trendingForm.img} onChange={e => setTrendingForm(f => ({ ...f, img: e.target.value }))}
                          placeholder="https://... (URL directa de la imagen de la carta)"
                          className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700 font-mono" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button onClick={commitTrendingForm} disabled={!trendingForm.player.trim()}
                        className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black py-2.5 rounded-xl text-sm transition-all">
                        {editTrendingIdx !== null ? 'Guardar cambios' : '+ Agregar al trending'}
                      </button>
                      <button onClick={() => { setShowTrendingForm(false); setEditTrendingIdx(null); setTrendingForm(BLANK_TRENDING) }}
                        className="px-4 py-2.5 rounded-xl text-sm font-bold border border-white/10 text-gray-500 hover:text-gray-300 transition-all">
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de items */}
                {trendingLoading
                  ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
                  : trendingItems.length === 0
                  ? (
                    <div className="text-center py-14 bg-[#1c1835] border border-white/5 rounded-2xl">
                      <p className="text-4xl mb-3">🔥</p>
                      <p className="text-white font-bold mb-1">Sin override</p>
                      <p className="text-gray-500 text-sm">El landing mostrará las 4 cartas por defecto.<br />Agrega items para personalizar.</p>
                    </div>
                  )
                  : (
                    <div className="space-y-2">
                      {trendingItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 bg-[#1c1835] border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition-all">
                          {item.img && (
                            <img src={item.img} alt={item.player}
                              className="w-12 h-12 rounded-lg object-cover shrink-0 bg-[#26213d]"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-white font-bold text-sm truncate">{item.player}</p>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20 shrink-0">{item.sport}</span>
                            </div>
                            <p className="text-gray-500 text-[11px] truncate">{item.price} · {item.grade}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => { setEditTrendingIdx(i); setTrendingForm({ ...item }); setShowTrendingForm(true) }}
                              className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:border-amber-500/30 hover:text-amber-400 transition-all">
                              ✏️ Editar
                            </button>
                            <button onClick={() => deleteTrendingItem(i)}
                              className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all">
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            )}

            {/* ─ Imágenes ─ */}
            {landingSubTab === 'images' && (
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-white font-black text-lg">Imágenes del Landing</h3>
                    <p className="text-gray-500 text-xs mt-0.5">Pega URLs directas. Dejar vacío = imagen por defecto.</p>
                  </div>
                  <button onClick={saveImages} disabled={imageSaving}
                    className={`text-sm font-black px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 ${imageSaved ? 'bg-emerald-600 text-white' : 'bg-amber-500 hover:bg-amber-400 text-black'}`}>
                    {imageSaved ? '✅ Guardado' : imageSaving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>

                {IMAGE_SECTIONS.map(section => (
                  <div key={section.label} className="mb-8">
                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mb-3">{section.label}</p>
                    <div className="space-y-3">
                      {section.keys.map(key => (
                        <div key={key} className="flex items-center gap-3 bg-[#1c1835] border border-white/5 rounded-xl p-3">
                          <img
                            src={imageOverrides[key] || IMAGE_DEFAULTS[key]}
                            alt={IMAGE_LABELS[key]}
                            className="w-16 h-16 rounded-lg object-cover shrink-0 bg-[#26213d]"
                            onError={e => { (e.target as HTMLImageElement).src = IMAGE_DEFAULTS[key] }}
                          />
                          <div className="flex-1 min-w-0">
                            <label className="text-gray-400 text-xs font-bold block mb-1.5">{IMAGE_LABELS[key]}</label>
                            <input
                              value={imageOverrides[key] || ''}
                              onChange={e => {
                                const val = e.target.value
                                setImageOverrides(prev =>
                                  val ? { ...prev, [key]: val } : Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key))
                                )
                              }}
                              placeholder="URL personalizada (dejar vacío = default)"
                              className="w-full bg-[#26213d] border border-white/10 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500/50 font-mono placeholder-gray-700"
                            />
                          </div>
                          {imageOverrides[key] && (
                            <button
                              onClick={() => setImageOverrides(prev => Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key)))}
                              className="text-gray-600 hover:text-red-400 text-sm shrink-0 transition-colors px-1">
                              ✕
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <button onClick={saveImages} disabled={imageSaving}
                  className={`w-full py-3 rounded-xl font-black text-sm transition-all disabled:opacity-50 ${imageSaved ? 'bg-emerald-600 text-white' : 'bg-amber-500 hover:bg-amber-400 text-black'}`}>
                  {imageSaved ? '✅ Cambios guardados — la landing ya usa las nuevas imágenes' : imageSaving ? 'Guardando...' : 'Guardar cambios de imágenes'}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
