import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import { muxFetch } from '../_shared/mux.ts'

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

    const { live_stream_id } = await req.json()
    const { data: stream } = await admin.from('live_streams').select('*').eq('id', live_stream_id).single()
    if (!stream) return jsonResponse({ error: 'Transmisión no encontrada' }, 404)

    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (stream.host_id !== user.id && profile?.role !== 'admin') {
      return jsonResponse({ error: 'No tienes permiso para terminar esta transmisión' }, 403)
    }

    if (stream.mux_live_stream_id) {
      try {
        await muxFetch(`/video/v1/live-streams/${stream.mux_live_stream_id}/complete`, { method: 'PUT' })
      } catch (err) {
        // El webhook 'idle' lo confirmará de cualquier forma; no bloquear al host por esto.
        console.error('Mux complete error (continuando):', err)
      }
    }

    await admin
      .from('live_streams')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', live_stream_id)

    return jsonResponse({ ok: true })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: 'Error inesperado terminando la transmisión' }, 500)
  }
})
