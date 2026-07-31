import { useCallback, useEffect, useState } from 'react'
import MuxPlayer from '@mux/mux-player-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import StreamChat from '../components/StreamChat'
import StartStreamModal from '../components/StartStreamModal'
import ScheduleBreakModal from '../components/ScheduleBreakModal'

type LiveStreamRow = {
  id: number
  host_id: string
  host_display_name: string
  title: string
  sport: string
  status: 'scheduled' | 'live' | 'ended'
  mux_playback_id: string | null
  mux_asset_playback_id: string | null
  scheduled_at: string | null
  started_at: string | null
  ended_at: string | null
  created_at: string
  spot_mode: 'fixed' | 'raffle' | null
  randomizer_run_at: string | null
}

type BreakSpot = {
  id: number
  live_stream_id: number
  position: number
  label: string
  price: number
  status: 'available' | 'pending_payment' | 'sold'
  buyer_id: string | null
  assigned_team: string | null
}

const SPORT_BADGE: Record<string, string> = {
  NBA:     'bg-orange-500/20 text-orange-400 border-orange-500/30',
  NFL:     'bg-green-500/20  text-green-400  border-green-500/30',
  Soccer:  'bg-blue-500/20   text-blue-400   border-blue-500/30',
  MLB:     'bg-red-500/20    text-red-400    border-red-500/30',
  Pokémon: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
}

const HOW_IT_WORKS = [
  { icon: '📦', title: 'Caja real', desc: 'Compramos cajas selladas de distribuidores certificados' },
  { icon: '🎲', title: 'Randomizer', desc: 'Los spots se asignan al azar con herramienta verificable' },
  { icon: '📹', title: 'En vivo', desc: 'Abrimos en stream, todos ven cada carta al mismo tiempo' },
  { icon: '🚚', title: 'Envío', desc: 'Tu carta llega a tu puerta con seguro incluido' },
]

