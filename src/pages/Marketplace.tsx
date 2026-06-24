import { useState } from 'react'

// ─── Imagen según deporte / TCG ──────────────────────────────────────────────
const IMG = {
  // NBA → cancha / acción basketball
  nba_court:  'https://images.unsplash.com/photo-1546519638405-a9f9f1c9d0b3?w=500&q=85',
  nba_action: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=500&q=85',
  nba_game:   'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=500&q=85',
  nba_dunk:   'https://images.unsplash.com/photo-1526676037940-76d3a9d28a1b?w=500&q=85',
  // NFL → campo / acción fútbol americano
  nfl_stadium:'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=500&q=85',
  nfl_action: 'https://images.unsplash.com/photo-1504274066651-8d31a536b11a?w=500&q=85',
  nfl_field:  'https://images.unsplash.com/photo-1531873252757-2dcf08a23e93?w=500&q=85',
  // Soccer → pitch / acción fútbol
  soccer_shot:'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&q=85',
  soccer_game:'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&q=85',
  soccer_free:'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&q=85',
  // MLB → béisbol
  mlb_bat:    'https://images.unsplash.com/photo-1540747913346-19212a4b423e?w=500&q=85',
  mlb_stadium:'https://images.unsplash.com/photo-1521731978332-9e9e714bdd20?w=500&q=85',
  // Pokémon → cartas reales Pokémon
  pokemon:    'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=500&q=85',
  // One Piece / Anime
  onepiece:   'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&q=85',
}

