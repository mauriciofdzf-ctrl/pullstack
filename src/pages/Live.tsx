import { useState, useEffect, useRef } from 'react'

// ─── Timer countdown ──────────────────────────────────────────────────────────
function Timer({ seconds }: { seconds: number }) {
  const [t, setT] = useState(seconds)
  useEffect(() => {
    const i = setInterval(() => setT((p) => (p > 0 ? p - 1 : 0)), 1000)
    return () => clearInterval(i)
  }, [])
  const m = Math.floor(t / 60).toString().padStart(2, '0')
  const s = (t % 60).toString().padStart(2, '0')
  const urgent = t < 30
  return (
    <span className={`font-mono font-black ${urgent ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
      {m}:{s}
    </span>
  )
}

// ─── Streams disponibles ──────────────────────────────────────────────────────
const STREAMS = [
  { id: 1, title: '2025-26 Topps Basketball Hobby Box — RC Cooper Flagg garantizado',   host: 'CardKing_MX',    viewers: 342, startBid: 340, bids: 28, timeLeft: 134, img: 'https://images.unsplash.com/photo-1546519638405-a9f9f1c9d0b3?w=800&q=90',  sport: 'NBA' },
  { id: 2, title: 'Lamine Yamal Topps Chrome Euro Blue Refractor /150 PSA 9',           host: 'YamalTrader',    viewers: 561, startBid: 2800, bids: 61, timeLeft: 47, img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&q=90', sport: 'Soccer' },
  { id: 3, title: 'Pokémon SV 151 Booster Box Japonés — Mewtwo ex SAR chase',           host: 'PokéBreaker_MX', viewers: 228, startBid: 190, bids: 14, timeLeft: 270, img: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=800&q=90',  sport: 'Pokémon' },
]

const INITIAL_CHAT = [
  { id: 1, user: 'CardKing_MX',  msg: '¡Empezamos! Esta Topps Box puede tener el RC de Flagg 🔥',  host: true,  time: '9:00' },
  { id: 2, user: 'PullFanatic',  msg: 'Esa caja está fuego, voy por ella 👀',                        host: false, time: '9:01' },
  { id: 3, user: 'SlabCollector',msg: 'Puja en $400 💪',                                             host: false, time: '9:02' },
  { id: 4, user: 'MexiCards',    msg: '¿Alguien ya sacó un Flagg RC en vivo?',                       host: false, time: '9:03' },
  { id: 5, user: 'PrizmHunter',  msg: '$380 — sigo en juego 🎯',                                     host: false, time: '9:04' },
]

const EMOJIS = ['🔥', '💪', '👀', '🏆', '❤️', '😱']

export default function Live() {
  const [activeId, setActiveId]   = useState(1)
  const [bids, setBids]           = useState<Record<number, number>>({
    1: STREAMS[0].startBid,
    2: STREAMS[1].startBid,
    3: STREAMS[2].startBid,
  })
  const [bidCounts, setBidCounts] = useState<Record<number, number>>({
    1: STREAMS[0].bids, 2: STREAMS[1].bids, 3: STREAMS[2].bids,
  })
  const [bidInput, setBidInput]   = useState('')
  const [bidError, setBidError]   = useState('')
  const [bidSuccess, setBidSuccess] = useState(false)
  const [bidHistory, setBidHistory] = useState<{ user: string; amount: number; time: string }[]>([
    { user: 'PullFanatic',   amount: 340, time: '9:01' },
    { user: 'SlabCollector', amount: 360, time: '9:03' },
  ])
  const [chat, setChat]           = useState(INITIAL_CHAT)
  const [msg, setMsg]             = useState('')
  const chatRef = useRef<HTMLDivElement>(null)

  const active = STREAMS.find((s) => s.id === activeId)!
  const currentBid = bids[activeId]
  const minBid = currentBid + 10

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [chat])

  // Simulated bot messages
  useEffect(() => {
    const botMessages = [
      { user: 'NFLBreaker', msg: '¡Qué precio! ¿Alguien más puja?' },
      { user: 'CardKing_MX', msg: 'Recuerden: el ganador tiene 24h para pagar 🔔', host: true },
      { user: 'BoxBreaker', msg: 'Última oportunidad para esta caja 👀' },
    ]
    let i = 0
    const interval = setInterval(() => {
      if (i < botMessages.length) {
        const bm = botMessages[i]
        setChat((prev) => [...prev, { id: Date.now(), user: bm.user, msg: bm.msg, host: bm.host ?? false, time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) }])
        i++
      }
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const handleBid = () => {
    const amount = parseFloat(bidInput)
    if (!bidInput || isNaN(amount)) { setBidError('Ingresa una cantidad válida'); return }
    if (amount < minBid) { setBidError(`La oferta mínima es $${minBid}`); return }
    setBidError('')
    setBids((prev) => ({ ...prev, [activeId]: amount }))
    setBidCounts((prev) => ({ ...prev, [activeId]: (prev[activeId] || 0) + 1 }))
    setBidHistory((prev) => [...prev, { user: 'Tú', amount, time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) }])
    setChat((prev) => [...prev, { id: Date.now(), user: 'Tú', msg: `¡Pujé $${amount}! 🔥`, host: false, time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) }])
    setBidInput('')
    setBidSuccess(true)
    setTimeout(() => setBidSuccess(false), 3000)
  }

  const sendMsg = () => {
    if (!msg.trim()) return
    setChat((prev) => [...prev, { id: Date.now(), user: 'Tú', msg, host: false, time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) }])
    setMsg('')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <h1 className="text-3xl font-black text-white">Subastas en Vivo</h1>
          <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold px-2 py-0.5 rounded-full">
            {STREAMS.length} LIVE
          </span>
          <span className="text-gray-600 text-sm ml-auto">{STREAMS.reduce((a, s) => a + s.viewers, 0).toLocaleString()} viewers totales</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Main stream + bid ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Video */}
            <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
              <div className="relative aspect-video bg-black overflow-hidden">
                <img src={active.img} alt="" className="w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <button className="w-16 h-16 rounded-full bg-white/15 backdrop-blur flex items-center justify-center mb-3 mx-auto hover:bg-white/25 transition-colors">
                      <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                    <p className="text-white font-bold text-sm">Conectar al stream</p>
                    <p className="text-gray-500 text-xs mt-0.5">Necesitas una cuenta para ver en HD</p>
                  </div>
                </div>

                {/* Top overlays */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  EN VIVO
                </div>
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur text-white text-xs px-2.5 py-1.5 rounded-lg">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                  {active.viewers} viendo
                </div>

                {/* Bottom: timer + sport */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div className="bg-black/80 backdrop-blur px-3 py-2 rounded-xl">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wide">Tiempo restante</p>
                    <div className="text-2xl"><Timer seconds={active.timeLeft} /></div>
                  </div>
                  <span className="bg-black/70 text-amber-400 text-[10px] font-bold px-2 py-1 rounded-lg border border-amber-500/20">{active.sport}</span>
                </div>
              </div>

              {/* Auction info + bid */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-1">
                      👑 {active.host} · Host
                    </p>
                    <h2 className="text-white font-black text-lg leading-snug">{active.title}</h2>
                    <p className="text-gray-500 text-sm mt-1">{bidCounts[activeId]} ofertas realizadas</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-gray-500 text-xs mb-0.5">Oferta actual</p>
                    <div className={`font-black text-3xl transition-colors ${bidSuccess ? 'text-green-400' : 'text-amber-400'}`}>
                      ${currentBid.toLocaleString()}
                    </div>
                    <p className="text-gray-600 text-[10px]">Mínima: ${minBid.toLocaleString()}</p>
                  </div>
                </div>

                {/* Bid input */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                      <input
                        type="number"
                        placeholder={String(minBid)}
                        value={bidInput}
                        onChange={(e) => { setBidInput(e.target.value); setBidError('') }}
                        onKeyDown={(e) => e.key === 'Enter' && handleBid()}
                        className="w-full bg-[#1a1a1a] border border-white/10 text-white pl-8 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <button
                      onClick={handleBid}
                      className={`font-black px-6 py-3 rounded-xl text-sm transition-all hover:scale-105 shadow-lg ${bidSuccess ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'}`}
                    >
                      {bidSuccess ? '✓ Pujado' : 'PUJAR 🔥'}
                    </button>
                  </div>

                  {/* Quick bid buttons */}
                  <div className="flex gap-2">
                    {[minBid, minBid + 50, minBid + 100, minBid + 250].map((amt) => (
                      <button key={amt} onClick={() => setBidInput(String(amt))}
                        className="flex-1 bg-[#1a1a1a] hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 text-gray-400 hover:text-amber-400 text-xs font-bold py-2 rounded-lg transition-all">
                        ${amt >= 1000 ? (amt/1000).toFixed(1)+'k' : amt}
                      </button>
                    ))}
                  </div>

                  {bidError && <p className="text-red-400 text-xs">{bidError}</p>}
                </div>
              </div>
            </div>

            {/* Bid history + otros streams */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Historial de pujas */}
              <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
                <h3 className="text-white font-bold text-sm mb-3">Historial de pujas</h3>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {[...bidHistory].reverse().map((b, i) => (
                    <div key={i} className={`flex items-center justify-between text-xs ${b.user === 'Tú' ? 'text-amber-400' : 'text-gray-400'}`}>
                      <span className="font-bold">{b.user === 'Tú' ? '👤 Tú' : b.user}</span>
                      <span className="font-black">${b.amount.toLocaleString()}</span>
                      <span className="text-gray-600">{b.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Otros streams */}
              <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
                <h3 className="text-white font-bold text-sm mb-3">Otros en vivo</h3>
                <div className="space-y-2">
                  {STREAMS.filter((s) => s.id !== activeId).map((s) => (
                    <button key={s.id} onClick={() => { setActiveId(s.id); setBidInput('') }}
                      className="w-full flex items-center gap-3 hover:bg-white/3 rounded-lg p-2 transition-colors text-left">
                      <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0">
                        <img src={s.img} alt="" className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-bold truncate leading-tight">{s.title.slice(0, 40)}...</p>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-amber-400 text-[10px] font-black">${bids[s.id]?.toLocaleString()}</span>
                          <span className="text-gray-600 text-[10px]">· 👁 {s.viewers}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Chat ── */}
          <div className="bg-[#111] border border-white/5 rounded-2xl flex flex-col" style={{height: '580px'}}>
            <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-white font-bold text-sm">Chat en vivo</h3>
                <p className="text-gray-600 text-xs">{active.viewers} personas en sala</p>
              </div>
              <span className="flex items-center gap-1 text-red-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> LIVE
              </span>
            </div>

            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {chat.map((m) => (
                <div key={m.id} className={m.user === 'Tú' ? 'flex flex-col items-end' : ''}>
                  <div className={`max-w-[90%] ${m.user === 'Tú' ? '' : ''}`}>
                    <span className={`text-xs font-bold mr-1.5 ${m.host ? 'text-amber-400' : m.user === 'Tú' ? 'text-blue-400' : 'text-gray-500'}`}>
                      {m.host ? '👑 ' : ''}{m.user}
                    </span>
                    <span className={`text-xs ${m.host ? 'text-amber-200' : 'text-gray-300'}`}>{m.msg}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Emoji reactions */}
            <div className="px-3 py-2 border-t border-white/5 flex gap-2">
              {EMOJIS.map((e) => (
                <button key={e} onClick={() => { setChat((p) => [...p, { id: Date.now(), user: 'Tú', msg: e, host: false, time: '' }]) }}
                  className="text-lg hover:scale-125 transition-transform">
                  {e}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5 flex gap-2 shrink-0">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
                className="flex-1 bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-amber-500/50"
              />
              <button onClick={sendMsg} className="bg-amber-500 hover:bg-amber-400 text-black p-2.5 rounded-xl transition-all hover:scale-105">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
