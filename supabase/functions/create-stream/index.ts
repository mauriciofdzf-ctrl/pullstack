import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { muxFetch } from '../_shared/mux.ts'

// Crea un live stream en Mux + las filas correspondientes en Supabase.
// El caller debe ser admin o vendedor verificado — se verifica server-side,
// nunca confiando en el estado del cliente.
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
      return jsonResponse({ error: 'No tienes permiso para iniciar transmisiones' }, 403)
    }

    const { title, sport } = await req.json()
    if (!title || typeof title !== 'string') return jsonResponse({ error: 'Falta el título' }, 400)

    // Cada host reutiliza el mismo Live Stream de Mux (y su stream key) para
    // siempre — Mux recomienda esto explícitamente, y evita que OBS haya que
    // reconfigurarlo en cada break.
    let muxLiveStreamId: string
    let playbackId: string | null
    let streamKey: string
    let reused = false

    const { data: existing } = await admin
      .from('host_streams')
      .select('mux_live_stream_id, mux_playback_id')
      .eq('host_id', user.id)
      .maybeSingle()

    if (existing) {
      reused = true
      muxLiveStreamId = existing.mux_live_stream_id
      playbackId = existing.mux_playback_id
      const { data: keyRow } = await admin
        .from('host_stream_keys')
        .select('stream_key')
        .eq('host_id', user.id)
        .single()
      streamKey = keyRow?.stream_key ?? ''
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
      streamKey = stream.data.stream_key

      await admin.from('host_streams').insert({
        host_id: user.id,
        mux_live_stream_id: muxLiveStreamId,
        mux_playback_id: playbackId,
      })
      await admin.from('host_stream_keys').insert({
        host_id: user.id,
        stream_key: streamKey,
      })
    }

    const { data: row, error: insertError } = await admin
      .from('live_streams')
      .insert({
        host_id: user.id,
        host_display_name: profile.display_name || user.email?.split('@')[0] || 'Host',
        title,
        sport: sport || 'General',
        status: 'scheduled',
        mux_live_stream_id: muxLiveStreamId,
        mux_playback_id: playbackId,
      })
      .select()
      .single()

    if (insertError || !row) {
      console.error(insertError)
      return jsonResponse({ error: 'No se pudo crear la transmisión' }, 500)
    }

    return jsonResponse({
      live_stream_id: row.id,
      rtmp_url: 'rtmps://global-live.mux.com:443/app',
      stream_key: streamKey,
      playback_id: playbackId,
      reused,
    })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: 'Error inesperado creando la transmisión' }, 500)
  }
})
