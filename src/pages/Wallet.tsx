import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// ─── Tipos ────────────────────────────────────────────────────────────────────
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

type MyListing = {
  id: number
  title: string
  description: string | null
  sport: string
  kind: 'card' | 'box' | 'accessory'
  txn_type: 'sale' | 'auction' | 'trade'
  price: string | null
  min_bid: string | null
  grade: string | null
  condition: string | null
  image_url: string | null
  active: boolean
  created_at: string
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const SPORT_ICONS: Record<string, string> = {
  NBA: '🏀', NFL: '🏈', Soccer: '⚽', MLB: '⚾',
  'Pokémon': '🃏', 'One Piece': '🏴‍☠️', General: '🛡️',
}
const SPORT_OPTIONS = ['NBA', 'NFL', 'Soccer', 'MLB', 'Pokémon', 'One Piece', 'General']
const CONDITION_OPTIONS = ['Sin gradear (Raw)', 'Near Mint (NM)', 'Excellent (EX)', 'Very Good (VG)', 'Good (G)']
const KIND_LABEL: Record<string, string>  = { card: 'Carta', box: 'Caja', accessory: 'Accesorio' }
const TXN_LABEL: Record<string, string>   = { sale: 'Venta', auction: 'Subasta', trade: 'Trade' }
const TXN_CSS: Record<string, string>     = {
  sale:    'bg-green-500/15 text-green-400 border-green-500/30',
  auction: 'bg-red-500/15 text-red-400 border-red-500/30',
  trade:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
}
const PRIORITY_CSS: Record<string, string> = {
  high:   'bg-red-500/15 text-red-400 border-red-500/30',
  medium: 'bg-violet-600/15 text-violet-400 border-violet-500/30',
  low:    'bg-gray-500/15 text-gray-400 border-gray-500/30',
}
const PRIORITY_LABEL: Record<string, string> = { high: 'Alta', medium: 'Media', low: 'Baja' }

function parsePrice(p: string): number {
  return parseFloat(p.replace(/[^0-9.]/g, '')) || 0
}

// ─── Formulario nuevo anuncio (inline en Wallet) ──────────────────────────────
function NewListingInline({ user, profile, onCreated }: {
  user: { id: string }
  profile: { display_name?: string | null } | null
  onCreated: (l: MyListing) => void
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', sport: 'NBA',
    kind: 'card' as 'card' | 'box' | 'accessory',
    txn_type: 'sale' as 'sale' | 'auction' | 'trade',
    price: '', min_bid: '', grade: '', condition: 'Sin gradear (Raw)',
  })
  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging,   setIsDragging]   = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [error,        setError]        = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Solo se aceptan imágenes'); return }
    if (file.size > 8 * 1024 * 1024) { setError('Máx. 8MB'); return }
    setError(''); setImageFile(file); setImagePreview(URL.createObjectURL(file))
  }

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }

  const submit = async () => {
    if (!form.title.trim()) { setError('El título es obligatorio'); return }
    if (form.txn_type !== 'trade' && !form.price && !form.min_bid) { setError('Agrega un precio'); return }
    setLoading(true); setError('')

    let image_url: string | null = null
    if (imageFile) {
      setUploading(true)
      const ext  = imageFile.name.split('.').pop() || 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('listing-images').upload(path, imageFile, { upsert: true })
      if (!uploadErr) {
        const { data: u } = supabase.storage.from('listing-images').getPublicUrl(path)
        image_url = u.publicUrl
      }
      setUploading(false)
    }

    const payload = {
      user_id:      user.id,
      display_name: profile?.display_name || user.id.slice(0, 8),
      title:        form.title.trim(),
      description:  form.description.trim() || null,
      sport: form.sport, kind: form.kind, txn_type: form.txn_type,
      price:   form.price   ? `$${form.price}`   : null,
      min_bid: form.min_bid ? `$${form.min_bid}` : null,
      grade:   form.grade.trim() || null,
      condition: form.condition,
      image_url, active: true,
    }
    const { data, error: err } = await supabase.from('listings').insert(payload).select().single()
    setLoading(false)
    if (err) { setError('Error al publicar'); return }
    onCreated(data as MyListing)
    setOpen(false)
    setForm({ title:'', description:'', sport:'NBA', kind:'card', txn_type:'sale', price:'', min_bid:'', grade:'', condition:'Sin gradear (Raw)' })
    setImageFile(null); setImagePreview(null)
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="bg-violet-600 hover:bg-violet-500 text-white font-black px-4 py-2 rounded-xl text-sm transition-all flex items-center gap-1.5 shrink-0">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      Nuevo anuncio
    </button>
  )

  return (
    <div className="bg-[#1a1a36] border border-violet-500/20 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold">Publicar artículo</h3>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {([['sale','🛒','Vender'],['auction','🔨','Subastar'],['trade','🔄','Tradear']] as const).map(([val, ico, lbl]) => (
          <button key={val} onClick={() => set('txn_type', val)}
            className={`py-2.5 rounded-xl text-xs font-black border transition-all flex flex-col items-center gap-0.5 ${
              form.txn_type === val
                ? val === 'sale' ? 'bg-violet-600 border-violet-500 text-white'
                : val === 'auction' ? 'bg-red-500 border-red-500 text-white'
                                    : 'bg-blue-500 border-blue-500 text-white'
                : 'bg-[#21213e] border-white/10 text-gray-500 hover:border-white/20'
            }`}>
            <span>{ico}</span><span>{lbl}</span>
          </button>
        ))}
      </div>

      {/* Foto */}
      <div className="mb-3">
        {imagePreview ? (
          <div className="relative rounded-xl overflow-hidden border border-white/10">
            <div className="w-full bg-[#0d0d1a]" style={{ aspectRatio: '5/7' }}>
              <img src={imagePreview} className="w-full h-full object-contain" alt="preview" />
            </div>
            <button onClick={() => { setImageFile(null); setImagePreview(null) }}
              className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-lg hover:bg-red-500/80 transition-colors">
              ✕ Cambiar
            </button>
            <div className="absolute bottom-2 right-2 bg-green-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Lista</div>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`relative flex items-center justify-center h-20 border-2 border-dashed rounded-xl cursor-pointer select-none transition-all ${
              isDragging
                ? 'border-violet-500 bg-violet-500/10 scale-[1.01]'
                : 'border-white/15 hover:border-violet-500/40 hover:bg-violet-600/5'
            }`}
          >
            {isDragging ? (
              <div className="flex items-center gap-2 pointer-events-none">
                <span className="text-2xl">📸</span>
                <p className="text-violet-400 font-black text-sm">Suelta aquí</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4">
                <svg className="w-5 h-5 text-gray-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-gray-300 text-sm font-bold">Arrastra foto o haz clic</p>
                  <p className="text-gray-600 text-[10px]">JPG · PNG · WEBP · máx. 8MB</p>
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <input value={form.title} onChange={e => set('title', e.target.value)}
          placeholder="Título: jugador, carta, set... *"
          className="w-full bg-[#21213e] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 placeholder-gray-700" />
        <textarea value={form.description} onChange={e => set('description', e.target.value)}
          placeholder="Serial, condición, incluye envío..."
          rows={2}
          className="w-full bg-[#21213e] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 resize-none placeholder-gray-700" />
        <div className="grid grid-cols-2 gap-2">
          <select value={form.sport} onChange={e => set('sport', e.target.value)}
            className="bg-[#21213e] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none">
            {SPORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={form.kind} onChange={e => set('kind', e.target.value as any)}
            className="bg-[#21213e] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none">
            <option value="card">🃏 Carta</option>
            <option value="box">📦 Caja</option>
            <option value="accessory">🛡️ Accesorio</option>
          </select>
          {form.txn_type === 'sale' && (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                placeholder="Precio USD" min="0"
                className="w-full bg-[#21213e] border border-white/10 text-white rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50" />
            </div>
          )}
          {form.txn_type === 'auction' && (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
              <input type="number" value={form.min_bid} onChange={e => set('min_bid', e.target.value)}
                placeholder="Puja mínima USD" min="0"
                className="w-full bg-[#21213e] border border-white/10 text-white rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50" />
            </div>
          )}
          <select value={form.condition} onChange={e => set('condition', e.target.value)}
            className="bg-[#21213e] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none">
            {CONDITION_OPTIONS.map(c => <option key={c}>{c}</option>)}
          </select>
          {form.kind === 'card' && (
            <input value={form.grade} onChange={e => set('grade', e.target.value)}
              placeholder="Grado: PSA 10, BGS 9.5..."
              className="bg-[#21213e] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 placeholder-gray-700" />
          )}
        </div>
      </div>

      {error && <p className="text-red-400 text-xs mt-2 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">{error}</p>}

      <button onClick={submit} disabled={loading || !form.title.trim()}
        className="w-full mt-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-black font-black py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
        {loading
          ? <><div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />{uploading ? 'Subiendo foto...' : 'Publicando...'}</>
          : '📢 Publicar en el Mercado'}
      </button>
    </div>
  )
}

// ─── Wallet ───────────────────────────────────────────────────────────────────
export default function Wallet() {
  const { user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [tab,        setTab]        = useState<'collection' | 'listings' | 'wishlist'>('collection')
  const [items,      setItems]      = useState<CollectionItem[]>([])
  const [wishes,     setWishes]     = useState<WishItem[]>([])
  const [myListings, setMyListings] = useState<MyListing[]>([])
  const [loading,    setLoading]    = useState(true)
  const [sportFilter, setSport]     = useState('Todos')
  const [removing,   setRemoving]   = useState<number | null>(null)

  const [showWishForm, setShowWishForm] = useState(false)
  const [wishName,     setWishName]     = useState('')
  const [wishSport,    setWishSport]    = useState('NBA')
  const [wishNotes,    setWishNotes]    = useState('')
  const [wishMaxPrice, setWishMaxPrice] = useState('')
  const [wishPriority, setWishPriority] = useState<'low'|'medium'|'high'>('medium')
  const [wishSaving,   setWishSaving]   = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login', { state: { from: '/wallet' } }); return }
    loadAll()
  }, [user, authLoading])

  const loadAll = async () => {
    if (!user) return
    setLoading(true)
    const [colRes, wishRes, listRes] = await Promise.all([
      supabase.from('collection_items').select('*').order('added_at', { ascending: false }),
      supabase.from('wishlist_items').select('*').order('added_at', { ascending: false }),
      supabase.from('listings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setItems((colRes.data as CollectionItem[]) || [])
    setWishes((wishRes.data as WishItem[]) || [])
    setMyListings((listRes.data as MyListing[]) || [])
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
      user_id: user.id, name: wishName.trim(), sport: wishSport,
      notes:     wishNotes.trim() || null,
      max_price: wishMaxPrice.trim() ? `$${wishMaxPrice.trim()}` : null,
      priority:  wishPriority,
    }).select().single()
    if (data) setWishes(prev => [data as WishItem, ...prev])
    setWishName(''); setWishNotes(''); setWishMaxPrice(''); setWishPriority('medium')
    setShowWishForm(false); setWishSaving(false)
  }

  const toggleListing = async (id: number, active: boolean) => {
    setRemoving(id)
    await supabase.from('listings').update({ active: !active }).eq('id', id)
    setMyListings(prev => prev.map(l => l.id === id ? { ...l, active: !active } : l))
    setRemoving(null)
  }

  const deleteListing = async (id: number) => {
    setRemoving(id)
    await supabase.from('listings').delete().eq('id', id)
    setMyListings(prev => prev.filter(l => l.id !== id))
    setRemoving(null)
  }

  const totalValue = items.reduce((s, i) => s + parsePrice(i.price), 0)
  const activeAds  = myListings.filter(l => l.active).length
  const sportBreak = items.reduce<Record<string, number>>((acc, i) => { acc[i.sport] = (acc[i.sport] || 0) + 1; return acc }, {})
  const filtered   = sportFilter === 'Todos' ? items : items.filter(i => i.sport === sportFilter)

  if (authLoading || (loading && user)) return (
    <div className="min-h-screen bg-[#111128] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#111128] pt-20 pb-28 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <p className="text-violet-400 text-[10px] font-bold uppercase tracking-widest mb-1">PullStack</p>
          <h1 className="text-4xl font-black text-white mb-1">Mi Portfolio</h1>
          <p className="text-gray-600 text-sm">Colección · Anuncios activos · Lista de deseos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            { label: 'Piezas',     value: items.length.toString(),    sub: '',                                  color: 'text-white' },
            { label: 'Valor est.', value: totalValue === 0 ? '—' : totalValue >= 1e6 ? `$${(totalValue/1e6).toFixed(1)}M` : totalValue >= 1000 ? `$${(totalValue/1000).toFixed(0)}K` : `$${totalValue.toLocaleString()}`, sub: 'USD', color: 'text-violet-400' },
            { label: 'En venta',   value: activeAds.toString(),       sub: myListings.length > activeAds ? `${myListings.length - activeAds} pausados` : '', color: 'text-green-400' },
            { label: 'Deseadas',   value: wishes.length.toString(),   sub: '',                                  color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#1a1a36] border border-white/5 rounded-2xl p-4">
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`font-black text-2xl ${s.color}`}>{s.value}</p>
              {s.sub && <p className="text-gray-600 text-[10px] mt-0.5">{s.sub}</p>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#1a1a36] border border-white/5 rounded-xl p-1 w-fit">
          {([
            ['collection', '🃏', 'Colección',    items.length],
            ['listings',   '📢', 'Mis Anuncios', myListings.length],
            ['wishlist',   '⭐', 'Deseadas',     wishes.length],
          ] as const).map(([id, ico, lbl, cnt]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5 ${tab === id ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              <span>{ico}</span>
              <span className="hidden sm:inline">{lbl}</span>
              {cnt > 0 && <span className={`text-[10px] font-black ${tab === id ? 'text-black/60' : 'text-gray-600'}`}>({cnt})</span>}
            </button>
          ))}
        </div>

        {/* ══════════════════ COLECCIÓN ══════════════════ */}
        {tab === 'collection' && (
          <>
            {Object.keys(sportBreak).length > 0 && (
              <div className="bg-[#1a1a36] border border-white/5 rounded-2xl p-4 mb-5">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Por deporte</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(sportBreak).map(([sport, count]) => (
                    <button key={sport} onClick={() => setSport(sport === sportFilter ? 'Todos' : sport)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all ${sportFilter === sport ? 'bg-violet-500/20 border border-violet-500/30 text-violet-400' : 'bg-[#21213e] border border-white/5 text-gray-400 hover:border-white/10'}`}>
                      {SPORT_ICONS[sport] || '🃏'} {sport} <span className="font-black">{count}</span>
                    </button>
                  ))}
                  {sportFilter !== 'Todos' && (
                    <button onClick={() => setSport('Todos')} className="text-gray-600 hover:text-gray-300 text-xs px-2 transition-colors">✕ Todo</button>
                  )}
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 text-center">
                <div className="text-6xl mb-5">🃏</div>
                <h2 className="text-white font-black text-2xl mb-2">Colección vacía</h2>
                <p className="text-gray-500 text-sm mb-8 max-w-sm">Guarda cartas desde el Mercado con el botón 🔖 para armar tu portfolio.</p>
                <Link to="/marketplace" className="bg-violet-600 hover:bg-violet-500 text-white font-black px-6 py-3 rounded-xl transition-all">
                  Explorar el Mercado →
                </Link>
              </div>
            ) : (
              <>
                <p className="text-gray-600 text-xs mb-4">
                  <span className="text-white font-bold">{filtered.length}</span> artículo{filtered.length !== 1 ? 's' : ''}
                  {sportFilter !== 'Todos' && <span> en <span className="text-violet-400">{sportFilter}</span></span>}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map(item => (
                    <div key={item.id} className="group bg-[#1a1a36] border border-white/5 hover:border-violet-500/20 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{SPORT_ICONS[item.sport] || '🃏'}</span>
                          <div>
                            <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">{item.sport}</p>
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
                        <p className="text-violet-400 font-black text-lg">{item.price}</p>
                        <p className="text-gray-600 text-[10px]">{new Date(item.added_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <Link to="/marketplace" className="inline-flex items-center gap-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-400 font-bold px-5 py-2.5 rounded-xl text-sm transition-all">
                    + Agregar más al portfolio
                  </Link>
                </div>
              </>
            )}
          </>
        )}

        {/* ══════════════════ MIS ANUNCIOS ══════════════════ */}
        {tab === 'listings' && (
          <>
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-white font-bold text-sm">Lo que estás vendiendo o tradeando</p>
                <p className="text-gray-600 text-xs mt-0.5">Aparecen en el Mercado para otros coleccionistas</p>
              </div>
              {user && <NewListingInline user={user} profile={profile} onCreated={l => setMyListings(prev => [l, ...prev])} />}
            </div>

            {myListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 text-center">
                <div className="text-6xl mb-5">📢</div>
                <h2 className="text-white font-black text-2xl mb-2">Sin anuncios</h2>
                <p className="text-gray-500 text-sm mb-8 max-w-sm">Publica cartas, cajas o accesorios para que los coleccionistas de PullStack los encuentren.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myListings.map(listing => (
                  <div key={listing.id} className={`group bg-[#1a1a36] border rounded-2xl overflow-hidden transition-all ${listing.active ? 'border-white/5 hover:border-violet-500/20' : 'border-white/5 opacity-55'}`}>
                    <div className="relative bg-[#0d0d1a] overflow-hidden" style={{ aspectRatio: '5/7' }}>
                      {listing.image_url
                        ? <img src={listing.image_url} alt={listing.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                        : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                            <span className="text-5xl opacity-20">{SPORT_ICONS[listing.sport] || '🃏'}</span>
                            <p className="text-gray-700 text-[10px]">Sin foto</p>
                          </div>
                        )
                      }
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent" />
                      <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${TXN_CSS[listing.txn_type]}`}>
                          {TXN_LABEL[listing.txn_type]}
                        </span>
                        {!listing.active && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30 uppercase">Pausado</span>}
                      </div>
                      {listing.image_url && (
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur text-[10px] text-gray-400 px-2 py-0.5 rounded-lg">
                          {SPORT_ICONS[listing.sport]} {listing.sport}
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="text-white font-black text-sm leading-tight line-clamp-2 mb-1">{listing.title}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-3">
                        {!listing.image_url && <span>{SPORT_ICONS[listing.sport]} {listing.sport}</span>}
                        <span>{KIND_LABEL[listing.kind]}</span>
                        {listing.grade && <><span>·</span><span className="text-violet-400 font-bold">{listing.grade}</span></>}
                        {listing.condition && <><span>·</span><span>{listing.condition.split(' ')[0]}</span></>}
                      </div>

                      <div className="flex items-center justify-between mb-3 pt-2 border-t border-white/5">
                        <p className="text-white font-black text-lg">
                          {listing.txn_type === 'trade' ? 'Trade' : listing.price || listing.min_bid || '—'}
                        </p>
                        <p className="text-gray-600 text-[10px]">
                          {new Date(listing.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => toggleListing(listing.id, listing.active)} disabled={removing === listing.id}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${listing.active ? 'bg-[#21213e] border-white/10 text-gray-400 hover:border-red-500/30 hover:text-red-400' : 'bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/20'}`}>
                          {removing === listing.id
                            ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mx-auto" />
                            : listing.active ? 'Pausar' : '▶ Activar'
                          }
                        </button>
                        <button onClick={() => deleteListing(listing.id)} disabled={removing === listing.id}
                          title="Eliminar anuncio"
                          className="px-3 py-1.5 rounded-lg border border-white/5 text-gray-600 hover:text-red-400 hover:border-red-500/30 transition-all">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7M4 7h16" /></svg>
                        </button>
                        <Link to="/marketplace" title="Ver en Mercado"
                          className="px-3 py-1.5 rounded-lg border border-white/5 text-gray-600 hover:text-violet-400 hover:border-violet-500/30 transition-all flex items-center">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ══════════════════ WISHLIST ══════════════════ */}
        {tab === 'wishlist' && (
          <>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-white font-bold text-sm">Cartas que quieres conseguir</p>
                <p className="text-gray-600 text-xs mt-0.5">Tu lista de objetivos de colección</p>
              </div>
              <button onClick={() => setShowWishForm(!showWishForm)}
                className="bg-violet-600 hover:bg-violet-500 text-white font-black px-4 py-2 rounded-xl text-sm transition-all shrink-0">
                + Agregar
              </button>
            </div>

            {showWishForm && (
              <div className="bg-[#1a1a36] border border-violet-500/20 rounded-2xl p-5 mb-6">
                <h3 className="text-white font-bold mb-4">Nueva carta deseada</h3>
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <div className="sm:col-span-2">
                    <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Carta / Jugador *</label>
                    <input value={wishName} onChange={e => setWishName(e.target.value)}
                      placeholder="Ej. LeBron James RC PSA 10, Charizard 1st Ed..."
                      className="w-full bg-[#21213e] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 placeholder-gray-700" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Deporte</label>
                    <select value={wishSport} onChange={e => setWishSport(e.target.value)}
                      className="w-full bg-[#21213e] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                      {SPORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Precio máximo (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input value={wishMaxPrice} onChange={e => setWishMaxPrice(e.target.value)}
                        placeholder="500" type="number"
                        className="w-full bg-[#21213e] border border-white/10 text-white rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50" />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Notas</label>
                    <input value={wishNotes} onChange={e => setWishNotes(e.target.value)}
                      placeholder="Variante, grado mínimo, condición..."
                      className="w-full bg-[#21213e] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 placeholder-gray-700" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 block">Prioridad</label>
                    <div className="flex gap-2">
                      {(['high','medium','low'] as const).map(p => (
                        <button key={p} onClick={() => setWishPriority(p)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${wishPriority === p ? PRIORITY_CSS[p] : 'bg-[#21213e] border-white/10 text-gray-500'}`}>
                          {PRIORITY_LABEL[p]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowWishForm(false)} className="text-gray-500 hover:text-white text-sm px-4 py-2 transition-colors">Cancelar</button>
                  <button onClick={addWish} disabled={wishSaving || !wishName.trim()}
                    className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-black font-black px-5 py-2 rounded-xl text-sm transition-all">
                    {wishSaving ? 'Guardando...' : 'Agregar'}
                  </button>
                </div>
              </div>
            )}

            {wishes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 text-center">
                <div className="text-6xl mb-5">⭐</div>
                <h2 className="text-white font-black text-2xl mb-2">Lista vacía</h2>
                <p className="text-gray-500 text-sm mb-8 max-w-sm">Agrega las cartas que quieres conseguir para tenerlas siempre a la vista.</p>
                <button onClick={() => setShowWishForm(true)}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-black px-6 py-3 rounded-xl transition-all">
                  + Agregar primera carta
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {wishes.map(w => (
                  <div key={w.id} className="group bg-[#1a1a36] border border-white/5 hover:border-violet-500/20 rounded-2xl p-4 transition-all flex items-center gap-4">
                    <div className="text-2xl shrink-0">{SPORT_ICONS[w.sport] || '🃏'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="text-white font-bold text-sm">{w.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_CSS[w.priority]}`}>{PRIORITY_LABEL[w.priority]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                        <span>{w.sport}</span>
                        {w.max_price && <span>· Máx. <span className="text-violet-400 font-bold">{w.max_price}</span></span>}
                        {w.notes && <span>· {w.notes}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link to="/marketplace"
                        className="bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-400 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hidden sm:block whitespace-nowrap">
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
