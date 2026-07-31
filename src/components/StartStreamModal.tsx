import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const SPORTS = ['NBA', 'NFL', 'Soccer', 'MLB', 'Pokémon', 'One Piece', 'General']

type CreateStreamResult = {
  live_stream_id: number
  rtmp_url: string
  stream_key: string
  playback_id: string | null
  reused: boolean
}

type Props = {
  onClose: () => void
  onCreated: () => void
  // Si vienen, es un break ya programado — se saltan el formulario y solo se
  // piden las credenciales para esa fila existente.
  existingStreamId?: number
  existingTitle?: string
}

export default function StartStreamModal({ onClose, onCreated, existingStreamId, existingTitle }: Props) {
  const [title, setTitle]   = useState('')
  const [sport, setSport]   = useState('NBA')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [result, setResult] = useState<CreateStreamResult | null>(null)

  const handleCreate = async (titleOverride?: string) => {
    if (!existingStreamId && !titleOverride && !title.trim()) { setError('Ponle un título a tu transmisión'); return }
    setLoading(true)
    setError('')
    const { data, error: fnError } = await supabase.functions.invoke('create-stream', {
      body: existingStreamId
        ? { live_stream_id: existingStreamId }
        : { title: (titleOverride ?? title).trim(), sport },
    })
    setLoading(false)
    if (fnError || data?.error) {
      setError(data?.error || fnError?.message || 'Error creando la transmisión')
      return
    }
    setResult(data as CreateStreamResult)
    onCreated()
  }

  useEffect(() => {
    if (existingStreamId) handleCreate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingStreamId])

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1c1835] border border-white/10 rounded-2xl max-w-md w-full p-6">
        {existingStreamId && !result ? (
          <div className="py-8 text-center">
            {error ? (
              <>
                <p className="text-red-400 text-sm mb-4">{error}</p>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-sm font-bold">Cerrar</button>
              </>
            ) : (
              <p className="text-gray-400 text-sm">Obteniendo tus credenciales de OBS{existingTitle ? ` para "${existingTitle}"` : ''}...</p>
            )}
          </div>
        ) : !result ? (
          <>
            <h2 className="text-white font-black text-xl mb-1">Iniciar transmisión</h2>
            <p className="text-gray-500 text-sm mb-5">Configura tu break antes de conectar OBS.</p>

            <label className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-1.5 block">Título</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Topps Chrome NBA 2024-25 x3"
              className="w-full bg-[#26213d] border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm mb-4 focus:outline-none focus:border-violet-500/50" />

            <label className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-1.5 block">Deporte</label>
            <select value={sport} onChange={e => setSport(e.target.value)}
              className="w-full bg-[#26213d] border border-white/10 text-white rounded-xl px-3.5 py-2.5 text-sm mb-5 focus:outline-none focus:border-violet-500/50">
              {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {error && <p className="text-red-400 text-xs mb-4">{error}</p>}

            <div className="flex gap-3">
              <button onClick={onClose}
                className="flex-1 border border-white/10 text-gray-400 hover:text-white font-bold rounded-xl py-2.5 text-sm transition-all">
                Cancelar
              </button>
              <button onClick={() => handleCreate()} disabled={loading}
                className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-black rounded-xl py-2.5 text-sm transition-all">
                {loading ? 'Creando...' : 'Crear transmisión'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-white font-black text-xl mb-1">Conecta OBS</h2>
            <p className="text-gray-500 text-sm mb-5">
              Tu transmisión aparecerá como "en vivo" en PullStack en cuanto OBS empiece a enviar la señal.
            </p>

            {result.reused && (
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg px-3.5 py-3 text-violet-300 text-xs leading-relaxed mb-4">
                Esta es tu misma URL y clave de siempre — si ya las tienes guardadas en OBS, no necesitas volver a pegarlas: solo abre OBS y dale "Iniciar transmisión".
              </div>
            )}

            <div className="space-y-3 mb-5">
              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wide mb-1">Servidor (URL RTMP)</p>
                <p className="bg-[#26213d] border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono break-all">{result.rtmp_url}</p>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wide mb-1">Clave de transmisión (stream key)</p>
                <p className="bg-[#26213d] border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono break-all">{result.stream_key}</p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3.5 py-3 text-amber-300 text-xs leading-relaxed mb-5">
              {result.reused
                ? 'Esta URL y clave son permanentes: guárdalas en OBS una sola vez y reutilízalas en cada break.'
                : 'En OBS: Configuración → Emisión → Servicio: Personalizado → pega el servidor y la clave de arriba → Iniciar transmisión. Guárdalas — son permanentes, no cambian en tu próximo break.'}
            </div>

            <button onClick={onClose}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black rounded-xl py-2.5 text-sm transition-all">
              Listo
            </button>
          </>
        )}
      </div>
    </div>
  )
}
