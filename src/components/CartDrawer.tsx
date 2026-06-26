import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export type CartEntry = {
  id: number
  name: string
  price: string
  kind: string
  txn: string
}

type Props = {
  items: CartEntry[]
  onClose: () => void
  onRemove: (id: number) => void
  onClear: () => void
}

const MEXICO_STATES = [
  'Ciudad de México','Jalisco','Nuevo León','Estado de México','Guanajuato',
  'Puebla','Veracruz','Yucatán','Sonora','Chihuahua','Otro (LATAM)',
]

function parseTotal(items: CartEntry[]): number {
  return items.reduce((sum, item) => {
    const n = parseFloat(item.price.replace(/[^0-9.]/g, ''))
    return sum + (isNaN(n) ? 0 : n)
  }, 0)
}

export default function CartDrawer({ items, onClose, onRemove, onClear }: Props) {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<'cart' | 'form' | 'success'>('cart')
  const [contactName, setContactName] = useState(profile?.display_name || '')
  const [phone, setPhone]             = useState('')
  const [address, setAddress]         = useState('')
  const [city, setCity]               = useState('')
  const [state, setState]             = useState('Ciudad de México')
  const [notes, setNotes]             = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [orderId, setOrderId]         = useState<number | null>(null)

  const total = parseTotal(items)

  const handleOrder = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    if (!contactName || !phone || !address || !city) {
      setError('Completa todos los campos obligatorios')
      return
    }
    setError('')
    setLoading(true)

    const { data, error: dbError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, kind: i.kind })),
        total: `$${total.toLocaleString()}`,
        contact_name: contactName,
        phone,
        address,
        city,
        state,
        notes,
        status: 'pending',
      })
      .select('id')
      .single()

    setLoading(false)
    if (dbError) {
      setError('Error al guardar el pedido. Intenta de nuevo.')
      return
    }
    setOrderId(data?.id ?? null)
    onClear()
    setStep('success')
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0e0e1e] border-l border-white/10 z-50 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-2">
            {step === 'form' && (
              <button onClick={() => setStep('cart')} className="text-gray-500 hover:text-white mr-1 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-white font-black text-lg">
              {step === 'cart' ? 'Tu carrito' : step === 'form' ? 'Datos de envío' : '¡Pedido confirmado!'}
            </h2>
            {step === 'cart' && items.length > 0 && (
              <span className="bg-violet-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{items.length}</span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── STEP: Carrito ── */}
        {step === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
                  <div className="text-6xl">🛒</div>
                  <p className="text-gray-400 font-bold text-lg">Tu carrito está vacío</p>
                  <p className="text-gray-600 text-sm">Agrega cartas, cajas o accesorios desde el Explorador</p>
                  <button onClick={onClose} className="bg-violet-600 hover:bg-violet-500 text-white font-black px-6 py-2.5 rounded-xl transition-all text-sm">
                    Explorar
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {items.map((item, i) => (
                    <div key={`${item.id}-${i}`} className="flex items-center gap-3 bg-[#161628] border border-white/5 rounded-xl p-3">
                      <div className="w-10 h-10 bg-[#222] rounded-lg flex items-center justify-center text-lg shrink-0">
                        {item.kind === 'box' ? '📦' : item.kind === 'accessory' ? '🛡️' : '🃏'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm leading-tight truncate">{item.name}</p>
                        <p className="text-violet-400 font-black text-sm">{item.price}</p>
                      </div>
                      <button onClick={() => onRemove(item.id)} className="text-gray-600 hover:text-red-400 transition-colors shrink-0 p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-white/5 p-5 space-y-4 shrink-0 bg-[#0d0d0d]">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Subtotal ({items.length} {items.length === 1 ? 'artículo' : 'artículos'})</span>
                  <span className="text-white font-black text-xl">${total.toLocaleString()}</span>
                </div>
                <p className="text-gray-600 text-xs">Envío calculado al confirmar dirección · Seguro incluido</p>
                <button
                  onClick={() => { if (!user) { navigate('/login'); onClose() } else setStep('form') }}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-violet-500/20 text-sm"
                >
                  {user ? 'Continuar con el pedido →' : 'Inicia sesión para continuar →'}
                </button>
                <button onClick={onClear} className="w-full text-gray-600 hover:text-red-400 text-xs font-bold transition-colors py-1">
                  Vaciar carrito
                </button>
              </div>
            )}
          </>
        )}

        {/* ── STEP: Formulario de envío ── */}
        {step === 'form' && (
          <form onSubmit={handleOrder} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {/* Resumen rápido */}
              <div className="bg-violet-600/5 border border-violet-500/20 rounded-xl p-3 flex justify-between items-center">
                <span className="text-gray-400 text-sm">{items.length} artículo{items.length !== 1 ? 's' : ''}</span>
                <span className="text-violet-400 font-black">${total.toLocaleString()}</span>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-1.5">Nombre completo *</label>
                <input value={contactName} onChange={(e) => setContactName(e.target.value)} required
                  placeholder="Tu nombre"
                  className="w-full bg-[#161628] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-violet-500/50" />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-1.5">Teléfono / WhatsApp *</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required
                  placeholder="+52 55 1234 5678"
                  className="w-full bg-[#161628] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-violet-500/50" />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-1.5">Dirección *</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} required
                  placeholder="Calle, número, colonia"
                  className="w-full bg-[#161628] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-violet-500/50" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-1.5">Ciudad *</label>
                  <input value={city} onChange={(e) => setCity(e.target.value)} required
                    placeholder="Ciudad"
                    className="w-full bg-[#161628] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-violet-500/50" />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm font-medium mb-1.5">Estado / País</label>
                  <select value={state} onChange={(e) => setState(e.target.value)}
                    className="w-full bg-[#161628] border border-white/10 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-violet-500/50">
                    {MEXICO_STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-1.5">Notas adicionales (opcional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  placeholder="Instrucciones de entrega, horario, etc."
                  className="w-full bg-[#161628] border border-white/10 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-violet-500/50 resize-none" />
              </div>

              <div className="bg-[#161628] border border-white/5 rounded-xl p-4 space-y-2 text-xs text-gray-500">
                <p className="text-white font-bold text-sm mb-2">💳 Pago</p>
                <p>Te contactaremos vía WhatsApp para coordinar el pago. Métodos disponibles:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Tarjeta (Stripe)', 'OXXO Pay', 'Transferencia SPEI', 'MercadoPago'].map((m) => (
                    <span key={m} className="bg-[#222] border border-white/10 text-gray-400 px-2 py-0.5 rounded-full text-[10px] font-bold">{m}</span>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
              )}
            </div>

            <div className="border-t border-white/5 p-5 shrink-0 bg-[#0d0d0d]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm">Total del pedido</span>
                <span className="text-white font-black text-xl">${total.toLocaleString()}</span>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-violet-500/20 disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
                {loading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
                Confirmar pedido
              </button>
            </div>
          </form>
        )}

        {/* ── STEP: Éxito ── */}
        {step === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-5">
            <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-5xl">
              🎉
            </div>
            <div>
              <h3 className="text-white font-black text-2xl mb-2">¡Pedido confirmado!</h3>
              {orderId && <p className="text-gray-500 text-xs mb-3">Pedido #{orderId}</p>}
              <p className="text-gray-400 text-sm leading-relaxed">
                Te contactaremos por WhatsApp en las próximas horas para coordinar el pago y confirmar el envío.
              </p>
            </div>
            <div className="bg-violet-600/5 border border-violet-500/20 rounded-xl p-4 w-full text-left space-y-1">
              <p className="text-violet-400 font-bold text-xs uppercase tracking-wide mb-2">Próximos pasos</p>
              {['Recibirás un WhatsApp de nuestro equipo', 'Seleccionas tu método de pago', 'Tu pedido se envía en 24-48h con seguro'].map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                  <span className="text-violet-400 font-black shrink-0">{i + 1}.</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
            <button onClick={onClose}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-3 rounded-xl transition-all text-sm">
              Listo
            </button>
          </div>
        )}
      </div>
    </>
  )
}
