import type { ImageKey } from './imageConfig'

export type CatalogItem = {
  id:        number
  name:      string
  detail:    string
  sport:     'NBA' | 'NFL' | 'Soccer' | 'MLB' | 'Pokémon' | 'One Piece' | 'General'
  kind:      'card' | 'box' | 'accessory'
  txn:       'sale' | 'auction' | 'trade' | 'buy'
  price:     string
  sub:       string
  brand:     string
  grade?:    string
  change?:   string
  badge?:    string
  hot?:      boolean
  imgKey:    ImageKey
  imageUrl?: string  // URL directa para items agregados por admin
}

export const CATALOG: CatalogItem[] = [
  // ── Cartas NBA ───────────────────────────────────────────────────────────
  { id:1,  name:'Cooper Flagg',        detail:'2025 Topps Now RC Auto · Draft Night #1 Pick',           sport:'NBA',       kind:'card', txn:'auction', price:'$27,500',      sub:'Raw ~$8,000',             brand:'Topps Now 2025',           grade:'BGS 9.5', change:'+210%',          badge:'🔥 Hot',            hot:true,  imgKey:'nba1' },
  { id:2,  name:'Victor Wembanyama',   detail:'2023-24 Topps Chrome RC Silver Refractor',               sport:'NBA',       kind:'card', txn:'sale',    price:'$8,400',       sub:'Raw ~$1,200',             brand:'Topps Chrome 2023',        grade:'PSA 10',  change:'+145%',          badge:'🔥 Hot',            hot:true,  imgKey:'nba2' },
  { id:3,  name:'LeBron James',        detail:'2003-04 Topps Chrome RC · Base',                         sport:'NBA',       kind:'card', txn:'sale',    price:'$24,500',      sub:'Raw ~$6,000',             brand:'Topps Chrome 2003',        grade:'PSA 10',  change:'+18%',                                      hot:false, imgKey:'nba3' },
  { id:4,  name:'Caitlin Clark',       detail:'2024 Topps WNBA RC Auto Silver /49',                     sport:'NBA',       kind:'card', txn:'trade',   price:'$3,800',       sub:'Raw ~$900',               brand:'Topps WNBA 2024',          grade:'PSA 10',  change:'+88%',           badge:'WNBA',              hot:true,  imgKey:'nba4' },
  // ── Cartas NFL ───────────────────────────────────────────────────────────
  { id:5,  name:'Jayden Daniels',      detail:'2024 Panini Prizm RC Auto Silver',                       sport:'NFL',       kind:'card', txn:'auction', price:'$6,800',       sub:'Raw ~$1,800',             brand:'Panini Prizm 2024',        grade:'PSA 10',  change:'+320%',          badge:'🔥 Hot',            hot:true,  imgKey:'nfl1' },
  { id:6,  name:'Cam Ward',            detail:'2025 Topps Chrome RC Auto · #1 Draft Pick',              sport:'NFL',       kind:'card', txn:'sale',    price:'$4,100',       sub:'Raw ~$1,100',             brand:'Topps Chrome 2025',        grade:'BGS 9.5', change:'+180%',          badge:'#1 Pick',           hot:true,  imgKey:'nfl2' },
  { id:7,  name:'Patrick Mahomes',     detail:'2017 Panini Prizm RC Silver',                            sport:'NFL',       kind:'card', txn:'sale',    price:'$12,000',      sub:'Raw ~$2,500',             brand:'Panini Prizm 2017',        grade:'PSA 10',  change:'+9%',                                       hot:false, imgKey:'nfl3' },
  // ── Cartas Soccer ────────────────────────────────────────────────────────
  { id:8,  name:'Lamine Yamal',        detail:'2024 Topps Chrome UEFA Euro RC Auto · SuperFractor 1/1', sport:'Soccer',    kind:'card', txn:'auction', price:'$396,500',     sub:'Base ~$6.50',             brand:'Topps Chrome UEFA 2024',   grade:'PSA 10',  change:'+585%/año',      badge:'🏆 Récord',         hot:true,  imgKey:'soccer1' },
  { id:9,  name:'Vinicius Jr.',        detail:'2023-24 Panini Select RC Premier Level',                 sport:'Soccer',    kind:'card', txn:'sale',    price:'$2,800',       sub:'Raw ~$420',               brand:'Panini Select 2023',       grade:'PSA 9',   change:'+67%',                                      hot:false, imgKey:'soccer2' },
  { id:10, name:'Erling Haaland',      detail:'2022-23 Topps Chrome UCL RC · Orange Refractor /25',     sport:'Soccer',    kind:'card', txn:'sale',    price:'$4,500',       sub:'Raw ~$600',               brand:'Topps Chrome UCL 2022',    grade:'PSA 10',  change:'+38%',                                      hot:false, imgKey:'soccer3' },
  // ── Cartas MLB ───────────────────────────────────────────────────────────
  { id:11, name:'Shohei Ohtani',       detail:'2018 Bowman Chrome Prospects Auto',                      sport:'MLB',       kind:'card', txn:'sale',    price:'$9,200',       sub:'Raw ~$2,100',             brand:'Bowman Chrome 2018',       grade:'PSA 10',  change:'+44%',                                      hot:false, imgKey:'mlb1' },
  { id:12, name:'Roman Anthony',       detail:'2025 Topps Chrome RC Auto',                              sport:'MLB',       kind:'card', txn:'auction', price:'$1,800',       sub:'Raw ~$400',               brand:'Topps Chrome 2025',        grade:'BGS 9.5', change:'+290%',          badge:'🔥 Hot',            hot:true,  imgKey:'mlb2' },
  // ── Cartas Pokémon ───────────────────────────────────────────────────────
  { id:13, name:'Charizard Holo 1st Edition', detail:'1999 Base Set · #4/102 · Holo Rare',             sport:'Pokémon',   kind:'card', txn:'sale',    price:'$550,000',     sub:'Raw ~$18,000',            brand:'Wizards of the Coast 1999',grade:'PSA 10',  change:'+89%/12 meses',  badge:'🏆 Grail',           hot:true,  imgKey:'pokemon1' },
  { id:14, name:'Pikachu Illustrator', detail:'1998 CoroCoro Comics Promo · Solo 41 en el mundo',       sport:'Pokémon',   kind:'card', txn:'sale',    price:'$16,492,000',  sub:'No existe raw auténtico', brand:'The Pokémon Company 1998', grade:'PSA 10 · Único', change:'Récord mundial 🏆', badge:'Más caro del mundo', hot:true, imgKey:'pokemon1' },
  { id:15, name:'Mewtwo ex SAR',       detail:'Scarlet & Violet 151 · SV2a · #205',                     sport:'Pokémon',   kind:'card', txn:'auction', price:'$420',         sub:'Raw ~$80',                brand:'The Pokémon Company 2023', grade:'PSA 10',  change:'+52%',                                      hot:false, imgKey:'pokemon1' },
  // ── Cartas One Piece ─────────────────────────────────────────────────────
  { id:16, name:'Monkey D. Luffy',     detail:'OP06-118 Manga Art Rare · Wings of the Captain',         sport:'One Piece', kind:'card', txn:'auction', price:'$10,500',      sub:'Raw $1,800–$3,500',       brand:'Bandai 2024',              grade:'PSA 10',  change:'+215%/año',      badge:'🔥 Hot',            hot:true,  imgKey:'onepiece1' },
  { id:17, name:'Roronoa Zoro',        detail:'OP01-001 Secret Rare · Romance Dawn',                    sport:'One Piece', kind:'card', txn:'sale',    price:'$2,100',       sub:'Raw ~$650',               brand:'Bandai 2022',              grade:'PSA 9',   change:'+178%',                                     hot:false, imgKey:'onepiece1' },
  // ── Cajas NBA ────────────────────────────────────────────────────────────
  { id:18, name:'2025-26 Topps Basketball Hobby Box',      detail:'~24 packs · RC Autos garantizados · Cooper Flagg y Wemby',            sport:'NBA',       kind:'box', txn:'buy', price:'$290',   sub:'$270 MSRP · 8 en stock',         brand:'Topps',                 badge:'🔥 Topps Era',  imgKey:'nba1' },
  { id:19, name:'2024-25 Topps Chrome Basketball Hobby Box', detail:'Primera temporada Topps · Wembanyama, Clark RCs',                   sport:'NBA',       kind:'box', txn:'buy', price:'$210',   sub:'$190 MSRP · 12 en stock',        brand:'Topps',                 badge:'Nuevo',         imgKey:'nba2' },
  // ── Cajas NFL ────────────────────────────────────────────────────────────
  { id:20, name:'2025 Panini Prizm NFL Hobby Box',         detail:'Cam Ward, Jaxson Dart, Quinn Ewers · 24 packs',                       sport:'NFL',       kind:'box', txn:'buy', price:'$250',   sub:'$230 MSRP · 5 en stock',         brand:'Panini',                badge:'Nuevos RCs',    imgKey:'nfl1' },
  { id:21, name:'2024 Panini Prizm NFL Hobby Box',         detail:'Jayden Daniels, Caleb Williams, Marvin Harrison Jr',                  sport:'NFL',       kind:'box', txn:'buy', price:'$280',   sub:'$240 MSRP · 3 en stock',         brand:'Panini',                badge:'Trending 🔥',   hot:true, imgKey:'nfl2' },
  // ── Cajas Soccer ─────────────────────────────────────────────────────────
  { id:22, name:'2026 Topps Chrome FIFA World Cup Hobby Box', detail:'Copa del Mundo USA/CAN/MX · Yamal, Vinicius, Mbappé',             sport:'Soccer',    kind:'box', txn:'buy', price:'$340',   sub:'$320 MSRP · 4 en stock',         brand:'Topps',                 badge:'🌍 World Cup 2026', hot:true, imgKey:'soccer1' },
  { id:23, name:'2024-25 Topps Chrome UEFA UCL Hobby Box', detail:'Champions League · Lamine Yamal pull top del set',                   sport:'Soccer',    kind:'box', txn:'buy', price:'$185',   sub:'$170 MSRP · 7 en stock',         brand:'Topps',                                        imgKey:'soccer2' },
  // ── Cajas MLB ────────────────────────────────────────────────────────────
  { id:24, name:'2025 Topps Chrome Baseball Hobby Box',    detail:'Roman Anthony, Jac Caglianone · 24 packs · Autos garantizados',      sport:'MLB',       kind:'box', txn:'buy', price:'$195',   sub:'$180 MSRP · 10 en stock',        brand:'Topps',                                        imgKey:'mlb1' },
  { id:25, name:'2024 Topps Series 1 Baseball Hobby Box', detail:'Ohtani Dodgers · Jackson Holliday · Ideal para comenzar',             sport:'MLB',       kind:'box', txn:'buy', price:'$120',   sub:'$110 MSRP · 15 en stock',        brand:'Topps',                 badge:'Asequible',     imgKey:'mlb2' },
  // ── Cajas Pokémon ────────────────────────────────────────────────────────
  { id:26, name:'Pokémon SV: Scarlet & Violet Booster Box (36 packs)', detail:'Era Paldea · Special Art Rares · Illustration Rares',    sport:'Pokémon',   kind:'box', txn:'buy', price:'$165',   sub:'$145 MSRP · 14 en stock',        brand:'The Pokémon Company',   badge:'Popular',       imgKey:'pokemon1' },
  { id:27, name:'Pokémon 151 Booster Box (Japanese · SV2a)', detail:'Regresa a Gen 1 · Mewtwo ex SAR · Charizard ex SAR',              sport:'Pokémon',   kind:'box', txn:'buy', price:'$215',   sub:'$195 MSRP · 6 en stock',         brand:'The Pokémon Company',   badge:'Trending 🔥',   hot:true, imgKey:'pokemon1' },
  { id:28, name:'Pokémon Prismatic Evolutions Elite Trainer Box', detail:'9 packs + accesorios premium · Eeveelutions 2025',            sport:'Pokémon',   kind:'box', txn:'buy', price:'$75',    sub:'$55 MSRP · 20 en stock',         brand:'The Pokémon Company',   badge:'Más vendido',   imgKey:'pokemon1' },
  // ── Cajas One Piece ──────────────────────────────────────────────────────
  { id:29, name:'One Piece TCG OP09 Booster Box (Emperors in the New World)', detail:'OP09 · Kaido, Big Mom, Shanks · Set más nuevo',   sport:'One Piece', kind:'box', txn:'buy', price:'$110',   sub:'$95 MSRP · 16 en stock',         brand:'Bandai',                badge:'Nuevo 2025',    imgKey:'onepiece1' },
  { id:30, name:'One Piece TCG OP06 Booster Box (Wings of the Captain)', detail:'Posibilidad del Luffy Manga Art Rare ($10k+ PSA 10)',  sport:'One Piece', kind:'box', txn:'buy', price:'$98',    sub:'$88 MSRP · 11 en stock',         brand:'Bandai',                                        imgKey:'onepiece1' },
  { id:31, name:'One Piece TCG OP01 Romance Dawn Box (English)', detail:'Sellado · +259% MSRP · Zoro Secret Rare OP01-001',            sport:'One Piece', kind:'box', txn:'buy', price:'$4,300', sub:'$1,200 MSRP original · 1 en stock', brand:'Bandai',              badge:'🏆 Grail Sealed', hot:true, imgKey:'onepiece1' },
  // ── Accesorios ───────────────────────────────────────────────────────────
  { id:32, name:'Penny Sleeves (100 pzs)',          detail:'Protección básica estándar · Compatible con Toploaders',          sport:'General', kind:'accessory', txn:'buy', price:'$4',  sub:'300 en stock', brand:'Ultra Pro',                          imgKey:'cards' },
  { id:33, name:'Toploaders Rígidos 3×4" (25 pzs)', detail:'Estándar industria para cartas raw antes de PSA/BGS',           sport:'General', kind:'accessory', txn:'buy', price:'$12', sub:'85 en stock',  brand:'BCW',                                imgKey:'cards' },
  { id:34, name:'One Touch Magnético 35pt',          detail:'Cierre magnético · Ideal para display de tus mejores cartas',  sport:'General', kind:'accessory', txn:'buy', price:'$8',  sub:'45 en stock',  brand:'Ultra Pro', badge:'Popular',          imgKey:'cards' },
  { id:35, name:'Binder 9 bolsillos 360 cartas',    detail:'Side-loading · Negro premium · El favorito del hobby',          sport:'General', kind:'accessory', txn:'buy', price:'$35', sub:'22 en stock',  brand:'Vault X',                            imgKey:'cards' },
  { id:36, name:'Kit de Gradeo PSA — Envío Express', detail:'Bolsas, separadores, instrucciones y manual para PSA/BGS',    sport:'General', kind:'accessory', txn:'buy', price:'$18', sub:'60 en stock',  brand:'PSA',       badge:'Nuevo',           imgKey:'cards' },
]