function formatDateTime(iso: string | null) {
  if (!iso) return 'Sin fecha'
  return new Date(iso).toLocaleString('es', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
}

function money(n: number) {
  return `$${n.toLocaleString('es-MX')}`
}

export default function Live() {
  const { user, canStream, isAdmin } = useAuth()

  const [current, setCurrent]   = useState<LiveStreamRow | null>(null)
  const [schedule, setSchedule] = useState<LiveStreamRow[]>([])
  const [past, setPast]         = useState<LiveStreamRow[]>([])
  const [spotsByStream, setSpotsByStream] = useState<Record<number, BreakSpot[]>>({})
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [goLiveFor, setGoLiveFor] = useState<LiveStreamRow | null>(null)
  const [playingPast, setPlayingPast] = useState<LiveStreamRow | null>(null)
  const [buyingSpotId, setBuyingSpotId] = useState<number | null>(null)
  const [runningRandomizer, setRunningRandomizer] = useState(false)

  const loadStreams = useCallback(async () => {
    const [{ data: liveData }, { data: schedData }, { data: pastData }] = await Promise.all([
      supabase.from('live_streams').select('*').eq('status', 'live').order('started_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('live_streams').select('*').eq('status', 'scheduled').order('scheduled_at', { ascending: true }),
      supabase.from('live_streams').select('*').eq('status', 'ended').not('mux_asset_playback_id', 'is', null).order('ended_at', { ascending: false }).limit(20),
    ])
    const live = (liveData as LiveStreamRow) ?? null
    const sched = (schedData as LiveStreamRow[]) || []
    const pastRows = (pastData as LiveStreamRow[]) || []
    setCurrent(live)
    setSchedule(sched)
    setPast(pastRows)

    const streamIds = [live?.id, ...sched.map(s => s.id)].filter((id): id is number => !!id)
    if (streamIds.length > 0) {
      const { data: spots } = await supabase.from('break_spots').select('*').in('live_stream_id', streamIds).order('position', { ascending: true })
      const grouped: Record<number, BreakSpot[]> = {}
      for (const s of (spots as BreakSpot[]) || []) {
        (grouped[s.live_stream_id] ||= []).push(s)
      }
      setSpotsByStream(grouped)
    } else {
      setSpotsByStream({})
    }
  }, [])

  useEffect(() => {
    loadStreams()
    const ch = supabase
      .channel('live-streams-page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_streams' }, () => loadStreams())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'break_spots' }, () => loadStreams())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [loadStreams])

  const handleEndStream = async () => {
    if (!current || !confirm('¿Terminar la transmisión?')) return
    await supabase.functions.invoke('end-stream', { body: { live_stream_id: current.id } })
  }

  const buySpot = async (spot: BreakSpot) => {
    if (!user) { window.location.href = '/login'; return }
    setBuyingSpotId(spot.id)
    const { data, error } = await supabase.functions.invoke('create-spot-checkout', { body: { spot_id: spot.id } })
    setBuyingSpotId(null)
    if (error || data?.error) {
      alert(data?.error || error?.message || 'Error al comprar el spot')
      loadStreams()
      return
    }
    window.location.href = data.checkout_url
  }

  const runRandomizer = async (streamId: number) => {
    if (!confirm('¿Correr el randomizer? Esto asigna los equipos y no se puede repetir.')) return
    setRunningRandomizer(true)
    const { error } = await supabase.rpc('run_break_randomizer', { p_live_stream_id: streamId })
    setRunningRandomizer(false)
    if (error) alert(error.message)
  }

  const renderSpotGrid = (stream: LiveStreamRow) => {
    const spots = spotsByStream[stream.id]
    if (!stream.spot_mode || !spots || spots.length === 0) return null
    const allSold = spots.every(s => s.status === 'sold')
    const canRunRandomizer = stream.spot_mode === 'raffle' && !stream.randomizer_run_at && allSold
      && stream.status === 'live' && (isAdmin || stream.host_id === user?.id)

    return (
      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wide">
            {stream.spot_mode === 'raffle' ? 'Spots (rifa)' : 'Equipos disponibles'}
          </p>
          {canRunRandomizer && (
            <button onClick={() => runRandomizer(stream.id)} disabled={runningRandomizer}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black transition-all">
              🎲 Correr randomizer
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {spots.map(s => {
            const sold = s.status === 'sold'
            const pending = s.status === 'pending_payment'
            const label = stream.spot_mode === 'raffle' && s.assigned_team ? `${s.label}: ${s.assigned_team}` : s.label
            return (
              <div key={s.id} className={`rounded-lg px-2.5 py-2 border text-xs ${sold ? 'bg-white/5 border-white/5 text-gray-600' : pending ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' : 'bg-[#26213d] border-white/10 text-gray-200'}`}>
                <p className="font-bold truncate">{label}</p>
                {sold ? (
                  <p className="text-[10px] mt-0.5">Vendido</p>
                ) : pending ? (
                  <p className="text-[10px] mt-0.5">Reservado</p>
                ) : (
                  <button onClick={() => buySpot(s)} disabled={buyingSpotId === s.id}
                    className="mt-1 w-full text-[10px] font-black bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black rounded px-2 py-1 transition-all">
                    {buyingSpotId === s.id ? '...' : `Comprar ${money(s.price)}`}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0c0a1e] pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2.5 h-2.5 rounded-full ${current ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`} />
              <span className={`font-bold text-sm uppercase tracking-wider ${current ? 'text-red-400' : 'text-gray-500'}`}>
                {current ? 'En vivo ahora' : 'Sin transmisión'}
              </span>
            </div>
            <h1 className="text-white text-3xl font-black mb-2">Breaks & Livestreams</h1>
            <p className="text-gray-400">Aperturas en vivo de cajas con odds transparentes. Cada break es grabado y publicado.</p>
          </div>
          {canStream && (
            <button onClick={() => setShowScheduleModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-black font-black px-4 py-2.5 rounded-xl text-sm transition-all shrink-0">
              + Programar break
            </button>
          )}
        </div>

        {/* Live stream player */}
        {current ? (
          <div className="grid lg:grid-cols-3 gap-6 mb-10 items-stretch">
            <div className="lg:col-span-2">
              <div className="bg-[#1c1835] border border-white/5 rounded-2xl overflow-hidden h-full flex flex-col">
                <div className="aspect-video bg-[#13102a] relative">
                  {current.mux_playback_id ? (
                    <MuxPlayer
                      streamType="live"
                      playbackId={current.mux_playback_id}
                      metadata={{ video_title: current.title, viewer_user_id: user?.id }}
                      autoPlay
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                      Esperando señal de video...
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 px-3 py-1 rounded-lg pointer-events-none">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-white font-black text-xs">LIVE</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-white font-bold truncate">{current.title}</h3>
                      <p className="text-gray-500 text-sm">{current.host_display_name} · PullStackMX Live</p>
                    </div>
                    {(isAdmin || current.host_id === user?.id) && (
                      <button onClick={handleEndStream}
                        className="bg-[#26213d] hover:bg-red-500/20 border border-red-500/30 text-red-400 font-black px-4 py-2 rounded-xl text-sm transition-all shrink-0">
                        Terminar
                      </button>
                    )}
                  </div>
                  {renderSpotGrid(current)}
                </div>
              </div>
            </div>
            <div className="h-[420px] lg:h-full">
              <StreamChat room={`live-${current.id}`} />
            </div>
          </div>
        ) : (
          <div className="bg-[#1c1835] border border-white/5 rounded-2xl overflow-hidden mb-10">
            <div className="aspect-video bg-[#13102a] flex items-center justify-center relative">
              <div className="text-center px-6">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📡</span>
                </div>
                <p className="text-white font-bold text-lg mb-1">No hay transmisión en este momento</p>
                <p className="text-gray-500 text-sm">Revisa los próximos breaks programados abajo</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-10">
          {/* Schedule */}
          <div className="lg:col-span-2">
            <h2 className="text-white font-bold text-lg mb-4">Próximos breaks</h2>
            {schedule.length === 0 ? (
              <div className="bg-[#1c1835] border border-white/5 rounded-2xl p-6 text-center text-gray-500 text-sm">
                No hay breaks programados todavía.
              </div>
            ) : (
              <div className="space-y-3">
                {schedule.map(ev => (
                  <div key={ev.id} className="bg-[#1c1835] border border-white/5 hover:border-white/10 rounded-2xl p-4 transition-all">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border shrink-0 ${SPORT_BADGE[ev.sport] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                        {ev.sport}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{ev.title}</p>
                        <p className="text-gray-600 text-xs">{formatDateTime(ev.scheduled_at)} · {ev.host_display_name}</p>
                      </div>
                      {ev.host_id === user?.id && (
                        <button onClick={() => setGoLiveFor(ev)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
                          🎥 Conectar OBS
                        </button>
                      )}
                    </div>
                    {renderSpotGrid(ev)}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 bg-[#1c1835] border border-white/5 rounded-2xl p-4 text-center">
              <p className="text-gray-500 text-sm mb-3">¿Quieres entrar a un break grupal?</p>
              <a href="/messages"
                className="inline-block bg-violet-600 hover:bg-violet-500 text-white font-black px-5 py-2.5 rounded-xl text-sm transition-all">
                Solicitar spot en grupo break
              </a>
            </div>
          </div>

          {/* Past breaks */}
          <div>
            <h2 className="text-white font-bold text-lg mb-4">Breaks anteriores</h2>
            {past.length === 0 ? (
              <div className="bg-[#1c1835] border border-white/5 rounded-2xl p-6 text-center text-gray-500 text-sm">
                Aún no hay grabaciones publicadas.
              </div>
            ) : (
              <div className="space-y-3">
                {past.map(p => (
                  <button key={p.id} onClick={() => setPlayingPast(p)}
                    className="w-full text-left bg-[#1c1835] border border-white/5 hover:border-violet-500/30 rounded-2xl p-4 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SPORT_BADGE[p.sport] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>{p.sport}</span>
                      <span className="text-gray-600 text-[10px]">{formatDateTime(p.ended_at)}</span>
                    </div>
                    <p className="text-white font-bold text-sm mb-1">{p.title}</p>
                    <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg px-2.5 py-1.5 text-violet-400 text-xs font-bold">
                      ▶ Ver grabación
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-[#1c1835] border border-white/5 rounded-2xl p-6">
          <h2 className="text-white font-bold text-lg mb-5 text-center">¿Cómo funcionan los breaks?</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            {HOW_IT_WORKS.map(h => (
              <div key={h.title} className="text-center">
                <div className="text-3xl mb-2">{h.icon}</div>
                <div className="text-white font-bold text-sm mb-1">{h.title}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{h.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showScheduleModal && (
        <ScheduleBreakModal onClose={() => setShowScheduleModal(false)} onCreated={loadStreams} />
      )}

      {goLiveFor && (
        <StartStreamModal
          onClose={() => setGoLiveFor(null)}
          onCreated={loadStreams}
          existingStreamId={goLiveFor.id}
          existingTitle={goLiveFor.title}
        />
      )}

      {playingPast && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPlayingPast(null)}>
          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold">{playingPast.title}</h3>
              <button onClick={() => setPlayingPast(null)} className="text-gray-400 hover:text-white text-sm font-bold">✕ Cerrar</button>
            </div>
            <div className="aspect-video bg-[#13102a] rounded-2xl overflow-hidden">
              <MuxPlayer
                streamType="on-demand"
                playbackId={playingPast.mux_asset_playback_id ?? undefined}
                metadata={{ video_title: playingPast.title }}
                autoPlay
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
