import { useState } from 'react'

// ─── Imágenes por categoría ───────────────────────────────────────────────────
const IMG = {
  nba:      'https://images.unsplash.com/photo-1546519638405-a9f9f1c9d0b3?w=500&q=85', // cancha NBA
  nfl:      'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=500&q=85', // estadio NFL
  soccer:   'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&q=85', // acción soccer
  mlb:      'https://images.unsplash.com/photo-1540747913346-19212a4b423e?w=500&q=85', // béisbol
  pokemon:  'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=500&q=85', // cartas Pokémon
  onepiece: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&q=85', // anime merch
  accs:     'https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?w=500&q=85', // trading cards
}

// ─── Productos verificados ────────────────────────────────────────────────────
const PRODUCTS = [
  // ── Cajas NBA ──────────────────────────────────────────────────────────────
  {
    name:  '2025-26 Topps Basketball Hobby Box',
    brand: 'Topps',
    cat:   'Cajas NBA',
    price: '$290',
    msrp:  '$270 MSRP',
    stock: 8,
    img:   IMG.nba,
    badge: '🔥 Topps Era',
    desc:  'Topps tiene licencia NBA exclusiva desde 2025-26. ~24 packs · RC Autos garantizados · Cooper Flagg y Wemby en cada caja.',
  },
  {
    name:  '2024-25 Topps Chrome Basketball Hobby Box',
    brand: 'Topps',
    cat:   'Cajas NBA',
    price: '$210',
    msrp:  '$190 MSRP',
    stock: 12,
    img:   IMG.nba,
    badge: 'Nuevo',
    desc:  'Último set NBA bajo licencia Topps (primera temporada). Wembanyama, Caitlin Clark, rookies 2024.',
  },
  // ── Cajas NFL ──────────────────────────────────────────────────────────────
  {
    name:  '2025 Panini Prizm NFL Hobby Box',
    brand: 'Panini',
    cat:   'Cajas NFL',
    price: '$250',
    msrp:  '$230 MSRP',
    stock: 5,
    img:   IMG.nfl,
    badge: 'Nuevos RCs',
    desc:  'Cam Ward #1 Pick, Jaxson Dart, Quinn Ewers. 24 packs · 12 Prizm base RCs garantizados.',
  },
  {
    name:  '2024 Panini Prizm NFL Hobby Box',
    brand: 'Panini',
    cat:   'Cajas NFL',
    price: '$280',
    msrp:  '$240 MSRP',
    stock: 3,
    img:   IMG.nfl,
    badge: 'Trending 🔥',
    desc:  'Jayden Daniels, Caleb Williams, Marvin Harrison Jr. Los RCs más calientes de 2024.',
  },
  // ── Cajas Soccer ───────────────────────────────────────────────────────────
  {
    name:  '2026 Topps Chrome FIFA World Cup Hobby Box',
    brand: 'Topps',
    cat:   'Cajas Soccer',
    price: '$340',
    msrp:  '$320 MSRP',
    stock: 4,
    img:   IMG.soccer,
    badge: '🌍 World Cup 2026',
    desc:  'Copa del Mundo USA-Canadá-México 2026. Yamal, Vinicius Jr., Mbappé, Bellingham. El set del año.',
  },
  {
    name:  '2024-25 Topps Chrome UEFA UCL Hobby Box',
    brand: 'Topps',
    cat:   'Cajas Soccer',
    price: '$185',
    msrp:  '$170 MSRP',
    stock: 7,
    img:   IMG.soccer,
    badge: null,
    desc:  'Champions League 2024-25 · RCs Europeos · Lamine Yamal destaca como el pull top.',
  },
  // ── Cajas MLB ──────────────────────────────────────────────────────────────
  {
    name:  '2025 Topps Chrome Baseball Hobby Box',
    brand: 'Topps',
    cat:   'Cajas MLB',
    price: '$195',
    msrp:  '$180 MSRP',
    stock: 10,
    img:   IMG.mlb,
    badge: null,
    desc:  'Roman Anthony, Jac Caglianone, Jackson Holliday. 24 packs · Refractors y Autos en cada caja.',
  },
  {
    name:  '2024 Topps Series 1 Baseball Hobby Box',
    brand: 'Topps',
    cat:   'Cajas MLB',
    price: '$120',
    msrp:  '$110 MSRP',
    stock: 15,
    img:   IMG.mlb,
    badge: 'Asequible',
    desc:  'El set base de la temporada 2024. Ohtani Dodgers, Jackson Holliday. Gran para comenzar.',
  },
  // ── Pokémon TCG ────────────────────────────────────────────────────────────
  {
    name:  'Pokémon SV: Scarlet & Violet Booster Box (36 packs)',
    brand: 'The Pokémon Company',
    cat:   'Pokémon TCG',
    price: '$165',
    msrp:  '$145 MSRP',
    stock: 14,
    img:   IMG.pokemon,
    badge: 'Popular',
    desc:  'Era Paldea · 36 boosters · Posibilidad de Tera Ex, Special Art Rare, Illustration Rare.',
  },
  {
    name:  'Pokémon 151 Booster Box (Japanese · SV2a)',
    brand: 'The Pokémon Company',
    cat:   'Pokémon TCG',
    price: '$215',
    msrp:  '$195 MSRP',
    stock: 6,
    img:   IMG.pokemon,
    badge: 'Trending 🔥',
    desc:  'SV2a japonés · Regresa a la Gen 1 · Mewtwo ex SAR, Charizard ex SAR. Muy cotizado.',
  },
  {
    name:  'Pokémon Prismatic Evolutions ETB',
    brand: 'The Pokémon Company',
    cat:   'Pokémon TCG',
    price: '$75',
    msrp:  '$55 MSRP',
    stock: 20,
    img:   IMG.pokemon,
    badge: 'Más vendido',
    desc:  'Elite Trainer Box · 9 packs + accesorios premium · Set Eevee Evolutions 2025.',
  },
  // ── One Piece TCG ──────────────────────────────────────────────────────────
  {
    name:  'One Piece TCG OP09 Booster Box (Emperors in the New World)',
    brand: 'Bandai',
    cat:   'One Piece TCG',
    price: '$110',
    msrp:  '$95 MSRP',
    stock: 16,
    img:   IMG.onepiece,
    badge: 'Nuevo 2025',
    desc:  'OP09 · Emperors in the New World · Kaido, Big Mom, Shanks. El set más nuevo.',
  },
  {
    name:  'One Piece TCG OP06 Booster Box (Wings of the Captain)',
    brand: 'Bandai',
    cat:   'One Piece TCG',
    price: '$98',
    msrp:  '$88 MSRP',
    stock: 11,
    img:   IMG.onepiece,
    badge: null,
    desc:  'OP06 · Wings of the Captain · Posibilidad del Luffy Manga Art Rare ($10k+ en PSA 10).',
  },
  {
    name:  'One Piece TCG OP01 Romance Dawn Box (English)',
    brand: 'Bandai',
    cat:   'One Piece TCG',
    price: '$4,300',
    msrp:  '$1,200 MSRP original',
    stock: 1,
    img:   IMG.onepiece,
    badge: '🏆 Grail Sealed',
    desc:  'Sellado original · +259% sobre MSRP · Zoro Secret Rare OP01-001. Inversión/colección.',
  },
  // ── Accesorios ─────────────────────────────────────────────────────────────
  {
    name:  'Penny Sleeves (100 pzs) — Ultra Pro',
    brand: 'Ultra Pro',
    cat:   'Accesorios',
    price: '$4',
    msrp:  null,
    stock: 300,
    img:   IMG.accs,
    badge: null,
    desc:  'El estándar del hobby. Compatible con Toploaders y One-Touch. Protección básica esencial.',
  },
  {
    name:  'Toploaders Rígidos 3×4" (25 pzs) — BCW',
    brand: 'BCW',
    cat:   'Accesorios',
    price: '$12',
    msrp:  null,
    stock: 85,
    img:   IMG.accs,
    badge: null,
    desc:  'Estándar de la industria para cartas raw. 35pt. Previo a enviar a PSA/BGS.',
  },
  {
    name:  'One Touch Magnético 35pt — Ultra Pro',
    brand: 'Ultra Pro',
    cat:   'Accesorios',
    price: '$8',
    msrp:  null,
    stock: 45,
    img:   IMG.accs,
    badge: 'Popular',
    desc:  'Cierre magnético sin presión. Ideal para display de tus mejores cartas en vitrina.',
  },
  {
    name:  'Binder 9 bolsillos 360 cartas — Vault X',
    brand: 'Vault X',
    cat:   'Accesorios',
    price: '$35',
    msrp:  null,
    stock: 22,
    img:   IMG.accs,
    badge: null,
    desc:  '360 cartas · Side-loading (cartas no caen) · Negro premium · El favorito del hobby.',
  },
  {
    name:  'Kit de Gradeo PSA — Envío Express',
    brand: 'PSA',
    cat:   'Accesorios',
    price: '$18',
    msrp:  null,
    stock: 60,
    img:   IMG.accs,
    badge: 'Nuevo',
    desc:  'Bolsas, separadores, instrucciones y manual para envío correcto a PSA o BGS. Evita errores.',
  },
]

