import { useState } from 'react'
import { supabase } from '../lib/supabase'

const SPORTS = ['NBA', 'NFL', 'Soccer', 'MLB', 'Pokémon', 'One Piece', 'General']

type SpotMode = 'none' | 'fixed' | 'raffle'
type FixedSpot = { label: string; price: string }

export default function ScheduleBreakModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [sport, setSport] = useState('NBA')
  const [scheduledAt, setScheduledAt] = useState('')
  const [spotMode, setSpotMode] = useState<SpotMode>('none')

  const [fixedSpots, setFixedSpots] = useState<FixedSpot[]>([{ label: '', price: '' }])
  const [raffleCount, setRaffleCount] = useState('')
  const [rafflePrice, setRafflePrice] = useState('')
  const [raffleTeams, setRaffleTeams] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addFixedSpot = () => setFixedSpots(prev => [...prev, { label: '', price: '' }])
  const removeFixedSpot = (i: number) => setFixedSpots(prev => prev.filter((_, idx) => idx !== i))
  const updateFixedSpot = (i: number, field: keyof FixedSpot, value: string) =>
    setFixedSpots(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))

  const raffleTeamList = raffleTeams.split('\n').map(t => t.trim()).filter(Boolean)

  const handleSubmit = async () => {
    if (!title.trim()) { setError('Ponle un título al break'); return }

    const body: Record<string, unknown> = { title: title.trim(), sport, scheduled_at: scheduledAt || null }

    if (spotMode === 'fixed') {
      const spots = fixedSpots
        .filter(s => s.label.trim())
        .map(s => ({ label: s.label.trim(), price: Number(s.price) }))
      if (spots.length === 0) { setError('Agrega al menos un equipo con precio'); return }
      if (spots.some(s => !(s.price > 0))) { setError('Todos los equipos necesitan un precio válido'); return }
      body.spot_mode = 'fixed'
      body.spots = spots
    } else if (spotMode === 'raffle') {
      const count = Number(raffleCount)
      const price = Number(rafflePrice)
      if (!count || count < 1) { setError('Pon la cantidad de spots'); return }
      if (!price || price <= 0) { setError('Pon el precio por spot'); return }
      if (raffleTeamList.length !== count) {
        setError(`Escribiste ${raffleTeamList.length} equipos, pero configuraste ${count} spots — deben coincidir`)
        return
      }
      body.spot_mode = 'raffle'
      body.raffle_count = count
      body.raffle_price = price
      body.raffle_team_pool = raffleTeamList
    }

    setLoading(true)
    setError('')
    const { data, error: fnError } = await supabase.functions.invoke('create-break', { body })
    setLoading(false)

    if (fnError || data?.error) {
      setError(data?.error || fnError?.message || 'Error programando el break')
      return
    }
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1c1835] border border-white/10 rounded-2xl max-w-lg w-full p-6 my-8">
        <h2 className="text-white font-black text-xl mb-1">Programar break</h2>
        <p className="text-gray-500 text-sm mb-5">Anúncialo con tiempo — la gente recibe notificación al crearlo.</p>

        <label className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-1.5 block">Título</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Topps Chrome UEFA Champions League 2024-25"
          className="w-full bg-[#26213d] border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm mb-4 focus:outline-none focus:border-violet-500/50" />

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-1.5 block">Deporte</label>
            <select value={sport} onChange={e => setSport(e.target.value)}
              className="w-full bg-[#26213d] border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-violet-500/50">
              {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-1.5 block">Fecha y hora</label>
            <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
              className="w-full bg-[#26213d] border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-violet-500/50" />
          </div>
        </div>

        <label className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-1.5 block">Venta de spots</label>
        <div className="flex gap-2 mb-4">
          {([['none', 'Sin venta'], ['fixed', 'Precio fijo'], ['raffle', 'Rifa']] as [SpotMode, string][]).map(([mode, label]) => (
            <button key={mode} onClick={() => setSpotMode(mode)}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${spotMode === mode ? 'bg-violet-500/20 border-violet-500/40 text-violet-400' : 'bg-[#26213d] border-white/10 text-gray-400 hover:border-white/20'}`}>
              {label}
            </button>
          ))}
        </div>

        {spotMode === 'fixed' && (
          <div className="mb-4 space-y-2">
            {fixedSpots.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input value={s.label} onChange={e => updateFixedSpot(i, 'label', e.target.value)} placeholder="Equipo"
                  className="flex-1 bg-[#26213d] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50" />
                <input value={s.price} onChange={e => updateFixedSpot(i, 'price', e.target.value)} placeholder="Precio" type="number" min="0"
                  className="w-24 bg-[#26213d] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500/50" />
                {fixedSpots.length > 1 && (
                  <button onClick={() => removeFixedSpot(i)} className="text-gray-500 hover:text-red-400 px-2">✕</button>
                )}
              </div>
            ))}
            <button onClick={addFixedSpot} className="text-violet-400 text-xs font-bold hover:text-violet-300">+ Agregar equipo</button>
          </div>
        )}

        {spotMode === 'raffle' && (
          <div className="mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-1.5 block">Cantidad de spots</label>
                <input value={raffleCount} onChange={e => setRaffleCount(e.target.value)} type="number" min="1" placeholder="12"
                  className="w-full bg-[#26213d] border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-1.5 block">Precio por spot</label>
                <input value={rafflePrice} onChange={e => setRafflePrice(e.target.value)} type="number" min="0" placeholder="500"
                  className="w-full bg-[#26213d] border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-violet-500/50" />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-1.5 block">
                Equipos a rifar (uno por línea) — {raffleTeamList.length}/{raffleCount || '?'}
              </label>
              <textarea value={raffleTeams} onChange={e => setRaffleTeams(e.target.value)} rows={5} placeholder={'Real Madrid\nBayern Munich\nManchester City\n...'}
                className="w-full bg-[#26213d] border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 font-mono" />
            </div>
            <p className="text-gray-600 text-xs">El equipo asignado a cada comprador se revela en vivo durante el stream, no al momento de comprar.</p>
          </div>
        )}

        {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

        <div className="flex gap-3 mt-2">
          <button onClick={onClose}
            className="flex-1 border border-white/10 text-gray-400 hover:text-white font-bold rounded-xl py-2.5 text-sm transition-all">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black rounded-xl py-2.5 text-sm transition-all">
            {loading ? 'Programando...' : 'Programar break'}
          </button>
        </div>
      </div>
    </div>
  )
}
