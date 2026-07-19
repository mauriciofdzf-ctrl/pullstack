import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getImages } from '../lib/imageConfig'
import CartDrawer, { type CartEntry } from '../components/CartDrawer'
import CheckoutModal from '../components/CheckoutModal'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { CATALOG, type CatalogItem as Item, type CatalogItem } from '../lib/catalog'

type Kind = CatalogItem['kind']

type UserListing = {
  id: number
  user_id: string
  display_name: string
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
  ends_at: string | null
}



// ─── Filtros ──────────────────────────────────────────────────────────────────
const BASE_SPORTS = ['Todos', 'NBA', 'NFL', 'Soccer', 'MLB', 'Pokémon', 'One Piece']
const KINDS   = [
  { label: 'Todo',                value: 'all'       },
  { label: '🃏 Cartas Individuales', value: 'card'   },
  { label: '📦 Cajas Selladas',  value: 'box'        },
  { label: '🛡️ Accesorios',      value: 'accessory'  },
]
const TXNS    = ['Todos', 'Venta', 'Subasta', 'Trading', 'Tienda']
const SORTS   = ['Trending 🔥', 'Precio: Mayor', 'Precio: Menor', 'A–Z']

const txnMap:  Record<string, string>  = { sale:'Venta', auction:'Subasta', trade:'Trading', buy:'Tienda' }
const txnCss:  Record<string, string>  = {
  sale:    'bg-green-500/10 text-green-400 border-green-500/30',
  auction: 'bg-red-500/10 text-red-400 border-red-500/30',
  trade:   'bg-blue-500/10 text-blue-400 border-blue-500/30',
  buy:     'bg-purple-500/10 text-purple-300 border-purple-500/30',
}
const kindIcon: Record<Kind, string> = { card:'🃏', box:'📦', accessory:'🛡️' }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parsePrice(p: string): number {
  return parseFloat(p.replace(/[^0-9.]/g, '')) || 0
}
function cardAttrs(item: Item) {
  const d = item.detail.toLowerCase()
  const isRC     = d.includes(' rc ') || d.includes(' rc·') || d.includes('rc auto') || d.includes('rookie')
  const isAuto   = d.includes('auto')
  const is1of1   = d.includes('1/1') || d.includes('superfractor')
  const numMatch = item.detail.match(/\/ *(\d+)/)
  const numbered = numMatch ? `/${numMatch[1]}` : null
  const [gradeCo, gradeNum] = item.grade ? item.grade.split(' ') : [null, null]
  return { isRC, isAuto, is1of1, numbered, gradeCo, gradeNum }
}

const SPORT_OPTIONS = ['NBA', 'NFL', 'Soccer', 'MLB', 'Pokémon', 'One Piece', 'Magic: The Gathering', 'Dragon Ball', 'Yu-Gi-Oh!', 'General', 'Otra...']
const CONDITION_OPTIONS = ['Sin gradear (Raw)', 'Near Mint (NM)', 'Excellent (EX)', 'Very Good (VG)', 'Good (G)']
const LISTING_SPORT_ICON: Record<string, string> = {
  NBA:'🏀', NFL:'🏈', Soccer:'⚽', MLB:'⚾', 'Pokémon':'🃏', 'One Piece':'🏴‍☠️', General:'🛡️'
}

