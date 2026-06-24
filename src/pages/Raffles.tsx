import { useState, useEffect } from 'react'

const INITIAL_RAFFLES = [
  { id: 1, title: '2025-26 Topps Basketball Hobby Box',       type: 'Rifa',  priceNum: 15, price: '$15',      total: 100, sold: 73, date: '2026-06-30T21:00:00', img: 'https://images.unsplash.com/photo-1546519638405-a9f9f1c9d0b3?w=600&q=80', prize: 'Hobby Box sellada Topps NBA',            sport: 'NBA',     soldOut: false },
  { id: 2, title: 'Group Break · Panini Prizm NFL 2025',       type: 'Break', priceNum: 35, price: '$35/spot', total: 32,  sold: 28, date: '2026-07-02T20:00:00', img: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=600&q=80', prize: 'Cartas de tu equipo NFL',                 sport: 'NFL',     soldOut: false },
  { id: 3, title: 'Rifa · Cooper Flagg Topps Now RC Auto',     type: 'Rifa',  priceNum: 25, price: '$25',      total: 50,  sold: 12, date: '2026-07-05T22:00:00', img: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=600&q=80', prize: 'RC Auto PSA 9 garantizado',              sport: 'NBA',     soldOut: false },
  { id: 4, title: 'Group Break · Topps Chrome Baseball Jumbo', type: 'Break', priceNum: 45, price: '$45/spot', total: 30,  sold: 30, date: '2026-06-28T19:00:00', img: 'https://images.unsplash.com/photo-1540747913346-19212a4b423e?w=600&q=80', prize: 'Cartas de tu equipo MLB',                 sport: 'MLB',     soldOut: true  },
  { id: 5, title: 'Rifa · Mewtwo ex SAR PSA 10 (SV151)',       type: 'Rifa',  priceNum: 10, price: '$10',      total: 200, sold: 89, date: '2026-07-08T21:00:00', img: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=600&q=80', prize: 'Mewtwo ex Special Art Rare PSA 10',     sport: 'Pokémon', soldOut: false },
  { id: 6, title: 'Group Break · One Piece OP09 Box',          type: 'Break', priceNum: 20, price: '$20/spot', total: 20,  sold: 11, date: '2026-07-10T20:00:00', img: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&q=80', prize: 'Cartas de tu personaje One Piece',       sport: 'One Piece', soldOut: false },
]

const PAST = [
  { title: 'Rifa Lamine Yamal RC Blue Refractor /150', winner: '@YamalFan_MX',       prize: '$1,800',          date: 'Jun 22' },
  { title: 'Break Prizm NFL 2024',                     winner: '@NFLBreaker',         prize: 'Cartas Chiefs 🏆', date: 'Jun 18' },
  { title: 'Rifa Ohtani Bowman Chrome PSA 10',         winner: '@BaseballCollector',  prize: '$3,200',          date: 'Jun 12' },
  { title: 'Group Break Pokémon 151 Japonés',          winner: '@PokeCollector_GDL', prize: 'Mewtwo SAR 🃏',   date: 'Jun 8' },
]

// Countdown hook
function useCountdown(targetDate: string) {
  const getTimeLeft = () => {
    const diff = new Date(targetDate).getTime() - Date.now()
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, expired: true }
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    return { d, h, m, s, expired: false }
  }
  const [time, setTime] = useState(getTimeLeft)
  useEffect(() => {
    const i = setInterval(() => setTime(getTimeLeft()), 1000)
    return () => clearInterval(i)
  }, [targetDate])
  return time
}

function Countdown({ date }: { date: string }) {
  const { d, h, m, s, expired } = useCountdown(date)
  if (expired) return <span className="text-red-400 font-bold text-xs">¡Sorteando ahora!</span>
  return (
    <div className="flex gap-1 items-center">
      {d > 0 && <><span className="text-white font-black text-sm">{d}d</span><span className="text-gray-600 text-xs">:</span></>}
      <span className="text-white font-black text-sm">{String(h).padStart(2,'0')}h</span>
      <span className="text-gray-600 text-xs">:</span>
      <span className="text-white font-black text-sm">{String(m).padStart(2,'0')}m</span>
      <span className="text-gray-600 text-xs">:</span>
      <span className="text-amber-400 font-black text-sm">{String(s).padStart(2,'0')}s</span>
    </div>
  )
}

function RaffleCard({ raffle }: { raffle: typeof INITIAL_RAFFLES[0] }) {
  const [qty, setQty]         = useState(1)
  const [joined, setJoined]   = useState(false)
  const [spots, setSpots]     = useState(raffle.sold)
  const pct = Math.round((spots / raffle.total) * 100)
  const isBreak = raffle.type === 'Break'

  const handleJoin = () => {
    setSpots((s) => Math.min(s + qty, raffle.total))
    setJoined(true)
  }

  return (
    <div className={`group bg-[#111] border rounded-2xl overflow-hidden transition-all ${raffle.soldOut ? 'border-white/5 opacity-60' : joined ? 'border-amber-500/40' : 'border-white/5 hover:border-amber-500/30 hover:shadow-[0_20px_40px_rgba(245,158,11,0.08)] hover:-translate-y-1'}`}>
      <div className="relative h-44 overflow-hidden">
        <img src={raffle.img} alt={raffle.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent" />
        <div className={`absolute top-3 left-3 text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${raffle.type === 'Rifa' ? 'bg-amber-500 text-black' : 'bg-purple-600 text-white'}`}>
          {raffle.type}
        </div>
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur text-[10px] font-bold px-2 py-0.5 rounded-lg text-amber-400 border border-amber-500/20">
          {raffle.sport}
        </div>
        {raffle.soldOut && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="bg-red-600 text-white font-black px-4 py-2 rounded-xl text-sm">AGOTADO</span>
          </div>
        )}
        {joined && !raffle.soldOut && (
          <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center">
            <span className="bg-amber-500 text-black font-black px-4 py-2 rounded-xl text-sm">✓ INSCRITO</span>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-white font-bold text-sm leading-snug">{raffle.title}</h3>
          <p className="text-amber-500 text-xs font-bold mt-0.5">🏆 {raffle.prize}</p>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-[10px] text-gray-600 mb-1">
            <span>{spots}/{raffle.total} {isBreak ? 'spots' : 'tickets'}</span>
            <span className={pct >= 90 ? 'text-red-400 font-bold' : ''}>{pct}% {pct >= 90 ? '🔥' : ''}</span>
          </div>
          <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Countdown */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-[10px] uppercase tracking-wide mb-0.5">Sorteo en</p>
            <Countdown date={raffle.date} />
          </div>
          <div className="text-right">
            <p className="text-gray-600 text-[10px]">Precio</p>
            <p className="text-white font-black text-base">{raffle.price}</p>
          </div>
        </div>

        {/* Action */}
        {!raffle.soldOut && !joined && (
          <div className="flex items-center gap-2 pt-1">
            {!isBreak && (
              <div className="flex items-center gap-1 bg-[#1a1a1a] border border-white/10 rounded-lg">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-2.5 py-1.5 text-gray-400 hover:text-white transition-colors text-sm font-bold">−</button>
                <span className="px-2 text-white font-bold text-sm min-w-[24px] text-center">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(10, q + 1))} className="px-2.5 py-1.5 text-gray-400 hover:text-white transition-colors text-sm font-bold">+</button>
              </div>
            )}
            <button onClick={handleJoin} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-black py-2 rounded-lg text-xs transition-all hover:scale-105 text-center">
              {isBreak ? 'Elegir spot' : `Participar · $${raffle.priceNum * qty}`}
            </button>
          </div>
        )}
        {joined && !raffle.soldOut && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            <span className="text-amber-400 text-xs font-bold">✓ {isBreak ? 'Spot reservado' : `${qty} ticket${qty>1?'s':''} · $${raffle.priceNum * qty}`}</span>
            <button onClick={() => setJoined(false)} className="ml-auto text-gray-600 hover:text-gray-400 text-[10px]">Cancelar</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Raffles() {
  const [filter, setFilter] = useState('Todos')
  const types = ['Todos', 'Rifa', 'Break']
  const filtered = filter === 'Todos' ? INITIAL_RAFFLES : INITIAL_RAFFLES.filter((r) => r.type === filter)

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-16 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">PullStack</p>
          <h1 className="text-4xl font-black text-white mb-2">Rifas & Breaks</h1>
          <p className="text-gray-500 text-sm">Participa y gana cartas y cajas exclusivas · Sorteos en vivo cada semana</p>
        </div>

        {/* Cómo funciona */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 bg-[#111] border border-white/5 rounded-2xl p-6">
          {[
            { step: '01', icon: '🎟️', title: 'Elige y participa',   desc: 'Compra tickets para rifas o elige tu equipo en group breaks. Cantidad mínima: 1.' },
            { step: '02', icon: '🔒', title: 'Pago seguro',          desc: 'Procesado con Stripe. Tu dinero está retenido hasta el sorteo en vivo.' },
            { step: '03', icon: '🏆', title: 'Sorteo & envío',       desc: 'Sorteo transparente en vivo. Las cartas se envían en 48h con seguro y rastreo.' },
          ].map((s) => (
            <div key={s.step} className="flex gap-4">
              <div className="text-4xl font-black text-amber-500/20 leading-none shrink-0">{s.step}</div>
              <div>
                <div className="text-lg mb-1">{s.icon}</div>
                <div className="text-white font-bold text-sm mb-1">{s.title}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-xl font-black text-white">Activos ahora</h2>
          <div className="flex gap-2 ml-auto">
            {types.map((t) => (
              <button key={t} onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === t ? 'bg-amber-500 text-black' : 'bg-[#111] border border-white/10 text-gray-400 hover:border-amber-500/30 hover:text-amber-400'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-14">
          {filtered.map((r) => <RaffleCard key={r.id} raffle={r} />)}
        </div>

        {/* Ganadores */}
        <div>
          <h2 className="text-xl font-black text-white mb-5">Ganadores recientes 🏆</h2>
          <div className="bg-[#111] border border-white/5 rounded-2xl divide-y divide-white/5">
            {PAST.map((p, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-black text-sm shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm truncate">{p.title}</div>
                  <div className="text-gray-500 text-xs">{p.date}</div>
                </div>
                <div className="text-center shrink-0">
                  <div className="text-amber-400 font-black text-sm">{p.winner}</div>
                  <div className="text-gray-600 text-xs">{p.prize}</div>
                </div>
                <div className="text-2xl shrink-0">🏆</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
