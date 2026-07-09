export const COMMISSION_PCT = 8

export type PaymentMethod = 'spei' | 'mercadopago' | 'oxxo' | 'tarjeta'

export const PAYMENT_METHODS: {
  id: PaymentMethod
  label: string
  icon: string
  available: boolean
  instructions: (total: string, ref: string) => string[]
  detail: string
}[] = [
  {
    id: 'spei',
    label: 'SPEI / Transferencia',
    icon: '🏦',
    available: false, // cambiar a true cuando tengas los datos
    detail: 'Transferencia bancaria inmediata',
    instructions: (total, ref) => [
      `Banco: [PENDIENTE — agregar banco]`,
      `CLABE: [PENDIENTE — agregar CLABE]`,
      `Beneficiario: PullStack`,
      `Monto exacto: ${total}`,
      `Concepto / Referencia: PS-${ref}`,
    ],
  },
  {
    id: 'mercadopago',
    label: 'MercadoPago',
    icon: '💳',
    available: false,
    detail: 'Tarjeta, saldo MP o cuotas',
    instructions: (total, ref) => [
      `Link de pago: [PENDIENTE — agregar link de MP]`,
      `Monto: ${total}`,
      `Referencia: PS-${ref}`,
    ],
  },
  {
    id: 'oxxo',
    label: 'OXXO Pay',
    icon: '🏪',
    available: false,
    detail: 'Paga en efectivo en cualquier OXXO',
    instructions: (total, ref) => [
      `Link para generar ficha OXXO: [PENDIENTE — agregar link]`,
      `Monto: ${total}`,
      `Referencia: PS-${ref}`,
      `Válido 72 horas`,
    ],
  },
  {
    id: 'tarjeta',
    label: 'Tarjeta de crédito/débito',
    icon: '💰',
    available: false,
    detail: 'Visa, Mastercard, Amex',
    instructions: (total, ref) => [
      `Link de pago seguro: [PENDIENTE — agregar link de Stripe]`,
      `Monto: ${total}`,
      `Referencia: PS-${ref}`,
    ],
  },
]