// ─── Contact Seller Modal ─────────────────────────────────────────────────────
function ContactSellerModal({ listing, actionType, user, profile, onClose }: {
  listing: UserListing
  actionType: 'sale' | 'auction' | 'trade'
  user: { id: string }
  profile: { display_name?: string | null } | null
  onClose: () => void
}) {
  const navigate = useNavigate()
  const defaultMsg = {
    sale:    `Hola ${listing.display_name}! Me interesa tu anuncio "${listing.title}"${listing.price ? ` (${listing.price})` : ''}. ¿Está disponible? ¿Tienes más fotos?`,
    auction: `Hola ${listing.display_name}! Quiero hacer una puja por "${listing.title}". Mi oferta es: `,
    trade:   `Hola ${listing.display_name}! Me interesa "${listing.title}" para un trade. Te ofrezco: `,
  }
  const [message,   setMessage]   = useState(defaultMsg[actionType])
  const [bidAmount, setBidAmount] = useState('')
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)

  const send = async () => {
    if (!message.trim()) return
    setSending(true)
    await supabase.from('direct_messages').insert({
      from_user_id: user.id,
      to_user_id:   listing.user_id,
      from_name:    profile?.display_name || 'Usuario',
      to_name:      listing.display_name,
      content:      actionType === 'auction' && bidAmount ? `${message.trim()} — Puja: $${bidAmount}` : message.trim(),
      listing_id:   listing.id,
      listing_title: listing.title,
      action_type:  actionType,
      bid_amount:   actionType === 'auction' && bidAmount ? `$${bidAmount}` : null,
      read:         false,
    })
    setSending(false); setSent(true)
  }

  const ICON = { sale: '🛒', auction: '🔨', trade: '🔄' }
  const LABEL = { sale: 'Propuesta de compra', auction: 'Enviar puja', trade: 'Propuesta de trade' }
  const COLOR = { sale: 'bg-violet-600 hover:bg-violet-500', auction: 'bg-red-500 hover:bg-red-400', trade: 'bg-blue-500 hover:bg-blue-400' }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-[#1c1835] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {sent ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-white font-black text-xl mb-2">¡Mensaje enviado!</p>
            <p className="text-gray-400 text-sm mb-6">El vendedor recibirá tu mensaje y te responderá pronto.</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 bg-white/5 border border-white/10 text-gray-300 font-bold py-2.5 rounded-xl text-sm transition-all hover:bg-white/10">Cerrar</button>
              <button onClick={() => { onClose(); navigate('/messages') }}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-black py-2.5 rounded-xl text-sm transition-all">
                Ver mensajes →
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{ICON[actionType]} {LABEL[actionType]}</p>
                <p className="text-white font-black text-base truncate">{listing.title}</p>
              </div>
              <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#26213d] border border-white/5 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                  {listing.display_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-gray-400 text-[10px]">Enviando a</p>
                  <p className="text-white font-bold text-sm">{listing.display_name}</p>
                </div>
                {listing.price && <p className="ml-auto text-emerald-400 font-black text-sm">{listing.price}</p>}
              </div>

              {actionType === 'auction' && (
                <div>
                  <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">Tu puja MXN — mínimo</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder="0.00"
                      className="w-full bg-[#26213d] border border-red-500/30 text-white pl-7 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-red-500/60 font-black placeholder-gray-700" />
                  </div>
                  {listing.min_bid && <p className="text-red-400 text-[10px] mt-1">Puja mínima: {listing.min_bid}</p>}
                </div>
              )}

              <div>
                <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">Mensaje</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                  className="w-full bg-[#26213d] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 resize-none placeholder-gray-700" />
              </div>

              <button onClick={send} disabled={sending || !message.trim() || (actionType === 'auction' && !bidAmount)}
                className={`w-full py-3 rounded-xl text-white font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${COLOR[actionType]}`}>
                {sending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {ICON[actionType]} {sending ? 'Enviando...' : LABEL[actionType]}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Publish Modal ────────────────────────────────────────────────────────────
function PublishModal({ onClose, user, profile, onSuccess }: {
  onClose: () => void
  user: { id: string } | null
  profile: { display_name?: string | null } | null
  onSuccess: (listing: UserListing) => void
}) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '',
    sport: 'NBA', custom_sport: '', kind: 'card' as 'card' | 'box' | 'accessory',
    txn_type: 'sale' as 'sale' | 'auction' | 'trade',
    price: '', min_bid: '', reserve_price: '', grade: '', condition: 'Sin gradear (Raw)',
    duration_hours: '72',
  })
  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging,   setIsDragging]   = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [done,         setDone]         = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Solo se aceptan imágenes (JPG, PNG, WEBP)'); return }
    if (file.size > 8 * 1024 * 1024) { setError('La imagen no puede superar 8MB'); return }
    setError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null); setImagePreview(null)
  }

  const submit = async () => {
    if (!user) { onClose(); navigate('/login'); return }
    if (!form.title.trim()) { setError('El título es obligatorio'); return }
    if (form.txn_type !== 'trade' && !form.price && !form.min_bid) {
      setError('Ingresa un precio o puja mínima'); return
    }
    setLoading(true); setError('')

    let image_url: string | null = null
    if (imageFile) {
      setUploading(true)
      const ext  = imageFile.name.split('.').pop() || 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('listing-images').upload(path, imageFile, { upsert: true })
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(path)
        image_url = urlData.publicUrl
      }
      setUploading(false)
    }

    const ends_at = form.txn_type === 'auction'
      ? new Date(Date.now() + parseInt(form.duration_hours) * 3600000).toISOString()
      : null

    const payload = {
      user_id:       user.id,
      display_name:  profile?.display_name || user.id.slice(0, 8),
      title:         form.title.trim(),
      description:   form.description.trim() || null,
      sport:         form.sport === 'Otra...' ? (form.custom_sport.trim() || 'General') : form.sport,
      kind:          form.kind,
      txn_type:      form.txn_type,
      price:         form.price ? `$${form.price}` : null,
      min_bid:       form.min_bid ? `$${form.min_bid}` : null,
      reserve_price: form.reserve_price ? parseFloat(form.reserve_price) : null,
      grade:         form.grade.trim() || null,
      condition:     form.condition,
      image_url,
      active:        true,
      ends_at,
    }
    const { data, error: err } = await supabase.from('listings').insert(payload).select().single()
    setLoading(false)
    if (err) { setError('Error al publicar. Intenta de nuevo.'); return }
    setDone(true)
    setTimeout(() => { onSuccess(data as UserListing); onClose() }, 1600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg bg-[#1c1835] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">
        {done ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-violet-500/20 border border-violet-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-white font-black text-xl mb-1">¡Publicado!</p>
            <p className="text-gray-500 text-sm">Tu anuncio ya está visible en el Mercado.</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <div>
                <p className="text-violet-400 text-[10px] font-bold uppercase tracking-widest">Nuevo anuncio</p>
                <h3 className="text-white font-black text-lg">Publicar en el Mercado</h3>
              </div>
              <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {/* ① Tipo de transacción */}
              <div>
                <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 block">¿Qué quieres hacer?</label>
                <div className="grid grid-cols-3 gap-2">
                  {([['sale','🛒','Vender'],['auction','🔨','Subastar'],['trade','🔄','Tradear']] as const).map(([val, ico, lbl]) => (
                    <button key={val} onClick={() => set('txn_type', val)}
                      className={`py-3 rounded-xl text-sm font-black border transition-all flex flex-col items-center gap-1 ${
                        form.txn_type === val
                          ? val === 'sale'    ? 'bg-violet-600 border-violet-500 text-white'
                          : val === 'auction' ? 'bg-red-500 border-red-500 text-white'
                                              : 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-[#26213d] border-white/10 text-gray-500 hover:border-white/20 hover:text-white'
                      }`}>
                      <span className="text-xl">{ico}</span>
                      <span>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ② Foto — la más importante */}
              <div>
                <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 block">
                  Foto del artículo <span className="text-violet-400">📷</span>
                </label>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                    <div className="w-full bg-[#08061a]" style={{ aspectRatio: '5/7' }}>
                      <img src={imagePreview} alt="preview" className="w-full h-full object-contain" />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <button onClick={removeImage}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Cambiar foto
                      </button>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-green-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Lista</div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-xl cursor-pointer select-none transition-all ${
                      isDragging
                        ? 'border-violet-500 bg-violet-500/10 scale-[1.02]'
                        : 'border-white/15 hover:border-violet-500/50 hover:bg-violet-600/5'
                    }`}
                  >
                    {isDragging ? (
                      <div className="flex flex-col items-center pointer-events-none">
                        <span className="text-4xl mb-2">📸</span>
                        <p className="text-violet-400 font-black text-sm">Suelta aquí</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <svg className="w-9 h-9 text-gray-600 mb-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-300 font-bold text-sm">Arrastra tu foto aquí</p>
                        <p className="text-gray-600 text-[11px] mt-0.5">o haz clic para seleccionar</p>
                        <p className="text-gray-700 text-[10px] mt-1.5 border border-white/8 rounded-full px-3 py-0.5">JPG · PNG · WEBP · máx. 8MB</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                  </div>
                )}
              </div>

              {/* ③ Título */}
              <div>
                <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Título *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="Ej: LeBron James RC 2003 Topps Chrome PSA 9..."
                  className="w-full bg-[#26213d] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 placeholder-gray-700" />
              </div>

              {/* ④ Descripción */}
              <div>
                <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Descripción</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Serial, variante, condición específica, incluye envío, etc..."
                  rows={2}
                  className="w-full bg-[#26213d] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 resize-none placeholder-gray-700" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Categoría */}
                <div className={form.sport === 'Otra...' ? 'col-span-2' : ''}>
                  <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Categoría</label>
                  <select value={form.sport} onChange={e => set('sport', e.target.value)}
                    className="w-full bg-[#26213d] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                    {SPORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  {form.sport === 'Otra...' && (
                    <input value={form.custom_sport} onChange={e => set('custom_sport', e.target.value)}
                      placeholder="Ej: Fútbol Mexicano, Béisbol, Funko Pop..."
                      className="w-full mt-2 bg-[#26213d] border border-violet-500/30 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/60 placeholder-gray-700" />
                  )}
                </div>
                {/* Tipo */}
                <div>
                  <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Tipo</label>
                  <select value={form.kind} onChange={e => set('kind', e.target.value as any)}
                    className="w-full bg-[#26213d] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                    <option value="card">🃏 Carta individual</option>
                    <option value="box">📦 Caja sellada</option>
                    <option value="accessory">🛡️ Accesorio</option>
                  </select>
                </div>

                {/* Precio */}
                {form.txn_type === 'sale' && (
                  <div>
                    <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Precio MXN *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                      <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                        placeholder="500" min="0"
                        className="w-full bg-[#26213d] border border-white/10 text-white rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50" />
                    </div>
                  </div>
                )}

                {/* Puja inicial */}
                {form.txn_type === 'auction' && (
                  <div>
                    <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Puja inicial MXN *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                      <input type="number" value={form.min_bid} onChange={e => set('min_bid', e.target.value)}
                        placeholder="50" min="0"
                        className="w-full bg-[#26213d] border border-red-500/20 text-white rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50" />
                    </div>
                    <p className="text-gray-700 text-[10px] mt-1">Con cuánto arranca la subasta</p>
                  </div>
                )}

                {/* Precio de reserva */}
                {form.txn_type === 'auction' && (
                  <div>
                    <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Precio de reserva MXN</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                      <input type="number" value={form.reserve_price} onChange={e => set('reserve_price', e.target.value)}
                        placeholder="200" min="0"
                        className="w-full bg-[#26213d] border border-amber-500/20 text-white rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500/50" />
                    </div>
                    <p className="text-gray-700 text-[10px] mt-1">Mínimo para que la venta se concrete (oculto a compradores)</p>
                  </div>
                )}

                {/* Duración subasta */}
                {form.txn_type === 'auction' && (
                  <div className="col-span-2">
                    <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 block">Duración de la subasta</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { v: '1',   label: '1h'   },
                        { v: '3',   label: '3h'   },
                        { v: '6',   label: '6h'   },
                        { v: '12',  label: '12h'  },
                        { v: '24',  label: '1 día' },
                        { v: '72',  label: '3 días'},
                        { v: '168', label: '7 días'},
                        { v: '336', label: '14 días'},
                      ].map(({ v, label }) => (
                        <button key={v} type="button" onClick={() => set('duration_hours', v)}
                          className={`py-2 rounded-xl text-xs font-black border transition-all ${
                            form.duration_hours === v
                              ? 'bg-red-500/20 border-red-500/50 text-red-300'
                              : 'bg-[#26213d] border-white/10 text-gray-500 hover:border-white/20 hover:text-white'
                          }`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Condición */}
                <div>
                  <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Condición</label>
                  <select value={form.condition} onChange={e => set('condition', e.target.value)}
                    className="w-full bg-[#26213d] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                    {CONDITION_OPTIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {/* Grado */}
                {form.kind === 'card' && (
                  <div>
                    <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Grado (si aplica)</label>
                    <input value={form.grade} onChange={e => set('grade', e.target.value)}
                      placeholder="PSA 10, BGS 9.5..."
                      className="w-full bg-[#26213d] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 placeholder-gray-700" />
                  </div>
                )}
              </div>

              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}
            </div>

            <div className="px-6 py-4 border-t border-white/5 shrink-0">
              <button onClick={submit} disabled={loading || !form.title.trim()}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                {loading
                  ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />{uploading ? 'Subiendo foto...' : 'Publicando...'}</>
                  : <>📢 Publicar anuncio</>
                }
              </button>
              <p className="text-gray-600 text-[10px] text-center mt-2">Al publicar aceptas que PullStackMX puede moderar anuncios que incumplan las reglas.</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Bid Modal ────────────────────────────────────────────────────────────────
function BidModal({ item, onClose, user, navigate }: {
  item: Item
  onClose: () => void
  user: { id: string } | null
  navigate: ReturnType<typeof useNavigate>
}) {
  const [amount, setAmount]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')
  const minBid = Math.ceil(parsePrice(item.price) * 0.8)

  const submit = async () => {
    if (!user) { onClose(); navigate('/login'); return }
    const n = parseFloat(amount)
    if (isNaN(n) || n < minBid) { setError(`La puja mínima es $${minBid.toLocaleString()} MXN`); return }
    setLoading(true); setError('')
    await supabase.from('messages').insert({
      user_id: user.id,
      content: `🔨 Puja de $${n.toLocaleString()} MXN por "${item.name}" — ${item.detail} (${item.price})`,
      from_admin: false,
    })
    setLoading(false); setDone(true)
    setTimeout(onClose, 1800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-[#1c1835] border border-white/10 rounded-2xl p-6 shadow-2xl">
        {done ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-white font-black text-lg">¡Interés registrado!</p>
            <p className="text-gray-500 text-sm mt-1">El equipo de PullStackMX te contactará por mensajes pronto.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-0.5">Hacer una puja</p>
                <h3 className="text-white font-black text-lg leading-tight">{item.name}</h3>
                <p className="text-gray-500 text-xs">{item.detail.slice(0, 60)}...</p>
              </div>
              <button onClick={onClose} className="text-gray-600 hover:text-white ml-3 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="bg-[#26213d] rounded-xl p-3 mb-4 flex items-center justify-between">
              <span className="text-gray-500 text-xs">Precio listado</span>
              <span className="text-white font-black">{item.price}</span>
            </div>
            <div className="mb-4">
              <label className="text-gray-400 text-xs mb-1.5 block">Tu puja (MXN) — mínimo <span className="text-violet-400 font-bold">${minBid.toLocaleString()}</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setError('') }}
                  placeholder={`${minBid}`} min={minBid}
                  className="w-full bg-[#0c0a1e] border border-white/10 text-white rounded-xl pl-8 pr-4 py-3 text-lg font-black focus:outline-none focus:border-violet-500/50" />
              </div>
              {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
            </div>
            <button onClick={submit} disabled={loading || !amount}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-black py-3 rounded-xl transition-all">
              {loading ? 'Enviando puja...' : '🔨 Confirmar puja'}
            </button>
            <p className="text-gray-600 text-[10px] text-center mt-3">El vendedor decide si acepta. Si ganas, te contactamos por email.</p>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Trade Modal ──────────────────────────────────────────────────────────────
function TradeModal({ item, onClose, user, navigate }: {
  item: Item
  onClose: () => void
  user: { id: string } | null
  navigate: ReturnType<typeof useNavigate>
}) {
  const [offer, setOffer]     = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  const submit = async () => {
    if (!user) { onClose(); navigate('/login'); return }
    if (!offer.trim()) return
    setLoading(true)
    await supabase.from('messages').insert({
      user_id: user.id,
      content: `📦 Propuesta de Trade para "${item.name}" (${item.price})\n\nLo que ofrezco: ${offer}`,
      from_admin: false,
    })
    setLoading(false); setDone(true)
    setTimeout(onClose, 1800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-[#1c1835] border border-white/10 rounded-2xl p-6 shadow-2xl">
        {done ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-white font-black text-lg">¡Propuesta enviada!</p>
            <p className="text-gray-500 text-sm mt-1">Revisa tus mensajes para la respuesta.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-0.5">Proponer Trade</p>
                <h3 className="text-white font-black text-lg leading-tight">{item.name}</h3>
                <p className="text-gray-500 text-xs">{item.price}</p>
              </div>
              <button onClick={onClose} className="text-gray-600 hover:text-white ml-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mb-4">
              <label className="text-gray-400 text-xs mb-1.5 block">¿Qué ofreces a cambio?</label>
              <textarea value={offer} onChange={e => setOffer(e.target.value)}
                placeholder="Ej: Mahomes RC PSA 9 + $500 USD en efectivo..."
                rows={4}
                className="w-full bg-[#26213d] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 resize-none" />
            </div>
            <button onClick={submit} disabled={loading || !offer.trim()}
              className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-white font-black py-3 rounded-xl transition-all">
              {loading ? 'Enviando...' : 'Enviar propuesta de trade'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function Marketplace() {
  const { user, profile, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [sport,  setSport]  = useState('Todos')
  const [kind,   setKind]   = useState('all')
  const [txn,    setTxn]    = useState('Todos')
  const [query,  setQuery]  = useState('')
  const [sort,   setSort]   = useState('Trending 🔥')
  const [cart,       setCart]       = useState<CartEntry[]>([])
  const [cartOpen,   setCartOpen]   = useState(false)
  const [savedIds,   setSavedIds]   = useState<Set<number>>(new Set())
  const [savingId,   setSavingId]   = useState<number | null>(null)
  const showMXN = true
  const [bidItem,       setBidItem]       = useState<Item | null>(null)
  const [tradeItem,     setTradeItem]     = useState<Item | null>(null)
  const [listings,      setListings]      = useState<UserListing[]>([])
  const [showPublish,   setShowPublish]   = useState(false)
  const [deletingId,    setDeletingId]    = useState<number | null>(null)
  const [contactModal,  setContactModal]  = useState<{ listing: UserListing; action: 'sale' | 'auction' | 'trade' } | null>(null)
  const [checkoutModal, setCheckoutModal] = useState<UserListing | null>(null)
  const [showCatalog,   setShowCatalog]   = useState(true)
  const [hiddenIds,     setHiddenIds]     = useState<Set<number>>(new Set())
  const [extraItems,    setExtraItems]    = useState<Item[]>([])
  const [minPrice,      setMinPrice]      = useState('')
  const [maxPrice,      setMaxPrice]      = useState('')
  const [showCatalogForm, setShowCatalogForm] = useState(false)
  const [catalogForm, setCatalogForm] = useState({ name:'', detail:'', sport:'NBA', kind:'card', txn:'sale', price:'', sub:'', brand:'', grade:'', badge:'', imageUrl:'' })
  const [catalogFormSaving, setCatalogFormSaving] = useState(false)

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'show_catalog').single()
      .then(({ data }) => { if (data) setShowCatalog(data.value !== 'false') })
    supabase.from('settings').select('value').eq('key', 'catalog_hidden').maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          try { setHiddenIds(new Set(JSON.parse(data.value) as number[])) } catch { /* noop */ }
        }
      })
    supabase.from('settings').select('value').eq('key', 'catalog_extra').maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          try { setExtraItems(JSON.parse(data.value) as Item[]) } catch { /* noop */ }
        }
      })
  }, [])

  const MXN_RATE = 17.5
  const fmtMXN = (usdStr: string) => {
    const n = parsePrice(usdStr)
    if (!n) return usdStr
    const mxn = n * MXN_RATE
    return mxn >= 1000000 ? `$${(mxn / 1000000).toFixed(1)}M MXN` :
           mxn >= 1000    ? `$${Math.round(mxn / 1000)}K MXN` :
           `$${Math.round(mxn).toLocaleString()} MXN`
  }
  const displayPrice = (p: string) => showMXN ? fmtMXN(p) : p

  const IMG = useMemo(() => getImages(), [])

  useEffect(() => {
    if (!user) { setSavedIds(new Set()); return }
    supabase.from('collection_items').select('catalog_id').eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setSavedIds(new Set(data.map((d) => d.catalog_id as number)))
      })
  }, [user])

  useEffect(() => {
    supabase.from('listings').select('*').eq('active', true).order('created_at', { ascending: false })
      .then(({ data }) => setListings((data as UserListing[]) || []))
  }, [])

  const dynamicSports = useMemo(() => {
    const fromListings = listings.map(l => l.sport).filter(s => s && s !== 'General' && !BASE_SPORTS.includes(s))
    const unique = [...new Set(fromListings)]
    return [...BASE_SPORTS, ...unique]
  }, [listings])

  const deleteMyListing = async (id: number) => {
    if (!confirm('¿Retirar este anuncio del mercado?')) return
    setDeletingId(id)
    await supabase.from('listings').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.id !== id))
    setDeletingId(null)
  }


  const toggleCollection = async (item: typeof CATALOG[0]) => {
    if (!user) return
    const isSaved = savedIds.has(item.id)
    setSavingId(item.id)
    if (isSaved) {
      await supabase.from('collection_items').delete().eq('user_id', user.id).eq('catalog_id', item.id)
      setSavedIds((prev) => { const s = new Set(prev); s.delete(item.id); return s })
    } else {
      await supabase.from('collection_items').insert({
        user_id: user.id, catalog_id: item.id, name: item.name,
        sport: item.sport, kind: item.kind, price: item.price,
      })
      setSavedIds((prev) => new Set(prev).add(item.id))
    }
    setSavingId(null)
  }

  const minP = minPrice ? parseFloat(minPrice) : null
  const maxP = maxPrice ? parseFloat(maxPrice) : null

  const filteredListings = listings.filter(l => {
    const ms = sport === 'Todos' || l.sport === sport || l.sport === 'General'
    const mk = kind  === 'all'   || l.kind === kind
    const mt = txn   === 'Todos' || (txn === 'Venta' && l.txn_type === 'sale') || (txn === 'Subasta' && l.txn_type === 'auction') || (txn === 'Trading' && l.txn_type === 'trade')
    const mq = !query || l.title.toLowerCase().includes(query.toLowerCase()) || (l.description || '').toLowerCase().includes(query.toLowerCase())
    const p  = parsePrice(l.price || l.min_bid || '0')
    const mpMin = minP === null || p >= minP
    const mpMax = maxP === null || p <= maxP
    return ms && mk && mt && mq && mpMin && mpMax
  })

  const allCatalog = [...CATALOG.filter(item => !hiddenIds.has(item.id)), ...extraItems]

  let results = allCatalog.filter((item) => {
    const ms = sport === 'Todos' || item.sport === sport || item.sport === 'General'
    const mk = kind  === 'all'   || item.kind  === kind
    const mt = txn   === 'Todos' || txnMap[item.txn] === txn
    const mq = !query || item.name.toLowerCase().includes(query.toLowerCase()) || item.brand.toLowerCase().includes(query.toLowerCase()) || item.detail.toLowerCase().includes(query.toLowerCase())
    const p  = parsePrice(item.price)
    const mpMin = minP === null || p >= minP
    const mpMax = maxP === null || p <= maxP
    return ms && mk && mt && mq && mpMin && mpMax
  })

  if (sort === 'Precio: Mayor') results = [...results].sort((a, b) => parsePrice(b.price) - parsePrice(a.price))
  if (sort === 'Precio: Menor') results = [...results].sort((a, b) => parsePrice(a.price) - parsePrice(b.price))
  if (sort === 'A–Z')           results = [...results].sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'Trending 🔥')   results = [...results].sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0))

  const addCatalogItem = async () => {
    if (!catalogForm.name.trim() || !catalogForm.price.trim()) return
    setCatalogFormSaving(true)
    const newItem = { ...catalogForm, id: Date.now(), imgKey: 'nba1' } as Item
    const next = [...extraItems, newItem]
    setExtraItems(next)
    await supabase.from('settings').upsert({ key: 'catalog_extra', value: JSON.stringify(next), updated_at: new Date().toISOString() })
    setCatalogForm({ name:'', detail:'', sport:'NBA', kind:'card', txn:'sale', price:'', sub:'', brand:'', grade:'', badge:'', imageUrl:'' })
    setShowCatalogForm(false)
    setCatalogFormSaving(false)
  }

  const cartCount = cart.length

  const deleteExtraItem = async (id: number) => {
    const next = extraItems.filter(i => i.id !== id)
    setExtraItems(next)
    await supabase.from('settings').upsert({ key: 'catalog_extra', value: JSON.stringify(next), updated_at: new Date().toISOString() })
  }

  const isExtraItem = (id: number) => extraItems.some(i => i.id === id)

  const addToCart = (item: typeof CATALOG[0]) => {
    setCart((c) => [...c, { id: item.id, name: item.name, price: item.price, kind: item.kind, txn: item.txn }])
  }
  const removeOneFromCart = (id: number) => {
    setCart((c) => {
      const idx = c.findIndex((x) => x.id === id)
      if (idx === -1) return c
      return [...c.slice(0, idx), ...c.slice(idx + 1)]
    })
  }

  return (
    <div className="min-h-screen bg-[#0c0a1e] pt-20 pb-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-400 bg-clip-text text-transparent">Mercado</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => user ? setShowPublish(true) : navigate('/login')}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-black px-4 py-2.5 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-amber-500/25">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              <span className="hidden sm:inline">Publicar</span>
            </button>
            <button onClick={() => setCartOpen(true)}
              className="flex items-center gap-2 bg-[#1c1835] border border-white/10 hover:border-violet-500/30 text-white px-4 py-2.5 rounded-xl transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="text-sm font-bold hidden sm:inline">Carrito</span>
              {cartCount > 0 && (
                <span className="bg-violet-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative mb-5">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar carta, jugador, caja, marca... (ej: Charizard, Flagg, Topps, Prizm)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#1c1835] border border-white/10 text-white placeholder-gray-600 pl-11 pr-4 py-3.5 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Secciones destacadas ── */}
        <div className="grid grid-cols-3 gap-3 mb-7">
          {[
            { k: 'card',      icon: '🃏', label: 'Cartas',         color: 'violet', sub: 'Individuales · Gradeadas' },
            { k: 'box',       icon: '📦', label: 'Cajas Selladas',  color: 'amber',  sub: 'NBA · NFL · Soccer · TCG' },
            { k: 'accessory', icon: '🛡️', label: 'Accesorios',      color: 'emerald', sub: 'Sleeves · Toploaders · Binders' },
          ].map(s => (
            <button key={s.k} onClick={() => setKind(kind === s.k ? 'all' : s.k)}
              className={`rounded-2xl p-4 border transition-all text-left group ${
                kind === s.k
                  ? s.color === 'violet'  ? 'bg-violet-600/20 border-violet-500/50'
                  : s.color === 'amber'   ? 'bg-amber-500/20 border-amber-500/50'
                                          : 'bg-emerald-500/20 border-emerald-500/50'
                  : 'bg-[#1c1835] border-white/5 hover:border-white/15'
              }`}>
              <p className="text-2xl mb-1.5">{s.icon}</p>
              <p className={`font-black text-sm ${kind === s.k ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{s.label}</p>
              <p className={`text-[10px] mt-0.5 ${kind === s.k ? 'text-gray-300' : 'text-gray-600'}`}>{s.sub}</p>
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="space-y-3 mb-8">
          {/* Tipo de producto */}
          <div className="flex gap-2 flex-wrap">
            {KINDS.map((k) => (
              <button key={k.value} onClick={() => setKind(k.value)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${kind === k.value ? 'bg-violet-600 text-white' : 'bg-[#1c1835] border border-white/10 text-gray-400 hover:border-violet-500/30 hover:text-violet-400'}`}>
                {k.label}
              </button>
            ))}
            <div className="h-8 w-px bg-white/10 self-center mx-1 hidden sm:block" />
            {/* Tipo de transacción */}
            {TXNS.map((t) => (
              <button key={t} onClick={() => setTxn(t)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${txn === t ? 'bg-violet-600 text-white' : 'bg-[#1c1835] border border-white/10 text-gray-400 hover:border-violet-500/30 hover:text-violet-400'}`}>
                {t}
              </button>
            ))}
          </div>
          {/* Categoría + Sort */}
          <div className="flex gap-2 flex-wrap items-center">
            {dynamicSports.map((s) => (
              <button key={s} onClick={() => setSport(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sport === s ? 'bg-white/10 text-white border border-white/20' : 'text-gray-500 hover:text-gray-300'}`}>
                {s}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="bg-[#1c1835] border border-white/10 text-gray-400 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-violet-500/50">
                {SORTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {/* Rango de precio */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-600 text-xs font-bold uppercase tracking-widest">Precio MXN:</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs">$</span>
              <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Mín"
                className="bg-[#1c1835] border border-white/10 text-white pl-6 pr-3 py-1.5 rounded-lg text-xs w-24 focus:outline-none focus:border-violet-500/40 placeholder-gray-700" />
            </div>
            <span className="text-gray-700 text-xs">—</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs">$</span>
              <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Máx"
                className="bg-[#1c1835] border border-white/10 text-white pl-6 pr-3 py-1.5 rounded-lg text-xs w-24 focus:outline-none focus:border-violet-500/40 placeholder-gray-700" />
            </div>
            {(minPrice || maxPrice) && (
              <button onClick={() => { setMinPrice(''); setMaxPrice('') }} className="text-xs text-gray-600 hover:text-gray-300 transition-colors">✕ limpiar</button>
            )}
          </div>
        </div>

        {/* ── Área de productos con decoración ── */}
        <div className="relative">

          {/* ── Rayos eléctricos decorativos ── */}

          {/* ESQUINA INFERIOR-IZQUIERDA — naranja */}
          <div className="absolute -bottom-6 -left-5 w-36 h-52 pointer-events-none select-none">
            <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full" style={{background:'radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)'}}/>
            <svg viewBox="0 0 90 130" className="absolute inset-0 w-full h-full" fill="none" style={{filter:'drop-shadow(0 0 4px #f97316) drop-shadow(0 0 12px #ea580c) drop-shadow(0 0 22px #c2410c)'}}>
              <path d="M22,130 L36,78 L23,68 L46,12 L40,48 L60,42 L42,94 L55,90 L25,130Z" fill="#f97316" opacity="0.75"/>
              <path d="M24,130 L37,80 L25,71 L47,16 L41,50 L59,45 L43,95 L54,91 L27,130Z" fill="#fed7aa" opacity="0.45"/>
              <line x1="46" y1="12" x2="66" y2="2" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6" strokeLinecap="round"/>
              <line x1="60" y1="42" x2="78" y2="32" stroke="#f97316" strokeWidth="1.2" opacity="0.5" strokeLinecap="round"/>
              <line x1="55" y1="90" x2="70" y2="82" stroke="#fb923c" strokeWidth="1" opacity="0.4" strokeLinecap="round"/>
              {/* rayo secundario */}
              <path d="M58,130 L65,100 L59,95 L70,70" stroke="#f97316" strokeWidth="1.5" opacity="0.35" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* ESQUINA INFERIOR-DERECHA — naranja */}
          <div className="absolute -bottom-6 -right-5 w-36 h-52 pointer-events-none select-none" style={{transform:'scaleX(-1)'}}>
            <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full" style={{background:'radial-gradient(circle, rgba(249,115,22,0.25) 0%, transparent 70%)'}}/>
            <svg viewBox="0 0 90 130" className="absolute inset-0 w-full h-full" fill="none" style={{filter:'drop-shadow(0 0 4px #f97316) drop-shadow(0 0 12px #ea580c) drop-shadow(0 0 22px #c2410c)'}}>
              <path d="M22,130 L36,78 L23,68 L46,12 L40,48 L60,42 L42,94 L55,90 L25,130Z" fill="#f97316" opacity="0.75"/>
              <path d="M24,130 L37,80 L25,71 L47,16 L41,50 L59,45 L43,95 L54,91 L27,130Z" fill="#fed7aa" opacity="0.45"/>
              <line x1="46" y1="12" x2="66" y2="2" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6" strokeLinecap="round"/>
              <line x1="60" y1="42" x2="78" y2="32" stroke="#f97316" strokeWidth="1.2" opacity="0.5" strokeLinecap="round"/>
              <line x1="55" y1="90" x2="70" y2="82" stroke="#fb923c" strokeWidth="1" opacity="0.4" strokeLinecap="round"/>
              <path d="M58,130 L65,100 L59,95 L70,70" stroke="#f97316" strokeWidth="1.5" opacity="0.35" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* ESQUINA SUPERIOR-IZQUIERDA — morado */}
          <div className="absolute -top-6 -left-5 w-32 h-44 pointer-events-none select-none" style={{transform:'rotate(180deg)'}}>
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full" style={{background:'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)'}}/>
            <svg viewBox="0 0 80 110" className="absolute inset-0 w-full h-full" fill="none" style={{filter:'drop-shadow(0 0 4px #7c3aed) drop-shadow(0 0 10px #6d28d9) drop-shadow(0 0 20px #4c1d95)'}}>
              <path d="M18,110 L30,64 L19,56 L38,8 L33,40 L50,35 L35,78 L46,74 L20,110Z" fill="#8b5cf6" opacity="0.75"/>
              <path d="M20,110 L31,66 L21,58 L39,10 L34,42 L49,37 L36,79 L45,75 L22,110Z" fill="#ddd6fe" opacity="0.4"/>
              <line x1="38" y1="8" x2="56" y2="0" stroke="#c4b5fd" strokeWidth="1.5" opacity="0.55" strokeLinecap="round"/>
              <line x1="50" y1="35" x2="65" y2="26" stroke="#7c3aed" strokeWidth="1" opacity="0.45" strokeLinecap="round"/>
            </svg>
          </div>

          {/* ESQUINA SUPERIOR-DERECHA — morado */}
          <div className="absolute -top-6 -right-5 w-32 h-44 pointer-events-none select-none" style={{transform:'rotate(180deg) scaleX(-1)'}}>
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full" style={{background:'radial-gradient(circle, rgba(139,92,246,0.22) 0%, transparent 70%)'}}/>
            <svg viewBox="0 0 80 110" className="absolute inset-0 w-full h-full" fill="none" style={{filter:'drop-shadow(0 0 4px #7c3aed) drop-shadow(0 0 10px #6d28d9) drop-shadow(0 0 20px #4c1d95)'}}>
              <path d="M18,110 L30,64 L19,56 L38,8 L33,40 L50,35 L35,78 L46,74 L20,110Z" fill="#8b5cf6" opacity="0.75"/>
              <path d="M20,110 L31,66 L21,58 L39,10 L34,42 L49,37 L36,79 L45,75 L22,110Z" fill="#ddd6fe" opacity="0.4"/>
              <line x1="38" y1="8" x2="56" y2="0" stroke="#c4b5fd" strokeWidth="1.5" opacity="0.55" strokeLinecap="round"/>
              <line x1="50" y1="35" x2="65" y2="26" stroke="#7c3aed" strokeWidth="1" opacity="0.45" strokeLinecap="round"/>
            </svg>
          </div>

          {/* LADO IZQUIERDO superior — morado */}
          <div className="absolute top-1/4 -left-5 w-20 h-32 pointer-events-none select-none">
            <svg viewBox="0 0 50 80" className="w-full h-full" fill="none" style={{filter:'drop-shadow(0 0 3px #7c3aed) drop-shadow(0 0 8px #6d28d9)'}}>
              <path d="M12,80 L20,50 L13,44 L26,8 L22,30 L34,26 L24,56 L31,53 L14,80Z" fill="#8b5cf6" opacity="0.6"/>
            </svg>
          </div>
          {/* LADO IZQUIERDO inferior — naranja */}
          <div className="absolute top-2/3 -left-4 w-14 h-24 pointer-events-none select-none">
            <svg viewBox="0 0 40 60" className="w-full h-full" fill="none" style={{filter:'drop-shadow(0 0 3px #f97316) drop-shadow(0 0 7px #ea580c)'}}>
              <path d="M8,60 L15,37 L9,32 L20,4 L17,22 L27,19 L18,42 L24,39 L10,60Z" fill="#f97316" opacity="0.5"/>
            </svg>
          </div>

          {/* LADO DERECHO superior — naranja */}
          <div className="absolute top-1/4 -right-5 w-20 h-32 pointer-events-none select-none" style={{transform:'scaleX(-1)'}}>
            <svg viewBox="0 0 50 80" className="w-full h-full" fill="none" style={{filter:'drop-shadow(0 0 3px #f97316) drop-shadow(0 0 8px #ea580c)'}}>
              <path d="M12,80 L20,50 L13,44 L26,8 L22,30 L34,26 L24,56 L31,53 L14,80Z" fill="#f97316" opacity="0.55"/>
            </svg>
          </div>
          {/* LADO DERECHO inferior — morado */}
          <div className="absolute top-2/3 -right-4 w-14 h-24 pointer-events-none select-none" style={{transform:'scaleX(-1)'}}>
            <svg viewBox="0 0 40 60" className="w-full h-full" fill="none" style={{filter:'drop-shadow(0 0 3px #7c3aed) drop-shadow(0 0 7px #6d28d9)'}}>
              <path d="M8,60 L15,37 L9,32 L20,4 L17,22 L27,19 L18,42 L24,39 L10,60Z" fill="#8b5cf6" opacity="0.5"/>
            </svg>
          </div>

          {/* CENTRO TOP — rayo horizontal naranja */}
          <div className="absolute -top-4 left-1/4 w-28 h-10 pointer-events-none select-none">
            <svg viewBox="0 0 110 40" className="w-full h-full" fill="none" style={{filter:'drop-shadow(0 0 3px #f97316) drop-shadow(0 0 8px #ea580c)'}}>
              <path d="M0,30 L25,18 L20,14 L50,2 L42,12 L60,8 L38,22 L48,18 L25,32 Z" fill="#f97316" opacity="0.5"/>
              <path d="M55,38 L75,24 L70,20 L95,10 L88,20 L105,16" stroke="#fb923c" strokeWidth="1.2" opacity="0.35" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {/* CENTRO TOP — rayo horizontal morado */}
          <div className="absolute -top-4 right-1/4 w-28 h-10 pointer-events-none select-none" style={{transform:'scaleX(-1)'}}>
            <svg viewBox="0 0 110 40" className="w-full h-full" fill="none" style={{filter:'drop-shadow(0 0 3px #7c3aed) drop-shadow(0 0 8px #6d28d9)'}}>
              <path d="M0,30 L25,18 L20,14 L50,2 L42,12 L60,8 L38,22 L48,18 L25,32 Z" fill="#8b5cf6" opacity="0.5"/>
              <path d="M55,38 L75,24 L70,20 L95,10 L88,20 L105,16" stroke="#a78bfa" strokeWidth="1.2" opacity="0.35" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

        {/* ── Anuncios de usuarios ────────────────────────────── */}
        {filteredListings.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Anuncios de usuarios</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredListings.map(listing => {
                const txnLabel = listing.txn_type === 'sale' ? 'Venta' : listing.txn_type === 'auction' ? 'Subasta' : 'Trade'
                const txnColor = listing.txn_type === 'sale' ? 'bg-green-500/10 text-green-400 border-green-500/30' : listing.txn_type === 'auction' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                const displayListing = listing.price || listing.min_bid || (listing.txn_type === 'trade' ? 'A convenir' : '—')
                const isOwner = user?.id === listing.user_id
                return (
                  <div key={listing.id} onClick={() => navigate(`/listing/${listing.id}`)}
                    className="group relative rounded-2xl overflow-hidden transition-all hover:-translate-y-1 cursor-pointer"
                    style={{
                      padding: '3px',
                      background: 'linear-gradient(135deg, #f97316 0%, #a855f7 40%, #f97316 70%, #7c3aed 100%)',
                      boxShadow: '0 0 18px rgba(249,115,22,0.25), 0 0 32px rgba(139,92,246,0.2)',
                    }}>
                    {/* Inner card surface */}
                    <div className="relative bg-[#1c1835] rounded-xl overflow-hidden h-full">
                    {/* Visual header */}
                    <div className="relative bg-[#08061a] flex items-center justify-center overflow-hidden" style={{ aspectRatio: '5/7' }}>
                      {listing.image_url
                        ? <img src={listing.image_url} alt={listing.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                        : (
                          <div className="flex flex-col items-center gap-2 opacity-25 select-none pointer-events-none">
                            <span className="text-6xl">{LISTING_SPORT_ICON[listing.sport] || '🃏'}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sin foto</span>
                          </div>
                        )
                      }
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a1e]/80 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                        <span className="bg-violet-600/90 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Particular</span>
                        {listing.grade && <span className="bg-black/70 backdrop-blur text-violet-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-violet-500/30">{listing.grade}</span>}
                      </div>
                      <div className={`absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${txnColor}`}>{txnLabel}</div>
                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">{LISTING_SPORT_ICON[listing.sport]} {listing.sport}</span>
                        <span className="text-[10px] text-gray-600">{listing.kind === 'card' ? '🃏' : listing.kind === 'box' ? '📦' : '🛡️'}</span>
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-violet-400 text-[10px] font-bold uppercase tracking-widest mb-0.5 truncate">{listing.display_name}</p>
                      <h3 className="text-white font-black text-sm leading-tight mb-1 line-clamp-2">{listing.title}</h3>
                      {listing.description && <p className="text-gray-600 text-[10px] leading-relaxed mb-3 line-clamp-2">{listing.description}</p>}
                      {listing.condition && !listing.description && <p className="text-gray-600 text-[10px] mb-3">{listing.condition}</p>}

                      <div className="flex items-end justify-between gap-2 mb-3">
                        <div>
                          <p className="text-white font-black text-lg leading-none">{displayListing}</p>
                          {listing.txn_type === 'auction' && listing.min_bid && <p className="text-gray-600 text-[10px]">Puja mín.</p>}
                          {listing.condition && listing.grade && <p className="text-gray-500 text-[10px]">{listing.condition}</p>}
                        </div>
                        {isOwner && (
                          <button onClick={e => { e.stopPropagation(); deleteMyListing(listing.id) }} disabled={deletingId === listing.id}
                            title="Retirar anuncio"
                            className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20">
                            {deletingId === listing.id
                              ? <div className="w-3.5 h-3.5 border border-red-400/50 border-t-transparent rounded-full animate-spin" />
                              : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            }
                          </button>
                        )}
                      </div>

                      {listing.kind === 'card' ? (
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            onClick={e => { e.stopPropagation(); if (!user) { navigate('/login'); return }; if (listing.txn_type === 'sale') setCheckoutModal(listing); else navigate(`/listing/${listing.id}`) }}
                            className={`py-2 rounded-lg text-[11px] font-bold transition-all text-center ${listing.txn_type === 'sale' ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-[#26213d] border border-white/10 text-gray-500 hover:border-violet-500/30 hover:text-violet-400'}`}>
                            🛒 Comprar
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/listing/${listing.id}`) }}
                            className={`py-2 rounded-lg text-[11px] font-bold transition-all text-center ${listing.txn_type === 'auction' ? 'bg-red-500/80 hover:bg-red-500 text-white' : 'bg-[#26213d] border border-white/10 text-gray-500 hover:border-red-500/30 hover:text-red-400'}`}>
                            🔨 Pujar
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/listing/${listing.id}`) }}
                            className={`py-2 rounded-lg text-[11px] font-bold transition-all text-center ${listing.txn_type === 'trade' ? 'bg-blue-500/80 hover:bg-blue-500 text-white' : 'bg-[#26213d] border border-white/10 text-gray-500 hover:border-blue-500/30 hover:text-blue-400'}`}>
                            🔄 Trade
                          </button>
                        </div>
                      ) : (
                        <button onClick={e => { e.stopPropagation(); navigate(`/listing/${listing.id}`) }}
                          className="w-full bg-violet-500/10 hover:bg-violet-600 border border-violet-500/30 hover:border-violet-500 text-violet-400 hover:text-white font-bold py-2 px-3 rounded-lg text-xs transition-all">
                          Ver detalle →
                        </button>
                      )}
                    </div>
                    </div>{/* /inner card surface */}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Catálogo PullStackMX ──────────────────────────────── */}
        {!showCatalog && (
          <div className="text-center py-16 text-gray-600">
            <p className="text-4xl mb-3">🃏</p>
            <p className="font-bold">Solo se muestran anuncios de usuarios</p>
          </div>
        )}
        {showCatalog && (
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Catálogo PullStackMX</span>
              <div className="flex-1 h-px bg-white/5" />
              {isAdmin && (
                <button onClick={() => setShowCatalogForm(v => !v)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all shrink-0 ${showCatalogForm ? 'bg-amber-500 text-black border-amber-500' : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'}`}>
                  {showCatalogForm ? '✕' : '+ Agregar'}
                </button>
              )}
            </div>

            {showCatalogForm && isAdmin && (
              <div className="mt-4 bg-[#13102a] border border-amber-500/20 rounded-2xl p-5 space-y-3">
                <p className="text-amber-400 text-sm font-black">Agregar item al catálogo</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Nombre *</label>
                    <input value={catalogForm.name} onChange={e => setCatalogForm(f => ({...f, name: e.target.value}))}
                      placeholder="Ej: Luka Dončić RC Auto"
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Precio *</label>
                    <input value={catalogForm.price} onChange={e => setCatalogForm(f => ({...f, price: e.target.value}))}
                      placeholder="$1,200"
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Detalle</label>
                    <input value={catalogForm.detail} onChange={e => setCatalogForm(f => ({...f, detail: e.target.value}))}
                      placeholder="Ej: 2018-19 Panini Prizm RC Silver"
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Sport</label>
                    <select value={catalogForm.sport} onChange={e => setCatalogForm(f => ({...f, sport: e.target.value}))}
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50">
                      {['NBA','NFL','Soccer','MLB','Pokémon','One Piece','General'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Tipo</label>
                    <select value={catalogForm.kind} onChange={e => setCatalogForm(f => ({...f, kind: e.target.value}))}
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50">
                      <option value="card">Carta</option>
                      <option value="box">Caja</option>
                      <option value="accessory">Accesorio</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Transacción</label>
                    <select value={catalogForm.txn} onChange={e => setCatalogForm(f => ({...f, txn: e.target.value}))}
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50">
                      <option value="sale">Venta</option>
                      <option value="auction">Subasta</option>
                      <option value="trade">Trading</option>
                      <option value="buy">Tienda</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Marca / Set</label>
                    <input value={catalogForm.brand} onChange={e => setCatalogForm(f => ({...f, brand: e.target.value}))}
                      placeholder="Panini Prizm 2018"
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Grado</label>
                    <input value={catalogForm.grade} onChange={e => setCatalogForm(f => ({...f, grade: e.target.value}))}
                      placeholder="PSA 10"
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Badge</label>
                    <input value={catalogForm.badge} onChange={e => setCatalogForm(f => ({...f, badge: e.target.value}))}
                      placeholder="🔥 Hot"
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">Sub-texto</label>
                    <input value={catalogForm.sub} onChange={e => setCatalogForm(f => ({...f, sub: e.target.value}))}
                      placeholder="Raw ~$300"
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-gray-500 text-[11px] uppercase tracking-wide block mb-1">URL de imagen</label>
                    <input value={catalogForm.imageUrl} onChange={e => setCatalogForm(f => ({...f, imageUrl: e.target.value}))}
                      placeholder="https://... (opcional)"
                      className="w-full bg-[#1c1835] border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500/50 placeholder-gray-700 font-mono" />
                  </div>
                </div>
                <button onClick={addCatalogItem} disabled={catalogFormSaving || !catalogForm.name.trim() || !catalogForm.price.trim()}
                  className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-black py-2.5 rounded-xl text-sm transition-all">
                  {catalogFormSaving ? 'Guardando...' : '+ Agregar al catálogo'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Resultados */}
        {showCatalog && (
          <>
          <p className="text-gray-600 text-sm mb-6">
            <span className="text-white font-bold">{results.length}</span> resultados en catálogo
            {query && <span> para "<span className="text-violet-400">{query}</span>"</span>}
          </p>

          {results.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-gray-600 text-5xl mb-4">🔍</p>
              <p className="text-gray-400 font-bold text-lg">Sin resultados</p>
              <p className="text-gray-600 text-sm mt-1">Intenta con otros filtros o un término diferente</p>
              <button onClick={() => { setSport('Todos'); setKind('all'); setTxn('Todos'); setQuery('') }}
                className="mt-4 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-400 text-sm font-bold px-4 py-2 rounded-lg transition-all">
                Limpiar filtros
              </button>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {results.map((item) => (
              <div key={item.id}
                className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1"
                style={{
                  padding: '2px',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #f97316 50%, #7c3aed 100%)',
                  boxShadow: '0 0 14px rgba(139,92,246,0.2), 0 0 28px rgba(249,115,22,0.12)',
                }}>
                <div className="bg-[#1c1835] rounded-xl overflow-hidden h-full">
                {/* Imagen */}
                {(() => { const { isRC, isAuto, is1of1, numbered, gradeCo, gradeNum } = cardAttrs(item); return (
                <div className="relative h-48 overflow-hidden">
                  <img src={item.imageUrl || IMG[item.imgKey]} alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a1e]/90 via-black/10 to-transparent" />
                  {/* Badges top-left */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[calc(100%-70px)]">
                    {item.badge && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${item.badge.includes('🔥') || item.badge.includes('🏆') ? 'bg-red-600 text-white' : item.badge.includes('🌍') ? 'bg-blue-600 text-white' : 'bg-violet-600 text-white'}`}>
                        {item.badge}
                      </span>
                    )}
                    {isRC    && <span className="bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">RC</span>}
                    {isAuto  && <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">Auto</span>}
                    {is1of1  && <span className="bg-gradient-to-r from-violet-400 to-yellow-300 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">1/1</span>}
                    {numbered && !is1of1 && <span className="bg-white/10 backdrop-blur text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{numbered}</span>}
                  </div>
                  {/* Tipo transacción top-right */}
                  <div className={`absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${txnCss[item.txn]}`}>
                    {txnMap[item.txn]}
                  </div>
                  {/* Botón eliminar (solo admin, solo items extra) */}
                  {isAdmin && isExtraItem(item.id) && (
                    <button onClick={e => { e.stopPropagation(); deleteExtraItem(item.id) }}
                      className="absolute top-8 right-3 bg-red-600/90 hover:bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full transition-all opacity-0 group-hover:opacity-100">
                      🗑️
                    </button>
                  )}
                  {/* Footer de la imagen */}
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between gap-1">
                    {gradeCo && gradeNum && (
                      <span className="bg-black/70 backdrop-blur text-violet-400 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-violet-500/30 shrink-0">
                        <span className="text-gray-500">{gradeCo}</span> {gradeNum}
                      </span>
                    )}
                    <span className="bg-black/70 backdrop-blur text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-lg ml-auto">
                      {kindIcon[item.kind]} {item.sport !== 'General' ? item.sport : ''}
                    </span>
                  </div>
                </div>
                )})()}

                {/* Contenido */}
                <div className="p-4">
                  <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest mb-0.5">{item.brand}</p>
                  <h3 className="text-white font-black text-sm leading-tight mb-0.5">{item.name}</h3>
                  <p className="text-gray-600 text-[10px] leading-relaxed mb-3 line-clamp-2">{item.detail}</p>

                  {/* Price row */}
                  <div className="flex items-end justify-between gap-2 mb-3">
                    <div>
                      <p className="text-white font-black text-lg leading-none">{displayPrice(item.price)}</p>
                      <p className="text-gray-600 text-[10px]">{item.sub}</p>
                      {item.change && <p className={`text-[10px] font-bold ${item.change.startsWith('-') ? 'text-red-400' : 'text-emerald-400'}`}>{item.change}</p>}
                    </div>
                    {user && (
                      <button onClick={() => toggleCollection(item)} disabled={savingId === item.id}
                        title={savedIds.has(item.id) ? 'Quitar de colección' : 'Guardar en colección'}
                        className={`p-2 rounded-lg border transition-all shrink-0 ${savedIds.has(item.id) ? 'bg-violet-500/20 border-violet-500/40 text-violet-400' : 'bg-white/5 border-white/10 text-gray-500 hover:text-violet-400 hover:border-violet-500/30'}`}>
                        {savingId === item.id
                          ? <div className="w-3.5 h-3.5 border border-violet-400 border-t-transparent rounded-full animate-spin" />
                          : <svg className="w-3.5 h-3.5" fill={savedIds.has(item.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                        }
                      </button>
                    )}
                  </div>

                  {/* Action buttons */}
                  {item.kind === 'card' ? (
                    <div className="grid grid-cols-3 gap-1.5">
                      <button onClick={() => { addToCart(item); setCartOpen(true) }}
                        className={`py-2 rounded-lg text-[11px] font-bold transition-all text-center ${
                          item.txn === 'sale' ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-[#26213d] border border-white/10 text-gray-500 hover:border-violet-500/30 hover:text-violet-400'
                        }`}>
                        🛒 Comprar
                      </button>
                      <button onClick={() => user ? setBidItem(item) : navigate('/login')}
                        className={`py-2 rounded-lg text-[11px] font-bold transition-all text-center ${
                          item.txn === 'auction' ? 'bg-red-500/80 hover:bg-red-500 text-white' : 'bg-[#26213d] border border-white/10 text-gray-500 hover:border-red-500/30 hover:text-red-400'
                        }`}>
                        🔨 Pujar
                      </button>
                      <button onClick={() => user ? setTradeItem(item) : navigate('/login')}
                        className={`py-2 rounded-lg text-[11px] font-bold transition-all text-center ${
                          item.txn === 'trade' ? 'bg-blue-500/80 hover:bg-blue-500 text-white' : 'bg-[#26213d] border border-white/10 text-gray-500 hover:border-blue-500/30 hover:text-blue-400'
                        }`}>
                        🔄 Trade
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { addToCart(item); setCartOpen(true) }}
                      className={`w-full font-bold py-2 px-3 rounded-lg text-xs transition-all ${
                        item.kind === 'box'
                          ? 'bg-amber-500/10 hover:bg-amber-500 border border-amber-500/30 hover:border-amber-500 text-amber-400 hover:text-black'
                          : 'bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-black'
                      }`}>
                      {item.kind === 'box' ? '📦 Agregar al carrito' : '🛡️ Agregar al carrito'}
                    </button>
                  )}
                </div>
                </div>{/* /inner catalog surface */}
              </div>
            ))}
          </div>
          )}
          </>
        )}
        </div>{/* /productos wrapper */}
      </div>

      {cartOpen && (
        <CartDrawer
          items={cart}
          onClose={() => setCartOpen(false)}
          onRemove={removeOneFromCart}
          onClear={() => setCart([])}
        />
      )}
      {bidItem   && <BidModal   item={bidItem}   onClose={() => setBidItem(null)}   user={user} navigate={navigate} />}
      {tradeItem && <TradeModal item={tradeItem} onClose={() => setTradeItem(null)} user={user} navigate={navigate} />}
      {showPublish && <PublishModal onClose={() => setShowPublish(false)} user={user} profile={profile} onSuccess={l => setListings(prev => [l, ...prev])} />}
      {contactModal && user && (
        <ContactSellerModal
          listing={contactModal.listing}
          actionType={contactModal.action}
          user={user}
          profile={profile}
          onClose={() => setContactModal(null)}
        />
      )}
      {checkoutModal && user && (
        <CheckoutModal
          listing={checkoutModal}
          user={user}
          profile={profile}
          onClose={() => setCheckoutModal(null)}
        />
      )}
    </div>
  )
}