const CATS = ['Todos', 'Cajas NBA', 'Cajas NFL', 'Cajas Soccer', 'Cajas MLB', 'Pokémon TCG', 'One Piece TCG', 'Accesorios']

export default function Shop() {
  const [cat, setCat]   = useState('Todos')
  const [cart, setCart] = useState<string[]>([])

  const filtered = PRODUCTS.filter((p) => cat === 'Todos' || p.cat === cat)

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-16 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">PullStack</p>
            <h1 className="text-4xl font-black text-white mb-1">Tienda Oficial</h1>
            <p className="text-gray-500 text-sm">Cajas selladas · Pokémon TCG · One Piece TCG · Accesorios · Envío seguro LATAM</p>
          </div>
          <div className="relative shrink-0">
            <button className="bg-[#111] border border-white/10 text-white p-3 rounded-xl hover:border-amber-500/30 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </button>
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </div>
        </div>

        {/* Aviso Topps */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 mb-8 flex items-start gap-3">
          <span className="text-amber-400 text-xl shrink-0">ℹ️</span>
          <div>
            <p className="text-amber-300 text-sm font-bold">Topps tiene licencia exclusiva NBA desde 2025-26</p>
            <p className="text-gray-500 text-xs mt-0.5">Las cajas NBA 2025-26 son de Topps, no Panini. Panini sigue siendo el proveedor oficial de NFL, NBA hasta 2024-25.</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${cat === c ? 'bg-amber-500 text-black' : 'bg-[#111] border border-white/10 text-gray-400 hover:border-amber-500/30 hover:text-amber-400'}`}
            >{c}</button>
          ))}
        </div>

        <p className="text-gray-600 text-sm mb-6">{filtered.length} productos</p>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((p, i) => (
            <div
              key={i}
              className="group bg-[#111] border border-white/5 hover:border-amber-500/30 rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(245,158,11,0.08)]"
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={p.img}
                  alt={`${p.cat} — ${p.name}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-black/20 to-transparent" />
                {p.badge && (
                  <div className={`absolute top-3 left-3 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${p.badge.includes('🔥') || p.badge.includes('🏆') ? 'bg-red-600 text-white' : p.badge.includes('🌍') ? 'bg-blue-600 text-white' : 'bg-amber-500 text-black'}`}>
                    {p.badge}
                  </div>
                )}
                {p.stock <= 5 && (
                  <div className="absolute top-3 right-3 bg-red-900/80 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/40 animate-pulse">
                    ¡Solo {p.stock}!
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                  {p.cat}
                </div>
              </div>
              <div className="p-4">
                <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">{p.brand}</div>
                <h3 className="text-white font-bold text-sm leading-snug mb-1">{p.name}</h3>
                {p.msrp && <p className="text-gray-700 text-[10px] mb-1">{p.msrp}</p>}
                <p className="text-gray-500 text-[11px] leading-relaxed mb-3 line-clamp-2">{p.desc}</p>
                <div className="flex items-center justify-between">
                  <div className="text-white font-black text-xl">{p.price}</div>
                  <button
                    onClick={() => setCart((c) => [...c, p.name])}
                    className="bg-amber-500/10 hover:bg-amber-500 border border-amber-500/30 hover:border-amber-500 text-amber-400 hover:text-black font-bold py-2 px-3 rounded-lg text-xs transition-all"
                  >
                    + Carrito
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Banner envío */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: '📦', title: 'Envío Seguro LATAM', sub: 'México, Argentina, Colombia, Chile y más' },
            { icon: '🛡️', title: 'Sellados 100% Auténticos', sub: 'Verificados antes de enviar' },
            { icon: '💳', title: 'Pago con Stripe', sub: 'Tarjeta, OXXO y transferencia' },
          ].map((b, i) => (
            <div key={i} className="bg-[#111] border border-white/5 rounded-xl p-4 flex items-center gap-3">
              <span className="text-3xl">{b.icon}</span>
              <div>
                <p className="text-white font-bold text-sm">{b.title}</p>
                <p className="text-gray-600 text-xs">{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
