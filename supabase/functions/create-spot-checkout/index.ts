import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let spotId: number | null = null

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'No autorizado' }, 401)

    const { data: { user }, error: authError } = await admin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) return jsonResponse({ error: 'No autorizado' }, 401)

    const body = await req.json()
    spotId = body.spot_id
    if (!spotId) return jsonResponse({ error: 'Falta spot_id' }, 400)

    const { data: spot } = await admin.from('break_spots').select('*, live_streams(title, status)').eq('id', spotId).single()
    if (!spot) return jsonResponse({ error: 'Spot no encontrado' }, 404)
    if (spot.live_streams?.status === 'ended') return jsonResponse({ error: 'Este break ya terminó' }, 400)

    // Claim atómico: solo uno de dos compradores concurrentes se queda con la fila.
    const { data: claimed, error: claimError } = await admin
      .from('break_spots')
      .update({ status: 'pending_payment', buyer_id: user.id, reserved_at: new Date().toISOString() })
      .eq('id', spotId)
      .eq('status', 'available')
      .select()
      .single()

    if (claimError || !claimed) return jsonResponse({ error: 'Ese spot ya no está disponible' }, 409)

    const origin = req.headers.get('origin') || 'https://pullstack.vercel.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'mxn',
          unit_amount: Math.round(spot.price * 100),
          product_data: { name: `${spot.label} — ${spot.live_streams?.title ?? 'Break'}` },
        },
        quantity: 1,
      }],
      metadata: { spot_id: String(spotId), live_stream_id: String(spot.live_stream_id) },
      expires_at: Math.floor(Date.now() / 1000) + 1800,
      success_url: `${origin}/live?spot=success`,
      cancel_url: `${origin}/live?spot=cancelled`,
    })

    await admin.from('break_spots').update({ stripe_checkout_session_id: session.id }).eq('id', spotId)

    return jsonResponse({ checkout_url: session.url })
  } catch (err) {
    console.error(err)
    if (spotId) {
      await admin
        .from('break_spots')
        .update({ status: 'available', buyer_id: null, reserved_at: null })
        .eq('id', spotId)
        .eq('status', 'pending_payment')
    }
    return jsonResponse({ error: 'Error inesperado creando el checkout' }, 500)
  }
})
