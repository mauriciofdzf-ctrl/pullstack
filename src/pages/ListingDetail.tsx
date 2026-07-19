import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CheckoutModal from '../components/CheckoutModal'

type Listing = {
  id: number
  user_id: string
  display_name: string
  title: string
  description: string | null
  sport: string
  kind: string
  txn_type: 'sale' | 'auction' | 'trade'
  price: string | null
  min_bid: string | null
  reserve_price: number | null
  grade: string | null
  condition: string | null
  image_url: string | null
  active: boolean
  created_at: string
  ends_at: string | null
}

type Bid = {
  id: number
  bidder_id: string
  bidder_name: string
  amount: number
  created_at: string
}

type MyTxn = {
  id: number
  status: string
  payment_reference: string
  total_paid: number
  payment_method: string
  tracking_number: string | null
  tracking_carrier: string | null
  tracking_url: string | null
  estimated_delivery: string | null
  created_at: string
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return 'hace un momento'
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`
  return `hace ${Math.floor(s / 86400)} días`
}

function useCountdown(endsAt: string | null) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0, ended: false, label: '' })

  useEffect(() => {
    if (!endsAt) return
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now()
      if (diff <= 0) {
        setParts({ d: 0, h: 0, m: 0, s: 0, ended: true, label: 'Subasta finalizada' })
        return
      }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setParts({ d, h, m, s, ended: false, label: '' })
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [endsAt])

  return parts
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuth()

  const [listing, setListing]       = useState<Listing | null>(null)
  const [bids, setBids]             = useState<Bid[]>([])
  const [loading, setLoading]       = useState(true)
  const [bidAmount, setBidAmount]   = useState('')
  const [bidding, setBidding]       = useState(false)
  const [bidError, setBidError]     = useState('')
  const [bidSuccess, setBidSuccess] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [tradeMsg, setTradeMsg]     = useState('')
  const [tradeSent, setTradeSent]   = useState(false)
  const [tradeSending, setTradeSending] = useState(false)
  const [myTxn, setMyTxn]           = useState<MyTxn | null>(null)
  const [, setLiveCount]            = useState(0)
  const [newBidAlert, setNewBidAlert] = useState<{ name: string; amount: number } | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const countdown = useCountdown(listing?.ends_at ?? null)

  useEffect(() => {
    if (!id) return
    loadListing()
  }, [id])

  useEffect(() => {
    if (!user || !id) return
    supabase.from('transactions')
      .select('id, status, payment_reference, total_paid, payment_method, tracking_number, tracking_carrier, tracking_url, estimated_delivery, created_at')
      .eq('listing_id', id).eq('buyer_id', user.id)
      .order('created_at', { ascending: false }).limit(1).single()
      .then(({ data }) => { if (data) setMyTxn(data as MyTxn) })
  }, [user, id])

  const loadListing = async () => {
    setLoading(true)
    const { data } = await supabase.from('listings').select('*').eq('id', id).single()
    if (!data) { setLoading(false); return }
    setListing(data as Listing)
    if (data.txn_type === 'auction') loadBids(data.id)
    setLoading(false)
  }

  const loadBids = async (listingId: number) => {
    const { data } = await supabase.from('bids')
      .select('*').eq('listing_id', listingId).order('amount', { ascending: false })
    setBids((data || []) as Bid[])

    channelRef.current = supabase.channel(`bids-live-${listingId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'bids',
        filter: `listing_id=eq.${listingId}`,
      }, payload => {
        const b = payload.new as Bid
        setBids(prev => [b, ...prev].sort((a, z) => z.amount - a.amount))
        setLiveCount(n => n + 1)
        setNewBidAlert({ name: b.bidder_name, amount: b.amount })
        setTimeout(() => setNewBidAlert(null), 4000)
      })
      .subscribe()
  }

  useEffect(() => {
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [])

  const topBid = bids[0]
  const minNext = topBid
    ? topBid.amount + Math.max(10, Math.floor(topBid.amount * 0.03))
    : listing?.min_bid ? parseFloat(listing.min_bid.replace(/[^0-9.]/g, '')) : 0

  const placeBid = async () => {
    if (!user || !listing) return
    if (countdown.ended) return
    const amt = parseFloat(bidAmount)
    if (!amt || amt < minNext) { setBidError(`Puja mínima: $${minNext.toLocaleString()}`); return }
    if (topBid?.bidder_id === user.id) { setBidError('Ya tienes la puja más alta'); return }
    setBidding(true); setBidError('')
    const { error } = await supabase.from('bids').insert({
      listing_id:  listing.id,
      bidder_id:   user.id,
      bidder_name: profile?.display_name || 'Anónimo',
      amount:      amt,
    })
    setBidding(false)
    if (error) { setBidError('Error al pujar. Intenta de nuevo.'); return }
    setBidAmount('')
    setBidSuccess(true)
    setTimeout(() => setBidSuccess(false), 3000)
  }

  const sendTrade = async () => {
    if (!user || !listing || !tradeMsg.trim()) return
    setTradeSending(true)
    await supabase.from('direct_messages').insert({
      from_user_id:  user.id,
      to_user_id:    listing.user_id,
      from_name:     profile?.display_name || 'Usuario',
      to_name:       listing.display_name,
      content:       tradeMsg.trim(),
      listing_id:    listing.id,
      listing_title: listing.title,
      action_type:   'trade',
      read:          false,
    })
    setTradeSending(false)
    setTradeSent(true)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0c0a1e] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!listing) return (
    <div className="min-h-screen bg-[#0c0a1e] flex flex-col items-center justify-center gap-4">
      <p className="text-5xl">🃏</p>
      <p className="text-white font-black text-xl">Anuncio no encontrado</p>
      <button onClick={() => navigate('/marketplace')} className="text-violet-400 hover:text-violet-300 text-sm">← Volver al mercado</button>
    </div>
  )

  const TXN_COLOR = {
    sale:    'bg-violet-600/15 text-violet-400 border-violet-500/30',
    auction: 'bg-red-500/15 text-red-400 border-red-500/30',
    trade:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
  }
  const TXN_LABEL = { sale: 'Venta', auction: 'Subasta', trade: 'Trade' }
  const isOwner = user?.id === listing.user_id

  const reserveMet = listing.reserve_price != null && topBid != null && topBid.amount >= listing.reserve_price

  return (
    <div className="min-h-screen bg-[#0c0a1e] pt-20 pb-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 group">
          <div className="w-8 h-8 rounded-xl bg-[#1c1835] border border-white/10 group-hover:border-violet-500/30 flex items-center justify-center transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span className="text-sm font-bold">Volver</span>
        </button>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* ── Imagen ── */}
          <div>
            <div className="bg-[#08061a] rounded-2xl overflow-hidden border border-white/5 relative" style={{ aspectRatio: '5/7' }}>
              {listing.txn_type === 'auction' && !countdown.ended && (
                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-red-600/90 backdrop-blur text-white text-[10px] font-black px-2.5 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  EN VIVO
                </div>
              )}
              {listing.image_url
                ? <img src={listing.image_url} alt={listing.title} className="w-full h-full object-contain" />
                : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 opacity-20">
                    <span className="text-8xl">🃏</span>
                    <p className="text-gray-500 text-sm font-bold">Sin foto</p>
                  </div>
                )
              }
            </div>

          </div>

          {/* ── Info + Acciones ── */}
          <div className="flex flex-col gap-5">

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-widest ${TXN_COLOR[listing.txn_type]}`}>
                  {listing.txn_type === 'auction' ? '🔨' : listing.txn_type === 'trade' ? '🔄' : '🛒'} {TXN_LABEL[listing.txn_type]}
                </span>
                <span className="text-[10px] text-gray-600 font-bold uppercase">{listing.sport} · {listing.kind}</span>
              </div>
              <h1 className="text-2xl font-black text-white leading-tight mb-2">{listing.title}</h1>
              {listing.description && <p className="text-gray-400 text-sm leading-relaxed">{listing.description}</p>}
            </div>

            {/* Detalles */}
            {(listing.grade || listing.condition) && (
              <div className="grid grid-cols-2 gap-3">
                {listing.grade && (
                  <div className="bg-[#1c1835] border border-white/5 rounded-xl p-3">
                    <p className="text-gray-600 text-[10px] font-bold uppercase mb-1">Grado</p>
                    <p className="text-violet-400 font-black">{listing.grade}</p>
                  </div>
                )}
                {listing.condition && (
                  <div className="bg-[#1c1835] border border-white/5 rounded-xl p-3">
                    <p className="text-gray-600 text-[10px] font-bold uppercase mb-1">Condición</p>
                    <p className="text-white font-bold text-sm">{listing.condition}</p>
                  </div>
                )}
              </div>
            )}

            {/* Vendedor */}
            <div className="flex items-center gap-3 bg-[#1c1835] border border-white/5 rounded-xl p-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                {listing.display_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-gray-500 text-[10px]">Vendedor</p>
                <p className="text-white font-bold text-sm">{listing.display_name}</p>
              </div>
              <p className="ml-auto text-gray-600 text-[10px]">{timeAgo(listing.created_at)}</p>
            </div>

            {/* ── VENTA ── */}
            {listing.txn_type === 'sale' && (
              <div className="bg-[#1c1835] border border-violet-500/20 rounded-2xl p-5">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Precio</p>
                <p className="text-white font-black text-4xl mb-4">{listing.price || '—'}</p>
                {isOwner
                  ? <p className="text-gray-600 text-sm text-center">Este es tu anuncio</p>
                  : !user
                  ? <Link to="/login" className="block w-full text-center bg-violet-600 hover:bg-violet-500 text-white font-black py-3 rounded-xl transition-all">Inicia sesión para comprar</Link>
                  : <button onClick={() => setShowCheckout(true)} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/20">
                      🛒 Comprar ahora
                    </button>
                }
              </div>
            )}

            {/* ── SUBASTA ── */}
            {listing.txn_type === 'auction' && (
              <div className={`bg-[#1c1835] border rounded-2xl ${countdown.ended ? 'border-gray-500/20' : 'border-red-500/25'}`}>

                {/* Timer */}
                {listing.ends_at && (
                  <div className={`px-5 py-4 border-b border-white/5 rounded-t-2xl ${countdown.ended ? 'bg-gray-500/10' : 'bg-red-500/8'}`}>
                    {countdown.ended ? (
                      <p className="text-gray-400 font-black text-center">🔒 Subasta finalizada</p>
                    ) : (
                      <>
                        <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                          Tiempo restante
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { v: countdown.d, label: 'días' },
                            { v: countdown.h, label: 'horas' },
                            { v: countdown.m, label: 'min' },
                            { v: countdown.s, label: 'seg' },
                          ].map(({ v, label }) => (
                            <div key={label} className="bg-[#08061a] border border-red-500/15 rounded-xl p-2 text-center">
                              <p className="text-white font-black text-2xl tabular-nums leading-none">{String(v).padStart(2, '0')}</p>
                              <p className="text-red-400/60 text-[9px] font-bold uppercase mt-1">{label}</p>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Puja más alta */}
                <div className="px-5 pt-5 pb-4 border-b border-white/5 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                      {topBid ? 'Puja más alta' : 'Puja inicial'}
                    </p>
                    <p className="text-white font-black text-4xl tabular-nums">
                      ${(topBid?.amount || parseFloat((listing.min_bid || '0').replace(/[^0-9.]/g, ''))).toLocaleString('es-MX')}
                    </p>
                  </div>
                  {topBid ? (
                    <div className="text-right shrink-0">
                      <p className="text-gray-600 text-[10px]">por</p>
                      <p className={`font-black text-sm ${topBid.bidder_id === user?.id ? 'text-yellow-400' : 'text-emerald-400'}`}>
                        {topBid.bidder_id === user?.id ? '🏆 Tú lideras' : topBid.bidder_name}
                      </p>
                    </div>
                  ) : (
                    <span className="text-gray-600 text-xs shrink-0">Sin pujas aún</span>
                  )}
                </div>

                {/* Precio de reserva */}
                {listing.reserve_price != null && (
                  <div className={`px-5 py-3 border-b border-white/5 flex items-center justify-between ${reserveMet ? 'bg-emerald-500/5' : 'bg-amber-500/5'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${reserveMet ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                      <span className={`text-xs font-bold ${reserveMet ? 'text-emerald-400' : 'text-amber-400'}`}>
                        Precio de reserva
                      </span>
                    </div>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${reserveMet ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>
                      {reserveMet ? '✓ Alcanzado' : '⚠ No alcanzado'}
                    </span>
                    {isOwner && (
                      <span className="text-gray-600 text-[10px] ml-2">Reserva: ${listing.reserve_price.toLocaleString('es-MX')}</span>
                    )}
                  </div>
                )}

                {/* Competidores activos */}
                {!countdown.ended && bids.length > 0 && (() => {
                  const uniqueBidders = bids.reduce((acc: Bid[], bid) => {
                    if (!acc.some(b => b.bidder_id === bid.bidder_id)) acc.push(bid)
                    return acc
                  }, [])
                  return (
                    <div className="px-5 py-3 border-b border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                        {uniqueBidders.length} {uniqueBidders.length === 1 ? 'pujador compitiendo' : 'pujadores compitiendo'}
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {uniqueBidders.map((b, i) => (
                          <div key={b.bidder_id}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold border ${
                              i === 0 ? 'bg-yellow-400/10 border-yellow-400/25 text-yellow-400' :
                              b.bidder_id === user?.id ? 'bg-violet-500/10 border-violet-500/25 text-violet-400' :
                              'bg-white/5 border-white/10 text-gray-500'
                            }`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                              i === 0 ? 'bg-yellow-400 text-black' : 'bg-white/10 text-gray-400'
                            }`}>
                              {(b.bidder_id === user?.id ? (profile?.display_name || 'Tú') : b.bidder_name).slice(0, 2).toUpperCase()}
                            </div>
                            {b.bidder_id === user?.id ? 'Tú' : b.bidder_name}
                            {i === 0 && <span className="text-[10px]">🏆</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Historial de pujas — siempre visible */}
                <div className="px-5 py-3 border-b border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      Pujas en vivo ({bids.length})
                    </p>
                  </div>
                  {bids.length === 0 ? (
                    <p className="text-gray-700 text-xs text-center py-4">Sé el primero en pujar 🔨</p>
                  ) : (
                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                      {bids.map((b, i) => (
                        <div key={b.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${i === 0 ? 'bg-red-500/10 border border-red-500/20' : 'bg-[#26213d]'}`}>
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            i === 0 ? 'bg-yellow-400 text-black' :
                            i === 1 ? 'bg-gray-400 text-black' :
                            i === 2 ? 'bg-orange-700 text-white' :
                            'bg-white/5 text-gray-600'
                          }`}>
                            {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-black truncate ${i === 0 ? 'text-white' : 'text-gray-400'}`}>
                              {b.bidder_id === user?.id ? (i === 0 ? '⭐ Tú (líder)' : 'Tú') : b.bidder_name}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`font-black text-sm tabular-nums ${i === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                              ${b.amount.toLocaleString('es-MX')}
                            </p>
                            <p className="text-gray-700 text-[9px]">{timeAgo(b.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Formulario de puja */}
                <div className="px-5 py-4">
                  {newBidAlert && (
                    <div className="mb-3 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
                      <span className="text-orange-400 text-sm">🔨</span>
                      <p className="text-orange-400 text-xs font-bold">{newBidAlert.name} acaba de pujar <span className="text-white">${newBidAlert.amount.toLocaleString('es-MX')}</span></p>
                    </div>
                  )}
                  {countdown.ended ? (
                    <div className="bg-gray-500/10 border border-gray-500/20 rounded-xl p-3 text-center">
                      <p className="text-gray-400 text-sm font-bold">Esta subasta ya terminó</p>
                    </div>
                  ) : isOwner ? (
                    <p className="text-gray-600 text-sm text-center py-2">Este es tu anuncio</p>
                  ) : !user ? (
                    <Link to="/login" className="block w-full text-center bg-red-500 hover:bg-red-400 text-white font-black py-3 rounded-xl transition-all">
                      Inicia sesión para pujar
                    </Link>
                  ) : (
                    <>
                      {bidSuccess && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center text-emerald-400 font-bold text-sm mb-3">
                          ✅ ¡Puja registrada!
                        </div>
                      )}
                      <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">
                        Tu puja — mínimo <span className="text-red-400 font-black">${minNext.toLocaleString('es-MX')}</span>
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                          <input
                            type="number" value={bidAmount}
                            onChange={e => { setBidAmount(e.target.value); setBidError('') }}
                            placeholder={minNext.toString()}
                            className="w-full bg-[#26213d] border border-red-500/30 text-white pl-7 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-red-500/60 font-black placeholder-gray-700"
                          />
                        </div>
                        <button onClick={placeBid} disabled={bidding || !bidAmount}
                          className="bg-red-500 hover:bg-red-400 text-white font-black px-5 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                          {bidding && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                          🔨 Pujar
                        </button>
                      </div>
                      {bidError && <p className="text-red-400 text-xs mt-1.5">{bidError}</p>}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── TRADE ── */}
            {listing.txn_type === 'trade' && (
              <div className="bg-[#1c1835] border border-blue-500/20 rounded-2xl p-5 space-y-4">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">🔄 Propuesta de trade</p>
                {tradeSent ? (
                  <div className="text-center py-4">
                    <p className="text-emerald-400 font-black text-lg mb-2">✅ Propuesta enviada</p>
                    <p className="text-gray-400 text-sm mb-4">El vendedor recibirá tu mensaje</p>
                    <button onClick={() => navigate('/messages')} className="bg-amber-500 hover:bg-amber-400 text-black font-black px-6 py-2.5 rounded-xl text-sm transition-all">Ver mensajes →</button>
                  </div>
                ) : isOwner ? (
                  <p className="text-gray-600 text-sm text-center">Este es tu anuncio</p>
                ) : !user ? (
                  <Link to="/login" className="block w-full text-center bg-blue-500 hover:bg-blue-400 text-white font-black py-3 rounded-xl transition-all">Inicia sesión para tradear</Link>
                ) : (
                  <>
                    <textarea
                      value={tradeMsg || `Hola ${listing.display_name}! Me interesa tu "${listing.title}" para un trade. Te ofrezco: `}
                      onChange={e => setTradeMsg(e.target.value)} rows={4}
                      className="w-full bg-[#26213d] border border-blue-500/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/40 resize-none"
                    />
                    <button onClick={sendTrade} disabled={tradeSending}
                      className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {tradeSending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      🔄 Enviar propuesta de trade
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── MI PEDIDO ── */}
            {myTxn && (
              <div className="bg-[#1c1835] border border-cyan-500/20 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest">📦 Mi pedido</p>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                    myTxn.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                    myTxn.status === 'verified'  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                    myTxn.status === 'cancelled' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                    'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                  }`}>
                    {myTxn.status === 'completed' ? '🎉 Completado' :
                     myTxn.status === 'verified'  ? '✅ Verificado' :
                     myTxn.status === 'cancelled' ? '❌ Cancelado' :
                     '⏳ Pendiente de verificación'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#26213d] rounded-xl p-3">
                    <p className="text-gray-600 text-[9px] font-bold uppercase mb-1">Referencia</p>
                    <p className="text-violet-400 font-black font-mono">PS-{myTxn.payment_reference}</p>
                  </div>
                  <div className="bg-[#26213d] rounded-xl p-3">
                    <p className="text-gray-600 text-[9px] font-bold uppercase mb-1">Total pagado</p>
                    <p className="text-white font-black">${myTxn.total_paid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                {myTxn.tracking_number ? (
                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 space-y-2.5">
                    <p className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest">Guía de envío</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🚚</span>
                      <div>
                        <p className="text-white font-black text-sm">{myTxn.tracking_carrier}</p>
                        <p className="text-cyan-300 font-mono text-xs">{myTxn.tracking_number}</p>
                      </div>
                    </div>
                    {myTxn.estimated_delivery && (
                      <p className="text-gray-400 text-xs">Entrega estimada: <span className="text-white font-bold">{myTxn.estimated_delivery}</span></p>
                    )}
                    {myTxn.tracking_url && (
                      <a href={myTxn.tracking_url} target="_blank" rel="noopener noreferrer"
                        className="block w-full text-center bg-cyan-600 hover:bg-cyan-500 text-white font-black py-2.5 rounded-xl text-sm transition-all">
                        Rastrear envío →
                      </a>
                    )}
                  </div>
                ) : myTxn.status === 'verified' || myTxn.status === 'completed' ? (
                  <div className="bg-[#26213d] border border-white/5 rounded-xl p-3 text-center">
                    <p className="text-gray-400 text-xs">El equipo de PullStackMX está coordinando el envío.</p>
                    <p className="text-gray-600 text-xs mt-0.5">Recibirás la guía de rastreo pronto.</p>
                  </div>
                ) : (
                  <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3">
                    <p className="text-yellow-400 text-xs font-bold">Verificando tu pago</p>
                    <p className="text-gray-500 text-xs mt-0.5">El equipo confirmará tu pago en máx. 24 hrs.</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {showCheckout && user && (
        <CheckoutModal listing={listing} user={user} profile={profile} onClose={() => setShowCheckout(false)} />
      )}
    </div>
  )
}
