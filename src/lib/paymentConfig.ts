export const COMMISSION_PCT = 5

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
    available: true,
    detail: 'Transferencia bancaria inmediata',
    instructions: (total, ref) => [
      `Banco: TU BANCO AQUÍ`,
      `CLABE: TU CLABE AQUÍ (18 dígitos)`,
      `Beneficiario: PullStack`,
      `Monto exacto: ${total}`,
      `Concepto / Referencia: PS-${ref}`,
    ],
  },
  {
    id: 'mercadopago',
    label: 'MercadoPago',
    icon: '💳',
    available: true,
    detail: 'Tarjeta, saldo MP o cuotas',
    instructions: (total, ref) => [
      `Envía el pago a: TU_USUARIO_MP`,
      `O usa este link: TU_LINK_DE_COBRO_MP`,
      `Monto: ${total}`,
      `Referencia en el mensaje: PS-${ref}`,
    ],
  },
  {
    id: 'oxxo',
    label: 'OXXO Pay',
    icon: '🏪',
    available: true,
    detail: 'Paga en efectivo en cualquier OXXO',
    instructions: (total, ref) => [
      `Genera tu ficha en: TU_LINK_OXXO_MP`,
      `Monto: ${total}`,
      `Referencia: PS-${ref}`,
      `Válido por 72 horas`,
      `Lleva la ficha o número de referencia al OXXO`,
    ],
  },
  {
    id: 'tarjeta',
    label: 'Tarjeta de crédito/débito',
    icon: '💰',
    available: true,
    detail: 'Visa, Mastercard, Amex',
    instructions: (total, ref) => [
      `Link de pago seguro: TU_LINK_STRIPE_O_MP`,
      `Monto: ${total}`,
      `Referencia: PS-${ref}`,
    ],
  },
]
