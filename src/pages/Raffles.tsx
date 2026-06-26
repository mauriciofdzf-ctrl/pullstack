import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type Raffle = {
  id: number
  title: string
  sport: string
  prize: string
  price_per_ticket: number
  max_tickets: number
  sold_tickets: number
  ends_at: string
  image: string
  highlight: string
}

const RAFFLES: Raffle[] = [
  {
    id: 1,
    title:             'Wembanyama RC PSA 10',
    sport:             'NBA',
    prize:             'Victor Wembanyama 2023-24 Topps Chrome Prizm RC — PSA 10',
    price_per_ticket:  5,
    max_tickets:       100,
    sold_tickets:      67,
    ends_at:           new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    image:             'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&q=90&auto=format',
    highlight:         'Valor estimado $800 USD',
  },
  {
    id: 2,
    title:             'Messi Topps Chrome Auto /50',
    sport:             'Soccer',
    prize:             'Lionel Messi 2022 Topps Chrome Autógrafo On-Card /50',
    price_per_ticket:  10,
    max_tickets:       50,
    sold_tickets:      23,
    ends_at:           new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    image:             'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&q=90&auto=format',
    highlight:         'Firmado en carta · /50',
  },
  {
    id: 3,
    title:             'Pikachu Illustration Rare PSA 9',
    sport:             'Pokémon',
    prize:             'Pikachu with Grey Felt Hat 151 Illustration Rare — PSA 9',
    price_per_ticket:  3,
    max_tickets:       200,
    sold_tickets:      145,
    ends_at:           new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
    image:             'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=600&q=90&auto=format',
    highlight:         'Slabbed PSA 9',
  },
  {
    id: 4,
    title:             'Patrick Mahomes RPA /25',
    sport:             'NFL',
    prize:             'Patrick Mahomes 2017 Panini National Treasures RPA /25',
    price_per_ticket:  25,
    max_tickets:       30,
    sold_tickets:      8,
    ends_at:           new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    image:             'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600&q=90&auto=format',
    highlight:         'Valor ~$3,500 USD',
  },
]

