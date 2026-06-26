import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type CollectionItem = {
  id: number
  catalog_id: number
  name: string
  sport: string
  kind: string
  price: string
  added_at: string
}

type WishItem = {
  id: number
  name: string
  sport: string
  notes: string | null
  max_price: string | null
  priority: 'low' | 'medium' | 'high'
  added_at: string
}

const SPORT_ICONS: Record<string, string> = {
  NBA: '🏀', NFL: '🏈', Soccer: '⚽', MLB: '⚾',
  'Pokémon': '🃏', 'One Piece': '🏴‍☠️', General: '🛡️',
}
const KIND_LABEL: Record<string, string> = { card: 'Carta', box: 'Caja', accessory: 'Accesorio' }
const PRIORITY_CSS: Record<string, string> = {
  high:   'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low:    'bg-gray-500/20 text-gray-400 border-gray-500/30',
}
const PRIORITY_LABEL: Record<string, string> = { high: 'Alta', medium: 'Media', low: 'Baja' }
const SPORTS_LIST = ['NBA', 'NFL', 'Soccer', 'MLB', 'Pokémon', 'One Piece', 'General']

function parsePrice(p: string): number {
  return parseFloat(p.replace(/[^0-9.]/g, '')) || 0
}

export default function Wallet() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab]               = useState<'collection' | 'wishlist'>('collection')
  const [items, setItems]           = useState<CollectionItem[]>([])
  const [wishes, setWishes]         = useState<WishItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [sportFilter, setSport]     = useState('Todos')
  const [removing, setRemoving]     = useState<number | null>(null)

  // Wishlist form
  const [showWishForm, setShowWishForm] = useState(false)
  const [wishName, setWishName]         = useState('')
  const [wishSport, setWishSport]       = useState('NBA')
  const [wishNotes, setWishNotes]       = useState('')
  const [wishMaxPrice, setWishMaxPrice] = useState('')
  const [wishPriority, setWishPriority] = useState<'low'|'medium'|'high'>('medium')
  const [wishSaving, setWishSaving]     = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login', { state: { from: '/wallet' } }); return }
    loadAll()
  }, [user, authLoading])

  const loadAll = async () => {
    setLoading(true)
    const [colRes, wishRes] = await Promise.all([
      supabase.from('collection_items').select('*').order('added_at', { ascending: false }),
      supabase.from('wishlist_items').select('*').order('added_at', { ascending: false }),
    ])
    setItems((colRes.data as CollectionItem[]) || [])
    setWishes((wishRes.data as WishItem[]) || [])
    setLoading(false)
  }

  const removeItem = async (id: number) => {
    setRemoving(id)
    await supabase.from('collection_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    setRemoving(null)
  }

  const removeWish = async (id: number) => {
    setRemoving(id)
    await supabase.from('wishlist_items').delete().eq('id', id)
    setWishes(prev => prev.filter(w => w.id !== id))
    setRemoving(null)
  }

  const addWish = async () => {
    if (!user || !wishName.trim()) return
    setWishSaving(true)
    const { data } = await supabase.from('wishlist_items').insert({
      user_id:   user.id,
      name:      wishName.trim(),
      sport:     wishSport,
      notes:     wishNotes.trim() || null,
      max_price: wishMaxPrice.trim() ? `$${wishMaxPrice.trim()}` : null,
      priority:  wishPriority,
    }).select().single()
    if (data) setWishes(prev => [data as WishItem, ...prev])
    setWishName(''); setWishNotes(''); setWishMaxPrice(''); setWishPriority('medium')
    setShowWishForm(false); setWishSaving(false)
  }

  const sports     = ['Todos', ...Array.from(new Set(items.map(i => i.sport)))]
  const filtered   = sportFilter === 'Todos' ? items : items.filter(i => i.sport === sportFilter)
  const totalValue = items.reduce((s, i) => s + parsePrice(i.price), 0)
  const sportBreak = items.reduce<Record<string, number>>((acc, i) => { acc[i.sport] = (acc[i.sport] || 0) + 1; return acc }, {})

  if (authLoading || (loading && user)) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-1">PullStack</p>
          <h1 className="text-4xl font-black text-white mb-1">Mi Portfolio</h1>
          <p className="text-gray-500 text-sm">Colección guardada · Lista de deseos</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#111] border border-white/5 rounded-xl p-1 w-fit">
          <button onClick={() => setTab('collection')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'collection' ? 'bg-amber-500 text-black' : 'text-gray-500 hover:text-gray-300'}`}>
            🃏 Mi Colección {items.length > 0 && <span className="ml-1 opacity-70">({items.length})</span>}
          </button>
          <button onClick={() => setTab('wishlist')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'wishlist' ? 'bg-amber-500 text-black' : 'text-gray-500 hover:text-gray-300'}`}>
            ⭐ Deseadas {wishes.length > 0 && <span className="ml-1 opacity-70">({wishes.length})</span>}
          </button>
        </div>

        {/* ── COLLECTION TAB ──────────────────────────────────── */}
        {tab === 'collection' && (
          <>
            {/* Stats */}
            {items.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Piezas</p>
                  <p className="text-white font-black text-3xl">{items.length}</p>
                </div>
                <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Valor est.</p>
                  <p className="text-amber-400 font-black text-2xl">
                    ${totalValue >= 1e6 ? `${(totalValue/1e6).toFixed(1)}M` : totalValue >= 1000 ? `${(totalValue/1000).toFixed(0)}K` : totalValue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-[#111] border border-white/5 rounded-2xl p-4 col-span-2">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Por deporte</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(sportBreak).map(([sport, count]) => (
                      <span key={sport} className="flex items-center gap-1 bg-[#1a1a1a] border border-white/5 px-2 py-0.5 rounded-lg text-xs text-gray-300">
                        {SPORT_ICONS[sport] || '🃏'} {sport} <span className="text-amber-400 font-black">{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sport filter */}
            {items.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-5">
                {sports.map(s => (
                  <button key={s} onClick={() => setSport(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sportFilter === s ? 'bg-white/10 text-white border border-white/20' : 'text-gray-500 hover:text-gray-300'}`}>
                    {SPORT_ICONS[s] || ''} {s}
                  </button>
                ))}
              </div>
            )}

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="text-6xl mb-5">🃏</div>
                <h2 className="text-white font-black text-2xl mb-2">Tu colección está vacía</h2>
                <p className="text-gray-500 text-sm mb-8 max-w-sm">Guarda cartas desde el Explorador con el botón 🔖 para armar tu portfolio.</p>
                <Link to="/marketplace" className="bg-amber-500 hover:bg-amber-400 text-black font-black px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/20">
                  Explorar el catálogo →
                </Link>
              </div>
            ) : (
              <>
                <p className="text-gray-600 text-sm mb-4">
                  <span className="text-white font-bold">{filtered.length}</span> artículo{filtered.length !== 1 ? 's' : ''}
                  {sportFilter !== 'Todos' && <span> en <span className="text-amber-400">{sportFilter}</span></span>}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map(item => (
                    <div key={item.id} className="group bg-[#111] border border-white/5 hover:border-amber-500/20 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{SPORT_ICONS[item.sport] || '🃏'}</span>
                          <div>
                            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">{item.sport}</p>
                            <p className="text-[10px] text-gray-600">{KIND_LABEL[item.kind] || item.kind}</p>
                          </div>
                        </div>
                        <button onClick={() => removeItem(item.id)} disabled={removing === item.id}
                          className="text-gray-600 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100 shrink-0">
                          {removing === item.id
                            ? <div className="w-4 h-4 border-2 border-red-400/50 border-t-transparent rounded-full animate-spin" />
                            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          }
                        </button>
                      </div>
                      <h3 className="text-white font-black text-sm leading-tight mb-1 line-clamp-2">{item.name}</h3>
                      <div className="flex items-end justify-between mt-3 pt-3 border-t border-white/5">
                        <p className="text-amber-400 font-black text-lg">{item.price}</p>
                        <p className="text-gray-600 text-[10px]">{new Date(item.added_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <Link to="/marketplace" className="inline-flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
                    + Agregar más cartas al portfolio
                  </Link>
                </div>
              </>
            )}
          </>
        )}

        {/* ── WISHLIST TAB ─────────────────────────────────────── */}
        {tab === 'wishlist' && (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-gray-400 text-sm">Cartas que quieres conseguir en el futuro</p>
              <button onClick={() => setShowWishForm(!showWishForm)}
                className="bg-amber-500 hover:bg-amber-400 text-black font-black px-4 py-2 rounded-xl text-sm transition-all">
                + Agregar deseo
              </button>
            </div>

            {showWishForm && (
              <div className="bg-[#111] border border-amber-500/20 rounded-2xl p-5 mb-6">
                <h3 className="text-white font-bold mb-4">Nueva carta deseada</h3>
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <div className="sm:col-span-2">
                    <label className="text-gray-400 text-xs mb-1 block">Carta / Jugador *</label>
                    <input value={wishName} onChange={e => setWishName(e.target.value)}
                      placeholder="Ej. LeBron James RC PSA 10, Charizard Base Set..."
                      className="w-full bg-[#1a1a1a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Deporte</label>
                    <select value={wishSport} onChange={e => setWishSport(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                      {SPORTS_LIST.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1 block">Precio máximo (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input value={wishMaxPrice} onChange={e => setWishMaxPrice(e.target.value)}
                        placeholder="500" type="number"
                        className="w-full bg-[#1a1a1a] border border-white/10 text-white rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/50" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-gray-400 text-xs mb-1 block">Notas</label>
                    <input value={wishNotes} onChange={e => setWishNotes(e.target.value)}
                      placeholder="Variante, grado esperado, condición mínima..."
                      className="w-full bg-[#1a1a1a] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-gray-400 text-xs mb-2 block">Prioridad</label>
                    <div className="flex gap-2">
                      {(['high','medium','low'] as const).map(p => (
                        <button key={p} onClick={() => setWishPriority(p)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${wishPriority === p ? PRIORITY_CSS[p] : 'bg-[#1a1a1a] border-white/10 text-gray-500'}`}>
                          {PRIORITY_LABEL[p]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowWishForm(false)} className="text-gray-500 hover:text-white text-sm px-4 py-2 transition-colors">Cancelar</button>
                  <button onClick={addWish} disabled={wishSaving || !wishName.trim()}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black px-5 py-2 rounded-xl text-sm transition-all">
                    {wishSaving ? 'Guardando...' : 'Agregar'}
                  </button>
                </div>
              </div>
            )}

            {wishes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 text-center">
                <div className="text-6xl mb-5">⭐</div>
                <h2 className="text-white font-black text-2xl mb-2">Sin cartas deseadas aún</h2>
                <p className="text-gray-500 text-sm mb-8 max-w-sm">Agrega las cartas que sueñas tener. Las tienes en un solo lugar para cuando encuentres la oportunidad.</p>
                <button onClick={() => setShowWishForm(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-black px-6 py-3 rounded-xl transition-all">
                  + Agregar primera carta
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {wishes.map(w => (
                  <div key={w.id} className="group bg-[#111] border border-white/5 hover:border-amber-500/20 rounded-2xl p-4 transition-all flex items-center gap-4">
                    <div className="text-2xl shrink-0">{SPORT_ICONS[w.sport] || '🃏'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="text-white font-bold text-sm">{w.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_CSS[w.priority]}`}>
                          {PRIORITY_LABEL[w.priority]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{w.sport}</span>
                        {w.max_price && <span>· Máx. <span className="text-amber-400 font-bold">{w.max_price}</span></span>}
                        {w.notes && <span>· {w.notes}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link to="/marketplace"
                        className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hidden sm:block">
                        Buscar →
                      </Link>
                      <button onClick={() => removeWish(w.id)} disabled={removing === w.id}
                        className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        {removing === w.id
                          ? <div className="w-4 h-4 border-2 border-red-400/50 border-t-transparent rounded-full animate-spin" />
                          : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
