import { useState, useRef, useEffect } from 'react'

// ─── Conocimiento del bot ─────────────────────────────────────────────────────
type BotRule = { keywords: string[]; response: string; chips?: string[] }

const BOT_RULES: BotRule[] = [
  // Saludos
  {
    keywords: ['hola', 'ola', 'hey', 'hi', 'buenos', 'buenas', 'saludos', 'qué tal'],
    response: '¡Hola! 👋 Soy **PullBot**, tu asistente de trading cards. Puedo ayudarte con precios, cómo comprar/vender, información sobre gradeo y lo más trending del hobby. ¿Qué necesitas?',
    chips: ['¿Qué está trending?', '¿Cómo funciona el gradeo?', '¿Cómo compro una carta?', '¿Qué es una RC?'],
  },
  // Trending / Inversión
  {
    keywords: ['trending', 'caliente', 'hot', 'invertir', 'inversion', 'inversión', 'vale la pena', 'subir', 'subido'],
    response: '🔥 **Lo más trending ahora mismo:**\n\n📈 **Cooper Flagg** (NBA/Mavericks) — RC Auto Topps Now, subió +210% desde el draft\n📈 **Lamine Yamal** (Soccer/Barcelona) — SuperFractor 1/1 llegó a $396,500\n📈 **Charizard 1st Ed PSA 10** — $550,000, +89% en 12 meses\n📈 **Luffy Manga Art Rare** (One Piece OP06) — PSA 10 a $10,500\n📈 **Jayden Daniels** (NFL/Commanders) — Prizm RC Auto +320%\n\n💡 Para inversión: busca RCs graduados (PSA 9-10) de jugadores en su primera temporada.',
    chips: ['¿Qué es PSA?', '¿Qué es RC?', 'Ver Marketplace', '¿Pokémon vale?'],
  },
  // PSA / Gradeo
  {
    keywords: ['psa', 'bgs', 'sgc', 'gradear', 'gradeo', 'grading', 'grado', 'calificar', 'clasificar'],
    response: '🏆 **Gradeo de cartas — lo básico:**\n\n**PSA** (Professional Sports Authenticator) — El estándar de oro. PSA 10 = Gem Mint. Multiplica el valor x3-x10 vs raw.\n**BGS** (Beckett) — Muy respetado, escala más granular (9.5 Pristine). Preferido para Pokémon.\n**SGC** — Más rápido y barato, buena opción para cartas modernas.\n\n📦 Para enviar a PSA: necesitas cuenta en psacard.com, bolsas especiales y el kit de envío (lo vendemos en la tienda).\n\n⏱️ Tiempos actuales: ~3-6 meses en nivel economía ($25/carta).',
    chips: ['¿Cuánto cuesta gradear?', '¿Vale la pena gradear?', '¿Qué es una PSA 10?'],
  },
  // Costo de gradear
  {
    keywords: ['cuánto cuesta gradear', 'precio gradear', 'costo gradear', 'caro gradear'],
    response: '💰 **Precios PSA (2025-2026):**\n\n• **Economy** — $25/carta (3-6 meses)\n• **Regular** — $50/carta (45 días)\n• **Express** — $150/carta (10 días)\n• **Super Express** — $600/carta (3 días)\n\n⚡ Regla general: solo gradea cartas que en PSA 10 valdrían más de 3x el costo del gradeo. Si la carta raw vale $20, no la grades a Economy.',
    chips: ['¿Qué es PSA 10?', '¿Qué cartas gradeables?', 'Ver accesorios'],
  },
  // RC / Rookie Card
  {
    keywords: ['rc', 'rookie', 'primera carta', 'novato'],
    response: '🌟 **¿Qué es una RC (Rookie Card)?**\n\nEs la primera carta oficial de un jugador en la liga profesional. Son las más valiosas porque capturan el inicio de la carrera.\n\n**Tipos de RC:**\n• **Base RC** — La más común, ideal para comenzar\n• **RC Auto** — Con autógrafo del jugador (/número de ejemplares)\n• **RC Prizm** — Edición especial refractora, muy buscada\n• **RC SuperFractor 1/1** — Solo existe una en el mundo 🏆\n\n💡 El precio de una RC depende del rendimiento futuro del jugador. Cooper Flagg y Cam Ward son los RCs más buscados del 2025.',
    chips: ['¿Cuál RC comprar?', 'Ver Marketplace', '¿Qué es un Refractor?'],
  },
  // Refractor / Prizm
  {
    keywords: ['refractor', 'prizm', 'chrome', 'holo', 'foil', 'paralelo'],
    response: '✨ **Variantes y paralelos:**\n\n• **Base** — La versión estándar\n• **Silver Prizm** — El paralelo más popular, acabado metálico plateado\n• **Refractor** — Brilla en diferentes ángulos de luz\n• **Holo** — Holográfico clásico (Pokémon/cartas antiguas)\n• **Gold /10** — Solo 10 copias existen\n• **Red /5** — 5 copias en todo el mundo\n• **SuperFractor 1/1** — ÚNICO en el mundo, el más valioso\n\nEn general: mientras menos copias existan (/número más pequeño), más valiosa es la carta.',
    chips: ['¿Qué /número es bueno?', '¿Qué es PSA?', 'Cartas NBA trending'],
  },
  // Comprar
  {
    keywords: ['comprar', 'adquirir', 'conseguir', 'cómo compro', 'como compro', 'quiero comprar'],
    response: '🛒 **¿Cómo comprar en PullStack?**\n\n1. **Busca** la carta o caja que quieres en el Explorador\n2. **Filtra** por deporte, tipo (carta/caja/accesorio) y modalidad\n3. **Elige** tu modalidad:\n   - 💚 **Venta directa** — Precio fijo, compra al instante\n   - 🔴 **Subasta** — Puja y gana el mejor postor\n   - 🔵 **Trading** — Intercambia carta por carta\n4. **Paga** con tarjeta, OXXO o transferencia (próximamente con Stripe)\n5. **Recibe** tu carta certificada y asegurada 📦\n\n¿Quieres saber más sobre alguna modalidad?',
    chips: ['¿Cómo funciona la subasta?', '¿Cómo funciona el trading?', 'Ver Explorador'],
  },
  // Subasta
  {
    keywords: ['subasta', 'pujar', 'bid', 'remate'],
    response: '🔴 **Subastas en PullStack:**\n\nLas subastas duran 24-72 horas. El proceso:\n\n1. Ve la carta en subasta y haz clic en **"Pujar"**\n2. Ingresa tu oferta (debe superar la puja actual)\n3. Si alguien supera tu oferta, te llegará una notificación\n4. Al finalizar el tiempo, el mayor postor gana\n5. Tienes 24h para completar el pago\n\n💡 Consejo: espera los últimos minutos para pujar (técnica del "sniping")',
    chips: ['¿Cómo funciona el trading?', '¿Cómo compro?', 'Ver subastas'],
  },
  // Trading / P2P
  {
    keywords: ['trading', 'tradear', 'intercambio', 'intercambiar', 'p2p', 'trueque', 'cambio'],
    response: '🔵 **Trading P2P en PullStack:**\n\nEl sistema de intercambio más avanzado de LATAM:\n\n1. **Propón un trade** — Ofreces tus cartas por las del otro usuario\n2. **Si hay diferencia de valor** — El sistema calcula quién paga la diferencia en efectivo\n3. **Ambos confirman** — El trade se activa solo si los dos aceptan\n4. **Envío seguro** — PullStack actúa de intermediario hasta que ambos reciben\n\n📊 Ejemplo: Tu Wemby PSA 10 ($8,400) por su Mahomes RC ($12,000) → Tú pagas $3,600 adicionales.',
    chips: ['¿Cómo compro?', '¿Cómo vendo?', 'Ver Explorador'],
  },
  // Vender
  {
    keywords: ['vender', 'venta', 'poner en venta', 'publicar', 'cómo vendo', 'como vendo'],
    response: '💰 **¿Cómo vender en PullStack?**\n\n1. **Crea tu cuenta** y verifica tu identidad\n2. **Fotografía tu carta** (4 ángulos + esquinas)\n3. **Publica** — elige precio fijo, subasta o trading\n4. **Cuando alguien compra** — PullStack te notifica\n5. **Envía la carta** en 48h con seguro\n6. **Cobras** cuando el comprador confirma recepción\n\n💳 Comisión: 5% del precio de venta (entre los más bajos de LATAM)\n\n📦 Tip: una carta graduada (PSA/BGS) se vende hasta 10x más rápido que raw.',
    chips: ['¿Cómo gradear?', '¿Cómo fotografiar mi carta?', '¿Cuánto vale mi carta?'],
  },
  // Cuánto vale mi carta
  {
    keywords: ['cuánto vale', 'valor de', 'precio de', 'cotización', 'cuanto cuesta', 'cuánto cuesta'],
    response: '📊 **Para saber el valor de tu carta:**\n\n🔎 **Referencias de precio en tiempo real:**\n• **eBay Sold Listings** — busca el nombre exacto + "PSA 10" y filtra por vendidos\n• **COMC.com** — precios de mercado secundario\n• **Goldin Auctions** — para cartas de alto valor ($1,000+)\n\n💡 **Factores que afectan el precio:**\n• Condición (raw vs graduada)\n• Print run (/número de copias)\n• Rendimiento actual del jugador\n• Demanda en LATAM vs USA\n\nSi me dices la carta específica, te puedo dar una referencia de precio.',
    chips: ['¿Qué es PSA?', '¿Vale la pena gradear?', 'Ver Marketplace'],
  },
  // Pokémon
  {
    keywords: ['pokemon', 'pokémon', 'pikachu', 'charizard', 'mewtwo', 'eevee', 'paldea', 'scarlet', 'violet', 'sv'],
    response: '🃏 **Pokémon TCG — Lo que necesitas saber (2025-2026):**\n\n**Set actual más hot:** Prismatic Evolutions (SV8.5) — Los Eeveelutions están disparados\n**Top cartas por precio:**\n• Pikachu Illustrator PSA 10 — $16,492,000 (Goldin, Feb 2026) 🏆\n• Charizard 1st Ed PSA 10 — $550,000\n• Mewtwo ex SAR (SV151) — $420\n\n**Para comenzar a coleccionar:**\nSV151 (japonés) es el mejor set para empezar — asequible, hermosas artes, alta demanda.\n\n**Regla de oro Pokémon:** Las cartas japonesas suelen ser más baratas raw pero se gradan mejor por su calidad de impresión.',
    chips: ['¿Qué set comprar?', 'Ver Pokémon en tienda', '¿Vale gradear Pokémon?'],
  },
  // One Piece
  {
    keywords: ['one piece', 'luffy', 'zoro', 'bandai', 'op01', 'op06', 'manga art', 'romance dawn'],
    response: '🏴‍☠️ **One Piece TCG — Guía rápida:**\n\nOne Piece es el **"Nuevo Big Three"** del TCG mundial junto con Pokémon y Magic.\n\n**Cartas más valiosas:**\n• Luffy Manga Art Rare (OP06) PSA 10 — $10,500\n• Zoro Secret Rare (OP01) PSA 9 — $2,100\n• OP01 caja sellada — $4,300 (+259% del MSRP)\n\n**Por qué está explotando:**\nLa serie cumplió 25 años en 2022. El anime tiene 1,000+ episodios. Base de fans ENORME en LATAM.\n\n**Tip:** Las Manga Art Rares son difíciles de gradear (PSA 10 muy rara) — si encuentras una en buenas condiciones, es valiosa.',
    chips: ['Ver One Piece en tienda', '¿Qué set de One Piece comprar?', 'Ver cartas One Piece'],
  },
  // NBA
  {
    keywords: ['nba', 'basquetbol', 'basquetball', 'basketball', 'topps', 'wembanyama', 'flagg', 'lebron'],
    response: '🏀 **NBA Trading Cards — 2025-2026:**\n\n⚠️ **Importante:** Topps reemplazó a Panini como licencia oficial NBA desde 2025-26.\n\n**Cartas más buscadas:**\n• Cooper Flagg RC Auto (Mavericks, #1 Pick) — $27,500\n• Victor Wembanyama Chrome Refractor — $8,400\n• LeBron James RC 2003 PSA 10 — $24,500\n• Caitlin Clark WNBA Auto /49 — $3,800\n\n**Para empezar:** Un Topps Chrome Basketball Hobby Box 2024-25 cuesta ~$210 y casi siempre tiene un RC Auto garantizado.',
    chips: ['Ver cajas NBA', 'Ver cartas NBA', '¿Qué es RC?'],
  },
  // NFL
  {
    keywords: ['nfl', 'americano', 'football', 'mahomes', 'daniels', 'cam ward', 'panini prizm'],
    response: '🏈 **NFL Trading Cards — 2025:**\n\nPanini sigue siendo la licencia oficial del NFL.\n\n**Rookies más calientes 2025:**\n• Cam Ward (Panthers, #1 Pick) — RC Auto ~$4,100\n• Jayden Daniels (Commanders) — Prizm RC Auto +320%\n• Mahomes RC 2017 Prizm PSA 10 — $12,000 (el clásico)\n\n**Cajas recomendadas:**\n• Panini Prizm NFL 2025 — $250 (los nuevos RCs)\n• Panini Prizm NFL 2024 — $280 (Daniels, Williams, Harrison Jr)',
    chips: ['Ver cajas NFL', 'Ver cartas NFL', '¿Qué es PSA?'],
  },
  // Soccer
  {
    keywords: ['soccer', 'futbol', 'fútbol', 'yamal', 'vinicius', 'messi', 'mbappé', 'topps ucl', 'world cup'],
    response: '⚽ **Soccer Cards — 2025-2026:**\n\nEl mercado de soccer explota en LATAM. Topps tiene las licencias UEFA y FIFA.\n\n**Top cartas:**\n• Lamine Yamal SuperFractor 1/1 — $396,500 (récord soccer)\n• Vinicius Jr. Panini Select PSA 9 — $2,800\n• Erling Haaland UCL Refractor /25 — $4,500\n\n**El set del año:**\n2026 Topps Chrome FIFA World Cup — Copa del Mundo en USA/Canadá/México. Ya disponible en preventa.\n\n💡 Las cartas de jugadores LATAM (Yamal, Vinicius, Lautaro, Álvarez) tienen demanda premium en nuestra región.',
    chips: ['Ver cajas Soccer', 'Ver cartas Soccer', 'World Cup 2026'],
  },
  // MLB
  {
    keywords: ['mlb', 'beisbol', 'béisbol', 'baseball', 'ohtani', 'bowman', 'roman anthony'],
    response: '⚾ **MLB Trading Cards — 2025:**\n\nTopps es la licencia oficial MLB (siempre lo ha sido).\n\n**Top cartas:**\n• Shohei Ohtani Bowman Chrome Auto 2018 PSA 10 — $9,200\n• Roman Anthony Topps Chrome RC Auto 2025 — $1,800\n\n**Para empezar:** Topps Chrome Baseball (~$195) es el mejor producto — RC Autos garantizados, refractors, y precios más accesibles que NBA/NFL.\n\n🌟 **Tip de experto:** Los Bowman Prospects son baratos ANTES de llegar a las ligas mayores. Roman Anthony y Jackson Holliday eran ~$5 raw antes del debut.',
    chips: ['Ver cajas MLB', 'Ver cartas MLB', '¿Qué es Bowman?'],
  },
  // Rifas / Breaks
  {
    keywords: ['rifa', 'break', 'grupo break', 'spot', 'rifas'],
    response: '🎲 **Rifas y Group Breaks en PullStack:**\n\n**Rifa normal:**\nCompras boletos → se sortea al azar → el ganador se lleva la carta. Desde $10 por boleto.\n\n**Group Break:**\nSe compra una caja entre varios. Cada participante elige un equipo, y las cartas de ese equipo son suyas. Ideal para abrir cajas caras entre amigos.\n\n📅 Tenemos breaks semanales cada viernes 9PM (horario CDMX).\n\n💡 Los group breaks son perfectos para coleccionistas de un solo equipo — en vez de gastar $290 en una caja entera, pagas $20-40 por las cartas de tu equipo.',
    chips: ['Ver rifas activas', '¿Cómo me uno a un break?', '¿Cuándo es el próximo?'],
  },
  // Pago / Stripe
  {
    keywords: ['pago', 'pagar', 'stripe', 'oxxo', 'transferencia', 'tarjeta', 'precio'],
    response: '💳 **Métodos de pago en PullStack:**\n\n• **Tarjeta de crédito/débito** — Visa, Mastercard, American Express (Stripe)\n• **OXXO Pay** — Paga en efectivo en cualquier OXXO\n• **Transferencia SPEI** — Para México\n• **Próximamente:** MercadoPago, PayPal\n\n🔒 Todos los pagos son procesados con Stripe — el estándar mundial en seguridad de pagos.\n\n📦 Para ventas internacionales (Argentina, Colombia, Chile): tarjeta o transferencia bancaria.',
    chips: ['¿Cómo compro?', '¿Cuánto cuesta el envío?', 'Ver Explorador'],
  },
  // Envío
  {
    keywords: ['envío', 'envio', 'enviar', 'llegada', 'paquete', 'seguro', 'días'],
    response: '📦 **Envíos PullStack:**\n\n**México:**\n• 3-5 días hábiles — $99 MXN\n• Express 1-2 días — $199 MXN\n• Sobre seguro con rastreo incluido\n\n**LATAM (Argentina, Colombia, Chile, Perú):**\n• 7-15 días hábiles — desde $12 USD\n• Asegurado hasta el valor declarado\n\n🛡️ **Seguro incluido:** Todas las cartas se envían en top-loader + sobre rígido. Si llega dañada, PullStack cubre el reembolso.\n\n📸 Fotografiamos cada envío antes de sellarlo como evidencia.',
    chips: ['¿Cómo compro?', '¿Cómo vendo?', '¿Métodos de pago?'],
  },
  // Comunidad / Grupos
  {
    keywords: ['comunidad', 'grupo', 'chat', 'amigos', 'mensajes', 'dm'],
    response: '💬 **Comunidad PullStack:**\n\n• **Grupos de interés** — Coleccionistas NBA, Soccer Cards LATAM, NFL Traders MX y más\n• **DMs** — Mensajes directos con otros coleccionistas\n• **Feed** — Comparte tus mejores pulls, colecciones y trades\n• **Live** — Aperturas en vivo con chat y subastas en tiempo real\n\n📲 Es como Instagram + WhatsApp para coleccionistas de cartas.\n\n🤝 Los mejores trades suelen surgir en los grupos — alguien tiene lo que tú quieres y viceversa.',
    chips: ['Ver Comunidad', 'Ver Mensajes', 'Ver Live'],
  },
  // Gracias / despedida
  {
    keywords: ['gracias', 'thanks', 'perfecto', 'excelente', 'listo', 'ok', 'ya entendí', 'bye', 'adios', 'adiós'],
    response: '¡Con gusto! 🙌 Recuerda que puedes explorar todo el catálogo en el **Explorador** y unirte a los grupos de la comunidad para consejos de coleccionistas expertos. ¡Buenas pulls! 🎴✨',
    chips: ['Ver Explorador', 'Ver Comunidad', '¿Algo más?'],
  },
]

