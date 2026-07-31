import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@17'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })
const cryptoProvider = Stripe.createSubtleCryptoProvider()

// Endpoint público que Stripe llama directo — sin JWT de Supabase, la
// autenticidad se verifica con la firma del header Stripe-Signature.
Deno.serve(async req => {
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      undefined,
      cryptoProvider,
    )
  } catch (err) {
    console.error('Firma de Stripe inválida:', err)
    return new Response('Invalid signature', { status: 401 })
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const spotId = session.metadata?.spot_id
    if (spotId) {
      await admin
        .from('break_spots')
        .update({ status: 'sold' })
        .eq('id', Number(spotId))
        .eq('status', 'pending_payment')
    }
  } else if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    const spotId = session.metadata?.spot_id
    if (spotId) {
      await admin
        .from('break_spots')
        .update({ status: 'available', buyer_id: null, reserved_at: null, stripe_checkout_session_id: null })
        .eq('id', Number(spotId))
        .eq('status', 'pending_payment')
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
})
