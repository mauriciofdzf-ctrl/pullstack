import { useState, useMemo, useEffect } from 'react'
import { getImages, type ImageKey } from '../lib/imageConfig'
import CartDrawer, { type CartEntry } from '../components/CartDrawer'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Sport  = 'NBA' | 'NFL' | 'Soccer' | 'MLB' | 'Pokémon' | 'One Piece' | 'General'
type Kind   = 'card' | 'box' | 'accessory'
type Txn    = 'sale' | 'auction' | 'trade' | 'buy'

type Item = {
  id:        number
  name:      string       // jugador o nombre de producto
  detail:    string       // carta específica / descripción
  sport:     Sport
  kind:      Kind
  txn:       Txn
  price:     string
  sub:       string       // raw / MSRP / stock
  brand:     string
  grade?:    string
  change?:   string
  badge?:    string
  hot?:      boolean
  imgKey:    ImageKey
}

// ─── Catálogo completo ────────────────────────────────────────────────────────
const CATALOG: Item[] = [
  // ── Cartas NBA ───────────────────────────────────────────────────────────
  { id:1,  name:'Cooper Flagg',        detail:'2025 Topps Now RC Auto · Draft Night #1 Pick',       sport:'NBA',       kind:'card', txn:'auction', price:'$27,500',      sub:'Raw ~$8,000',          brand:'Topps Now 2025',           grade:'BGS 9.5', change:'+210%',            badge:'🔥 Hot',       hot:true,  imgKey:'nba1' },
  { id:2,  name:'Victor Wembanyama',   detail:'2023-24 Topps Chrome RC Silver Refractor',           sport:'NBA',       kind:'card', txn:'sale',    price:'$8,400',       sub:'Raw ~$1,200',          brand:'Topps Chrome 2023',        grade:'PSA 10',  change:'+145%',            badge:'🔥 Hot',       hot:true,  imgKey:'nba2' },
  { id:3,  name:'LeBron James',        detail:'2003-04 Topps Chrome RC · Base',                     sport:'NBA',       kind:'card', txn:'sale',    price:'$24,500',      sub:'Raw ~$6,000',          brand:'Topps Chrome 2003',        grade:'PSA 10',  change:'+18%',                             hot:false, imgKey:'nba3' },
  { id:4,  name:'Caitlin Clark',       detail:'2024 Topps WNBA RC Auto Silver /49',                 sport:'NBA',       kind:'card', txn:'trade',   price:'$3,800',       sub:'Raw ~$900',            brand:'Topps WNBA 2024',          grade:'PSA 10',  change:'+88%',             badge:'WNBA',         hot:true,  imgKey:'nba4' },
  // ── Cartas NFL ───────────────────────────────────────────────────────────
  { id:5,  name:'Jayden Daniels',      detail:'2024 Panini Prizm RC Auto Silver',                   sport:'NFL',       kind:'card', txn:'auction', price:'$6,800',       sub:'Raw ~$1,800',          brand:'Panini Prizm 2024',        grade:'PSA 10',  change:'+320%',            badge:'🔥 Hot',       hot:true,  imgKey:'nfl1' },
  { id:6,  name:'Cam Ward',            detail:'2025 Topps Chrome RC Auto · #1 Draft Pick',          sport:'NFL',       kind:'card', txn:'sale',    price:'$4,100',       sub:'Raw ~$1,100',          brand:'Topps Chrome 2025',        grade:'BGS 9.5', change:'+180%',            badge:'#1 Pick',      hot:true,  imgKey:'nfl2' },
  { id:7,  name:'Patrick Mahomes',     detail:'2017 Panini Prizm RC Silver',                        sport:'NFL',       kind:'card', txn:'sale',    price:'$12,000',      sub:'Raw ~$2,500',          brand:'Panini Prizm 2017',        grade:'PSA 10',  change:'+9%',                              hot:false, imgKey:'nfl3' },
  // ── Cartas Soccer ────────────────────────────────────────────────────────
  { id:8,  name:'Lamine Yamal',        detail:'2024 Topps Chrome UEFA Euro RC Auto · SuperFractor 1/1', sport:'Soccer', kind:'card', txn:'auction', price:'$396,500',   sub:'Base ~$6.50',          brand:'Topps Chrome UEFA 2024',   grade:'PSA 10',  change:'+585%/año',        badge:'🏆 Récord',    hot:true,  imgKey:'soccer1' },
  { id:9,  name:'Vinicius Jr.',        detail:'2023-24 Panini Select RC Premier Level',             sport:'Soccer',    kind:'card', txn:'sale',    price:'$2,800',       sub:'Raw ~$420',            brand:'Panini Select 2023',       grade:'PSA 9',   change:'+67%',                             hot:false, imgKey:'soccer2' },
  { id:10, name:'Erling Haaland',      detail:'2022-23 Topps Chrome UCL RC · Orange Refractor /25', sport:'Soccer',   kind:'card', txn:'sale',    price:'$4,500',       sub:'Raw ~$600',            brand:'Topps Chrome UCL 2022',    grade:'PSA 10',  change:'+38%',                             hot:false, imgKey:'soccer3' },
  // ── Cartas MLB ───────────────────────────────────────────────────────────
  { id:11, name:'Shohei Ohtani',       detail:'2018 Bowman Chrome Prospects Auto',                  sport:'MLB',       kind:'card', txn:'sale',    price:'$9,200',       sub:'Raw ~$2,100',          brand:'Bowman Chrome 2018',       grade:'PSA 10',  change:'+44%',                             hot:false, imgKey:'mlb1' },
  { id:12, name:'Roman Anthony',       detail:'2025 Topps Chrome RC Auto',                          sport:'MLB',       kind:'card', txn:'auction', price:'$1,800',       sub:'Raw ~$400',            brand:'Topps Chrome 2025',        grade:'BGS 9.5', change:'+290%',            badge:'🔥 Hot',       hot:true,  imgKey:'mlb2' },
  // ── Cartas Pokémon ───────────────────────────────────────────────────────
  { id:13, name:'Charizard Holo 1st Edition', detail:'1999 Base Set · #4/102 · Holo Rare',         sport:'Pokémon',   kind:'card', txn:'sale',    price:'$550,000',     sub:'Raw ~$18,000',         brand:'Wizards of the Coast 1999',grade:'PSA 10',  change:'+89%/12 meses',    badge:'🏆 Grail',     hot:true,  imgKey:'pokemon1' },
  { id:14, name:'Pikachu Illustrator', detail:'1998 CoroCoro Comics Promo · Solo 41 en el mundo',  sport:'Pokémon',   kind:'card', txn:'sale',    price:'$16,492,000',  sub:'No existe raw auténtico', brand:'The Pokémon Company 1998', grade:'PSA 10 · Único', change:'Récord mundial 🏆', badge:'Más caro del mundo', hot:true, imgKey:'pokemon1' },
  { id:15, name:'Mewtwo ex SAR',       detail:'Scarlet & Violet 151 · SV2a · #205',                sport:'Pokémon',   kind:'card', txn:'auction', price:'$420',         sub:'Raw ~$80',             brand:'The Pokémon Company 2023', grade:'PSA 10',  change:'+52%',                             hot:false, imgKey:'pokemon1' },
  // ── Cartas One Piece ─────────────────────────────────────────────────────
  { id:16, name:'Monkey D. Luffy',     detail:'OP06-118 Manga Art Rare · Wings of the Captain',    sport:'One Piece', kind:'card', txn:'auction', price:'$10,500',      sub:'Raw $1,800–$3,500',    brand:'Bandai 2024',              grade:'PSA 10',  change:'+215%/año',        badge:'🔥 Hot',       hot:true,  imgKey:'onepiece1' },
  { id:17, name:'Roronoa Zoro',        detail:'OP01-001 Secret Rare · Romance Dawn',               sport:'One Piece', kind:'card', txn:'sale',    price:'$2,100',       sub:'Raw ~$650',            brand:'Bandai 2022',              grade:'PSA 9',   change:'+178%',                            hot:false, imgKey:'onepiece1' },
  // ── Cajas NBA ────────────────────────────────────────────────────────────
  { id:18, name:'2025-26 Topps Basketball Hobby Box', detail:'~24 packs · RC Autos garantizados · Cooper Flagg y Wemby', sport:'NBA', kind:'box', txn:'buy', price:'$290', sub:'$270 MSRP · 8 en stock', brand:'Topps', badge:'🔥 Topps Era', imgKey:'nba1' },
  { id:19, name:'2024-25 Topps Chrome Basketball Hobby Box', detail:'Primera temporada Topps · Wembanyama, Clark RCs', sport:'NBA', kind:'box', txn:'buy', price:'$210', sub:'$190 MSRP · 12 en stock', brand:'Topps', badge:'Nuevo', imgKey:'nba2' },
  // ── Cajas NFL ────────────────────────────────────────────────────────────
  { id:20, name:'2025 Panini Prizm NFL Hobby Box', detail:'Cam Ward, Jaxson Dart, Quinn Ewers · 24 packs', sport:'NFL', kind:'box', txn:'buy', price:'$250', sub:'$230 MSRP · 5 en stock', brand:'Panini', badge:'Nuevos RCs', imgKey:'nfl1' },
  { id:21, name:'2024 Panini Prizm NFL Hobby Box', detail:'Jayden Daniels, Caleb Williams, Marvin Harrison Jr', sport:'NFL', kind:'box', txn:'buy', price:'$280', sub:'$240 MSRP · 3 en stock', brand:'Panini', badge:'Trending 🔥', hot:true, imgKey:'nfl2' },
  // ── Cajas Soccer ─────────────────────────────────────────────────────────
  { id:22, name:'2026 Topps Chrome FIFA World Cup Hobby Box', detail:'Copa del Mundo USA/CAN/MX · Yamal, Vinicius, Mbappé', sport:'Soccer', kind:'box', txn:'buy', price:'$340', sub:'$320 MSRP · 4 en stock', brand:'Topps', badge:'🌍 World Cup 2026', hot:true, imgKey:'soccer1' },
  { id:23, name:'2024-25 Topps Chrome UEFA UCL Hobby Box', detail:'Champions League · Lamine Yamal pull top del set', sport:'Soccer', kind:'box', txn:'buy', price:'$185', sub:'$170 MSRP · 7 en stock', brand:'Topps', imgKey:'soccer2' },
  // ── Cajas MLB ────────────────────────────────────────────────────────────
  { id:24, name:'2025 Topps Chrome Baseball Hobby Box', detail:'Roman Anthony, Jac Caglianone · 24 packs · Autos garantizados', sport:'MLB', kind:'box', txn:'buy', price:'$195', sub:'$180 MSRP · 10 en stock', brand:'Topps', imgKey:'mlb1' },
  { id:25, name:'2024 Topps Series 1 Baseball Hobby Box', detail:'Ohtani Dodgers · Jackson Holliday · Ideal para comenzar', sport:'MLB', kind:'box', txn:'buy', price:'$120', sub:'$110 MSRP · 15 en stock', brand:'Topps', badge:'Asequible', imgKey:'mlb2' },
  // ── Cajas Pokémon ────────────────────────────────────────────────────────
  { id:26, name:'Pokémon SV: Scarlet & Violet Booster Box (36 packs)', detail:'Era Paldea · Special Art Rares · Illustration Rares', sport:'Pokémon', kind:'box', txn:'buy', price:'$165', sub:'$145 MSRP · 14 en stock', brand:'The Pokémon Company', badge:'Popular', imgKey:'pokemon1' },
  { id:27, name:'Pokémon 151 Booster Box (Japanese · SV2a)', detail:'Regresa a Gen 1 · Mewtwo ex SAR · Charizard ex SAR', sport:'Pokémon', kind:'box', txn:'buy', price:'$215', sub:'$195 MSRP · 6 en stock', brand:'The Pokémon Company', badge:'Trending 🔥', hot:true, imgKey:'pokemon1' },
  { id:28, name:'Pokémon Prismatic Evolutions Elite Trainer Box', detail:'9 packs + accesorios premium · Eeveelutions 2025', sport:'Pokémon', kind:'box', txn:'buy', price:'$75', sub:'$55 MSRP · 20 en stock', brand:'The Pokémon Company', badge:'Más vendido', imgKey:'pokemon1' },
  // ── Cajas One Piece ──────────────────────────────────────────────────────
  { id:29, name:'One Piece TCG OP09 Booster Box (Emperors in the New World)', detail:'OP09 · Kaido, Big Mom, Shanks · Set más nuevo', sport:'One Piece', kind:'box', txn:'buy', price:'$110', sub:'$95 MSRP · 16 en stock', brand:'Bandai', badge:'Nuevo 2025', imgKey:'onepiece1' },
  { id:30, name:'One Piece TCG OP06 Booster Box (Wings of the Captain)', detail:'Posibilidad del Luffy Manga Art Rare ($10k+ PSA 10)', sport:'One Piece', kind:'box', txn:'buy', price:'$98', sub:'$88 MSRP · 11 en stock', brand:'Bandai', imgKey:'onepiece1' },
  { id:31, name:'One Piece TCG OP01 Romance Dawn Box (English)', detail:'Sellado · +259% MSRP · Zoro Secret Rare OP01-001', sport:'One Piece', kind:'box', txn:'buy', price:'$4,300', sub:'$1,200 MSRP original · 1 en stock', brand:'Bandai', badge:'🏆 Grail Sealed', hot:true, imgKey:'onepiece1' },
  // ── Accesorios ───────────────────────────────────────────────────────────
  { id:32, name:'Penny Sleeves (100 pzs)', detail:'Protección básica estándar · Compatible con Toploaders', sport:'General', kind:'accessory', txn:'buy', price:'$4', sub:'300 en stock', brand:'Ultra Pro', imgKey:'cards' },
  { id:33, name:'Toploaders Rígidos 3×4" (25 pzs)', detail:'Estándar industria para cartas raw antes de PSA/BGS', sport:'General', kind:'accessory', txn:'buy', price:'$12', sub:'85 en stock', brand:'BCW', imgKey:'cards' },
  { id:34, name:'One Touch Magnético 35pt', detail:'Cierre magnético · Ideal para display de tus mejores cartas', sport:'General', kind:'accessory', txn:'buy', price:'$8', sub:'45 en stock', brand:'Ultra Pro', badge:'Popular', imgKey:'cards' },
  { id:35, name:'Binder 9 bolsillos 360 cartas', detail:'Side-loading · Negro premium · El favorito del hobby', sport:'General', kind:'accessory', txn:'buy', price:'$35', sub:'22 en stock', brand:'Vault X', imgKey:'cards' },
  { id:36, name:'Kit de Gradeo PSA — Envío Express', detail:'Bolsas, separadores, instrucciones y manual para PSA/BGS', sport:'General', kind:'accessory', txn:'buy', price:'$18', sub:'60 en stock', brand:'PSA', badge:'Nuevo', imgKey:'cards' },
]

