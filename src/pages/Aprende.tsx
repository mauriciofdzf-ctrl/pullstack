import { useState } from 'react'

// ─── Calculadora de Grading ────────────────────────────────────────────────────
const CONDITIONS = [
  { value: 'gem',   label: 'Perfecta — Gem Mint',    desc: 'Sin defectos visibles. Esquinas afiladas, centrado perfecto.',
    p10: 0.60, p9: 0.30, p8: 0.10 },
  { value: 'nm',    label: 'Muy buena — Near Mint',  desc: 'Defectos mínimos, sólo visibles bajo lupa.',
    p10: 0.25, p9: 0.50, p8: 0.25 },
  { value: 'ex',    label: 'Buena — Excellent',       desc: 'Pequeños toques en esquinas o superficie.',
    p10: 0.05, p9: 0.30, p8: 0.65 },
  { value: 'vg',    label: 'Regular — Very Good',     desc: 'Desgaste notable, pliegues leves, bordes marcados.',
    p10: 0.00, p9: 0.10, p8: 0.90 },
]
const SERVICES = [
  { label: 'PSA Bulk',          cost: 17,  days: '45+ días hábiles',   company: 'PSA', maxVal: 499 },
  { label: 'PSA Value',         cost: 22,  days: '30 días hábiles',    company: 'PSA', maxVal: 499 },
  { label: 'PSA Value Plus',    cost: 45,  days: '20 días hábiles',    company: 'PSA', maxVal: 1499 },
  { label: 'PSA Standard',      cost: 65,  days: '10 días hábiles',    company: 'PSA', maxVal: 9999 },
  { label: 'PSA Express',       cost: 150, days: '5 días hábiles',     company: 'PSA', maxVal: 99999 },
  { label: 'BGS Speedy',        cost: 15,  days: '45+ días hábiles',   company: 'BGS', maxVal: 499 },
  { label: 'SGC Standard',      cost: 18,  days: '30 días hábiles',    company: 'SGC', maxVal: 999 },
]
const MULT: Record<string, { m10: number; m9: number; m8: number }> = {
  modern:  { m10: 4.5, m9: 2.0, m8: 1.2 },
  recent:  { m10: 3.5, m9: 1.8, m8: 1.1 },
  vintage: { m10: 8.0, m9: 3.0, m8: 1.5 },
}

