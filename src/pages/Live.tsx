import { useState, useEffect } from 'react'

const auctions = [
  {
    id: 1,
    title: '2024 Panini Prizm Basketball Hobby Box',
    host: 'CardKing_MX',
    viewers: 342,
    currentBid: 340,
    bids: 28,
    timeLeft: 134,
    img: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=600&q=90',
    isMain: true,
  },
  {
    id: 2,
    title: 'Messi Silver Prizm RC /150 PSA 9',
    host: 'PullMaster',
    viewers: 218,
    currentBid: 2800,
    bids: 61,
    timeLeft: 47,
    img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&q=80',
    isMain: false,
  },
  {
    id: 3,
    title: '2023 Topps Chrome Jumbo Case Break',
    host: 'BreakRoom_Pro',
    viewers: 95,
    currentBid: 780,
    bids: 14,
    timeLeft: 270,
    img: 'https://images.unsplash.com/photo-1540747913346-19212a4b423e?w=400&q=80',
    isMain: false,
  },
]

function Timer({ seconds }: { seconds: number }) {
  const [t, setT] = useState(seconds)
  useEffect(() => {
    const i = setInterval(() => setT((p) => (p > 0 ? p - 1 : 0)), 1000)
    return () => clearInterval(i)
  }, [])
  const m = Math.floor(t / 60).toString().padStart(2, '0')
  const s = (t % 60).toString().padStart(2, '0')
  return <span className={t < 30 ? 'text-red-400' : 'text-amber-400'}>{m}:{s}</span>
}

export default function Live() {
  const main = auctions[0]
  const [chat, setChat] = useState([
    { user: 'CardKing_MX', msg: '¡Empezamos con la Prizm 2024! 🔥', host: true },
    { user: 'PullFanatic', msg: 'Esa caja está fuego, voy por ella', host: false },
    { user: 'SlabCollector', msg: 'Puja en $400 👀', host: false },
    { user: 'MexiCards', msg: 'Alguien ya sacó un Wemby?', host: false },
  ])
  const [msg, setMsg] = useState('')

  const sendMsg = () => {
    if (!msg.trim()) return
    setChat((p) => [...p, { user: 'Tú', msg, host: false }])
    setMsg('')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
          <h1 className="text-3xl font-black text-white">Subastas en Vivo</h1>
          <span className="bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold px-2 py-0.5 rounded-full">LIVE</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stream */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
              {/* Video placeholder */}
              <div className="relative aspect-video bg-black">
                <img src={main.img} alt="" className="w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center mb-3 mx-auto cursor-pointer hover:bg-white/20 transition-colors">
                      <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <p className="text-white font-bold text-sm">Conectar al stream en vivo</p>
                    <p className="text-gray-500 text-xs mt-1">Necesitas una cuenta para ver</p>
                  </div>
                </div>
                {/* Live badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  EN VIVO
                </div>
                {/* Viewers */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur text-white text-xs font-medium px-2.5 py-1.5 rounded-lg">
                  👁 {main.viewers} viendo
                </div>
                {/* Timer overlay */}
                <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur px-3 py-2 rounded-xl text-center">
                  <div className="text-gray-500 text-[10px] uppercase tracking-wide">Tiempo</div>
                  <div className="text-2xl font-black font-mono"><Timer seconds={main.timeLeft} /></div>
                </div>
              </div>

              {/* Auction info */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-1">{main.host} · Host</div>
                    <h2 className="text-white font-black text-xl">{main.title}</h2>
                    <p className="text-gray-500 text-sm mt-1">{main.bids} ofertas realizadas</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-gray-500 text-xs mb-1">Oferta actual</div>
                    <div className="text-amber-400 font-black text-3xl">${main.currentBid}</div>
                  </div>
                </div>
                <div className="flex gap-3 mt-5">
                  <input type="number" placeholder={`Min. $${main.currentBid + 10}`}
                    className="flex-1 bg-[#1a1a1a] border border-white/10 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-500/50"
                  />
                  <button className="bg-amber-500 hover:bg-amber-400 text-black font-black px-6 py-3 rounded-xl text-sm transition-all hover:scale-105 shadow-lg shadow-amber-500/20">
                    PUJAR 🔥
                  </button>
                </div>
              </div>
            </div>

            {/* Other live streams */}
            <div>
              <h3 className="text-white font-bold mb-3 text-sm">Otros streams activos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {auctions.slice(1).map((a) => (
                  <div key={a.id} className="group bg-[#111] border border-white/5 hover:border-red-500/30 rounded-xl overflow-hidden cursor-pointer transition-all hover:-translate-y-0.5">
                    <div className="relative h-36 overflow-hidden">
                      <img src={a.img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-70" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent" />
                      <div className="absolute top-2 left-2 bg-red-600/90 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>LIVE
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-black font-mono px-2 py-0.5 rounded">
                        <Timer seconds={a.timeLeft} />
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-white font-bold text-sm leading-tight mb-2">{a.title}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-amber-400 font-black text-base">${a.currentBid}</div>
                          <div className="text-gray-600 text-[10px]">{a.bids} ofertas · 👁 {a.viewers}</div>
                        </div>
                        <button className="bg-red-600 hover:bg-red-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs">
                          Unirme
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="bg-[#111] border border-white/5 rounded-2xl flex flex-col h-[600px]">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-white font-bold text-sm">Chat en vivo</h3>
              <p className="text-gray-600 text-xs">{main.viewers} personas en sala</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chat.map((m, i) => (
                <div key={i}>
                  <span className={`text-xs font-bold mr-1 ${m.host ? 'text-amber-400' : m.user === 'Tú' ? 'text-blue-400' : 'text-gray-500'}`}>
                    {m.host ? '👑 ' : ''}{m.user}
                  </span>
                  <span className="text-gray-300 text-xs">{m.msg}</span>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/5 flex gap-2">
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
                className="flex-1 bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-3 py-2 rounded-lg text-xs focus:outline-none focus:border-amber-500/50"
              />
              <button onClick={sendMsg} className="bg-amber-500 hover:bg-amber-400 text-black font-black px-3 py-2 rounded-lg text-xs transition-all">
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