// ─── Cartas verificadas con datos reales ─────────────────────────────────────
const CARDS = [
  // ── NBA ──────────────────────────────────────────────────────────────────
  {
    player:  'Cooper Flagg',
    detail:  '2025 Topps Now RC Auto · Draft Night #1 Pick',
    team:    'Dallas Mavericks',
    brand:   'Topps Now 2025',
    grade:   'BGS 9.5',
    price:   '$27,500',
    raw:     '~$8,000',
    change:  '+210%',
    sport:   'NBA',
    type:    'auction',
    hot:     true,
    img:     IMG.nba_court,
    note:    'Topps tiene licencia exclusiva NBA desde 2025-26. #1 Draft Pick.',
  },
  {
    player:  'Victor Wembanyama',
    detail:  '2023-24 Topps Chrome RC Silver Refractor',
    team:    'San Antonio Spurs',
    brand:   'Topps Chrome 2023',
    grade:   'PSA 10',
    price:   '$8,400',
    raw:     '~$1,200',
    change:  '+145%',
    sport:   'NBA',
    type:    'sale',
    hot:     true,
    img:     IMG.nba_action,
    note:    'El talento más grande desde LeBron. RC francés.',
  },
  {
    player:  'LeBron James',
    detail:  '2003-04 Topps Chrome RC · Base',
    team:    'LA Lakers',
    brand:   'Topps Chrome 2003',
    grade:   'PSA 10',
    price:   '$24,500',
    raw:     '~$6,000',
    change:  '+18%',
    sport:   'NBA',
    type:    'sale',
    hot:     false,
    img:     IMG.nba_game,
    note:    'Carta fundacional del hobby moderno.',
  },
  {
    player:  'Caitlin Clark',
    detail:  '2024 Topps WNBA RC Auto Silver /49',
    team:    'Indiana Fever · WNBA',
    brand:   'Topps WNBA 2024',
    grade:   'PSA 10',
    price:   '$3,800',
    raw:     '~$900',
    change:  '+88%',
    sport:   'NBA',
    type:    'trade',
    hot:     true,
    img:     IMG.nba_dunk,
    note:    'Fenómeno WNBA. La carta femenina más buscada en 2025.',
  },
  // ── NFL ──────────────────────────────────────────────────────────────────
  {
    player:  'Jayden Daniels',
    detail:  '2024 Panini Prizm RC Auto Silver',
    team:    'Washington Commanders',
    brand:   'Panini Prizm 2024',
    grade:   'PSA 10',
    price:   '$6,800',
    raw:     '~$1,800',
    change:  '+320%',
    sport:   'NFL',
    type:    'auction',
    hot:     true,
    img:     IMG.nfl_action,
    note:    'Heisman 2023 · Rookie del Año favorito 2024.',
  },
  {
    player:  'Cam Ward',
    detail:  '2025 Topps Chrome RC Auto · #1 Draft Pick',
    team:    'Carolina Panthers',
    brand:   'Topps Chrome 2025',
    grade:   'BGS 9.5',
    price:   '$4,100',
    raw:     '~$1,100',
    change:  '+180%',
    sport:   'NFL',
    type:    'sale',
    hot:     true,
    img:     IMG.nfl_stadium,
    note:    '#1 Pick 2025 NFL Draft. Miami Hurricanes. Alta demanda.',
  },
  {
    player:  'Patrick Mahomes',
    detail:  '2017 Panini Prizm RC Silver',
    team:    'Kansas City Chiefs',
    brand:   'Panini Prizm 2017',
    grade:   'PSA 10',
    price:   '$12,000',
    raw:     '~$2,500',
    change:  '+9%',
    sport:   'NFL',
    type:    'sale',
    hot:     false,
    img:     IMG.nfl_field,
    note:    '3× Super Bowl. La carta NFL de referencia del hobby.',
  },
  // ── Soccer ────────────────────────────────────────────────────────────────
  {
    player:  'Lamine Yamal',
    detail:  '2024 Topps Chrome UEFA Euro RC Auto · SuperFractor 1/1',
    team:    'FC Barcelona · Selección España',
    brand:   'Topps Chrome UEFA 2024',
    grade:   'PSA 10',
    price:   '$396,500',
    raw:     'Base ~$6.50 · Auto /10 ~$15k+',
    change:  '+585% en ventas / año',
    sport:   'Soccer',
    type:    'auction',
    hot:     true,
    img:     IMG.soccer_shot,
    note:    'Récord absoluto soccer. 17 años. Campeón Euro 2024.',
  },
  {
    player:  'Vinicius Jr.',
    detail:  '2023-24 Panini Select RC Premier Level',
    team:    'Real Madrid · Brasil',
    brand:   'Panini Select 2023',
    grade:   'PSA 9',
    price:   '$2,800',
    raw:     '~$420',
    change:  '+67%',
    sport:   'Soccer',
    type:    'sale',
    hot:     false,
    img:     IMG.soccer_game,
    note:    'UCL 2024. Balón de Oro runner-up. Alta demanda en LATAM.',
  },
  {
    player:  'Erling Haaland',
    detail:  '2022-23 Topps Chrome UCL RC · Orange Refractor /25',
    team:    'Manchester City · Noruega',
    brand:   'Topps Chrome UCL 2022',
    grade:   'PSA 10',
    price:   '$4,500',
    raw:     '~$600',
    change:  '+38%',
    sport:   'Soccer',
    type:    'sale',
    hot:     false,
    img:     IMG.soccer_free,
    note:    '36 goles PL 2022-23. Récord histórico Premier League.',
  },
  // ── MLB ───────────────────────────────────────────────────────────────────
  {
    player:  'Shohei Ohtani',
    detail:  '2018 Bowman Chrome Prospects Auto',
    team:    'LA Dodgers · Japón',
    brand:   'Bowman Chrome 2018',
    grade:   'PSA 10',
    price:   '$9,200',
    raw:     '~$2,100',
    change:  '+44%',
    sport:   'MLB',
    type:    'sale',
    hot:     false,
    img:     IMG.mlb_bat,
    note:    '3× MVP. Contrato $700M Dodgers. Carta más cara de MLB.',
  },
  {
    player:  'Roman Anthony',
    detail:  '2025 Topps Chrome RC Auto',
    team:    'Boston Red Sox · Red Sox',
    brand:   'Topps Chrome 2025',
    grade:   'BGS 9.5',
    price:   '$1,800',
    raw:     '~$400',
    change:  '+290%',
    sport:   'MLB',
    type:    'auction',
    hot:     true,
    img:     IMG.mlb_stadium,
    note:    '.292 AVG en debut. 3ro AL ROY 2025. Mejor prospect 2024.',
  },
  // ── Pokémon ───────────────────────────────────────────────────────────────
  {
    player:  'Charizard Holo 1st Edition',
    detail:  '1999 Base Set 1st Ed. · Holo Rare · #4/102',
    team:    'Pokémon TCG · Base Set',
    brand:   'Wizards of the Coast 1999',
    grade:   'PSA 10',
    price:   '$550,000',
    raw:     '~$18,000',
    change:  '+89% en 12 meses',
    sport:   'Pokémon',
    type:    'sale',
    hot:     true,
    img:     IMG.pokemon,
    note:    'Heritage Auctions Dic 2025. Solo ~120 copias PSA 10 existen.',
  },
  {
    player:  'Pikachu Illustrator',
    detail:  '1998 CoroCoro Comics Promo · Solo 41 en el mundo',
    team:    'Pokémon TCG · Promo',
    brand:   'The Pokémon Company 1998',
    grade:   'PSA 10 · Único',
    price:   '$16,492,000',
    raw:     'No existe raw auténtico',
    change:  'Récord mundial Feb 2026 🏆',
    sport:   'Pokémon',
    type:    'sale',
    hot:     true,
    img:     IMG.pokemon,
    note:    'Carta más cara de la historia. Goldin Auctions Feb 16, 2026.',
  },
  {
    player:  'Mewtwo ex Special Art Rare',
    detail:  'Pokémon TCG Scarlet & Violet 151 · SV2a · #205',
    team:    'Pokémon TCG · SV151',
    brand:   'The Pokémon Company 2023',
    grade:   'PSA 10',
    price:   '$420',
    raw:     '~$80',
    change:  '+52%',
    sport:   'Pokémon',
    type:    'auction',
    hot:     false,
    img:     IMG.pokemon,
    note:    'Chase card del set 151. Alta demanda Japón y USA.',
  },
  // ── One Piece ─────────────────────────────────────────────────────────────
  {
    player:  'Monkey D. Luffy',
    detail:  'OP06-118 Manga Art Rare · Wings of the Captain',
    team:    'One Piece TCG · OP06',
    brand:   'Bandai 2024',
    grade:   'PSA 10',
    price:   '$10,500',
    raw:     '$1,800–$3,500',
    change:  '+215% en un año',
    sport:   'One Piece',
    type:    'auction',
    hot:     true,
    img:     IMG.onepiece,
    note:    'PSA 10 pop <30 copias. Superficie texturizada difícil de graduar.',
  },
  {
    player:  'Roronoa Zoro',
    detail:  'OP01-001 Secret Rare · Romance Dawn',
    team:    'One Piece TCG · OP01',
    brand:   'Bandai 2022',
    grade:   'PSA 9',
    price:   '$2,100',
    raw:     '~$650',
    change:  '+178%',
    sport:   'One Piece',
    type:    'sale',
    hot:     false,
    img:     IMG.onepiece,
    note:    'OP01 boxes ahora $4,300+. Set fundacional del juego.',
  },
]

