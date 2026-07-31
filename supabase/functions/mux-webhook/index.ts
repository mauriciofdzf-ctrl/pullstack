import { createClient } from 'npm:@supabase/supabase-js@2'

// Endpoint público que Mux llama directo — sin JWT de Supabase, la autenticidad
// se verifica con la firma HMAC del header Mux-Signature.
const MUX_WEBHOOK_SECRET = Deno.env.get('MUX_WEBHOOK_SECRET')!

async function verifyMuxSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  if (!signatureHeader) return false
  const parts = Object.fromEntries(signatureHeader.split(',').map(p => p.split('=') as [string, string]))
  const timestamp = parts['t']
  const expectedHash = parts['v1']
  if (!timestamp || !expectedHash) return false

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(MUX_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signatureBytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${rawBody}`))
  const computedHash = Array.from(new Uint8Array(signatureBytes)).map(b => b.toString(16).padStart(2, '0')).join('')
  return computedHash === expectedHash
}

Deno.serve(async req => {
  const rawBody = await req.text()
  const valid = await verifyMuxSignature(rawBody, req.headers.get('mux-signature'))
  if (!valid) return new Response('Invalid signature', { status: 401 })

  const event = JSON.parse(rawBody)
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // El mismo mux_live_stream_id se reutiliza en muchas filas de live_streams
  // (una por cada break del host), así que cada evento debe apuntar a la
  // sesión correcta, no actualizar todas las filas históricas con ese id.
  switch (event.type) {
    case 'video.live_stream.active': {
      const { data: scheduled } = await admin
        .from('live_streams')
        .select('id')
        .eq('mux_live_stream_id', event.data.id)
        .eq('status', 'scheduled')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (scheduled) {
        await admin
          .from('live_streams')
          .update({ status: 'live', started_at: new Date().toISOString() })
          .eq('id', scheduled.id)
      } else {
        // El host conectó OBS sin anunciar un break desde la app primero —
        // creamos la sesión sobre la marcha con un título genérico.
        const { data: host } = await admin
          .from('host_streams')
          .select('host_id, mux_playback_id')
          .eq('mux_live_stream_id', event.data.id)
          .maybeSingle()
        if (host) {
          const { data: profile } = await admin
            .from('profiles')
            .select('display_name')
            .eq('id', host.host_id)
            .single()
          await admin.from('live_streams').insert({
            host_id: host.host_id,
            host_display_name: profile?.display_name || 'Host',
            title: 'Transmisión en vivo',
            sport: 'General',
            status: 'live',
            mux_live_stream_id: event.data.id,
            mux_playback_id: host.mux_playback_id,
            started_at: new Date().toISOString(),
          })
        }
      }
      break
    }
    case 'video.live_stream.idle': {
      await admin
        .from('live_streams')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('mux_live_stream_id', event.data.id)
        .eq('status', 'live')
      break
    }
    case 'video.asset.ready': {
      const liveStreamMuxId = event.data.live_stream_id
      if (liveStreamMuxId) {
        const { data: ended } = await admin
          .from('live_streams')
          .select('id')
          .eq('mux_live_stream_id', liveStreamMuxId)
          .eq('status', 'ended')
          .is('mux_asset_playback_id', null)
          .order('ended_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (ended) {
          await admin
            .from('live_streams')
            .update({
              mux_asset_id: event.data.id,
              mux_asset_playback_id: event.data.playback_ids?.[0]?.id ?? null,
            })
            .eq('id', ended.id)
        }
      }
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
})
