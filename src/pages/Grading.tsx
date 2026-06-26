import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const GRADERS = [
  { id: 'PSA',  name: 'PSA',          desc: 'Mayor liquidez global',        popular: true  },
  { id: 'BGS',  name: 'BGS (Beckett)', desc: 'Subgrades detallados',         popular: false },
  { id: 'SGC',  name: 'SGC',           desc: 'Rápido y económico',           popular: false },
  { id: 'CGC',  name: 'CGC',           desc: 'Especialista TCG (Pokémon)',   popular: false },
]

const SERVICES: Record<string, { name: string; price: string; days: string }[]> = {
  PSA: [
    { name: 'Bulk',    price: '$17 USD', days: '100+ días' },
    { name: 'Economy', price: '$50 USD', days: '60 días'   },
    { name: 'Regular', price: '$75 USD', days: '45 días'   },
    { name: 'Express', price: '$150 USD', days: '15 días'  },
  ],
  BGS: [
    { name: 'Speedy',   price: '$15 USD',  days: '60 días' },
    { name: 'Standard', price: '$25 USD',  days: '30 días' },
    { name: 'Express',  price: '$100 USD', days: '10 días' },
  ],
  SGC: [
    { name: 'Standard', price: '$18 USD', days: '45 días' },
    { name: 'Express',  price: '$50 USD', days: '15 días' },
  ],
  CGC: [
    { name: 'Standard', price: '$15 USD', days: '45 días' },
    { name: 'Express',  price: '$50 USD', days: '15 días' },
  ],
}

const CONDITIONS = ['Mint (M)', 'Near Mint (NM)', 'Excellent (EX)', 'Very Good (VG)', 'Poor (P)']

const STEPS = [
  { n: '1', label: 'Llenas el form', icon: '📋' },
  { n: '2', label: 'Nos envías la carta', icon: '📦' },
  { n: '3', label: 'La mandamos a gradear', icon: '🔬' },
  { n: '4', label: 'Te la regresamos', icon: '🏆' },
]

