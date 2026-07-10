import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IMAGE_DEFAULTS, loadImageOverridesFromDB } from '../lib/imageConfig'

export default function Landing() {
  const navigate = useNavigate()
  const [IMGS, setIMGS] = useState(IMAGE_DEFAULTS)

  useEffect(() => {
    loadImageOverridesFromDB().then(overrides => {
      if (Object.keys(overrides).length > 0) setIMGS({ ...IMAGE_DEFAULTS, ...overrides })
    })
  }, [])

  // Arrays inside component so they can reference IMGS
  const trending = [
    { player: 'Lamine Yamal',        detail: '2024 Topps Chrome UEFA Euro · SuperFractor Auto 1/1', team: 'FC Barcelona · Selección España', grade: 'PSA 10',      price: '$396,500',    change: '+585% en ventas / último año',    sport: '⚽ Soccer',   hot: true, img: IMGS.soccer1 },
    { player: 'Cooper Flagg',         detail: '2025 Topps Now RC Auto · Draft Night #1',             team: 'Dallas Mavericks · #1 Draft 2025', grade: 'BGS 9.5',     price: '$27,500',     change: '+210% desde Draft Night',         sport: '🏀 NBA',      hot: true, img: IMGS.nba1 },
    { player: 'Charizard Holo 1st Ed.', detail: '1999 Base Set 1st Edition · Holo Rare · #4/102',   team: 'Pokémon TCG · Base Set',           grade: 'PSA 10',      price: '$550,000',    change: '+89% en 12 meses',                sport: '⚡ Pokémon',  hot: true, img: IMGS.pokemon1 },
    { player: 'Pikachu Illustrator',  detail: '1998 CoroCoro Comics Promo · Solo 41 en el mundo',   team: 'Pokémon TCG · Promo',              grade: 'PSA 10',      price: '$16,492,000', change: 'Récord mundial Feb 2026 🏆',       sport: '⚡ Pokémon',  hot: true, img: IMGS.pokemon1 },
  ]

  const categories = [
    { name: 'NBA 🏀',        sub: 'Cooper Flagg · Wembanyama · LeBron',    count: '12,400 cartas', img: IMGS.nba2,      path: '/marketplace?sport=NBA' },
    { name: 'NFL 🏈',        sub: 'Jayden Daniels · Cam Ward · Mahomes',   count: '9,800 cartas',  img: IMGS.nfl1,      path: '/marketplace?sport=NFL' },
    { name: 'Soccer ⚽',     sub: 'Lamine Yamal · Vinicius Jr · Haaland',  count: '18,200 cartas', img: IMGS.soccer2,   path: '/marketplace?sport=Soccer' },
    { name: 'MLB ⚾',        sub: 'Shohei Ohtani · Roman Anthony',          count: '7,600 cartas',  img: IMGS.mlb1,      path: '/marketplace?sport=MLB' },
    { name: 'Pokémon ⚡',    sub: 'Charizard · Pikachu · Mewtwo',          count: '31,000 cartas', img: IMGS.pokemon1,  path: '/marketplace?sport=Pokémon' },
    { name: 'One Piece 🏴‍☠️', sub: 'Luffy · Zoro · Shanks · Nami',          count: '8,900 cartas',  img: IMGS.onepiece1, path: '/marketplace?sport=One+Piece' },
  ]

  const liveNow = [
    { title: '2025-26 Topps Basketball Hobby Box — RC Cooper Flagg garantizado', host: 'CardKing_MX',    viewers: 342, bid: '$420', time: '02:14', img: IMGS.nba3 },
    { title: 'Lamine Yamal Topps Chrome Euro Blue Refractor /150',               host: 'YamalTrader',    viewers: 561, bid: '$38',  time: '00:47', img: IMGS.soccer3 },
    { title: 'Pokémon SV 151 Booster Box — Mewtwo ex SAR chase',                 host: 'PokéBreaker_MX', viewers: 228, bid: '$190', time: '04:30', img: IMGS.pokemon1 },
  ]

  return (
    <main className="bg-[#0c0a1e] text-white pt-16">

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${IMGS.cards}')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08061a] via-[#0c0a1e]/92 to-[#08061a]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#08061a] via-transparent to-[#08061a]/20" />
        {/* Glow ambiental */}
        <div className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-amber-500/6 blur-[120px] pointer-events-none" />
        <div className="absolute right-1/3 top-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-[100px] pointer-events-none" />

        {/* Floating cards */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:flex items-center justify-end pr-12">
          <div className="relative w-80 h-[440px]">
            <div className="absolute left-0 top-10 w-44 h-64 rounded-2xl overflow-hidden rotate-[-8deg] opacity-60 shadow-2xl border border-white/10">
              <img src={IMGS.soccer2} alt="Soccer" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-violet-400 text-[10px] font-bold uppercase tracking-widest">Soccer · Topps Chrome</p>
                <p className="text-white font-black text-sm">Lamine Yamal</p>
                <p className="text-gray-300 text-[10px]">RC Euro 2024 · /150</p>
              </div>
            </div>
            <div className="absolute right-2 top-6 w-40 h-56 rounded-2xl overflow-hidden rotate-[11deg] opacity-70 shadow-2xl border border-yellow-500/20">
              <img src={IMGS.pokemon1} alt="Pokemon" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest">Pokémon TCG</p>
                <p className="text-white font-black text-sm">Charizard Holo</p>
                <p className="text-gray-300 text-[10px]">1st Ed. PSA 10</p>
              </div>
            </div>
            <div className="absolute left-10 bottom-0 w-52 rounded-2xl overflow-hidden rotate-[3deg] z-10 shadow-[0_0_80px_rgba(245,158,11,0.3)] border border-violet-400/40" style={{height:'304px'}}>
              <img src={IMGS.nba1} alt="NBA" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-violet-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">NBA · Topps Now 2025</p>
                <p className="text-white font-black text-xl leading-tight">Cooper Flagg</p>
                <p className="text-gray-300 text-xs">Dallas Mavericks · #1 Draft RC Auto</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-violet-400 font-black text-lg">$27,500</p>
                  <span className="bg-violet-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">BGS 9.5</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-28 w-full">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full mb-8 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              NBA · NFL · Soccer · MLB · Pokémon · One Piece
            </div>
            <h1 className="text-6xl sm:text-7xl font-black leading-[0.88] mb-6 tracking-tighter">
              TU COLECCIÓN.<br />
              TU{' '}
              <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                INVERSIÓN.
              </span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-md">
              El marketplace más completo para cartas deportivas y TCG en LATAM.
              Compra, vende, subasta y haz trading — todo en un solo lugar seguro.
            </p>
            <div className="flex flex-wrap gap-3 mb-14">
              <button
                onClick={() => navigate('/marketplace')}
                className="bg-amber-500 hover:bg-amber-400 text-black font-black px-8 py-3.5 rounded-xl text-sm transition-all hover:scale-105 shadow-lg shadow-amber-500/25 uppercase tracking-wide"
              >
                Explorar ahora
              </button>
              <button
                onClick={() => navigate('/live')}
                className="flex items-center gap-2 border border-white/15 hover:border-red-500/50 text-white hover:text-red-400 font-semibold px-8 py-3.5 rounded-xl text-sm transition-all"
              >
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Ver en vivo
              </button>
            </div>
            <div className="flex gap-10 pt-8 border-t border-white/5">
              {[
                { value: 'SPEI', label: 'OXXO · MercadoPago · Tarjeta', color: 'text-emerald-400' },
                { value: '8%',   label: 'Comisión transparente',          color: 'text-amber-400' },
                { value: 'MXN',  label: 'Precios en pesos disponibles',   color: 'text-violet-400' },
              ].map((s) => (
                <div key={s.label}>
                  <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-gray-600 text-xs mt-1 uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CATEGORÍAS ─── */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#13102a] to-[#0c0a1e] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">Explorar</p>
            <h2 className="text-4xl font-black text-white">Todas las categorías</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => navigate('/marketplace')}
                className="group relative rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer text-left"
              >
                <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                <div className="absolute inset-0 border border-amber-500/0 group-hover:border-amber-500/40 rounded-2xl transition-colors group-hover:shadow-[inset_0_0_20px_rgba(245,158,11,0.08)]" />
                <div className="absolute inset-0 p-3 flex flex-col justify-end">
                  <p className="text-white font-black text-sm leading-tight">{cat.name}</p>
                  <p className="text-gray-400 text-[10px] mt-0.5 leading-snug hidden sm:block">{cat.sub}</p>
                  <p className="text-amber-400 text-[10px] font-bold mt-1">{cat.count}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRENDING ─── */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">Mercado 2026</p>
              <h2 className="text-4xl font-black text-white">Las cartas más hot 🔥</h2>
              <p className="text-gray-500 text-sm mt-1">Precios reales verificados · eBay, Goldin, PSA</p>
            </div>
            <button onClick={() => navigate('/marketplace')} className="text-sm text-amber-400 hover:text-amber-300 font-semibold border border-amber-500/20 hover:border-amber-500/40 px-4 py-2 rounded-lg transition-all">
              Ver todo →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trending.map((card) => (
              <div
                key={card.player}
                onClick={() => navigate('/marketplace')}
                className="group bg-[#1c1835] border border-white/5 hover:border-amber-500/30 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(245,158,11,0.15)]"
              >
                <div className="relative h-56 overflow-hidden">
                  <img src={card.img} alt={card.sport} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a1e] via-black/20 to-transparent" />
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">🔥 {card.sport}</div>
                  <div className="absolute top-3 right-3 bg-black/70 backdrop-blur text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-amber-500/30">{card.grade}</div>
                </div>
                <div className="p-4">
                  <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-1">{card.detail}</p>
                  <h3 className="text-white font-black text-base leading-tight mb-0.5">{card.player}</h3>
                  <p className="text-gray-600 text-[10px] mb-3">{card.team}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-black text-lg">{card.price}</div>
                      <div className="text-green-400 text-[10px] font-bold">{card.change}</div>
                    </div>
                    <span className="bg-amber-500/10 border border-amber-500/25 text-amber-400 font-bold py-2 px-4 rounded-lg text-xs group-hover:bg-amber-500/20 transition-colors">Ver →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LIVE AUCTIONS ─── */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#0c0a1e] to-[#13102a] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-red-500/4 blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-500 text-xs font-bold uppercase tracking-widest">Subastas en Vivo Ahora</span>
              </div>
              <h2 className="text-4xl font-black text-white">Entrar al stream</h2>
            </div>
            <button onClick={() => navigate('/live')} className="text-sm text-red-400 hover:text-red-300 font-semibold border border-red-500/20 hover:border-red-500/40 px-4 py-2 rounded-lg transition-all">
              Ver todos →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {liveNow.map((a) => (
              <div key={a.title} onClick={() => navigate('/live')}
                className="group bg-[#1c1835] border border-white/5 hover:border-red-500/30 rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1">
                <div className="relative h-44 overflow-hidden">
                  <img src={a.img} alt={a.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent" />
                  <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    LIVE · {a.viewers} viewers
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-white font-bold text-sm leading-snug mb-1 line-clamp-2">{a.title}</p>
                  <p className="text-gray-600 text-xs mb-3">Host: {a.host}</p>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-gray-500 text-[10px] uppercase">Oferta actual</p>
                      <p className="text-amber-400 font-black text-xl">{a.bid}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-[10px] uppercase">Tiempo</p>
                      <p className="text-red-400 font-black text-xl font-mono">{a.time}</p>
                    </div>
                  </div>
                  <button className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-2.5 rounded-xl text-sm transition-all">
                    🔴 Unirme al live
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-3">Plataforma completa</p>
            <h2 className="text-4xl font-black text-white">Todo lo que necesita<br />un coleccionista serio</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="md:col-span-2 relative rounded-2xl overflow-hidden h-64 group cursor-pointer" onClick={() => navigate('/marketplace')}>
              <img src={IMGS.cards} alt="Explorador" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <p className="text-3xl mb-2">🃏</p>
                <h3 className="text-white font-black text-2xl mb-1">Explorador · Marketplace</h3>
                <p className="text-gray-400 text-sm max-w-sm">Cartas individuales, cajas selladas y accesorios en un solo lugar. Filtra por deporte, tipo y precio.</p>
                <button className="mt-4 self-start text-amber-400 text-sm font-bold border border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/5 px-4 py-2 rounded-lg transition-all">Explorar →</button>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden h-64 group cursor-pointer" onClick={() => navigate('/marketplace')}>
              <img src={IMGS.soccer2} alt="Trading P2P" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 to-black/30" />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <p className="text-2xl mb-2">🔄</p>
                <h3 className="text-white font-black text-xl mb-1">Trading P2P</h3>
                <p className="text-gray-400 text-xs leading-relaxed">Intercambia cartas 1:1 o con diferencia de valor. Sistema de escrow para máxima seguridad.</p>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden h-64 group cursor-pointer" onClick={() => navigate('/live')}>
              <img src={IMGS.pokemon1} alt="Subastas Live" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 to-black/30" />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-400 text-xs font-bold uppercase">En Vivo</span>
                </div>
                <h3 className="text-white font-black text-xl mb-1">Subastas Live</h3>
                <p className="text-gray-400 text-xs leading-relaxed">Subastas en tiempo real con video streaming. Chat en vivo. Pujas desde tu teléfono.</p>
              </div>
            </div>
            <div className="md:col-span-2 relative rounded-2xl overflow-hidden h-64 group cursor-pointer" onClick={() => navigate('/raffles')}>
              <img src={IMGS.nba2} alt="Rifas y breaks" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <div className="flex gap-2 mb-3 flex-wrap">
                  {['Rifas semanales', 'Group Breaks', 'Spot por equipo', 'Sorteo en vivo'].map((t) => (
                    <span key={t} className="bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
                <h3 className="text-white font-black text-2xl mb-1">Rifas & Group Breaks</h3>
                <p className="text-gray-400 text-sm max-w-sm">Compra tu spot de equipo en un group break o entra a rifas de cajas exclusivas.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── POR QUÉ PULLSTACK ─── */}
      <section className="py-20 px-6 bg-[#13102a]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">La diferencia LATAM</p>
            <h2 className="text-4xl font-black text-white">Lo que no encuentras<br />en eBay, Whatnot o Goldin</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {([
              ['🏦', 'emerald', 'Pagos 100% LATAM', 'SPEI, OXXO, MercadoPago. Sin tarjeta USD ni PayPal.'],
              ['🇲🇽', 'red',     'Precios en MXN',   'Ve exactamente cuánto pagas en pesos, tipo de cambio incluido.'],
              ['📬', 'blue',    'Grading Concierge', 'Enviamos tus cartas a PSA/BGS desde México con seguro y tracking.'],
              ['🤝', 'violet',  'Trading P2P Seguro','Escrow integrado. Sin riesgo de estafas en grupos de Facebook.'],
              ['📦', 'amber',   'Sin Aduanas Sorpresa','Costo real: precio + envío + impuestos + aranceles MX calculados.'],
              ['🎓', 'cyan',    'Educación en Español','RC, parallels, PSA pop, comps. Todo en español, todo gratis.'],
              ['📊', 'fuchsia', 'Precios Reales LATAM','Comps de eBay, Goldin, Fanatics. Sin inflación de WhatsApp.'],
              ['🎙️', 'orange',  'Comunidad Española', 'Subastas live con hosts mexicanos. No más streams en inglés.'],
            ] as [string, string, string, string][]).map(([icon, color, title, desc]) => {
              const c: Record<string, string> = {
                emerald:'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                red:'text-red-400 bg-red-500/10 border-red-500/20',
                blue:'text-blue-400 bg-blue-500/10 border-blue-500/20',
                violet:'text-violet-400 bg-violet-500/10 border-violet-500/20',
                amber:'text-amber-400 bg-amber-500/10 border-amber-500/20',
                cyan:'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                fuchsia:'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
                orange:'text-orange-400 bg-orange-500/10 border-orange-500/20',
              }
              return (
                <div key={title} className="bg-[#1c1835] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 border ${c[color]}`}>{icon}</div>
                  <h3 className="text-white font-black text-sm mb-1.5">{title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
              )
            })}
          </div>

          <div className="bg-[#1c1835] border border-white/5 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 text-center text-[10px] font-black uppercase tracking-widest border-b border-white/5">
              <div className="py-3 text-gray-600">Característica</div>
              <div className="py-3 text-gray-600 border-x border-white/5">Competencia (US)</div>
              <div className="py-3 text-emerald-400 bg-emerald-500/5">PullStack ✓</div>
            </div>
            {[
              ['Pagos LATAM (SPEI/OXXO)',     '❌ Solo USD/tarjeta',         '✅ SPEI · OXXO · MercadoPago'],
              ['Precios en MXN',              '❌ Solo USD',                  '✅ USD + MXN en tiempo real'],
              ['Grading desde México',        '❌ Auto-envío costoso a EUA',  '✅ Concierge local con seguro'],
              ['Soporte en español',          '❌ Solo inglés',               '✅ Español 100%'],
              ['Costo real de importación',   '❌ No calculado',              '✅ Incluido en precio'],
              ['Comunidad LATAM verificada',  '❌ Grupos de FB sin escrow',    '✅ Plataforma con escrow P2P'],
            ].map(([feat, them, us]) => (
              <div key={feat} className="grid grid-cols-3 border-b border-white/5 last:border-0">
                <div className="px-4 py-2.5 text-gray-400 text-xs">{feat}</div>
                <div className="px-4 py-2.5 text-gray-600 text-xs border-x border-white/5">{them}</div>
                <div className="px-4 py-2.5 text-emerald-400 text-xs font-bold">{us}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MARCAS ─── */}
      <section className="py-14 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-gray-700 text-[10px] uppercase tracking-[0.3em] mb-8">Marcas y juegos disponibles</p>
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-5">
            {['TOPPS', 'PANINI', 'UPPER DECK', 'BOWMAN', 'DONRUSS', 'POKÉMON TCG', 'ONE PIECE TCG', 'DRAGON BALL SUPER', 'YU-GI-OH!', 'MAGIC: THE GATHERING'].map((b) => (
              <span key={b} className="text-gray-700 hover:text-amber-400 font-black text-sm tracking-tight transition-colors cursor-pointer">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-28 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/10 to-black pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-5xl font-black text-white mb-4">¿Listo para tu<br /><span className="text-amber-400">primer pull?</span></h2>
          <p className="text-gray-400 mb-10 text-lg">Únete a +50,000 coleccionistas en la plataforma #1 de LATAM.</p>
          <button onClick={() => navigate('/marketplace')} className="bg-amber-500 hover:bg-amber-400 text-black font-black px-12 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-2xl shadow-amber-500/20">
            Empezar ahora →
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-black text-xs">PS</span>
            </div>
            <span className="text-white font-black">PullStack</span>
          </div>
          <p className="text-gray-700 text-sm">© 2026 PullStack · Todos los derechos reservados</p>
          <div className="flex gap-6">
            {['Términos', 'Privacidad', 'Contacto'].map((l) => (
              <a key={l} href="#" className="text-gray-700 hover:text-gray-400 text-sm transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