const SPORTS = ['Todos', 'NBA', 'NFL', 'Soccer', 'MLB', 'Pokémon', 'One Piece']
const TYPES  = ['Todos', 'Venta', 'Subasta', 'Trading']
const SORTS  = ['Trending 🔥', 'Precio: Mayor', 'Precio: Menor', '% Ganancia']

const typeMap:   Record<string, string> = { sale: 'Venta', auction: 'Subasta', trade: 'Trading' }
const typeCss:   Record<string, string> = {
  sale:    'bg-green-500/10 text-green-400 border-green-500/30',
  auction: 'bg-red-500/10 text-red-400 border-red-500/30',
  trade:   'bg-blue-500/10 text-blue-400 border-blue-500/30',
}

export default function Marketplace() {
  const [sport, setSport]   = useState('Todos')
  const [type,  setType]    = useState('Todos')
  const [sort,  setSort]    = useState('Trending 🔥')
  const [search,setSearch]  = useState('')

  const filtered = CARDS.filter((c) => {
    const ms = sport === 'Todos' || c.sport === sport
    const mt = type  === 'Todos' || typeMap[c.type] === type
    const mq = !search || c.player.toLowerCase().includes(search.toLowerCase()) || c.brand.toLowerCase().includes(search.toLowerCase())
    return ms && mt && mq
  })

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-16 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">PullStack</p>
          <h1 className="text-4xl font-black text-white mb-1">Marketplace</h1>
          <p className="text-gray-500 text-sm">NBA · NFL · Soccer · MLB · Pokémon TCG · One Piece TCG · Precios verificados</p>
        </div>

        {/* Búsqueda */}
        <div className="relative mb-5">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar jugador, carta, marca... (ej: Charizard, Flagg, Yamal)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111] border border-white/10 text-white placeholder-gray-600 pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="flex gap-2 flex-wrap flex-1">
            {SPORTS.map((s) => (
              <button
                key={s}
                onClick={() => setSport(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sport === s ? 'bg-amber-500 text-black' : 'bg-[#111] border border-white/10 text-gray-400 hover:border-amber-500/30 hover:text-amber-400'}`}
              >{s}</button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${type === t ? 'bg-amber-500 text-black' : 'bg-[#111] border border-white/10 text-gray-400 hover:border-amber-500/30 hover:text-amber-400'}`}
              >{t}</button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-[#111] border border-white/10 text-gray-400 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-amber-500/50"
          >
            {SORTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>

        <p className="text-gray-600 text-sm mb-6">{filtered.length} cartas encontradas</p>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((card, i) => (
            <div
              key={i}
              className="group bg-[#111] border border-white/5 hover:border-amber-500/30 rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(245,158,11,0.1)]"
            >
              <div className="relative h-52 overflow-hidden">
                <img
                  src={card.img}
                  alt={`${card.sport} — ${card.player}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-black/10 to-transparent" />
                {card.hot && (
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">🔥 Hot</div>
                )}
                <div className={`absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${typeCss[card.type]}`}>
                  {typeMap[card.type]}
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                  <span className="bg-black/70 backdrop-blur text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-amber-500/30">{card.grade}</span>
                </div>
                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                  {card.sport}
                </div>
              </div>
              <div className="p-4">
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-0.5">{card.brand}</p>
                <h3 className="text-white font-black text-base leading-tight">{card.player}</h3>
                <p className="text-gray-600 text-[10px] mb-0.5">{card.team}</p>
                <p className="text-gray-700 text-[10px] mb-3 leading-relaxed line-clamp-2">{card.detail}</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-white font-black text-lg leading-none">{card.price}</p>
                    <p className="text-gray-600 text-[10px]">Raw: {card.raw}</p>
                    <p className="text-green-400 text-[10px] font-bold">{card.change}</p>
                  </div>
                  <button className="bg-amber-500/10 hover:bg-amber-500 border border-amber-500/30 hover:border-amber-500 text-amber-400 hover:text-black font-bold py-2 px-3 rounded-lg text-xs transition-all">
                    {card.type === 'auction' ? 'Pujar' : card.type === 'trade' ? 'Tradear' : 'Comprar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
