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

const SPORT_ICONS: Record<string, string> = {
  NBA: '🏀', NFL: '🏈', Soccer: '⚽', MLB: '⚾',
  'Pokémon': '🃏', 'One Piece': '🏴‍☠️', General: '🛡️',
}
const KIND_ICONS: Record<string, string> = { card: '🃏', box: '📦', accessory: '🛡️' }

function parsePrice(p: string): number {
  return parseFloat(p.replace(/[^0-9.]/g, '')) || 0
}

export default function Wallet() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [items, setItems]         = useState<CollectionItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [sportFilter, setSport]   = useState('Todos')
  const [removing, setRemoving]   = useState<number | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login', { state: { from: '/wallet' } }); return }
    loadCollection()
  }, [user, authLoading])

  const loadCollection = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('collection_items')
      .select('*')
      .order('added_at', { ascending: false })
    setItems((data as CollectionItem[]) || [])
    setLoading(false)
  }

  const removeItem = async (id: number) => {
    setRemoving(id)
    await supabase.from('collection_items').delete().eq('id', id)
    setItems((prev) => prev.filter((i) => i.id !== id))
    setRemoving(null)
  }

  const sports = ['Todos', ...Array.from(new Set(items.map((i) => i.sport)))]
  const filtered = sportFilter === 'Todos' ? items : items.filter((i) => i.sport === sportFilter)

  const totalValue = items.reduce((sum, i) => sum + parsePrice(i.price), 0)
  const sportBreakdown = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.sport] = (acc[i.sport] || 0) + 1
    return acc
  }, {})

  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-1">PullStack</p>
          <h1 className="text-4xl font-black text-white mb-1">Mi Colección</h1>
          <p className="text-gray-500 text-sm">Cartas y artículos que has guardado</p>
        </div>

        {/* Stats */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Total piezas</p>
              <p className="text-white font-black text-3xl">{items.length}</p>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Valor estimado</p>
              <p className="text-amber-400 font-black text-2xl">
                ${totalValue >= 1000000 ? `${(totalValue / 1000000).toFixed(1)}M` : totalValue >= 1000 ? `${(totalValue / 1000).toFixed(0)}K` : totalValue.toLocaleString()}
              </p>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-2xl p-4 col-span-2">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Por deporte</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(sportBreakdown).map(([sport, count]) => (
                  <span key={sport} className="flex items-center gap-1 bg-[#1a1a1a] border border-white/5 px-2 py-0.5 rounded-lg text-xs text-gray-300">
                    {SPORT_ICONS[sport] || '🃏'} {sport} <span className="text-amber-400 font-black ml-0.5">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filtro por deporte */}
        {items.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-6">
            {sports.map((s) => (
              <button key={s} onClick={() => setSport(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sportFilter === s ? 'bg-white/10 text-white border border-white/20' : 'text-gray-500 hover:text-gray-300'}`}>
                {SPORT_ICONS[s] || ''} {s}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="text-6xl mb-6">🃏</div>
            <h2 className="text-white font-black text-2xl mb-3">Tu colección está vacía</h2>
            <p className="text-gray-500 text-sm mb-8 max-w-sm">
              Guarda cartas y artículos desde el Explorador para armar tu colección y ver su valor estimado.
            </p>
            <Link to="/marketplace"
              className="bg-amber-500 hover:bg-amber-400 text-black font-black px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/20">
              Explorar el catálogo →
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-600 text-sm mb-5">
              <span className="text-white font-bold">{filtered.length}</span> artículo{filtered.length !== 1 ? 's' : ''}
              {sportFilter !== 'Todos' && <span> en <span className="text-amber-400">{sportFilter}</span></span>}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((item) => (
                <div key={item.id}
                  className="group bg-[#111] border border-white/5 hover:border-amber-500/20 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{SPORT_ICONS[item.sport] || KIND_ICONS[item.kind] || '🃏'}</span>
                      <div>
                        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">{item.sport}</p>
                        <p className="text-[10px] text-gray-600">{item.kind === 'card' ? 'Carta' : item.kind === 'box' ? 'Caja' : 'Accesorio'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={removing === item.id}
                      className="text-gray-600 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100 shrink-0"
                      title="Quitar de colección">
                      {removing === item.id
                        ? <div className="w-4 h-4 border-2 border-red-400/50 border-t-transparent rounded-full animate-spin" />
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                      }
                    </button>
                  </div>

                  {/* Name */}
                  <h3 className="text-white font-black text-sm leading-tight mb-1 line-clamp-2">{item.name}</h3>

                  {/* Price + date */}
                  <div className="flex items-end justify-between mt-3 pt-3 border-t border-white/5">
                    <p className="text-amber-400 font-black text-lg">{item.price}</p>
                    <p className="text-gray-600 text-[10px]">
                      {new Date(item.added_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link to="/marketplace"
                className="inline-flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
                + Agregar más cartas
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
