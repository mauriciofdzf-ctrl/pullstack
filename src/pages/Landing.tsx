import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IMAGE_DEFAULTS, loadImageOverridesFromDB } from '../lib/imageConfig'
import { useAuth } from '../contexts/AuthContext'

export default function Landing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [IMGS, setIMGS] = useState(IMAGE_DEFAULTS)

  useEffect(() => {
    loadImageOverridesFromDB().then(overrides => {
      if (Object.keys(overrides).length > 0) setIMGS({ ...IMAGE_DEFAULTS, ...overrides })
    })
  }, [])

  // Redirige a marketplace si ya tiene sesión
  useEffect(() => {
    if (user) navigate('/marketplace', { replace: true })
  }, [user, navigate])

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
      <style>{`
        @keyframes cardFloat1{0%,100%{transform:rotate(-8deg) translateY(0px)}50%{transform:rotate(-8deg) translateY(-12px)}}
        @keyframes cardFloat2{0%,100%{transform:rotate(12deg) translateY(0px)}50%{transform:rotate(12deg) translateY(-8px)}}
        @keyframes cardFloat3{0%,100%{transform:rotate(3deg) translateY(0px)}50%{transform:rotate(3deg) translateY(-16px)}}
        @keyframes shimmer{0%{transform:translateX(-150%)}100%{transform:translateX(250%)}}
      `}</style>

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-[#08061a]" />
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 80% 60% at 20% 50%, rgba(109,40,217,0.12) 0%, transparent 70%)'}} />
        <div className="absolute inset-0" style={{background:'radial-gradient(ellipse 60% 50% at 75% 40%, rgba(245,158,11,0.08) 0%, transparent 70%)'}} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{backgroundImage:'linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)',backgroundSize:'50px 50px'}} />

        {/* ── Animated Cards (right side) ── */}
        <div className="absolute right-0 top-0 bottom-0 w-[48%] hidden lg:flex items-center justify-center">
          <div className="relative w-80 h-[460px]">

            {/* Card 1 — Pokémon (back-left) */}
            <div className="absolute left-0 top-8 w-44 h-[248px] rounded-2xl overflow-hidden shadow-2xl border border-yellow-500/30"
              style={{animation:'cardFloat1 6s ease-in-out infinite',background:'linear-gradient(135deg,#7c2d12 0%,#c2410c 40%,#92400e 100%)'}}>
              <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 30% 30%,rgba(255,255,255,0.4) 0%,transparent 60%)'}} />
              {/* shimmer */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 w-1/3 h-full opacity-30 skew-x-[-20deg]"
                  style={{background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.6),transparent)',animation:'shimmer 4s ease-in-out infinite 2s'}} />
              </div>
              <div className="absolute inset-0 p-3 flex flex-col">
                <div className="flex items-center justify-between mb-auto">
                  <span className="text-yellow-200 text-[9px] font-black bg-black/30 px-1.5 py-0.5 rounded">120 HP ⚡</span>
                  <span className="text-[18px]">🔥</span>
                </div>
                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-2.5">
                  <p className="text-orange-300 text-[9px] font-bold uppercase tracking-widest mb-0.5">Pokémon TCG</p>
                  <p className="text-white font-black text-base leading-tight">Charizard Holo</p>
                  <p className="text-orange-200/70 text-[10px]">1st Edition · PSA 10</p>
                  <p className="text-yellow-400 font-black text-sm mt-1.5">$550,000</p>
                </div>
              </div>
            </div>

            {/* Card 2 — Soccer (back-right) */}
            <div className="absolute right-0 top-4 w-40 h-[220px] rounded-2xl overflow-hidden shadow-2xl border border-emerald-500/25"
              style={{animation:'cardFloat2 5s ease-in-out infinite 1s',background:'linear-gradient(135deg,#064e3b 0%,#065f46 50%,#047857 100%)'}}>
              <div className="absolute inset-0 opacity-15" style={{backgroundImage:'radial-gradient(circle at 70% 20%,rgba(255,255,255,0.4) 0%,transparent 60%)'}} />
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 w-1/3 h-full opacity-25 skew-x-[-20deg]"
                  style={{background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)',animation:'shimmer 5s ease-in-out infinite 0.5s'}} />
              </div>
              <div className="absolute inset-0 p-3 flex flex-col">
                <p className="text-emerald-300 text-[9px] font-bold uppercase tracking-widest mb-auto">⚽ Soccer · Topps</p>
                <div className="bg-black/40 backdrop-blur-sm rounded-xl p-2">
                  <p className="text-white font-black text-sm leading-tight">Lamine Yamal</p>
                  <p className="text-emerald-200/70 text-[9px]">RC Euro 2024 · /150</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-emerald-400 font-black text-xs">$396,500</p>
                    <span className="bg-violet-600/80 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">PSA 10</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 — NBA (front hero card) */}
            <div className="absolute left-8 bottom-0 w-52 rounded-2xl overflow-hidden z-10 border border-violet-400/50"
              style={{height:'300px',animation:'cardFloat3 4.5s ease-in-out infinite 0.3s',
                background:'linear-gradient(135deg,#1e1060 0%,#2d1b8a 50%,#120b55 100%)',
                boxShadow:'0 0 60px rgba(139,92,246,0.35),0 20px 60px rgba(0,0,0,0.6)'}}>
              {/* Holographic overlay */}
              <div className="absolute inset-0 opacity-10" style={{backgroundImage:'repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,0.08) 4px,rgba(255,255,255,0.08) 5px)'}} />
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 w-1/2 h-full opacity-20 skew-x-[-15deg]"
                  style={{background:'linear-gradient(90deg,transparent,rgba(167,139,250,0.8),transparent)',animation:'shimmer 3.5s ease-in-out infinite 1s'}} />
              </div>
              {/* Stars */}
              <div className="absolute top-2 right-3 text-yellow-400 text-xs opacity-60">✦ ✦</div>
              <div className="absolute inset-0 p-4 flex flex-col">
                <p className="text-violet-400 text-[9px] font-bold uppercase tracking-widest mb-auto">🏀 NBA · Topps Now 2025</p>
                <div>
                  <p className="text-white font-black text-2xl leading-tight">Cooper Flagg</p>
                  <p className="text-gray-400 text-[11px] mb-4">Dallas Mavericks · #1 Draft RC Auto</p>
                  <div className="flex items-center justify-between">
                    <p className="text-violet-300 font-black text-xl">$27,500</p>
                    <span className="bg-violet-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full">BGS 9.5</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── Hero text ── */}
        <div className="relative max-w-7xl mx-auto px-6 py-28 w-full">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full mb-8 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              Deportes · TCG · Coleccionables
            </div>
            <h1 className="text-6xl sm:text-7xl font-black leading-[0.9] mb-6 tracking-tighter">
              COLECCIONA<br />LO QUE{' '}
              <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">
                AMAS.
              </span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-md">
              La plataforma de LATAM para comprar, vender e intercambiar cartas.
              Todos los deportes, todos los gustos — en un solo lugar.
            </p>
            <div className="flex flex-wrap gap-3 mb-14">
              <button
                onClick={() => navigate('/register')}
                className="bg-amber-500 hover:bg-amber-400 text-black font-black px-8 py-3.5 rounded-xl text-sm transition-all hover:scale-105 shadow-lg shadow-amber-500/25 uppercase tracking-wide"
              >
                Crear cuenta gratis
              </button>
              <button
                onClick={() => navigate('/login')}
                className="border border-white/15 hover:border-amber-500/40 text-white hover:text-amber-400 font-semibold px-8 py-3.5 rounded-xl text-sm transition-all"
              >
                Iniciar sesión →
              </button>
            </div>
            <div className="flex flex-wrap gap-8 pt-8 border-t border-white/5">
              {[
                { icon: '💳', label: 'Pagos fáciles',       sub: 'OXXO, SPEI, tarjeta y más' },
                { icon: '🇲🇽', label: 'Precios en MXN',     sub: 'Sin conversiones complicadas' },
                { icon: '🔒', label: 'Transacciones seguras', sub: 'Escrow integrado P2P' },
              ].map((s) => (
                <div key={s.label} className="flex items-start gap-2.5">
                  <span className="text-xl mt-0.5">{s.icon}</span>
                  <div>
                    <div className="text-white text-sm font-black">{s.label}</div>
                    <div className="text-gray-600 text-xs mt-0.5">{s.sub}</div>
                  </div>
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
                onClick={() => navigate(user ? cat.path : '/register')}
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
            <button onClick={() => navigate(user ? '/marketplace' : '/register')} className="text-sm text-amber-400 hover:text-amber-300 font-semibold border border-amber-500/20 hover:border-amber-500/40 px-4 py-2 rounded-lg transition-all">
              Ver todo →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trending.map((card) => (
              <div
                key={card.player}
                onClick={() => navigate(user ? '/marketplace' : '/register')}
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
            <button onClick={() => navigate(user ? '/live' : '/register')} className="text-sm text-red-400 hover:text-red-300 font-semibold border border-red-500/20 hover:border-red-500/40 px-4 py-2 rounded-lg transition-all">
              Ver todos →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {liveNow.map((a) => (
              <div key={a.title} onClick={() => navigate(user ? '/live' : '/register')}
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
                  <button
                    onClick={e => { e.stopPropagation(); navigate(user ? '/live' : '/register') }}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-2.5 rounded-xl text-sm transition-all"
                  >
                    {user ? '🔴 Unirme al live' : '🔴 Acceder al live'}
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
            <div className="md:col-span-2 relative rounded-2xl overflow-hidden h-64 group cursor-pointer" onClick={() => navigate(user ? '/marketplace' : '/register')}>
              <img src={IMGS.cards} alt="Explorador" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end">
                <p className="text-3xl mb-2">🃏</p>
                <h3 className="text-white font-black text-2xl mb-1">Explorador · Marketplace</h3>
                <p className="text-gray-400 text-sm max-w-sm">Cartas individuales, cajas selladas y accesorios en un solo lugar. Filtra por deporte, tipo y precio.</p>
                <button className="mt-4 self-start text-amber-400 text-sm font-bold border border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-500/5 px-4 py-2 rounded-lg transition-all">Explorar →</button>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden h-64 group cursor-pointer" onClick={() => navigate(user ? '/marketplace' : '/register')}>
              <img src={IMGS.soccer2} alt="Trading P2P" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 to-black/30" />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <p className="text-2xl mb-2">🔄</p>
                <h3 className="text-white font-black text-xl mb-1">Trading P2P</h3>
                <p className="text-gray-400 text-xs leading-relaxed">Intercambia cartas 1:1 o con diferencia de valor. Sistema de escrow para máxima seguridad.</p>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden h-64 group cursor-pointer" onClick={() => navigate(user ? '/live' : '/register')}>
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
            <div className="md:col-span-2 relative rounded-2xl overflow-hidden h-64 group cursor-pointer" onClick={() => navigate(user ? '/raffles' : '/register')}>
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

      {/* ─── GATE DE REGISTRO ─── */}
      {!user && (
        <section className="py-20 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#13102a] to-[#0c0a1e]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-amber-500/8 blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-violet-600/8 blur-[100px] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          <div className="relative max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold px-4 py-1.5 rounded-full mb-8 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              Acceso gratuito · LATAM
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight">
              Ya viste lo que hay adentro.<br />
              <span className="bg-gradient-to-r from-amber-400 to-yellow-300 bg-clip-text text-transparent">Regístrate gratis.</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Compra, vende, subasta y haz trading de cartas deportivas en la plataforma de LATAM. Sin complicaciones.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="bg-amber-500 hover:bg-amber-400 text-black font-black px-10 py-4 rounded-xl text-base transition-all hover:scale-105 shadow-2xl shadow-amber-500/25"
              >
                Crear cuenta gratis →
              </button>
              <button
                onClick={() => navigate('/login')}
                className="border border-white/15 hover:border-white/30 text-gray-300 hover:text-white font-semibold px-10 py-4 rounded-xl text-base transition-all"
              >
                Ya tengo cuenta
              </button>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              {['Sin tarjeta requerida', 'SPEI · OXXO · MercadoPago', 'Soporte en español'].map(f => (
                <span key={f} className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">✓</span> {f}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── MARCAS ─── */}
      <section className="py-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c0a1e] to-[#13102a]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full bg-violet-600/8 blur-[80px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        <div className="relative max-w-6xl mx-auto">
          <p className="text-center text-gray-600 text-[10px] uppercase tracking-[0.3em] mb-10">Marcas y juegos disponibles</p>
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-5">
            {['TOPPS', 'PANINI', 'UPPER DECK', 'BOWMAN', 'DONRUSS', 'POKÉMON TCG', 'ONE PIECE TCG', 'DRAGON BALL SUPER', 'YU-GI-OH!', 'MAGIC: THE GATHERING'].map((b) => (
              <span key={b} className="text-gray-600 hover:text-amber-400 font-black text-sm tracking-tight transition-all cursor-pointer hover:scale-105">{b}</span>
            ))}
          </div>
        </div>
      </section>


      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-700 text-sm">© 2026 PullStackMX · Todos los derechos reservados</p>
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