// ─── Filtros ──────────────────────────────────────────────────────────────────
const SPORTS  = ['Todos', 'NBA', 'NFL', 'Soccer', 'MLB', 'Pokémon', 'One Piece']
const KINDS   = [
  { label: 'Todo',                value: 'all'       },
  { label: '🃏 Cartas Individuales', value: 'card'   },
  { label: '📦 Cajas Selladas',  value: 'box'        },
  { label: '🛡️ Accesorios',      value: 'accessory'  },
]
const TXNS    = ['Todos', 'Venta', 'Subasta', 'Trading', 'Tienda']
const SORTS   = ['Trending 🔥', 'Precio: Mayor', 'Precio: Menor', 'A–Z']

const txnMap:  Record<string, string>  = { sale:'Venta', auction:'Subasta', trade:'Trading', buy:'Tienda' }
const txnCss:  Record<string, string>  = {
  sale:    'bg-green-500/10 text-green-400 border-green-500/30',
  auction: 'bg-red-500/10 text-red-400 border-red-500/30',
  trade:   'bg-blue-500/10 text-blue-400 border-blue-500/30',
  buy:     'bg-purple-500/10 text-purple-300 border-purple-500/30',
}
const kindIcon: Record<Kind, string> = { card:'🃏', box:'📦', accessory:'🛡️' }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parsePrice(p: string): number {
  return parseFloat(p.replace(/[^0-9.]/g, '')) || 0
}
function cardAttrs(item: Item) {
  const d = item.detail.toLowerCase()
  const isRC     = d.includes(' rc ') || d.includes(' rc·') || d.includes('rc auto') || d.includes('rookie')
  const isAuto   = d.includes('auto')
  const is1of1   = d.includes('1/1') || d.includes('superfractor')
  const numMatch = item.detail.match(/\/ *(\d+)/)
  const numbered = numMatch ? `/${numMatch[1]}` : null
  const [gradeCo, gradeNum] = item.grade ? item.grade.split(' ') : [null, null]
  return { isRC, isAuto, is1of1, numbered, gradeCo, gradeNum }
}

