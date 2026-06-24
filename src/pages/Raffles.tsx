const raffles = [
  {
    id: 1,
    title: '2024 Panini Prizm Basketball Hobby Box',
    type: 'Rifa',
    price: '$15',
    total: 100,
    sold: 73,
    date: 'Jun 30, 2026 · 9PM',
    img: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=600&q=80',
    prize: 'Hobby Box sellada',
  },
  {
    id: 2,
    title: 'Group Break · Panini Select Soccer 2024',
    type: 'Break',
    price: '$35 / spot',
    total: 32,
    sold: 28,
    date: 'Jul 2, 2026 · 8PM',
    img: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=600&q=80',
    prize: 'Cartas de tu equipo',
  },
  {
    id: 3,
    title: 'Rifa · LeBron James RC PSA 9',
    type: 'Rifa',
    price: '$25',
    total: 50,
    sold: 12,
    date: 'Jul 5, 2026 · 10PM',
    img: 'https://images.unsplash.com/photo-1546519638405-a9f9f1c9d0b3?w=600&q=80',
    prize: 'Carta certificada PSA',
  },
  {
    id: 4,
    title: 'Group Break · Topps Chrome Baseball Jumbo',
    type: 'Break',
    price: '$45 / spot',
    total: 30,
    sold: 30,
    date: 'Jun 28, 2026 · 7PM',
    img: 'https://images.unsplash.com/photo-1540747913346-19212a4b423e?w=600&q=80',
    prize: 'Cartas de tu equipo MLB',
    soldOut: true,
  },
]

const past = [
  { title: 'Rifa Messi Select RC', winner: '@MessiFan_MX', prize: '$2,200', date: 'Jun 15' },
  { title: 'Break Prizm NFL', winner: '@NFLBreaker', prize: 'Cartas Chiefs', date: 'Jun 10' },
  { title: 'Rifa Ohtani PSA 10', winner: '@BaseballCollector', prize: '$1,800', date: 'Jun 5' },
]

export default function Raffles() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">PullStack</p>
          <h1 className="text-4xl font-black text-white mb-2">Rifas & Breaks</h1>
          <p className="text-gray-500">Participa y gana cartas y cajas exclusivas</p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 bg-[#111] border border-white/5 rounded-2xl p-6">
          {[
            { step: '01', title: 'Elige una rifa o break', desc: 'Selecciona el evento y el número de tickets o tu spot de equipo.' },
            { step: '02', title: 'Paga de forma segura', desc: 'Pago protegido con Stripe. Tu dinero está seguro hasta el sorteo.' },
            { step: '03', title: 'Gana y recibe', desc: 'Sorteo en vivo y transparente. Las cartas se envían a tu dirección.' },
          ].map((s) => (
            <div key={s.step} className="flex gap-4">
              <div className="text-4xl font-black text-amber-500/20 leading-none">{s.step}</div>
              <div>
                <div className="text-white font-bold text-sm mb-1">{s.title}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Active raffles */}
        <h2 className="text-xl font-black text-white mb-6">Activos ahora</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {raffles.map((r) => (
            <div key={r.id} className={`group bg-[#111] border rounded-2xl overflow-hidden transition-all hover:-translate-y-1 ${r.soldOut ? 'border-white/5 opacity-60' : 'border-white/5 hover:border-amber-500/30 hover:shadow-[0_20px_40px_rgba(245,158,11,0.08)] cursor-pointer'}`}>
              <div className="relative h-48 overflow-hidden">
                <img src={r.img} alt={r.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent" />
                <div className={`absolute top-3 left-3 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${r.type === 'Rifa' ? 'bg-amber-500 text-black' : 'bg-purple-600 text-white'}`}>
                  {r.type}
                </div>
                {r.soldOut && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-red-600 text-white font-black px-4 py-2 rounded-xl text-sm">AGOTADO</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-white font-bold text-sm leading-snug mb-1">{r.title}</h3>
                <div className="text-amber-500 text-xs font-bold mb-3">Premio: {r.prize}</div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-gray-600 mb-1">
                    <span>{r.sold}/{r.total} tickets</span>
                    <span>{Math.round((r.sold / r.total) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${(r.sold / r.total) * 100}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-black text-lg">{r.price}</div>
                    <div className="text-gray-600 text-[10px]">📅 {r.date}</div>
                  </div>
                  {!r.soldOut && (
                    <button className="bg-amber-500 hover:bg-amber-400 text-black font-black py-2 px-4 rounded-lg text-xs transition-all hover:scale-105">
                      Participar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Past winners */}
        <div>
          <h2 className="text-xl font-black text-white mb-5">Ganadores recientes 🏆</h2>
          <div className="bg-[#111] border border-white/5 rounded-2xl divide-y divide-white/5">
            {past.map((p) => (
              <div key={p.title} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-white font-bold text-sm">{p.title}</div>
                  <div className="text-gray-500 text-xs">{p.date}</div>
                </div>
                <div className="text-center">
                  <div className="text-amber-400 font-black text-sm">{p.winner}</div>
                  <div className="text-gray-500 text-xs">{p.prize}</div>
                </div>
                <div className="text-2xl">🏆</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
