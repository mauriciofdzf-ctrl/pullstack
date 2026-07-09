import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getImages, type ImageKey } from '../lib/imageConfig'
import CartDrawer, { type CartEntry } from '../components/CartDrawer'
import CheckoutModal from '../components/CheckoutModal'
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

type UserListing = {
  id: number
  user_id: string
  display_name: string
  title: string
  description: string | null
  sport: string
  kind: 'card' | 'box' | 'accessory'
  txn_type: 'sale' | 'auction' | 'trade'
  price: string | null
  min_bid: string | null
  grade: string | null
  condition: string | null
  image_url: string | null
  active: boolean
  created_at: string
  ends_at: string | null
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

const SPORT_OPTIONS = ['NBA', 'NFL', 'Soccer', 'MLB', 'Pokémon', 'One Piece', 'General']
const CONDITION_OPTIONS = ['Sin gradear (Raw)', 'Near Mint (NM)', 'Excellent (EX)', 'Very Good (VG)', 'Good (G)']
const LISTING_SPORT_ICON: Record<string, string> = {
  NBA:'🏀', NFL:'🏈', Soccer:'⚽', MLB:'⚾', 'Pokémon':'🃏', 'One Piece':'🏴‍☠️', General:'🛡️'
}

// ─── Contact Seller Modal ─────────────────────────────────────────────────────
function ContactSellerModal({ listing, actionType, user, profile, onClose }: {
  listing: UserListing
  actionType: 'sale' | 'auction' | 'trade'
  user: { id: string }
  profile: { display_name?: string | null } | null
  onClose: () => void
}) {
  const navigate = useNavigate()
  const defaultMsg = {
    sale:    `Hola ${listing.display_name}! Me interesa tu anuncio "${listing.title}"${listing.price ? ` (${listing.price})` : ''}. ¿Está disponible? ¿Tienes más fotos?`,
    auction: `Hola ${listing.display_name}! Quiero hacer una puja por "${listing.title}". Mi oferta es: `,
    trade:   `Hola ${listing.display_name}! Me interesa "${listing.title}" para un trade. Te ofrezco: `,
  }
  const [message,   setMessage]   = useState(defaultMsg[actionType])
  const [bidAmount, setBidAmount] = useState('')
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)

  const send = async () => {
    if (!message.trim()) return
    setSending(true)
    await supabase.from('direct_messages').insert({
      from_user_id: user.id,
      to_user_id:   listing.user_id,
      from_name:    profile?.display_name || 'Usuario',
      to_name:      listing.display_name,
      content:      actionType === 'auction' && bidAmount ? `${message.trim()} — Puja: $${bidAmount}` : message.trim(),
      listing_id:   listing.id,
      listing_title: listing.title,
      action_type:  actionType,
      bid_amount:   actionType === 'auction' && bidAmount ? `$${bidAmount}` : null,
      read:         false,
    })
    setSending(false); setSent(true)
  }

  const ICON = { sale: '🛒', auction: '🔨', trade: '🔄' }
  const LABEL = { sale: 'Propuesta de compra', auction: 'Enviar puja', trade: 'Propuesta de trade' }
  const COLOR = { sale: 'bg-violet-600 hover:bg-violet-500', auction: 'bg-red-500 hover:bg-red-400', trade: 'bg-blue-500 hover:bg-blue-400' }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-[#12161f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {sent ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-white font-black text-xl mb-2">¡Mensaje enviado!</p>
            <p className="text-gray-400 text-sm mb-6">El vendedor recibirá tu mensaje y te responderá pronto.</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 bg-white/5 border border-white/10 text-gray-300 font-bold py-2.5 rounded-xl text-sm transition-all hover:bg-white/10">Cerrar</button>
              <button onClick={() => { onClose(); navigate('/messages') }}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-black py-2.5 rounded-xl text-sm transition-all">
                Ver mensajes →
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{ICON[actionType]} {LABEL[actionType]}</p>
                <p className="text-white font-black text-base truncate">{listing.title}</p>
              </div>
              <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-[#191d28] border border-white/5 rounded-xl p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                  {listing.display_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-gray-400 text-[10px]">Enviando a</p>
                  <p className="text-white font-bold text-sm">{listing.display_name}</p>
                </div>
                {listing.price && <p className="ml-auto text-emerald-400 font-black text-sm">{listing.price}</p>}
              </div>

              {actionType === 'auction' && (
                <div>
                  <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">Tu puja (USD) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder="0.00"
                      className="w-full bg-[#191d28] border border-red-500/30 text-white pl-7 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-red-500/60 font-black placeholder-gray-700" />
                  </div>
                  {listing.min_bid && <p className="text-red-400 text-[10px] mt-1">Puja mínima: {listing.min_bid}</p>}
                </div>
              )}

              <div>
                <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1.5 block">Mensaje</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
                  className="w-full bg-[#191d28] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 resize-none placeholder-gray-700" />
              </div>

              <button onClick={send} disabled={sending || !message.trim() || (actionType === 'auction' && !bidAmount)}
                className={`w-full py-3 rounded-xl text-white font-black text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${COLOR[actionType]}`}>
                {sending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {ICON[actionType]} {sending ? 'Enviando...' : LABEL[actionType]}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Publish Modal ────────────────────────────────────────────────────────────
function PublishModal({ onClose, user, profile, onSuccess }: {
  onClose: () => void
  user: { id: string } | null
  profile: { display_name?: string | null } | null
  onSuccess: (listing: UserListing) => void
}) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '', description: '',
    sport: 'NBA', kind: 'card' as 'card' | 'box' | 'accessory',
    txn_type: 'sale' as 'sale' | 'auction' | 'trade',
    price: '', min_bid: '', grade: '', condition: 'Sin gradear (Raw)',
    duration_days: '3',
  })
  const [imageFile,    setImageFile]    = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDragging,   setIsDragging]   = useState(false)
  const [uploading,    setUploading]    = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [done,         setDone]         = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Solo se aceptan imágenes (JPG, PNG, WEBP)'); return }
    if (file.size > 8 * 1024 * 1024) { setError('La imagen no puede superar 8MB'); return }
    setError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null); setImagePreview(null)
  }

  const submit = async () => {
    if (!user) { onClose(); navigate('/login'); return }
    if (!form.title.trim()) { setError('El título es obligatorio'); return }
    if (form.txn_type !== 'trade' && !form.price && !form.min_bid) {
      setError('Ingresa un precio o puja mínima'); return
    }
    setLoading(true); setError('')

    let image_url: string | null = null
    if (imageFile) {
      setUploading(true)
      const ext  = imageFile.name.split('.').pop() || 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('listing-images').upload(path, imageFile, { upsert: true })
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(path)
        image_url = urlData.publicUrl
      }
      setUploading(false)
    }

    const ends_at = form.txn_type === 'auction'
      ? new Date(Date.now() + parseInt(form.duration_days) * 86400000).toISOString()
      : null

    const payload = {
      user_id:      user.id,
      display_name: profile?.display_name || user.id.slice(0, 8),
      title:        form.title.trim(),
      description:  form.description.trim() || null,
      sport:        form.sport,
      kind:         form.kind,
      txn_type:     form.txn_type,
      price:        form.price ? `$${form.price}` : null,
      min_bid:      form.min_bid ? `$${form.min_bid}` : null,
      grade:        form.grade.trim() || null,
      condition:    form.condition,
      image_url,
      active:       true,
      ends_at,
    }
    const { data, error: err } = await supabase.from('listings').insert(payload).select().single()
    setLoading(false)
    if (err) { setError('Error al publicar. Intenta de nuevo.'); return }
    setDone(true)
    setTimeout(() => { onSuccess(data as UserListing); onClose() }, 1600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg bg-[#12161f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">
        {done ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-violet-500/20 border border-violet-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-white font-black text-xl mb-1">¡Publicado!</p>
            <p className="text-gray-500 text-sm">Tu anuncio ya está visible en el Mercado.</p>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <div>
                <p className="text-violet-400 text-[10px] font-bold uppercase tracking-widest">Nuevo anuncio</p>
                <h3 className="text-white font-black text-lg">Publicar en el Mercado</h3>
              </div>
              <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {/* ① Tipo de transacción */}
              <div>
                <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 block">¿Qué quieres hacer?</label>
                <div className="grid grid-cols-3 gap-2">
                  {([['sale','🛒','Vender'],['auction','🔨','Subastar'],['trade','🔄','Tradear']] as const).map(([val, ico, lbl]) => (
                    <button key={val} onClick={() => set('txn_type', val)}
                      className={`py-3 rounded-xl text-sm font-black border transition-all flex flex-col items-center gap-1 ${
                        form.txn_type === val
                          ? val === 'sale'    ? 'bg-violet-600 border-violet-500 text-white'
                          : val === 'auction' ? 'bg-red-500 border-red-500 text-white'
                                              : 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-[#191d28] border-white/10 text-gray-500 hover:border-white/20 hover:text-white'
                      }`}>
                      <span className="text-xl">{ico}</span>
                      <span>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ② Foto — la más importante */}
              <div>
                <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2 block">
                  Foto del artículo <span className="text-violet-400">📷</span>
                </label>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                    <div className="w-full bg-[#070910]" style={{ aspectRatio: '5/7' }}>
                      <img src={imagePreview} alt="preview" className="w-full h-full object-contain" />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <button onClick={removeImage}
                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-3 py-2 rounded-lg flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Cambiar foto
                      </button>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-green-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Lista</div>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-xl cursor-pointer select-none transition-all ${
                      isDragging
                        ? 'border-violet-500 bg-violet-500/10 scale-[1.02]'
                        : 'border-white/15 hover:border-violet-500/50 hover:bg-violet-600/5'
                    }`}
                  >
                    {isDragging ? (
                      <div className="flex flex-col items-center pointer-events-none">
                        <span className="text-4xl mb-2">📸</span>
                        <p className="text-violet-400 font-black text-sm">Suelta aquí</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <svg className="w-9 h-9 text-gray-600 mb-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-300 font-bold text-sm">Arrastra tu foto aquí</p>
                        <p className="text-gray-600 text-[11px] mt-0.5">o haz clic para seleccionar</p>
                        <p className="text-gray-700 text-[10px] mt-1.5 border border-white/8 rounded-full px-3 py-0.5">JPG · PNG · WEBP · máx. 8MB</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                  </div>
                )}
              </div>

              {/* ③ Título */}
              <div>
                <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Título *</label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="Ej: LeBron James RC 2003 Topps Chrome PSA 9..."
                  className="w-full bg-[#191d28] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 placeholder-gray-700" />
              </div>

              {/* ④ Descripción */}
              <div>
                <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Descripción</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Serial, variante, condición específica, incluye envío, etc..."
                  rows={2}
                  className="w-full bg-[#191d28] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 resize-none placeholder-gray-700" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Deporte */}
                <div>
                  <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Deporte</label>
                  <select value={form.sport} onChange={e => set('sport', e.target.value)}
                    className="w-full bg-[#191d28] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                    {SPORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                {/* Tipo */}
                <div>
                  <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Tipo</label>
                  <select value={form.kind} onChange={e => set('kind', e.target.value as any)}
                    className="w-full bg-[#191d28] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                    <option value="card">🃏 Carta individual</option>
                    <option value="box">📦 Caja sellada</option>
                    <option value="accessory">🛡️ Accesorio</option>
                  </select>
                </div>

                {/* Precio */}
                {form.txn_type === 'sale' && (
                  <div>
                    <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Precio USD *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                      <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                        placeholder="500" min="0"
                        className="w-full bg-[#191d28] border border-white/10 text-white rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50" />
                    </div>
                  </div>
                )}

                {/* Puja mínima */}
                {form.txn_type === 'auction' && (
                  <div>
                    <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Puja mínima USD *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                      <input type="number" value={form.min_bid} onChange={e => set('min_bid', e.target.value)}
                        placeholder="100" min="0"
                        className="w-full bg-[#191d28] border border-white/10 text-white rounded-xl pl-7 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-500/50" />
                    </div>
                  </div>
                )}

                {/* Duración subasta */}
                {form.txn_type === 'auction' && (
                  <div>
                    <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Duración de la subasta</label>
                    <select value={form.duration_days} onChange={e => set('duration_days', e.target.value)}
                      className="w-full bg-[#191d28] border border-red-500/20 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                      <option value="1">⏱ 1 día</option>
                      <option value="3">⏱ 3 días</option>
                      <option value="7">⏱ 7 días</option>
                      <option value="14">⏱ 14 días</option>
                      <option value="30">⏱ 30 días</option>
                    </select>
                  </div>
                )}

                {/* Condición */}
                <div>
                  <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Condición</label>
                  <select value={form.condition} onChange={e => set('condition', e.target.value)}
                    className="w-full bg-[#191d28] border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none">
                    {CONDITION_OPTIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {/* Grado */}
                {form.kind === 'card' && (
                  <div>
                    <label className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1 block">Grado (si aplica)</label>
                    <input value={form.grade} onChange={e => set('grade', e.target.value)}
                      placeholder="PSA 10, BGS 9.5..."
                      className="w-full bg-[#191d28] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 placeholder-gray-700" />
                  </div>
                )}
              </div>

              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{error}</p>}
            </div>

            <div className="px-6 py-4 border-t border-white/5 shrink-0">
              <button onClick={submit} disabled={loading || !form.title.trim()}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-black font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                {loading
                  ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />{uploading ? 'Subiendo foto...' : 'Publicando...'}</>
                  : <>📢 Publicar anuncio</>
                }
              </button>
              <p className="text-gray-600 text-[10px] text-center mt-2">Al publicar aceptas que PullStack puede moderar anuncios que incumplan las reglas.</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Bid Modal ────────────────────────────────────────────────────────────────
function BidModal({ item, onClose, user, navigate }: {
  item: Item
  onClose: () => void
  user: { id: string } | null
  navigate: ReturnType<typeof useNavigate>
}) {
  const [amount, setAmount]   = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')
  const minBid = Math.ceil(parsePrice(item.price) * 0.8)

  const submit = async () => {
    if (!user) { onClose(); navigate('/login'); return }
    const n = parseFloat(amount)
    if (isNaN(n) || n < minBid) { setError(`La puja mínima es $${minBid.toLocaleString()} USD`); return }
    setLoading(true); setError('')
    await supabase.from('messages').insert({
      user_id: user.id,
      content: `🔨 Puja de $${n.toLocaleString()} USD por "${item.name}" — ${item.detail} (${item.price})`,
      from_admin: false,
    })
    setLoading(false); setDone(true)
    setTimeout(onClose, 1800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-[#12161f] border border-white/10 rounded-2xl p-6 shadow-2xl">
        {done ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-white font-black text-lg">¡Interés registrado!</p>
            <p className="text-gray-500 text-sm mt-1">El equipo de PullStack te contactará por mensajes pronto.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-0.5">Hacer una puja</p>
                <h3 className="text-white font-black text-lg leading-tight">{item.name}</h3>
                <p className="text-gray-500 text-xs">{item.detail.slice(0, 60)}...</p>
              </div>
              <button onClick={onClose} className="text-gray-600 hover:text-white ml-3 shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="bg-[#191d28] rounded-xl p-3 mb-4 flex items-center justify-between">
              <span className="text-gray-500 text-xs">Precio listado</span>
              <span className="text-white font-black">{item.price}</span>
            </div>
            <div className="mb-4">
              <label className="text-gray-400 text-xs mb-1.5 block">Tu puja (USD) — mínimo <span className="text-violet-400 font-bold">${minBid.toLocaleString()}</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setError('') }}
                  placeholder={`${minBid}`} min={minBid}
                  className="w-full bg-[#090c14] border border-white/10 text-white rounded-xl pl-8 pr-4 py-3 text-lg font-black focus:outline-none focus:border-violet-500/50" />
              </div>
              {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
            </div>
            <button onClick={submit} disabled={loading || !amount}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-black py-3 rounded-xl transition-all">
              {loading ? 'Enviando puja...' : '🔨 Confirmar puja'}
            </button>
            <p className="text-gray-600 text-[10px] text-center mt-3">El vendedor decide si acepta. Si ganas, te contactamos por email.</p>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Trade Modal ──────────────────────────────────────────────────────────────
function TradeModal({ item, onClose, user, navigate }: {
  item: Item
  onClose: () => void
  user: { id: string } | null
  navigate: ReturnType<typeof useNavigate>
}) {
  const [offer, setOffer]     = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  const submit = async () => {
    if (!user) { onClose(); navigate('/login'); return }
    if (!offer.trim()) return
    setLoading(true)
    await supabase.from('messages').insert({
      user_id: user.id,
      content: `📦 Propuesta de Trade para "${item.name}" (${item.price})\n\nLo que ofrezco: ${offer}`,
      from_admin: false,
    })
    setLoading(false); setDone(true)
    setTimeout(onClose, 1800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-[#12161f] border border-white/10 rounded-2xl p-6 shadow-2xl">
        {done ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-white font-black text-lg">¡Propuesta enviada!</p>
            <p className="text-gray-500 text-sm mt-1">Revisa tus mensajes para la respuesta.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-0.5">Proponer Trade</p>
                <h3 className="text-white font-black text-lg leading-tight">{item.name}</h3>
                <p className="text-gray-500 text-xs">{item.price}</p>
              </div>
              <button onClick={onClose} className="text-gray-600 hover:text-white ml-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="mb-4">
              <label className="text-gray-400 text-xs mb-1.5 block">¿Qué ofreces a cambio?</label>
              <textarea value={offer} onChange={e => setOffer(e.target.value)}
                placeholder="Ej: Mahomes RC PSA 9 + $500 USD en efectivo..."
                rows={4}
                className="w-full bg-[#191d28] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 resize-none" />
            </div>
            <button onClick={submit} disabled={loading || !offer.trim()}
              className="w-full bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-white font-black py-3 rounded-xl transition-all">
              {loading ? 'Enviando...' : 'Enviar propuesta de trade'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function Marketplace() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
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
  const [bidItem,       setBidItem]       = useState<Item | null>(null)
  const [tradeItem,     setTradeItem]     = useState<Item | null>(null)
  const [listings,      setListings]      = useState<UserListing[]>([])
  const [showPublish,   setShowPublish]   = useState(false)
  const [deletingId,    setDeletingId]    = useState<number | null>(null)
  const [contactModal,  setContactModal]  = useState<{ listing: UserListing; action: 'sale' | 'auction' | 'trade' } | null>(null)
  const [checkoutModal, setCheckoutModal] = useState<UserListing | null>(null)
  const [showCatalog,   setShowCatalog]   = useState(true)
  const [minPrice,      setMinPrice]      = useState('')
  const [maxPrice,      setMaxPrice]      = useState('')

  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'show_catalog').single()
      .then(({ data }) => { if (data) setShowCatalog(data.value !== 'false') })
  }, [])

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

  useEffect(() => {
    supabase.from('listings').select('*').eq('active', true).order('created_at', { ascending: false })
      .then(({ data }) => setListings((data as UserListing[]) || []))
  }, [])

  const deleteMyListing = async (id: number) => {
    if (!confirm('¿Retirar este anuncio del mercado?')) return
    setDeletingId(id)
    await supabase.from('listings').delete().eq('id', id)
    setListings(prev => prev.filter(l => l.id !== id))
    setDeletingId(null)
  }


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

  const minP = minPrice ? parseFloat(minPrice) : null
  const maxP = maxPrice ? parseFloat(maxPrice) : null

  const filteredListings = listings.filter(l => {
    const ms = sport === 'Todos' || l.sport === sport || l.sport === 'General'
    const mk = kind  === 'all'   || l.kind === kind
    const mt = txn   === 'Todos' || (txn === 'Venta' && l.txn_type === 'sale') || (txn === 'Subasta' && l.txn_type === 'auction') || (txn === 'Trading' && l.txn_type === 'trade')
    const mq = !query || l.title.toLowerCase().includes(query.toLowerCase()) || (l.description || '').toLowerCase().includes(query.toLowerCase())
    const p  = parsePrice(l.price || l.min_bid || '0')
    const mpMin = minP === null || p >= minP
    const mpMax = maxP === null || p <= maxP
    return ms && mk && mt && mq && mpMin && mpMax
  })

  let results = CATALOG.filter((item) => {
    const ms = sport === 'Todos' || item.sport === sport || item.sport === 'General'
    const mk = kind  === 'all'   || item.kind  === kind
    const mt = txn   === 'Todos' || txnMap[item.txn] === txn
    const mq = !query || item.name.toLowerCase().includes(query.toLowerCase()) || item.brand.toLowerCase().includes(query.toLowerCase()) || item.detail.toLowerCase().includes(query.toLowerCase())
    const p  = parsePrice(item.price)
    const mpMin = minP === null || p >= minP
    const mpMax = maxP === null || p <= maxP
    return ms && mk && mt && mq && mpMin && mpMax
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
    <div className="min-h-screen bg-[#090c14] pt-20 pb-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-violet-400 text-xs font-bold uppercase tracking-widest mb-1">PullStack</p>
            <h1 className="text-4xl font-black text-white mb-1">Mercado</h1>
            <p className="text-gray-500 text-sm">Compra · Subasta · Tradea · NBA · NFL · Soccer · MLB · Pokémon · One Piece</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => user ? setShowPublish(true) : navigate('/login')}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-black px-4 py-2.5 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-violet-500/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              <span className="hidden sm:inline">Publicar</span>
            </button>
            <button onClick={() => setCartOpen(true)}
              className="flex items-center gap-2 bg-[#12161f] border border-white/10 hover:border-violet-500/30 text-white px-4 py-2.5 rounded-xl transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="text-sm font-bold hidden sm:inline">Carrito</span>
              {cartCount > 0 && (
                <span className="bg-violet-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>
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
            className="w-full bg-[#12161f] border border-white/10 text-white placeholder-gray-600 pl-11 pr-4 py-3.5 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* ── Secciones destacadas ── */}
        <div className="grid grid-cols-3 gap-3 mb-7">
          {[
            { k: 'card',      icon: '🃏', label: 'Cartas',         color: 'violet', sub: 'Individuales · Gradeadas' },
            { k: 'box',       icon: '📦', label: 'Cajas Selladas',  color: 'amber',  sub: 'NBA · NFL · Soccer · TCG' },
            { k: 'accessory', icon: '🛡️', label: 'Accesorios',      color: 'emerald', sub: 'Sleeves · Toploaders · Binders' },
          ].map(s => (
            <button key={s.k} onClick={() => setKind(kind === s.k ? 'all' : s.k)}
              className={`rounded-2xl p-4 border transition-all text-left group ${
                kind === s.k
                  ? s.color === 'violet'  ? 'bg-violet-600/20 border-violet-500/50'
                  : s.color === 'amber'   ? 'bg-amber-500/20 border-amber-500/50'
                                          : 'bg-emerald-500/20 border-emerald-500/50'
                  : 'bg-[#12161f] border-white/5 hover:border-white/15'
              }`}>
              <p className="text-2xl mb-1.5">{s.icon}</p>
              <p className={`font-black text-sm ${kind === s.k ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{s.label}</p>
              <p className={`text-[10px] mt-0.5 ${kind === s.k ? 'text-gray-300' : 'text-gray-600'}`}>{s.sub}</p>
            </button>
          ))}
        </div>

        {/* Filtros */}
        <div className="space-y-3 mb-8">
          {/* Tipo de producto */}
          <div className="flex gap-2 flex-wrap">
            {KINDS.map((k) => (
              <button key={k.value} onClick={() => setKind(k.value)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${kind === k.value ? 'bg-violet-600 text-white' : 'bg-[#12161f] border border-white/10 text-gray-400 hover:border-violet-500/30 hover:text-violet-400'}`}>
                {k.label}
              </button>
            ))}
            <div className="h-8 w-px bg-white/10 self-center mx-1 hidden sm:block" />
            {/* Tipo de transacción */}
            {TXNS.map((t) => (
              <button key={t} onClick={() => setTxn(t)}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${txn === t ? 'bg-violet-600 text-white' : 'bg-[#12161f] border border-white/10 text-gray-400 hover:border-violet-500/30 hover:text-violet-400'}`}>
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${showMXN ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'bg-[#12161f] border-white/10 text-gray-500 hover:text-gray-300'}`}>
                {showMXN ? '🇲🇽 MXN' : '🇺🇸 USD'}
              </button>
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="bg-[#12161f] border border-white/10 text-gray-400 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-violet-500/50">
                {SORTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {/* Rango de precio */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-gray-600 text-xs font-bold uppercase tracking-widest">Precio USD:</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs">$</span>
              <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Mín"
                className="bg-[#12161f] border border-white/10 text-white pl-6 pr-3 py-1.5 rounded-lg text-xs w-24 focus:outline-none focus:border-violet-500/40 placeholder-gray-700" />
            </div>
            <span className="text-gray-700 text-xs">—</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs">$</span>
              <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Máx"
                className="bg-[#12161f] border border-white/10 text-white pl-6 pr-3 py-1.5 rounded-lg text-xs w-24 focus:outline-none focus:border-violet-500/40 placeholder-gray-700" />
            </div>
            {(minPrice || maxPrice) && (
              <button onClick={() => { setMinPrice(''); setMaxPrice('') }} className="text-xs text-gray-600 hover:text-gray-300 transition-colors">✕ limpiar</button>
            )}
          </div>
          {showMXN && (
            <p className="text-[10px] text-gray-600">Precios convertidos a MXN usando tipo de cambio de referencia $17.50 MXN/USD. Precios reales pueden variar.</p>
          )}
        </div>

        {/* ── Anuncios de usuarios ────────────────────────────── */}
        {filteredListings.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Anuncios de usuarios</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredListings.map(listing => {
                const txnLabel = listing.txn_type === 'sale' ? 'Venta' : listing.txn_type === 'auction' ? 'Subasta' : 'Trade'
                const txnColor = listing.txn_type === 'sale' ? 'bg-green-500/10 text-green-400 border-green-500/30' : listing.txn_type === 'auction' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                const displayListing = listing.price || listing.min_bid || (listing.txn_type === 'trade' ? 'A convenir' : '—')
                const isOwner = user?.id === listing.user_id
                return (
                  <div key={listing.id} onClick={() => navigate(`/listing/${listing.id}`)} className="group bg-[#12161f] border border-white/5 hover:border-violet-500/30 rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(139,92,246,0.15)] cursor-pointer">
                    {/* Visual header */}
                    <div className="relative bg-[#070910] flex items-center justify-center overflow-hidden" style={{ aspectRatio: '5/7' }}>
                      {listing.image_url
                        ? <img src={listing.image_url} alt={listing.title} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                        : (
                          <div className="flex flex-col items-center gap-2 opacity-25 select-none pointer-events-none">
                            <span className="text-6xl">{LISTING_SPORT_ICON[listing.sport] || '🃏'}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sin foto</span>
                          </div>
                        )
                      }
                      <div className="absolute inset-0 bg-gradient-to-t from-[#090c14]/80 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                        <span className="bg-violet-600/90 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Particular</span>
                        {listing.grade && <span className="bg-black/70 backdrop-blur text-violet-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-violet-500/30">{listing.grade}</span>}
                      </div>
                      <div className={`absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${txnColor}`}>{txnLabel}</div>
                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">{LISTING_SPORT_ICON[listing.sport]} {listing.sport}</span>
                        <span className="text-[10px] text-gray-600">{listing.kind === 'card' ? '🃏' : listing.kind === 'box' ? '📦' : '🛡️'}</span>
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-violet-400 text-[10px] font-bold uppercase tracking-widest mb-0.5 truncate">{listing.display_name}</p>
                      <h3 className="text-white font-black text-sm leading-tight mb-1 line-clamp-2">{listing.title}</h3>
                      {listing.description && <p className="text-gray-600 text-[10px] leading-relaxed mb-3 line-clamp-2">{listing.description}</p>}
                      {listing.condition && !listing.description && <p className="text-gray-600 text-[10px] mb-3">{listing.condition}</p>}

                      <div className="flex items-end justify-between gap-2 mb-3">
                        <div>
                          <p className="text-white font-black text-lg leading-none">{displayListing}</p>
                          {listing.txn_type === 'auction' && listing.min_bid && <p className="text-gray-600 text-[10px]">Puja mín.</p>}
                          {listing.condition && listing.grade && <p className="text-gray-500 text-[10px]">{listing.condition}</p>}
                        </div>
                        {isOwner && (
                          <button onClick={e => { e.stopPropagation(); deleteMyListing(listing.id) }} disabled={deletingId === listing.id}
                            title="Retirar anuncio"
                            className="text-gray-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20">
                            {deletingId === listing.id
                              ? <div className="w-3.5 h-3.5 border border-red-400/50 border-t-transparent rounded-full animate-spin" />
                              : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            }
                          </button>
                        )}
                      </div>

                      {listing.kind === 'card' ? (
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            onClick={e => { e.stopPropagation(); if (!user) { navigate('/login'); return }; if (listing.txn_type === 'sale') setCheckoutModal(listing); else navigate(`/listing/${listing.id}`) }}
                            className={`py-2 rounded-lg text-[11px] font-bold transition-all text-center ${listing.txn_type === 'sale' ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-[#191d28] border border-white/10 text-gray-500 hover:border-violet-500/30 hover:text-violet-400'}`}>
                            🛒 Comprar
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/listing/${listing.id}`) }}
                            className={`py-2 rounded-lg text-[11px] font-bold transition-all text-center ${listing.txn_type === 'auction' ? 'bg-red-500/80 hover:bg-red-500 text-white' : 'bg-[#191d28] border border-white/10 text-gray-500 hover:border-red-500/30 hover:text-red-400'}`}>
                            🔨 Pujar
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); navigate(`/listing/${listing.id}`) }}
                            className={`py-2 rounded-lg text-[11px] font-bold transition-all text-center ${listing.txn_type === 'trade' ? 'bg-blue-500/80 hover:bg-blue-500 text-white' : 'bg-[#191d28] border border-white/10 text-gray-500 hover:border-blue-500/30 hover:text-blue-400'}`}>
                            🔄 Trade
                          </button>
                        </div>
                      ) : (
                        <button onClick={e => { e.stopPropagation(); navigate(`/listing/${listing.id}`) }}
                          className="w-full bg-violet-500/10 hover:bg-violet-600 border border-violet-500/30 hover:border-violet-500 text-violet-400 hover:text-white font-bold py-2 px-3 rounded-lg text-xs transition-all">
                          Ver detalle →
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Catálogo PullStack ──────────────────────────────── */}
        {!showCatalog && (
          <div className="text-center py-16 text-gray-600">
            <p className="text-4xl mb-3">🃏</p>
            <p className="font-bold">Solo se muestran anuncios de usuarios</p>
          </div>
        )}
        {showCatalog && <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Catálogo PullStack</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>}

        {/* Resultados */}
        {showCatalog && (
          <>
          <p className="text-gray-600 text-sm mb-6">
            <span className="text-white font-bold">{results.length}</span> resultados en catálogo
            {query && <span> para "<span className="text-violet-400">{query}</span>"</span>}
          </p>

          {results.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-gray-600 text-5xl mb-4">🔍</p>
              <p className="text-gray-400 font-bold text-lg">Sin resultados</p>
              <p className="text-gray-600 text-sm mt-1">Intenta con otros filtros o un término diferente</p>
              <button onClick={() => { setSport('Todos'); setKind('all'); setTxn('Todos'); setQuery('') }}
                className="mt-4 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-400 text-sm font-bold px-4 py-2 rounded-lg transition-all">
                Limpiar filtros
              </button>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {results.map((item) => (
              <div key={item.id}
                className="group bg-[#12161f] border border-white/5 hover:border-violet-500/30 rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(139,92,246,0.15)]">
                {/* Imagen */}
                {(() => { const { isRC, isAuto, is1of1, numbered, gradeCo, gradeNum } = cardAttrs(item); return (
                <div className="relative h-48 overflow-hidden">
                  <img src={IMG[item.imgKey]} alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090c14]/90 via-black/10 to-transparent" />
                  {/* Badges top-left */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[calc(100%-70px)]">
                    {item.badge && (
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${item.badge.includes('🔥') || item.badge.includes('🏆') ? 'bg-red-600 text-white' : item.badge.includes('🌍') ? 'bg-blue-600 text-white' : 'bg-violet-600 text-white'}`}>
                        {item.badge}
                      </span>
                    )}
                    {isRC    && <span className="bg-purple-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">RC</span>}
                    {isAuto  && <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">Auto</span>}
                    {is1of1  && <span className="bg-gradient-to-r from-violet-400 to-yellow-300 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">1/1</span>}
                    {numbered && !is1of1 && <span className="bg-white/10 backdrop-blur text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{numbered}</span>}
                  </div>
                  {/* Tipo transacción top-right */}
                  <div className={`absolute top-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${txnCss[item.txn]}`}>
                    {txnMap[item.txn]}
                  </div>
                  {/* Footer de la imagen */}
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between gap-1">
                    {gradeCo && gradeNum && (
                      <span className="bg-black/70 backdrop-blur text-violet-400 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-violet-500/30 shrink-0">
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
                  <p className="text-[10px] text-violet-400 font-bold uppercase tracking-widest mb-0.5">{item.brand}</p>
                  <h3 className="text-white font-black text-sm leading-tight mb-0.5">{item.name}</h3>
                  <p className="text-gray-600 text-[10px] leading-relaxed mb-3 line-clamp-2">{item.detail}</p>

                  {/* Price row */}
                  <div className="flex items-end justify-between gap-2 mb-3">
                    <div>
                      <p className="text-white font-black text-lg leading-none">{displayPrice(item.price)}</p>
                      <p className="text-gray-600 text-[10px]">{item.sub}</p>
                      {item.change && <p className={`text-[10px] font-bold ${item.change.startsWith('-') ? 'text-red-400' : 'text-emerald-400'}`}>{item.change}</p>}
                    </div>
                    {user && (
                      <button onClick={() => toggleCollection(item)} disabled={savingId === item.id}
                        title={savedIds.has(item.id) ? 'Quitar de colección' : 'Guardar en colección'}
                        className={`p-2 rounded-lg border transition-all shrink-0 ${savedIds.has(item.id) ? 'bg-violet-500/20 border-violet-500/40 text-violet-400' : 'bg-white/5 border-white/10 text-gray-500 hover:text-violet-400 hover:border-violet-500/30'}`}>
                        {savingId === item.id
                          ? <div className="w-3.5 h-3.5 border border-violet-400 border-t-transparent rounded-full animate-spin" />
                          : <svg className="w-3.5 h-3.5" fill={savedIds.has(item.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                        }
                      </button>
                    )}
                  </div>

                  {/* Action buttons */}
                  {item.kind === 'card' ? (
                    <div className="grid grid-cols-3 gap-1.5">
                      <button onClick={() => { addToCart(item); setCartOpen(true) }}
                        className={`py-2 rounded-lg text-[11px] font-bold transition-all text-center ${
                          item.txn === 'sale' ? 'bg-violet-600 hover:bg-violet-500 text-white' : 'bg-[#191d28] border border-white/10 text-gray-500 hover:border-violet-500/30 hover:text-violet-400'
                        }`}>
                        🛒 Comprar
                      </button>
                      <button onClick={() => user ? setBidItem(item) : navigate('/login')}
                        className={`py-2 rounded-lg text-[11px] font-bold transition-all text-center ${
                          item.txn === 'auction' ? 'bg-red-500/80 hover:bg-red-500 text-white' : 'bg-[#191d28] border border-white/10 text-gray-500 hover:border-red-500/30 hover:text-red-400'
                        }`}>
                        🔨 Pujar
                      </button>
                      <button onClick={() => user ? setTradeItem(item) : navigate('/login')}
                        className={`py-2 rounded-lg text-[11px] font-bold transition-all text-center ${
                          item.txn === 'trade' ? 'bg-blue-500/80 hover:bg-blue-500 text-white' : 'bg-[#191d28] border border-white/10 text-gray-500 hover:border-blue-500/30 hover:text-blue-400'
                        }`}>
                        🔄 Trade
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => { addToCart(item); setCartOpen(true) }}
                      className={`w-full font-bold py-2 px-3 rounded-lg text-xs transition-all ${
                        item.kind === 'box'
                          ? 'bg-amber-500/10 hover:bg-amber-500 border border-amber-500/30 hover:border-amber-500 text-amber-400 hover:text-black'
                          : 'bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-black'
                      }`}>
                      {item.kind === 'box' ? '📦 Agregar al carrito' : '🛡️ Agregar al carrito'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
          </>
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
      {bidItem   && <BidModal   item={bidItem}   onClose={() => setBidItem(null)}   user={user} navigate={navigate} />}
      {tradeItem && <TradeModal item={tradeItem} onClose={() => setTradeItem(null)} user={user} navigate={navigate} />}
      {showPublish && <PublishModal onClose={() => setShowPublish(false)} user={user} profile={profile} onSuccess={l => setListings(prev => [l, ...prev])} />}
      {contactModal && user && (
        <ContactSellerModal
          listing={contactModal.listing}
          actionType={contactModal.action}
          user={user}
          profile={profile}
          onClose={() => setContactModal(null)}
        />
      )}
      {checkoutModal && user && (
        <CheckoutModal
          listing={checkoutModal}
          user={user}
          profile={profile}
          onClose={() => setCheckoutModal(null)}
        />
      )}
    </div>
  )
}