const INITIAL_CHIPS = ['¿Qué está trending?', '¿Cómo compro una carta?', '¿Qué es PSA?', '¿Cómo funciona el trading?', '¿Mejor inversión ahora?']

function matchResponse(input: string): BotRule | null {
  const lower = input.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  for (const rule of BOT_RULES) {
    if (rule.keywords.some((k) => lower.includes(k.normalize('NFD').replace(/[̀-ͯ]/g, '')))) {
      return rule
    }
  }
  return null
}

type Message = { id: number; from: 'bot' | 'user'; text: string; chips?: string[] }

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ChatBot() {
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0, from: 'bot',
      text: '¡Hola! 👋 Soy **PullBot**, tu asistente de trading cards. Pregúntame sobre precios, gradeo, cómo comprar/vender o qué está trending. ¡Estoy para ayudarte!',
      chips: INITIAL_CHIPS,
    },
  ])
  const [input,   setInput]   = useState('')
  const [typing,  setTyping]  = useState(false)
  const [unread,  setUnread]  = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  useEffect(() => {
    if (!open) setUnread(0)
  }, [open])

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    const userMsg: Message = { id: Date.now(), from: 'user', text }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setTyping(true)

    setTimeout(() => {
      const rule = matchResponse(text)
      const botMsg: Message = {
        id: Date.now() + 1,
        from: 'bot',
        text: rule
          ? rule.response
          : '🤔 No encontré info específica sobre eso, pero puedo ayudarte con **precios de cartas**, **gradeo PSA/BGS**, **cómo comprar o vender**, y **qué está trending**. ¿Sobre cuál de estos temas tienes dudas?',
        chips: rule?.chips ?? INITIAL_CHIPS,
      }
      setTyping(false)
      setMessages((m) => [...m, botMsg])
      if (!open) setUnread((n) => n + 1)
    }, 700 + Math.random() * 500)
  }

  // Renderiza markdown básico (**bold**)
  const renderText = (text: string) =>
    text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.+?)\*\*/g)
      return (
        <span key={i} className="block">
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="font-bold">{p}</strong> : p)}
        </span>
      )
    })

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-violet-600 hover:bg-violet-500 text-white rounded-full shadow-[0_8px_30px_rgba(245,158,11,0.4)] flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        title="Abrir PullBot"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a2 2 0 012 2v1h2a3 3 0 013 3v7a3 3 0 01-3 3H8l-4 3v-3H4a3 3 0 01-3-3V8a3 3 0 013-3h2V4a2 2 0 012-2h4zM9 9a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2zm-3 4a3 3 0 01-2.83-2h5.66A3 3 0 0112 13z" />
          </svg>
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {/* Panel de chat */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[560px] flex flex-col bg-[#1c1835] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#13102a] border-b border-white/5">
            <div className="w-9 h-9 bg-violet-600 rounded-full flex items-center justify-center text-black shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a2 2 0 012 2v1h2a3 3 0 013 3v7a3 3 0 01-3 3H8l-4 3v-3H4a3 3 0 01-3-3V8a3 3 0 013-3h2V4a2 2 0 012-2h4zM9 9a1 1 0 100 2 1 1 0 000-2zm6 0a1 1 0 100 2 1 1 0 000-2zm-3 4a3 3 0 01-2.83-2h5.66A3 3 0 0112 13z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm">PullBot</p>
              <p className="text-green-400 text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                En línea · Experto en trading cards
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-gray-600 hover:text-gray-300 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-2 ${m.from === 'user' ? 'flex-row-reverse' : ''}`}>
                {m.from === 'bot' && (
                  <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-black shrink-0 mt-0.5">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2a2 2 0 012 2v1h2a3 3 0 013 3v7a3 3 0 01-3 3H8l-4 3v-3H4a3 3 0 01-3-3V8a3 3 0 013-3h2V4a2 2 0 012-2h4z" />
                    </svg>
                  </div>
                )}
                <div className={`flex flex-col gap-2 max-w-[85%] ${m.from === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed ${m.from === 'user' ? 'bg-violet-600 text-white font-medium rounded-br-sm' : 'bg-[#26213d] border border-white/5 text-gray-200 rounded-bl-sm'}`}>
                    {renderText(m.text)}
                  </div>
                  {m.chips && m.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.chips.map((c) => (
                        <button
                          key={c}
                          onClick={() => sendMessage(c)}
                          className="bg-[#26213d] hover:bg-violet-500/10 border border-white/10 hover:border-violet-500/40 text-gray-400 hover:text-violet-400 text-[11px] px-2.5 py-1 rounded-full transition-all"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="flex gap-2">
                <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-black shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a2 2 0 012 2v1h2a3 3 0 013 3v7a3 3 0 01-3 3H8l-4 3v-3H4a3 3 0 01-3-3V8a3 3 0 013-3h2V4a2 2 0 012-2h4z" />
                  </svg>
                </div>
                <div className="bg-[#26213d] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-white/5 bg-[#13102a]">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                placeholder="Pregunta sobre precios, gradeo, cómo comprar..."
                className="flex-1 bg-[#1c1835] border border-white/10 text-white placeholder-gray-700 px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-violet-500/40"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-30 text-black p-2.5 rounded-xl transition-all shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
