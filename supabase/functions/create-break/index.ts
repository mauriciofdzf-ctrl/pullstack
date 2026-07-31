import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { muxFetch } from '../_shared/mux.ts'

type SpotInput = { label: string; price: number }

// Programa un break (título, deporte, fecha) sin mostrar credenciales de OBS —
// eso es responsabilidad de create-stream, para el momento en que el host
// realmente vaya a transmitir. Reutiliza el Live Stream de Mux del host si ya
// existe (cero llamadas a Mux si no es su primer break).
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'No autorizado' }, 401)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authError } = await admin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) return jsonResponse({ error: 'No autorizado' }, 401)

    const { data: profile } = await admin
      .from('profiles')
      .select('role, is_verified_seller, display_name')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && !profile.is_verified_seller)) {
      return jsonResponse({ error: 'No tienes permiso para programar breaks' }, 403)
    }

    const body = await req.json()
    const title: string = body.title
    const sport: string = body.sport || 'General'
    const scheduledAt: string | null = body.scheduled_at || null
    const spotMode: 'fixed' | 'raffle' | null = body.spot_mode ?? null
    const spots: SpotInput[] | undefined = body.spots
    const raffleCount: number | undefined = body.raffle_count
    const rafflePrice: number | undefined = body.raffle_price
    const raffleTeamPool: string[] | undefined = body.raffle_team_pool

    if (!title || typeof title !== 'string') return jsonResponse({ error: 'Falta el título' }, 400)

    if (spotMode === 'fixed') {
      if (!Array.isArray(spots) || spots.length === 0) {
        return jsonResponse({ error: 'Agrega al menos un equipo con precio' }, 400)
      }
      if (spots.some(s => !s.label || !(s.price > 0))) {
        return jsonResponse({ error: 'Cada equipo necesita nombre y precio válido' }, 400)
      }
    } else if (spotMode === 'raffle') {
      if (!raffleCount || raffleCount < 1 || !rafflePrice || rafflePrice <= 0) {
        return jsonResponse({ error: 'Configura la cantidad de spots y el precio de la rifa' }, 400)
      }
      if (!Array.isArray(raffleTeamPool) || raffleTeamPool.length !== raffleCount) {
        return jsonResponse({ error: 'El número de equipos debe coincidir con la cantidad de spots' }, 400)
      }
    }

    // Reutiliza el Live Stream de Mux permanente del host (o lo crea si es el primero).
    let muxLiveStreamId: string
    let playbackId: string | null

    const { data: existing } = await admin
      .from('host_streams')
      .select('mux_live_stream_id, mux_playback_id')
      .eq('host_id', user.id)
      .maybeSingle()

    if (existing) {
      muxLiveStreamId = existing.mux_live_stream_id
      playbackId = existing.mux_playback_id
    } else {
      const stream = await muxFetch('/video/v1/live-streams', {
        method: 'POST',
        body: JSON.stringify({
          playback_policy: ['public'],
          new_asset_settings: { playback_policy: ['public'] },
        }),
      })
      muxLiveStreamId = stream.data.id
      playbackId = stream.data.playback_ids?.[0]?.id ?? null

      await admin.from('host_streams').insert({
        host_id: user.id,
        mux_live_stream_id: muxLiveStreamId,
        mux_playback_id: playbackId,
      })
      await admin.from('host_stream_keys').insert({
        host_id: user.id,
        stream_key: stream.data.stream_key,
      })
    }

    const { data: row, error: insertError } = await admin
      .from('live_streams')
      .insert({
        host_id: user.id,
        host_display_name: profile.display_name || user.email?.split('@')[0] || 'Host',
        title,
        sport,
        status: 'scheduled',
        scheduled_at: scheduledAt,
        mux_live_stream_id: muxLiveStreamId,
        mux_playback_id: playbackId,
        spot_mode: spotMode,
        spot_price: spotMode === 'raffle' ? rafflePrice : null,
        raffle_team_pool: spotMode === 'raffle' ? raffleTeamPool : null,
      })
      .select()
      .single()

    if (insertError || !row) {
      console.error(insertError)
      return jsonResponse({ error: 'No se pudo programar el break' }, 500)
    }

    if (spotMode === 'fixed' && spots) {
      await admin.from('break_spots').insert(
        spots.map((s, i) => ({
          live_stream_id: row.id,
          position: i,
          label: s.label,
          price: s.price,
        })),
      )
    } else if (spotMode === 'raffle' && raffleCount) {
      await admin.from('break_spots').insert(
        Array.from({ length: raffleCount }, (_, i) => ({
          live_stream_id: row.id,
          position: i,
          label: `Spot #${i + 1}`,
          price: rafflePrice,
        })),
      )
    }

    const { data: allUsers } = await admin.from('profiles').select('id')
    if (allUsers?.length) {
      await admin.from('notifications').insert(
        allUsers.map(u => ({ user_id: u.id, type: 'break_scheduled', live_stream_id: row.id })),
      )
    }

    return jsonResponse({ live_stream_id: row.id })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: 'Error inesperado programando el break' }, 500)
  }
})