export default function Grading() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    player_name: '',
    card_year: '',
    brand: '',
    card_number: '',
    variation: '',
    raw_value: '',
    condition: 'Near Mint (NM)',
    grader: 'PSA',
    service_tier: 'Bulk',
    notes: '',
  })
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { navigate('/login', { state: { from: '/grading' } }); return }
    if (!form.player_name.trim()) { setError('El nombre del jugador/personaje es obligatorio.'); return }
    setLoading(true); setError('')
    const { error: err } = await supabase.from('grading_submissions').insert({
      user_id:      user.id,
      player_name:  form.player_name.trim(),
      card_year:    form.card_year  || null,
      brand:        form.brand      || null,
      card_number:  form.card_number || null,
      variation:    form.variation  || null,
      raw_value:    form.raw_value  ? parseFloat(form.raw_value) : null,
      condition:    form.condition,
      grader:       form.grader,
      service_tier: form.service_tier,
      notes:        form.notes || null,
    })
    setLoading(false)
    if (err) { setError('Error al enviar. Intenta de nuevo.'); return }
    setSuccess(true)
  }

  const selectedServices = SERVICES[form.grader] || []

  if (success) return (
    <div className="min-h-screen bg-[#06060f] pt-24 pb-16 px-4 flex items-center justify-center">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-white text-2xl font-black mb-3">¡Solicitud enviada!</h2>
        <p className="text-gray-400 mb-2">Te contactaremos en 24–48 horas por email con la dirección de envío y cotización final.</p>
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 my-6 text-left space-y-2 text-sm">
          <p className="text-violet-400 font-bold">¿Qué sigue?</p>
          <p className="text-gray-300">1. Recibes email con instrucciones y dirección.</p>
          <p className="text-gray-300">2. Empacas la carta con protección (sleeve + toploader).</p>
          <p className="text-gray-300">3. La envías a nosotros (~$5–15 MXN a CDMX).</p>
          <p className="text-gray-300">4. Nosotros la enviamos a {form.grader} internacionalmente.</p>
          <p className="text-gray-300">5. Al regresar, te la mandamos de vuelta con seguro.</p>
        </div>
        <p className="text-gray-500 text-xs mb-8">Costo de envío internacional aprox. <span className="text-violet-400 font-bold">$45 USD</span> round-trip desde México.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setSuccess(false); setForm({ player_name: '', card_year: '', brand: '', card_number: '', variation: '', raw_value: '', condition: 'Near Mint (NM)', grader: 'PSA', service_tier: 'Bulk', notes: '' }) }}
            className="bg-[#161628] border border-white/10 text-gray-300 font-bold px-5 py-2.5 rounded-xl text-sm transition-all hover:border-white/20">
            Nueva solicitud
          </button>
          <button onClick={() => navigate('/profile')}
            className="bg-violet-600 hover:bg-violet-500 text-white font-black px-5 py-2.5 rounded-xl text-sm transition-all">
            Ver mi perfil
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#06060f] pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
            Grading Concierge
          </div>
          <h1 className="text-white text-3xl font-black mb-2">Gradea tu carta desde México</h1>
          <p className="text-gray-400">Nos encargamos de todo el proceso de envío a PSA, BGS, SGC o CGC. Sin complicaciones con aduanas ni intermediarios.</p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-4 gap-2 mb-8">
          {STEPS.map(s => (
            <div key={s.n} className="bg-[#0e0e1e] border border-white/5 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1.5">{s.icon}</div>
              <div className="w-5 h-5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-400 font-black text-[10px] flex items-center justify-center mx-auto mb-1">{s.n}</div>
              <div className="text-gray-500 text-[10px] leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {!user && (
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <p className="text-amber-300 text-sm font-medium">Inicia sesión para enviar tu solicitud</p>
            <button onClick={() => navigate('/login', { state: { from: '/grading' } })}
              className="bg-violet-600 hover:bg-violet-500 text-white font-black px-4 py-2 rounded-xl text-sm transition-all shrink-0">
              Iniciar sesión
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Card info */}
          <div className="bg-[#0e0e1e] border border-white/5 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4">Información de la carta</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-gray-400 text-xs mb-1.5 block">Jugador / Personaje *</label>
                <input value={form.player_name} onChange={e => set('player_name', e.target.value)}
                  placeholder="Ej. LeBron James, Pikachu, Lionel Messi"
                  className="w-full bg-[#161628] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block">Año</label>
                <input value={form.card_year} onChange={e => set('card_year', e.target.value)}
                  placeholder="2003"
                  className="w-full bg-[#161628] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block">Marca / Set</label>
                <input value={form.brand} onChange={e => set('brand', e.target.value)}
                  placeholder="Topps Chrome, Prizm, Base Set..."
                  className="w-full bg-[#161628] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block">Número de carta</label>
                <input value={form.card_number} onChange={e => set('card_number', e.target.value)}
                  placeholder="#23"
                  className="w-full bg-[#161628] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block">Variante / Parallel</label>
                <input value={form.variation} onChange={e => set('variation', e.target.value)}
                  placeholder="Refractor, Silver /99, RC Auto..."
                  className="w-full bg-[#161628] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block">Valor estimado raw (USD)</label>
                <input value={form.raw_value} onChange={e => set('raw_value', e.target.value)}
                  placeholder="150" type="number" min="0"
                  className="w-full bg-[#161628] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-gray-400 text-xs mb-2 block">Condición percibida</label>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map(c => (
                    <button key={c} type="button" onClick={() => set('condition', c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${form.condition === c ? 'bg-violet-500/20 border-violet-500/40 text-violet-400' : 'bg-[#161628] border-white/10 text-gray-400 hover:border-white/20'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grader */}
          <div className="bg-[#0e0e1e] border border-white/5 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4">Gradería</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {GRADERS.map(g => (
                <button key={g.id} type="button"
                  onClick={() => { set('grader', g.id); set('service_tier', SERVICES[g.id][0].name) }}
                  className={`relative p-3 rounded-xl border text-left transition-all ${form.grader === g.id ? 'bg-violet-500/10 border-violet-500/40' : 'bg-[#161628] border-white/10 hover:border-white/20'}`}>
                  {g.popular && (
                    <div className="absolute -top-2 -right-2 bg-violet-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">Popular</div>
                  )}
                  <div className={`font-black text-sm mb-0.5 ${form.grader === g.id ? 'text-violet-400' : 'text-white'}`}>{g.name}</div>
                  <div className="text-gray-500 text-[10px] leading-tight">{g.desc}</div>
                </button>
              ))}
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-2 block">Nivel de servicio</label>
              <div className="space-y-2">
                {selectedServices.map(s => (
                  <button key={s.name} type="button" onClick={() => set('service_tier', s.name)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${form.service_tier === s.name ? 'bg-violet-500/10 border-violet-500/40' : 'bg-[#161628] border-white/10 hover:border-white/20'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${form.service_tier === s.name ? 'bg-violet-600 border-violet-500' : 'border-gray-600'}`} />
                      <span className={`text-sm font-bold ${form.service_tier === s.name ? 'text-violet-400' : 'text-white'}`}>{s.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-white text-sm font-bold">{s.price}</span>
                      <span className="text-gray-500 text-xs ml-2">{s.days}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-[#0e0e1e] border border-white/5 rounded-2xl p-6">
            <label className="text-white font-bold text-sm mb-3 block">Notas adicionales</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="¿Algo que debamos saber? Estado específico de la carta, urgencia, instrucciones especiales..."
              rows={3}
              className="w-full bg-[#161628] border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/50 resize-none transition-colors" />
          </div>

          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-sm text-blue-300">
            <strong className="text-blue-200">Sobre los costos:</strong> Precio del servicio de grading + ~$45 USD de envío round-trip desde México. Te enviamos cotización exacta antes de proceder. Sin pagos anticipados.
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-black font-black py-4 rounded-2xl transition-all text-lg">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Enviando...
              </span>
            ) : user ? 'Enviar solicitud de grading' : 'Inicia sesión para continuar'}
          </button>
        </form>
      </div>
    </div>
  )
}