export default function Marketplace() {
  const { user } = useAuth()
  const [sport,  setSport]  = useState('Todos')
  const [kind,   setKind]   = useState('all')
  const [txn,    setTxn]    = useState('Todos')
  const [query,  setQuery]  = useState('')
  const [sort,   setSort]   = useState('Trending 🔥')
  const [cart,       setCart]       = useState<CartEntry[]>([])
  const [cartOpen,   setCartOpen]   = useState(false)
  const [savedIds,   setSavedIds]   = useState<Set<number>>(new Set())
  const [savingId,   setSavingId]   = useState<number | null>(null)
  const [showMXN,    setShowMXN]    = useState(false)

  const MXN_RATE = 17.5
  const fmtMXN = (usdStr: string) => {
    const n = parsePrice(usdStr)
    if (!n) return usdStr
    const mxn = n * MXN_RATE
    return mxn >= 1000000 ? `$${(mxn / 1000000).toFixed(1)}M MXN` :
           mxn >= 1000    ? `$${Math.round(mxn / 1000)}K MXN` :
           `$${Math.round(mxn).toLocaleString()} MXN`
  }
  const displayPrice = (p: string) => showMXN ? fmtMXN(p) : p

  const IMG = useMemo(() => getImages(), [])

  useEffect(() => {
    if (!user) { setSavedIds(new Set()); return }
    supabase.from('collection_items').select('catalog_id').eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setSavedIds(new Set(data.map((d) => d.catalog_id as number)))
      })
  }, [user])

  const toggleCollection = async (item: typeof CATALOG[0]) => {
    if (!user) return
    const isSaved = savedIds.has(item.id)
    setSavingId(item.id)
    if (isSaved) {
      await supabase.from('collection_items').delete().eq('user_id', user.id).eq('catalog_id', item.id)
      setSavedIds((prev) => { const s = new Set(prev); s.delete(item.id); return s })
    } else {
      await supabase.from('collection_items').insert({
        user_id: user.id, catalog_id: item.id, name: item.name,
        sport: item.sport, kind: item.kind, price: item.price,
      })
      setSavedIds((prev) => new Set(prev).add(item.id))
    }
    setSavingId(null)
  }

  let results = CATALOG.filter((item) => {
    const ms = sport === 'Todos' || item.sport === sport || item.sport === 'General'
    const mk = kind  === 'all'   || item.kind  === kind
    const mt = txn   === 'Todos' || txnMap[item.txn] === txn
    const mq = !query || item.name.toLowerCase().includes(query.toLowerCase()) || item.brand.toLowerCase().includes(query.toLowerCase()) || item.detail.toLowerCase().includes(query.toLowerCase())
    return ms && mk && mt && mq
  })

  if (sort === 'Precio: Mayor') results = [...results].sort((a, b) => parsePrice(b.price) - parsePrice(a.price))
  if (sort === 'Precio: Menor') results = [...results].sort((a, b) => parsePrice(a.price) - parsePrice(b.price))
  if (sort === 'A–Z')           results = [...results].sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'Trending 🔥')   results = [...results].sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0))

  const cartCount = cart.length

  const addToCart = (item: typeof CATALOG[0]) => {
    setCart((c) => [...c, { id: item.id, name: item.name, price: item.price, kind: item.kind, txn: item.txn }])
  }
  const removeOneFromCart = (id: number) => {
    setCart((c) => {
      const idx = c.findIndex((x) => x.id === id)
      if (idx === -1) return c
      return [...c.slice(0, idx), ...c.slice(idx + 1)]
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-1">PullStack</p>
            <h1 className="text-4xl font-black text-white mb-1">Explorador</h1>
            <p className="text-gray-500 text-sm">Cartas · Cajas Selladas · Accesorios · NBA · NFL · Soccer · MLB · Pokémon · One Piece</p>
          </div>
          {/* Carrito */}
          <div className="relative shrink-0">
            <button
              onClick={() => setCartOpen(true)}
              className="flex items-center gap-2 bg-[#111] border border-white/10 hover:border-amber-500/30 text-white px-4 py-2.5 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="text-sm font-bold hidden sm:inline">Carrito</span>
              {cartCount > 0 && (
                <span className="bg-amber-500 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative mb-5">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar carta, jugador, caja, marca... (ej: Charizard, Flagg, Topps, Prizm)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#111] border border-white/10 text-white placeholder-gray-600 pl-11 pr-4 py-3.5 rounded-xl text-sm focus:outline-none focus:border-amber-500/50 transition-colors"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="space-y-3 mb-8">
          {/* Tipo de producto */}
          <div className="flex gap-2 flex-wrap">
            {KINDS.map((k) => (
              <button key={k.value} onClick={() => setKind(k.value)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${kind === k.value ? 'bg-amber-500 text-black' : 'bg-[#111] border border-white/10 text-gray-400 hover:border-amber-500/30 hover:text-amber-400'}`}>
                {k.label}
              </button>
            ))}
            <div className="h-8 w-px bg-white/10 self-center mx-1 hidden sm:block" />
            {/* Tipo de transacción */}
            {TXNS.map((t) => (
              <button key={t} onClick={() => setTxn(t)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${txn === t ? 'bg-amber-500 text-black' : 'bg-[#111] border border-white/10 text-gray-400 hover:border-amber-500/30 hover:text-amber-400'}`}>
                {t}
              </button>
            ))}
          </div>
          {/* Deporte + Sort + MXN toggle */}
          <div className="flex gap-2 flex-wrap items-center">
            {SPORTS.map((s) => (
              <button key={s} onClick={() => setSport(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sport === s ? 'bg-white/10 text-white border border-white/20' : 'text-gray-500 hover:text-gray-300'}`}>
                {s}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setShowMXN(!showMXN)}
                title="Cambiar moneda"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${showMXN ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-[#111] border-white/10 text-gray-500 hover:text-gray-300'}`}>
                {showMXN ? '🇲🇽 MXN' : '🇺🇸 USD'}
              </button>
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="bg-[#111] border border-white/10 text-gray-400 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-amber-500/50">
                {SORTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {showMXN && (
            <p className="text-[10px] text-gray-600">Precios convertidos a MXN usando tipo de cambio de referencia $17.50 MXN/USD. Precios reales pueden variar.</p>
          )}
        </div>

        {/* Resultados */}
        <p className="text-gray-600 text-sm mb-6">
          <span className="text-white font-bold">{results.length}</span> resultados
          {query && <span> para "<span className="text-amber-400">{query}</span>"</span>}
        </p>

        {results.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-600 text-5xl mb-4">🔍</p>
            <p className="text-gray-400 font-bold text-lg">Sin resultados</p>
            <p className="text-gray-600 text-sm mt-1">Intenta con otros filtros o un término diferente</p>
            <button onClick={() => { setSport('Todos'); setKind('all'); setTxn('Todos'); setQuery('') }}
              className="mt-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-bold px-4 py-2 rounded-lg transition-all">
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {results.map((item) => (
              <div key={item.id}
                className="group bg-[#111] border border-white/5 hover:border-amber-500/30 rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(245,158,11,0.08)]">
                {/* Imagen */}
                {(() => { const { isRC, isAuto, is1of1, numbered, gradeCo, gradeNum } = cardAttrs(item); return (
                <div className="relative h-48 overflow-hidden">
                  <img src={IMG[item.imgKey]} alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-black/10 to-transparent" />
                  {/* Badges top-left */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[calc(100%-70px)]">
                    {item.badge && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${item.badge.includes('🔥') || item.badge.includes('🏆') ? 'bg-red-600 text-white' : item.badge.includes('🌍') ? 'bg-blue-600 text-white' : 'bg-amber-500 text-black'}`}>
                        {item.badge}
                      </span>
                    )}
                    {isRC    && <span className="bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">RC</span>}
                    {isAuto  && <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">Auto</span>}
                    {is1of1  && <span className="bg-gradient-to-r from-amber-400 to-yellow-300 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">1/1</span>}
                    {numbered && !is1of1 && <span className="bg-white/10 backdrop-blur text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{numbered}</span>}
                  </div>
                  {/* Tipo transacción top-right */}
                  <div className={`absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${txnCss[item.txn]}`}>
                    {txnMap[item.txn]}
                  </div>
                  {/* Footer de la imagen */}
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between gap-1">
                    {gradeCo && gradeNum && (
                      <span className="bg-black/70 backdrop-blur text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-amber-500/30 shrink-0">
                        <span className="text-gray-500">{gradeCo}</span> {gradeNum}
                      </span>
                    )}
                    <span className="bg-black/70 backdrop-blur text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-lg ml-auto">
                      {kindIcon[item.kind]} {item.sport !== 'General' ? item.sport : ''}
                    </span>
                  </div>
                </div>
                )})()}

                {/* Contenido */}
                <div className="p-4">
                  <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-0.5">{item.brand}</p>
                  <h3 className="text-white font-black text-sm leading-tight mb-0.5">{item.name}</h3>
                  <p className="text-gray-600 text-[10px] leading-relaxed mb-3 line-clamp-2">{item.detail}</p>

                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-white font-black text-lg leading-none">{displayPrice(item.price)}</p>
                      <p className="text-gray-600 text-[10px]">{item.sub}</p>
                      {item.change && <p className="text-green-400 text-[10px] font-bold">{item.change}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {user && (
                        <button
                          onClick={() => toggleCollection(item)}
                          disabled={savingId === item.id}
                          title={savedIds.has(item.id) ? 'Quitar de colección' : 'Guardar en colección'}
                          className={`p-2 rounded-lg border transition-all text-sm ${savedIds.has(item.id) ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/10 text-gray-500 hover:text-amber-400 hover:border-amber-500/30'}`}>
                          {savingId === item.id
                            ? <div className="w-3.5 h-3.5 border border-amber-400 border-t-transparent rounded-full animate-spin" />
                            : <svg className="w-3.5 h-3.5" fill={savedIds.has(item.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                          }
                        </button>
                      )}
                      <button
                        onClick={() => { addToCart(item); setCartOpen(true) }}
                        className="bg-amber-500/10 hover:bg-amber-500 border border-amber-500/30 hover:border-amber-500 text-amber-400 hover:text-black font-bold py-2 px-3 rounded-lg text-xs transition-all">
                        {item.txn === 'auction' ? 'Pujar' : item.txn === 'trade' ? 'Tradear' : '+ Agregar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cartOpen && (
        <CartDrawer
          items={cart}
          onClose={() => setCartOpen(false)}
          onRemove={removeOneFromCart}
          onClear={() => setCart([])}
        />
      )}
    </div>
  )
}