function GradingCalc() {
  const [rawValue,   setRawValue]   = useState('')
  const [condition,  setCondition]  = useState('nm')
  const [serviceIdx, setServiceIdx] = useState(1)
  const [era,        setEra]        = useState('modern')
  const [result,     setResult]     = useState<null | { ev: number; cost: number; net: number; rec: string; probGrade: string }>(null)

  const calculate = () => {
    const raw = parseFloat(rawValue)
    if (!raw || raw <= 0) return
    const cond = CONDITIONS.find((c) => c.value === condition)!
    const svc  = SERVICES[serviceIdx]
    const mult = MULT[era]
    const shippingEst = 45 // USD: envío MX→USA + regreso

    const ev = cond.p10 * raw * mult.m10 + cond.p9 * raw * mult.m9 + cond.p8 * raw * mult.m8
    const cost = svc.cost + shippingEst
    const net = ev - raw - cost

    const probGrade =
      cond.p10 >= 0.5 ? 'PSA 10 probable' :
      cond.p10 >= 0.2 ? 'PSA 9 probable' :
      'PSA 8 o menos probable'

    const rec =
      net > raw * 0.3 ? 'Sí conviene gradear' :
      net > 0         ? 'Borderline — depende de tu tiempo' :
      'No conviene gradear'

    setResult({ ev, cost, net, rec, probGrade })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Inputs */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 space-y-5">
        <h3 className="text-white font-black text-lg">Datos de tu carta</h3>

        <div>
          <label className="block text-gray-400 text-sm font-medium mb-1.5">Valor raw estimado (USD)</label>
          <input type="number" value={rawValue} onChange={(e) => setRawValue(e.target.value)} placeholder="Ej: 120"
            className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-500/50 transition-colors" />
        </div>

        <div>
          <label className="block text-gray-400 text-sm font-medium mb-1.5">Condición percibida</label>
          <div className="space-y-2">
            {CONDITIONS.map((c) => (
              <button key={c.value} onClick={() => setCondition(c.value)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${condition === c.value ? 'border-amber-500/50 bg-amber-500/5 text-white' : 'border-white/10 bg-[#1a1a1a] text-gray-400 hover:border-amber-500/20'}`}>
                <span className="font-bold text-sm">{c.label}</span>
                <br />
                <span className="text-[11px] text-gray-600">{c.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-sm font-medium mb-1.5">Era de la carta</label>
          <div className="grid grid-cols-3 gap-2">
            {[{ v: 'modern', l: 'Moderna (2000+)' }, { v: 'recent', l: 'Reciente (2010+)' }, { v: 'vintage', l: 'Vintage (<1990)' }].map((e) => (
              <button key={e.v} onClick={() => setEra(e.v)}
                className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all text-center ${era === e.v ? 'border-amber-500/50 bg-amber-500/5 text-amber-400' : 'border-white/10 bg-[#1a1a1a] text-gray-500 hover:border-amber-500/20'}`}>
                {e.l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-sm font-medium mb-1.5">Servicio de grading</label>
          <select value={serviceIdx} onChange={(e) => setServiceIdx(parseInt(e.target.value))}
            className="w-full bg-[#1a1a1a] border border-white/10 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-500/50">
            {SERVICES.map((s, i) => (
              <option key={i} value={i}>{s.label} — ${s.cost} · {s.days}</option>
            ))}
          </select>
          <p className="text-gray-600 text-[10px] mt-1">+ ~$45 USD de envío round-trip desde México (estimado)</p>
        </div>

        <button onClick={calculate}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/20">
          Calcular
        </button>
      </div>

      {/* Output */}
      <div className="space-y-4">
        {!result ? (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="text-4xl">🔢</div>
            <p className="text-gray-500 text-sm">Llena el formulario y presiona Calcular para ver si conviene gradear tu carta.</p>
          </div>
        ) : (
          <>
            {/* Recomendación */}
            <div className={`rounded-2xl p-5 border ${result.net > 0 && result.net > parseFloat(rawValue) * 0.3 ? 'bg-green-500/5 border-green-500/20' : result.net > 0 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
              <p className={`font-black text-xl mb-1 ${result.net > 0 && result.net > parseFloat(rawValue) * 0.3 ? 'text-green-400' : result.net > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                {result.net > parseFloat(rawValue) * 0.3 ? '✓' : result.net > 0 ? '⚠' : '✗'} {result.rec}
              </p>
              <p className="text-gray-500 text-sm">{result.probGrade}</p>
            </div>

            {/* Números */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-5 space-y-3">
              <h3 className="text-white font-black text-sm uppercase tracking-widest">Proyección financiera</h3>
              <div className="space-y-2.5 text-sm">
                {[
                  { label: 'Valor raw actual',        val: `$${parseFloat(rawValue).toLocaleString()}`,           cls: 'text-gray-300' },
                  { label: 'Valor esperado en grade', val: `$${result.ev.toLocaleString('en', { maximumFractionDigits: 0 })}`, cls: 'text-white font-bold' },
                  { label: 'Costo total (grading + envío)', val: `$${result.cost}`,                                cls: 'text-red-400' },
                  { label: 'Ganancia neta esperada',  val: `${result.net >= 0 ? '+' : ''}$${result.net.toLocaleString('en', { maximumFractionDigits: 0 })}`, cls: result.net >= 0 ? 'text-green-400 font-black text-lg' : 'text-red-400 font-black text-lg' },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between items-center">
                    <span className="text-gray-500">{r.label}</span>
                    <span className={r.cls}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grade breakdown */}
            <div className="bg-[#111] border border-white/5 rounded-2xl p-5">
              <h3 className="text-white font-black text-sm uppercase tracking-widest mb-3">Probabilidades de grade</h3>
              {[
                { g: 'PSA 10', p: CONDITIONS.find(c => c.value === condition)!.p10 },
                { g: 'PSA 9',  p: CONDITIONS.find(c => c.value === condition)!.p9 },
                { g: 'PSA 8',  p: CONDITIONS.find(c => c.value === condition)!.p8 },
              ].map(({ g, p }) => (
                <div key={g} className="mb-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span className="font-bold">{g}</span>
                    <span>{Math.round(p * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${p * 100}%` }} />
                  </div>
                </div>
              ))}
              <p className="text-gray-600 text-[10px] mt-3">Probabilidades son estimaciones basadas en condición percibida, no garantías.</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Contenido de tabs ──────────────────────────────────────────────────────────

const CARD_TYPES = [
  { icon: '🃏', name: 'Base Card',              en: 'Base',         desc: 'Carta estándar del set. Poco valor salvo que sea vintage, de un jugador top o esté en PSA 10 perfecto.' },
  { icon: '⭐', name: 'Rookie Card (RC)',         en: 'RC',           desc: 'Primera carta oficial de un novato. El driver más especulativo: si el jugador se vuelve estrella, sube mucho.' },
  { icon: '🌱', name: 'Prospect Card',           en: 'Prospect',     desc: 'Sale antes del debut oficial. En béisbol, la Bowman Chrome 1st es clave. Alto riesgo: muchos prospectos no llegan a MLB.' },
  { icon: '✍️', name: 'Autógrafo (Auto)',         en: 'Auto',         desc: 'Carta firmada por el jugador. On-card auto (firma directa) vale más que sticker auto (etiqueta pegada).' },
  { icon: '👑', name: 'RPA — Rookie Patch Auto', en: 'RPA',          desc: 'Combinación de rookie + autógrafo + pieza de jersey/parche. La más premium en NBA y NFL.' },
  { icon: '🔢', name: 'Carta Numerada',          en: 'Numbered',     desc: 'Serial limitado: "/99" = 99 copias. Más escasez no garantiza más valor — necesita jugador y demanda.' },
  { icon: '🌈', name: 'Parallel',                en: 'Parallel',     desc: 'Versión alternativa con diferente color/acabado/rareza. Cada set tiene su jerarquía (Silver, Gold, Orange, Red…).' },
  { icon: '🌟', name: 'Superfractor 1/1',         en: 'Superfractor', desc: 'Una sola copia en el mundo. Unicidad máxima — combinada con jugador correcto puede valer millones.' },
  { icon: '💎', name: 'Insert',                  en: 'Insert',       desc: 'Diseño especial dentro del set. Algunos icónicos: Kaboom, Stained Glass, Manga Art, Color Blast.' },
  { icon: '🧵', name: 'Memorabilia / Relic',     en: 'Relic',        desc: 'Incluye pieza de jersey, bat o parche. Game-worn > player-worn > event-worn. Lee el reverso de la carta.' },
  { icon: '🔏', name: 'SSP / SP',               en: 'Short Print',  desc: 'No siempre numeradas pero de producción limitada. Su valor depende de qué tan reconocida sea su escasez.' },
  { icon: '🏆', name: 'Cut Autograph',           en: 'Cut Auto',     desc: 'Firma recortada de otro documento y montada en la carta. Usual en leyendas fallecidas o figuras históricas.' },
]

const GRADERS = [
  { name: 'PSA', color: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/20',
    pros: ['Mayor liquidez del mercado', 'PSA 10 vende más fácil', 'Pop Report público', '+80M objetos graduados'],
    cons: ['Precios más altos', 'Turnaround puede ser lento', 'Gem Rate muy exigente'],
    scale: '1–10 (Gem Mint = 10)' },
  { name: 'BGS', color: 'text-orange-400', bg: 'bg-orange-500/5 border-orange-500/20',
    pros: ['Subgrades (esquinas, bordes, centrado, superficie)', 'Black Label 9.5 muy deseado', 'Fuerte en cartas modernas con autos'],
    cons: ['Menos liquidez que PSA en muchos mercados', 'Black Label 10 casi imposible de obtener'],
    scale: '1–10 con subgrades (Black Label = 9.5 en 4 subgrades)' },
  { name: 'SGC', color: 'text-green-400', bg: 'bg-green-500/5 border-green-500/20',
    pros: ['Fuerte en vintage', 'Turnaround competitivo', 'Slab estético (negro)', 'Precio atractivo'],
    cons: ['Menor liquidez que PSA en modernas', 'Pop Report menos consultado'],
    scale: '1–10 (Gem Mint = 10)' },
  { name: 'CGC', color: 'text-purple-400', bg: 'bg-purple-500/5 border-purple-500/20',
    pros: ['Líder en TCG (Pokémon, One Piece)', 'Creciendo en sports', 'Tecnología moderna'],
    cons: ['Menor liquidez en cartas deportivas vs PSA/SGC'],
    scale: '1–10 (Pristine = 10)' },
]

const LATAM_TIPS = [
  { title: 'Los precios son en USD',      icon: '💵',
    body: 'Todo el mercado opera en dólares. Usa el tipo de cambio del día, no del banco: busca "USD MXN" en Google para el TC oficial. El toggle "Ver en MXN" del Explorador usa $17.50 como referencia.' },
  { title: 'Costo real puesto en México', icon: '📦',
    body: 'Precio + envío USA→MX ($15-$40) + impuestos de importación (~16-20% del valor declarado) + seguro. Una carta de $100 puede costar $140-$160 real en México. Siempre calcula antes de comprar.' },
  { title: 'Cómo enviar a PSA desde México', icon: '🏅',
    body: 'Busca un consolidador de PSA en México (hay varios en grupos de FB y Discord) o manda directo vía FedEx/DHL. Siempre con seguro, siempre con tracking. Empaca con penny sleeves + top loader + bubble wrap + caja rígida.' },
  { title: 'Dónde comprar con más confianza', icon: '🛡️',
    body: 'eBay con vendedor +500 feedback y política de devoluciones. Tiendas certificadas con reputación. PullStack para cartas verificadas. Grupos de FB solo con escrow o meetup en persona. Nunca transferencia directa a desconocidos.' },
  { title: 'Cómo vender desde México', icon: '💰',
    body: 'eBay tiene envío internacional desde México. Grupos de WhatsApp/FB con buenos precios pero menos protección. PullStack para ventas con escrow. Para cartas PSA de alto valor, Goldin o Heritage Auctions aceptan consignaciones internacionales.' },
  { title: 'El mercado de soccer en LATAM', icon: '⚽',
    body: 'Es la mayor oportunidad cultural. Mucha gente conoce las estampas Panini, pero no el grading, parallels o numbered cards. La educación es el diferencial. Cartas de Yamal, Vinicius, Messi y jugadores mexicanos tienen mercado local.' },
]

const VALUE_FACTORS = [
  { factor: 'El jugador', weight: '40%', icon: '⭐', desc: 'LeBron, Messi, Mahomes, Ohtani > cualquier carta rara de jugador sin mercado. El jugador es el driver principal.' },
  { factor: 'La carta correcta', weight: '20%', icon: '🃏', desc: 'Primera Bowman Chrome, Prizm Rookie, primera Topps. Hay cartas "canónicas" que el mercado siempre busca.' },
  { factor: 'Escasez real', weight: '15%', icon: '🔢', desc: 'No es solo numeración. Pop Report, gem rate, cuántas están en manos de coleccionistas activos.' },
  { factor: 'Condición', weight: '15%', icon: '🔬', desc: 'PSA 10 vs PSA 9 puede ser 2x-5x diferencia. Raw vs graded cambia completamente el mercado.' },
  { factor: 'Timing y narrativa', weight: '10%', icon: '⏰', desc: 'MVP, playoffs, récord, Hall of Fame, lesión. Comprar en el hype es el error más común.' },
]

type Tab = 'tipos' | 'grading' | 'calc' | 'latam' | 'valor'

export default function Aprende() {
  const [tab, setTab] = useState<Tab>('tipos')

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'tipos',   label: 'Tipos de Cartas',  icon: '🃏' },
    { id: 'grading', label: 'Grading',           icon: '🏅' },
    { id: 'calc',    label: 'Calculadora',       icon: '🔢' },
    { id: 'valor',   label: 'Valor',             icon: '📈' },
    { id: 'latam',   label: 'Guía LATAM',        icon: '🌎' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20 pb-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-1">PullStack</p>
          <h1 className="text-4xl font-black text-white mb-2">Aprende el Hobby</h1>
          <p className="text-gray-500 text-sm max-w-xl">
            Todo lo que necesitas saber para entender el mercado de trading cards, tomar mejores decisiones y construir una colección con estrategia.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-8 scrollbar-none">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shrink-0 ${tab === t.id ? 'bg-amber-500 text-black' : 'bg-[#111] border border-white/5 text-gray-400 hover:text-white hover:border-amber-500/20'}`}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Tipos de Cartas ── */}
        {tab === 'tipos' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CARD_TYPES.map((ct) => (
              <div key={ct.en} className="bg-[#111] border border-white/5 hover:border-amber-500/20 rounded-2xl p-5 transition-all hover:-translate-y-0.5">
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-2xl">{ct.icon}</span>
                  <div>
                    <h3 className="text-white font-black text-sm">{ct.name}</h3>
                    <span className="text-amber-500 text-[10px] font-bold uppercase tracking-widest">{ct.en}</span>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">{ct.desc}</p>
              </div>
            ))}

            {/* Parallels chart */}
            <div className="bg-[#111] border border-amber-500/20 rounded-2xl p-5 sm:col-span-2 lg:col-span-3">
              <h3 className="text-white font-black text-sm mb-4">Jerarquía de Parallels (ejemplo Topps/Panini Chrome)</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Base', clr: 'bg-gray-700 text-gray-300', print: 'Ilimitada' },
                  { label: 'Refractor', clr: 'bg-gray-600 text-white', print: '~500' },
                  { label: 'Silver', clr: 'bg-slate-500 text-white', print: '~199' },
                  { label: 'Blue', clr: 'bg-blue-600 text-white', print: '/150' },
                  { label: 'Gold', clr: 'bg-amber-500 text-black', print: '/50' },
                  { label: 'Orange', clr: 'bg-orange-500 text-black', print: '/25' },
                  { label: 'Red', clr: 'bg-red-600 text-white', print: '/5' },
                  { label: 'Superfractor', clr: 'bg-gradient-to-r from-amber-400 to-yellow-200 text-black font-black', print: '1/1' },
                ].map((p) => (
                  <div key={p.label} className="text-center">
                    <div className={`${p.clr} px-3 py-1.5 rounded-lg text-xs font-bold mb-1`}>{p.label}</div>
                    <div className="text-[10px] text-gray-600">{p.print}</div>
                  </div>
                ))}
              </div>
              <p className="text-gray-600 text-xs mt-3">Más escasez + jugador correcto + mercado activo = mayor valor potencial</p>
            </div>
          </div>
        )}

        {/* ── Tab: Grading ── */}
        {tab === 'grading' && (
          <div className="space-y-6">
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
              <h2 className="text-white font-black text-xl mb-2">¿Qué es el grading?</h2>
              <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
                Una empresa independiente evalúa la autenticidad y condición de la carta, le asigna un grado numérico (1–10) y la encapsula en un slab plástico con número de certificación único. Convierte una carta "de confianza" en un activo verificado, líquido y tradeable globalmente.
              </p>
            </div>

            <div>
              <h2 className="text-white font-black text-xl mb-4">Qué evalúan</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Centrado', desc: 'Qué tan centrada está la imagen respecto al borde. Se mide en ratio.' },
                  { label: 'Esquinas', desc: 'Nítidas y sin desgaste. Las esquinas son lo más difícil de proteger.' },
                  { label: 'Bordes', desc: 'Sin rayones, raspaduras ni marcas de manejo.' },
                  { label: 'Superficie', desc: 'Sin rayaduras, scratches, manchas o marcas de impresión.' },
                ].map((e) => (
                  <div key={e.label} className="bg-[#111] border border-white/5 rounded-xl p-4">
                    <p className="text-amber-400 font-black text-sm mb-1">{e.label}</p>
                    <p className="text-gray-600 text-xs">{e.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-white font-black text-xl mb-4">Las 4 graderas principales</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {GRADERS.map((g) => (
                  <div key={g.name} className={`${g.bg} border rounded-2xl p-5`}>
                    <h3 className={`${g.color} font-black text-xl mb-0.5`}>{g.name}</h3>
                    <p className="text-gray-500 text-[10px] mb-3">{g.scale}</p>
                    <div className="space-y-1">
                      {g.pros.map((p) => <p key={p} className="text-gray-300 text-xs">✓ {p}</p>)}
                      {g.cons.map((c) => <p key={c} className="text-gray-600 text-xs">✕ {c}</p>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
              <h2 className="text-white font-black text-xl mb-4">Escala de grades PSA</h2>
              <div className="space-y-2">
                {[
                  { g: 10, label: 'Gem Mint', desc: 'Prácticamente perfecta. Esquinas afiladas, centrado ≤55/45, sin defectos.', clr: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
                  { g: 9,  label: 'Mint', desc: 'Excelente, con defectos mínimos sólo visibles bajo inspección cercana.', clr: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
                  { g: 8,  label: 'Near Mint-Mint', desc: 'Muy buena, con un pequeño defecto visible sin lupa.', clr: 'text-green-400 bg-green-500/10 border-green-500/20' },
                  { g: 7,  label: 'Near Mint', desc: 'Buena condición con ligero desgaste. Aún atractiva.', clr: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                  { g: 6,  label: 'Excellent-Mint', desc: 'Desgaste visible en esquinas y superficie. Centrado puede no ser ideal.', clr: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
                  { g: 5,  label: 'Excellent', desc: 'Mucho uso, doblez leve, pero no alterada ni marcada.', clr: 'text-gray-500 bg-gray-500/5 border-gray-600/20' },
                ].map(({ g, label, desc, clr }) => (
                  <div key={g} className={`flex items-start gap-3 p-3 rounded-xl border ${clr}`}>
                    <span className="font-black text-2xl w-8 text-center shrink-0">{g}</span>
                    <div>
                      <p className="font-bold text-sm">{label}</p>
                      <p className="text-gray-500 text-xs">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Calculadora ── */}
        {tab === 'calc' && (
          <div>
            <div className="mb-6">
              <h2 className="text-white font-black text-2xl mb-2">¿Me conviene gradear?</h2>
              <p className="text-gray-500 text-sm">Ingresa los datos de tu carta y calcula si el grading tiene sentido financiero para ti.</p>
            </div>
            <GradingCalc />
            <div className="mt-6 bg-[#111] border border-white/5 rounded-2xl p-5">
              <h3 className="text-amber-400 font-black text-sm mb-2">⚠️ Nota importante</h3>
              <p className="text-gray-500 text-xs leading-relaxed">
                Los multiplicadores de valor son estimaciones basadas en datos históricos de mercado. Las probabilidades de grade son aproximaciones. El grading no garantiza el grado esperado. El valor real depende de demanda del jugador, liquidez del set y timing del mercado. Usa esta calculadora como guía orientativa, no como garantía.
              </p>
            </div>
          </div>
        )}

        {/* ── Tab: Valor ── */}
        {tab === 'valor' && (
          <div className="space-y-6">
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
              <h2 className="text-white font-black text-xl mb-2">La ecuación del valor</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                El valor de una carta no depende de un solo factor. Es la combinación de varios elementos simultáneamente. Entender esto es lo que separa a un coleccionista estratégico de uno que compra por hype.
              </p>
              <div className="mt-4 bg-[#1a1a1a] rounded-xl p-3 font-mono text-amber-400 text-sm">
                Valor = jugador + carta correcta + escasez + condición + marca + timing + liquidez + narrativa
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {VALUE_FACTORS.map((f) => (
                <div key={f.factor} className="bg-[#111] border border-white/5 rounded-2xl p-5 hover:border-amber-500/20 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{f.icon}</span>
                    <span className="text-amber-500 font-black text-sm">{f.weight}</span>
                  </div>
                  <h3 className="text-white font-black text-sm mb-1">{f.factor}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5">
                <h3 className="text-green-400 font-black text-sm mb-3">✓ Cuándo sube el valor</h3>
                <div className="space-y-1 text-xs text-gray-400">
                  {['MVP / Campeonato / Récord histórico', 'Playoff run inesperado', 'Hall of Fame inductión', 'Trade a mercado grande', 'Documental o hype mediático', 'Debut excepcional de novato', 'Lesión de competidores (sube el jugador sano)'].map(e => <p key={e}>↑ {e}</p>)}
                </div>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
                <h3 className="text-red-400 font-black text-sm mb-3">✗ Cuándo baja el valor</h3>
                <div className="space-y-1 text-xs text-gray-400">
                  {['Lesión grave / larga recuperación', 'Mal desempeño sostenido', 'Trade a mercado pequeño', 'Escándalo fuera de cancha', 'Overproduction del set', 'Comprar en el pico del hype', 'Prospecto que no consolida en mayores'].map(e => <p key={e}>↓ {e}</p>)}
                </div>
              </div>
            </div>

            <div className="bg-[#111] border border-amber-500/20 rounded-2xl p-6">
              <h3 className="text-amber-400 font-black text-lg mb-4">Las 8 reglas de oro</h3>
              <div className="space-y-3">
                {[
                  'La carta correcta importa más que la carta rara. Una /5 de un jugador sin demanda puede ser difícil de vender.',
                  'Raw y graded son mercados distintos. No compares una carta raw con un PSA 10.',
                  'El precio listado no es el valor. El valor se aproxima con ventas completadas reales.',
                  'La liquidez importa más de lo que parece. Una carta con muchas ventas recientes es más fácil de valorar.',
                  'Los rookies son apuestas, no certezas. El mercado de prospectos puede ser brutal.',
                  'El grading no arregla una mala carta. Solo amplifica el valor si ya hay demanda y buena condición.',
                  'Las licencias cambian el mercado. Topps/Fanatics tomando NBA/NFL puede redefinir qué sets se vuelven icónicos.',
                  'La confianza es el producto. El mayor riesgo en cartas es pagar de más, comprar falso o no poder vender.',
                ].map((rule, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-amber-500 font-black text-sm shrink-0 w-6">{i + 1}.</span>
                    <p className="text-gray-400 text-sm">{rule}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Guía LATAM ── */}
        {tab === 'latam' && (
          <div className="space-y-5">
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
              <h2 className="text-white font-black text-xl mb-2">🌎 Por qué LATAM es diferente</h2>
              <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
                El mercado de cartas está dominado por plataformas en inglés y precios en dólares. Para el coleccionista en México o LATAM hay barreras reales: importación, tipo de cambio, desconfianza, falta de comps locales y educación en español. PullStack existe para cambiar eso.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {LATAM_TIPS.map((tip) => (
                <div key={tip.title} className="bg-[#111] border border-white/5 rounded-2xl p-5 hover:border-amber-500/20 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{tip.icon}</span>
                    <h3 className="text-white font-black text-sm">{tip.title}</h3>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">{tip.body}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
              <h3 className="text-white font-black text-lg mb-4">Calculadora de Costo Real LATAM</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {[
                    { label: 'Precio de la carta (USD)', placeholder: 'Ej: 150', id: 'price' },
                    { label: 'Envío a México (USD)', placeholder: 'Ej: 25', id: 'shipping' },
                    { label: 'Tipo de cambio (MXN/USD)', placeholder: 'Ej: 17.50', id: 'rate' },
                  ].map((f) => (
                    <div key={f.id}>
                      <label className="block text-gray-400 text-xs font-medium mb-1">{f.label}</label>
                      <input type="number" id={f.id} placeholder={f.placeholder}
                        onChange={() => {
                          const price    = parseFloat((document.getElementById('price')   as HTMLInputElement)?.value || '0')
                          const shipping = parseFloat((document.getElementById('shipping') as HTMLInputElement)?.value || '0')
                          const rate     = parseFloat((document.getElementById('rate')    as HTMLInputElement)?.value || '17.5')
                          const tax      = (price + shipping) * 0.18
                          const totalUSD = price + shipping + tax
                          const totalMXN = totalUSD * rate
                          const el = document.getElementById('latam-result')
                          if (el) el.innerHTML = `
                            <div class="text-xs text-gray-500 space-y-1">
                              <div class="flex justify-between"><span>Precio base</span><span class="text-white">$${price.toFixed(0)} USD</span></div>
                              <div class="flex justify-between"><span>Envío</span><span class="text-white">$${shipping.toFixed(0)} USD</span></div>
                              <div class="flex justify-between"><span>Impuestos est. (18%)</span><span class="text-red-400">$${tax.toFixed(0)} USD</span></div>
                              <div class="flex justify-between border-t border-white/10 pt-2 mt-2"><span class="font-bold text-white">Total USD</span><span class="font-black text-amber-400">$${totalUSD.toFixed(0)} USD</span></div>
                              <div class="flex justify-between"><span class="font-bold text-white">Total MXN</span><span class="font-black text-amber-400">$${Math.round(totalMXN).toLocaleString()} MXN</span></div>
                            </div>`
                        }}
                        className="w-full bg-[#1a1a1a] border border-white/10 text-white placeholder-gray-600 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500/50" />
                    </div>
                  ))}
                </div>
                <div id="latam-result" className="bg-[#1a1a1a] border border-white/5 rounded-xl p-4 flex items-center justify-center">
                  <p className="text-gray-600 text-xs text-center">Ingresa datos para ver el costo real puesto en México</p>
                </div>
              </div>
              <p className="text-gray-600 text-[10px] mt-3">Impuestos estimados. El costo real puede variar según valor declarado, courier y aduanas. Solo orientativo.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