function useCountdown(endsAt: string) {
  const [text, setText] = useState('')
  useEffect(() => {
    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now()
      if (diff <= 0) { setText('Terminada'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setText(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAt])
  return text
}

function RaffleCard({ raffle, onEnter, entered, loading }: {
  raffle: Raffle
  onEnter: () => void
  entered: boolean
  loading: boolean
}) {
  const countdown = useCountdown(raffle.ends_at)
  const pct = Math.min(100, Math.round((raffle.sold_tickets / raffle.max_tickets) * 100))
  const isUrgent = new Date(raffle.ends_at).getTime() - Date.now() < 24 * 60 * 60 * 1000

  return (
    <div className="bg-[#0e0e1e] border border-white/5 hover:border-violet-500/20 rounded-2xl overflow-hidden transition-all group">
      <div className="aspect-video overflow-hidden relative">
        <img src={raffle.image} alt={raffle.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/20 to-transparent" />
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur text-white text-xs font-bold px-2.5 py-1 rounded-lg">
          {raffle.sport}
        </div>
        <div className={`absolute top-3 right-3 flex items-center gap-1.5 backdrop-blur px-2.5 py-1 rounded-lg ${isUrgent ? 'bg-red-500/80' : 'bg-black/70'}`}>
          {isUrgent && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
          <span className="text-white text-xs font-bold">{countdown}</span>
        </div>
        <div className="absolute bottom-3 left-3 bg-violet-600/90 text-white text-xs font-black px-2.5 py-1 rounded-lg">
          {raffle.highlight}
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-white font-black text-base mb-1">{raffle.title}</h3>
        <p className="text-gray-500 text-xs mb-4 leading-relaxed">{raffle.prize}</p>
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-500">{raffle.sold_tickets} / {raffle.max_tickets} boletos</span>
            <span className={`font-bold ${pct >= 80 ? 'text-red-400' : 'text-violet-400'}`}>{pct}% vendido</span>
          </div>
          <div className="w-full bg-[#161628] rounded-full h-1.5">
            <div className={`h-1.5 rounded-full transition-all ${pct >= 80 ? 'bg-red-500' : 'bg-violet-600'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-[10px]">Por boleto</p>
            <p className="text-violet-400 font-black text-xl">${raffle.price_per_ticket} <span className="text-sm">USD</span></p>
          </div>
          <button onClick={onEnter} disabled={entered || loading || countdown === 'Terminada'}
            className={`font-black px-5 py-2.5 rounded-xl text-sm transition-all ${
              entered
                ? 'bg-green-500/20 border border-green-500/30 text-green-400 cursor-default'
                : countdown === 'Terminada'
                ? 'bg-gray-500/20 border border-gray-500/20 text-gray-500 cursor-default'
                : loading
                ? 'bg-violet-500/50 text-black cursor-wait'
                : 'bg-violet-600 hover:bg-violet-500 text-white'
            }`}>
            {loading ? '...' : entered ? '✓ Inscrito' : countdown === 'Terminada' ? 'Terminada' : 'Participar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Raffles() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [enteredIds, setEnteredIds] = useState<Set<number>>(new Set())
  const [loadingId, setLoadingId]   = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('raffle_entries').select('raffle_id').eq('user_id', user.id)
      .then(({ data }) => { if (data) setEnteredIds(new Set(data.map(e => e.raffle_id))) })
  }, [user])

  const handleEnter = useCallback(async (raffle: Raffle) => {
    if (!user) { navigate('/login', { state: { from: '/raffles' } }); return }
    if (enteredIds.has(raffle.id)) return
    setLoadingId(raffle.id)
    const { error } = await supabase.from('raffle_entries').insert({
      user_id:     user.id,
      raffle_id:   raffle.id,
      raffle_name: raffle.title,
    })
    if (!error) setEnteredIds(prev => new Set([...prev, raffle.id]))
    setLoadingId(null)
  }, [user, navigate, enteredIds])

  return (
    <div className="min-h-screen bg-[#06060f] pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">

        <div className="mb-8">
          <h1 className="text-white text-3xl font-black mb-2">Rifas & Breaks</h1>
          <p className="text-gray-400">Gana cartas premium. Ganadores anunciados en vivo con randomizer verificable y grabado.</p>
        </div>

        {!user && (
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
            <p className="text-amber-300 text-sm font-medium">Inicia sesión para participar en rifas</p>
            <button onClick={() => navigate('/login')}
              className="bg-violet-600 hover:bg-violet-500 text-white font-black px-4 py-2 rounded-xl text-sm transition-all shrink-0">
              Iniciar sesión
            </button>
          </div>
        )}

        {user && enteredIds.size > 0 && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mb-6">
            <p className="text-green-400 text-sm font-bold">✓ Estás inscrito en {enteredIds.size} rifa{enteredIds.size > 1 ? 's' : ''}. El ganador se anunciará en live.</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-5 mb-8">
          {RAFFLES.map(r => (
            <RaffleCard
              key={r.id}
              raffle={r}
              onEnter={() => handleEnter(r)}
              entered={enteredIds.has(r.id)}
              loading={loadingId === r.id}
            />
          ))}
        </div>

        <div className="bg-[#0e0e1e] border border-white/5 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-white font-bold text-lg mb-1">¿Tienes una carta para rifar?</h3>
              <p className="text-gray-500 text-sm">Abrimos rifas a vendedores verificados. Comisión de solo 5%. Sin riesgo de no-shows.</p>
            </div>
            <a href="/messages"
              className="bg-[#161628] border border-white/10 hover:border-violet-500/30 text-gray-300 hover:text-violet-400 font-bold px-5 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap">
              Contactar para listar →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
