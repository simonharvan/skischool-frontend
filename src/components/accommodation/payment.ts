import type { PaymentStatus } from '@/types/accommodation'

export const PAYMENT_STATUSES: PaymentStatus[] = ['paid', 'partial', 'unpaid']

/** Glyph shown in the round payment badge on calendar bars. */
export const paymentIcon = (s: PaymentStatus) => ({ paid: '✓', partial: '½', unpaid: '€' })[s]

/** Element Plus tag type for a payment status. */
export const paymentTagType = (s: PaymentStatus) =>
  ({ paid: 'success', partial: 'warning', unpaid: 'danger' })[s] as 'success' | 'warning' | 'danger'
