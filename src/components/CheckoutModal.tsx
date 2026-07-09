import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { COMMISSION_PCT, type PaymentMethod } from '../lib/paymentConfig'

type UserListing = {
  id: number
  user_id: string
  display_name: string
  title: string
  price: string | null
  min_bid: string | null
  image_url: string | null
  txn_type: 'sale' | 'auction' | 'trade'
}

function parsePrice(raw: string | null): number {
  if (!raw) return 0
  return parseFloat(raw.replace(/[^0-9.]/g, '')) || 0
}

function formatMXN(n: number): string {
  return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function genRef(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

type Step = 'method' | 'payment' | 'done'

type PayCfg = {
  spei_banco: string; spei_clabe: string; spei_beneficiario: string
  mp_usuario: string; mp_link: string
  oxxo_link: string
  tarjeta_link: string
}

const STATIC_METHODS: { id: PaymentMethod; label: string; icon: string; detail: string }[] = [
  { id: 'spei',        label: 'SPEI / Transferencia',      icon: '🏦', detail: 'Transferencia bancaria inmediata' },
  { id: 'mercadopago', label: 'MercadoPago',               icon: '💳', detail: 'Tarjeta, saldo MP o cuotas' },
  { id: 'oxxo',        label: 'OXXO Pay',                  icon: '🏪', detail: 'Paga en efectivo en cualquier OXXO' },
  { id: 'tarjeta',     label: 'Tarjeta de crédito/débito', icon: '💰', detail: 'Visa, Mastercard, Amex' },
]

export default function CheckoutModal({ listing, user, profile, onClose }: {
  listing: UserListing
  user: { id: string }
  profile: { display_name?: string | null } | null
  onClose: () => void
}) {
  const navigate = useNavigate()
  const [step, setStep]             = useState<Step>('method')
  const [method, setMethod]         = useState<PaymentMethod | null>(null)
  const [ref]                       = useState(genRef)
  const [confirming, setConfirming] = useState(false)
  const [txnId, setTxnId]           = useState<number | null>(null)
  const [error, setError]           = useState('')
  const [payCfg, setPayCfg]         = useState<PayCfg | null>(null)

  useEffect(() => {
    supabase.from('settings').select('key, value').then(({ data }) => {
      if (data) {
        const m: Record<string, string> = {}
        data.forEach(r => { m[r.key] = r.value || '' })
        setPayCfg({
          spei_banco: m.spei_banco || '', spei_clabe: m.spei_clabe || '',
          spei_beneficiario: m.spei_beneficiario || 'PullStack',
          mp_usuario: m.mp_usuario || '', mp_link: m.mp_link || '',
          oxxo_link: m.oxxo_link || '',
          tarjeta_link: m.tarjeta_link || '',
        })
      }
    })
  }, [])

  const getInstructions = (m: PaymentMethod, total: string, r: string): string[] => {
    if (!payCfg) return []
    if (m === 'spei') return [
      `Banco: ${payCfg.spei_banco || '—'}`,
      `CLABE: ${payCfg.spei_clabe || '—'}`,
      `Beneficiario: ${payCfg.spei_beneficiario || 'PullStack'}`,
      `Monto exacto: ${total}`,
      `Concepto / Referencia: PS-${r}`,
    ]
    if (m === 'mercadopago') return [
      payCfg.mp_usuario ? `Envía el pago a: ${payCfg.mp_usuario}` : '',
      payCfg.mp_link    ? `O usa este link: ${payCfg.mp_link}` : '',
      `Monto: ${total}`,
      `Referencia en el mensaje: PS-${r}`,
    ].filter(Boolean)
    if (m === 'oxxo') return [
      payCfg.oxxo_link ? `Genera tu ficha en: ${payCfg.oxxo_link}` : '—',
      `Monto: ${total}`,
      `Referencia: PS-${r}`,
      `Válido por 72 horas`,
    ]
    if (m === 'tarjeta') return [
      payCfg.tarjeta_link ? `Link de pago seguro: ${payCfg.tarjeta_link}` : '—',
      `Monto: ${total}`,
      `Referencia: PS-${r}`,
    ]
    return []
  }

  const isMethodReady = (m: PaymentMethod): boolean => {
    if (!payCfg) return false
    if (m === 'spei')        return !!(payCfg.spei_banco && payCfg.spei_clabe)
    if (m === 'mercadopago') return !!(payCfg.mp_usuario || payCfg.mp_link)
    if (m === 'oxxo')        return !!payCfg.oxxo_link
    if (m === 'tarjeta')     return !!payCfg.tarjeta_link
    return false
  }

  const rawPrice  = listing.txn_type === 'auction' ? (listing.min_bid ?? listing.price) : listing.price
  const priceNum  = parsePrice(rawPrice)
  const commission = Math.round(priceNum * COMMISSION_PCT) / 100
  const total     = priceNum + commission

  const selectedMethod = STATIC_METHODS.find(m => m.id === method)

  const confirmPayment = async () => {
    if (!method) return
    setConfirming(true)
    setError('')

    const { data, error: dbErr } = await supabase.from('transactions').insert({
      buyer_id:        user.id,
      seller_id:       listing.user_id,
      listing_id:      listing.id,
      listing_title:   listing.title,
      sale_price:      rawPrice || '0',
      sale_price_num:  priceNum,
      commission_pct:  COMMISSION_PCT,
      commission_amt:  commission,
      total_paid:      total,
      payment_method:  method,
      payment_reference: ref,
      status:          'pending',
      buyer_name:      profile?.display_name || 'Usuario',
      seller_name:     listing.display_name,
    }).select('id').single()

    if (dbErr) {
      setError('Error al registrar. Intenta de nuevo.')
      setConfirming(false)
      return
    }

    await supabase.from('direct_messages').insert({
      from_user_id:  user.id,
      to_user_id:    listing.user_id,
      from_name:     profile?.display_name || 'Usuario',
      to_name:       listing.display_name,
      content:       `¡Hola! Realicé el pago por "${listing.title}" (${formatMXN(total)}) vía ${selectedMethod?.label}. Referencia: PS-${ref}. Quedo en espera de confirmación.`,
      listing_id:    listing.id,
      listing_title: listing.title,
      action_type:   'sale',
      read:          false,
    })

    setTxnId(data?.id ?? null)
    setConfirming(false)
    setStep('done')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md bg-[#1a1a36] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        {step !== 'done' && (
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">🛒 Checkout</p>
              <p className="text-white font-black text-base truncate max-w-[280px]">{listing.title}</p>
            </div>
            <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ── STEP 1: Selección de método ── */}
        {step === 'method' && (
          <div className="p-5 space-y-4">
            {/* Price breakdown */}
            <div className="bg-[#21213e] border border-white/5 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Precio del artículo</span>
                <span className="text-white font-bold">{rawPrice || '—'}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Comisión PullStack ({COMMISSION_PCT}%)</span>
                <span className="text-violet-400 font-bold">{formatMXN(commission)}</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between">
                <span className="text-white font-black">Total a pagar</span>
                <span className="text-white font-black text-lg">{formatMXN(total)}</span>
              </div>
            </div>

            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Elige método de pago</p>

            <div className="space-y-2">
              {STATIC_METHODS.map(m => {
                const ready = isMethodReady(m.id)
                return (
                  <button key={m.id} onClick={() => setMethod(m.id)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                      method === m.id
                        ? 'border-violet-500/60 bg-violet-500/10'
                        : 'border-white/5 bg-[#21213e] hover:border-white/15'
                    }`}>
                    <span className="text-2xl">{m.icon}</span>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm">{m.label}</p>
                      <p className="text-gray-500 text-[10px]">{m.detail}</p>
                    </div>
                    {!ready && (
                      <span className="text-[9px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full font-bold shrink-0">Próximamente</span>
                    )}
                    {method === m.id && (
                      <div className="w-4 h-4 rounded-full border-2 border-violet-500 bg-violet-500 flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <button onClick={() => method && setStep('payment')}
              disabled={!method}
              className="w-full py-3 rounded-xl text-white font-black text-sm bg-violet-600 hover:bg-violet-500 transition-all disabled:opacity-40">
              Continuar →
            </button>
          </div>
        )}

        {/* ── STEP 2: Instrucciones de pago ── */}
        {step === 'payment' && selectedMethod && (
          <div className="p-5 space-y-4">
            <button onClick={() => setStep('method')} className="flex items-center gap-1.5 text-gray-500 hover:text-white text-xs font-bold transition-colors mb-1">
              ← Cambiar método
            </button>

            <div className="flex items-center gap-3 bg-[#21213e] border border-white/5 rounded-xl p-3">
              <span className="text-2xl">{selectedMethod.icon}</span>
              <div>
                <p className="text-white font-black text-sm">{selectedMethod.label}</p>
                <p className="text-emerald-400 font-black text-lg">{formatMXN(total)}</p>
              </div>
            </div>

            {method && isMethodReady(method) ? (
              <div className="bg-[#21213e] border border-white/5 rounded-xl p-4 space-y-2.5">
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-3">Datos de pago</p>
                {getInstructions(method, formatMXN(total), ref).map((line, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-violet-400 font-black text-xs shrink-0 mt-0.5">{i + 1}.</span>
                    <p className="text-gray-300 text-sm font-mono break-all">{line}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
                <p className="text-yellow-400 font-black text-sm mb-1">Método en configuración</p>
                <p className="text-gray-400 text-xs">Este método estará disponible pronto. Elige otro por ahora.</p>
              </div>
            )}

            {method && isMethodReady(method) && (
              <>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300 flex gap-2">
                  <span className="shrink-0">ℹ️</span>
                  <span>Al confirmar, notificamos al vendedor y al equipo PullStack. Tu pago será verificado en máx. 24 hrs.</span>
                </div>

                {error && <p className="text-red-400 text-xs text-center">{error}</p>}

                <button onClick={confirmPayment} disabled={confirming}
                  className="w-full py-3 rounded-xl text-white font-black text-sm bg-emerald-600 hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {confirming && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  ✅ Ya realicé el pago — Confirmar
                </button>
              </>
            )}

            {method && !isMethodReady(method) && (
              <button onClick={() => setStep('method')}
                className="w-full py-3 rounded-xl text-white font-black text-sm bg-violet-600 hover:bg-violet-500 transition-all">
                ← Elegir otro método
              </button>
            )}
          </div>
        )}

        {/* ── STEP 3: Confirmado ── */}
        {step === 'done' && (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white font-black text-xl mb-2">¡Pago registrado!</p>
            <p className="text-gray-400 text-sm mb-1">Referencia: <span className="text-violet-400 font-black">PS-{ref}</span></p>
            {txnId && <p className="text-gray-600 text-xs mb-4">Orden #{txnId}</p>}
            <p className="text-gray-400 text-sm mb-6">El equipo de PullStack verificará tu pago en máx. 24 hrs y notificará al vendedor para coordinar el envío.</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 bg-white/5 border border-white/10 text-gray-300 font-bold py-2.5 rounded-xl text-sm hover:bg-white/10 transition-all">
                Cerrar
              </button>
              <button onClick={() => { onClose(); navigate('/messages') }}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-black py-2.5 rounded-xl text-sm transition-all">
                Ver mensajes →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
