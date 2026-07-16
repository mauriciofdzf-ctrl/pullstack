import { useState } from 'react'

const SCHEDULE = [
  { id: 1, sport: 'NBA',      title: 'Topps Chrome Sapphire NBA 2023-24',          date: 'Hoy 8:00 PM',      status: 'live',    viewers: 47 },
  { id: 2, sport: 'NFL',      title: 'Panini Prizm NFL 2024 Hobby Box x3',          date: 'Mañana 7:00 PM',   status: 'upcoming', viewers: 0 },
  { id: 3, sport: 'Soccer',   title: 'Topps Chrome UEFA Champions League 2024-25',  date: 'Sáb 6:00 PM',      status: 'upcoming', viewers: 0 },
  { id: 4, sport: 'Pokémon',  title: 'Scarlet & Violet Booster Box x2',             date: 'Dom 5:00 PM',      status: 'upcoming', viewers: 0 },
  { id: 5, sport: 'MLB',      title: 'Bowman Chrome Jumbo Box Baseball 2024',       date: 'Lun 8:00 PM',      status: 'upcoming', viewers: 0 },
]

const PAST = [
  { id: 1, title: 'Prizm NBA 2022-23 Hobby x2',       sport: 'NBA',    date: 'hace 2 días',   highlight: 'Wembanyama RC /99 🔥',   pulls: '6 hits' },
  { id: 2, title: 'Chrome Mega Box Baseball x5',       sport: 'MLB',    date: 'hace 5 días',   highlight: 'Corbin Carroll Auto RC', pulls: '4 autos' },
  { id: 3, title: 'Panini Immaculate NFL 2023',        sport: 'NFL',    date: 'hace 1 semana', highlight: 'CJ Stroud RPA /49',      pulls: '3 RPAs' },
  { id: 4, title: 'Pokémon 151 ETB x4',               sport: 'Pokémon',date: 'hace 2 semanas',highlight: 'Charizard Illustration Rare', pulls: '2 SAR' },
]

const SPORT_BADGE: Record<string, string> = {
  NBA:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
  NFL:     'bg-green-500/20  text-green-400  border-green-500/30',
  Soccer:  'bg-blue-500/20   text-blue-400   border-blue-500/30',
  MLB:     'bg-red-500/20    text-red-400    border-red-500/30',
  Pokémon: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
}

const HOW_IT_WORKS = [
  { icon: '📦', title: 'Caja real', desc: 'Compramos cajas selladas de distribuidores certificados' },
  { icon: '🎲', title: 'Randomizer', desc: 'Los spots se asignan al azar con herramienta verificable' },
  { icon: '📹', title: 'En vivo', desc: 'Abrimos en stream, todos ven cada carta al mismo tiempo' },
  { icon: '🚚', title: 'Envío', desc: 'Tu carta llega a tu puerta con seguro incluido' },
]

export default function Live() {
  const [notifiedIds, setNotifiedIds] = useState<Set<number>>(new Set())

  const toggle = (id: number) =>
    setNotifiedIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  return (
    <div className="min-h-screen bg-[#0c0a1e] pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 font-bold text-sm uppercase tracking-wider">En Vivo ahora</span>
          </div>
          <h1 className="text-white text-3xl font-black mb-2">Breaks & Livestreams</h1>
          <p className="text-gray-400">Aperturas en vivo de cajas con odds transparentes. Cada break es grabado y publicado.</p>
        </div>

        {/* Live stream player */}
        <div className="bg-[#1c1835] border border-white/5 rounded-2xl overflow-hidden mb-8">
          <div className="aspect-video bg-[#13102a] flex items-center justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#08061a] to-[#1c1835] flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-white font-bold text-xl mb-1">Topps Chrome Sapphire NBA</p>
                <p className="text-gray-500 text-sm">Abriendo ahora — 4 Hobby Boxes</p>
              </div>
            </div>
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 px-3 py-1 rounded-lg">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white font-black text-xs">LIVE</span>
            </div>
            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur px-3 py-1 rounded-lg text-gray-300 text-xs font-bold">
              👁 {SCHEDULE[0].viewers} viendo
            </div>
          </div>
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-white font-bold truncate">{SCHEDULE[0].title}</h3>
              <p className="text-gray-500 text-sm">PullStackMX Live · Comenzó hace 12 min</p>
            </div>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer"
              className="bg-red-500 hover:bg-red-400 text-white font-black px-4 py-2 rounded-xl text-sm transition-all shrink-0">
              Unirme al chat →
            </a>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          {/* Schedule */}
          <div className="lg:col-span-2">
            <h2 className="text-white font-bold text-lg mb-4">Próximos breaks</h2>
            <div className="space-y-3">
              {SCHEDULE.map(ev => (
                <div key={ev.id} className="bg-[#1c1835] border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all">
                  <div className="flex items-center gap-3">
                    {ev.status === 'live' ? (
                      <div className="flex items-center gap-1.5 bg-red-500/20 border border-red-500/30 text-red-400 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" /> LIVE
                      </div>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${SPORT_BADGE[ev.sport] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                        {ev.sport}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{ev.title}</p>
                      <p className="text-gray-600 text-xs">{ev.date}</p>
                    </div>
                    {ev.status === 'live' ? (
                      <button className="bg-red-500 hover:bg-red-400 text-white font-black px-3 py-1.5 rounded-lg text-xs shrink-0 transition-all">
                        Ver
                      </button>
                    ) : (
                      <button onClick={() => toggle(ev.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 border transition-all ${notifiedIds.has(ev.id) ? 'bg-violet-500/20 border-violet-500/40 text-violet-400' : 'bg-[#26213d] border-white/10 text-gray-400 hover:border-white/20'}`}>
                        {notifiedIds.has(ev.id) ? '✓ Anotado' : 'Notificarme'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-[#1c1835] border border-white/5 rounded-2xl p-4 text-center">
              <p className="text-gray-500 text-sm mb-3">¿Quieres entrar a un break grupal?</p>
              <a href="/messages"
                className="inline-block bg-violet-600 hover:bg-violet-500 text-white font-black px-5 py-2.5 rounded-xl text-sm transition-all">
                Solicitar spot en grupo break
              </a>
            </div>
          </div>

          {/* Past breaks */}
          <div>
            <h2 className="text-white font-bold text-lg mb-4">Breaks anteriores</h2>
            <div className="space-y-3">
              {PAST.map(p => (
                <div key={p.id} className="bg-[#1c1835] border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SPORT_BADGE[p.sport] || ''}`}>{p.sport}</span>
                    <span className="text-gray-600 text-[10px]">{p.date}</span>
                  </div>
                  <p className="text-white font-bold text-sm mb-1">{p.title}</p>
                  <p className="text-gray-600 text-xs mb-2">{p.pulls}</p>
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg px-2.5 py-1.5 text-violet-400 text-xs font-bold">
                    🔥 {p.highlight}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-[#1c1835] border border-white/5 rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-5 text-center">¿Cómo funcionan los breaks?</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            {HOW_IT_WORKS.map(h => (
              <div key={h.title} className="text-center">
                <div className="text-3xl mb-2">{h.icon}</div>
                <div className="text-white font-bold text-sm mb-1">{h.title}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{h.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
