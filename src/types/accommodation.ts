export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled'
export type BookingSource = 'backoffice' | 'phone' | 'email' | 'web'
export type PaymentMethod = 'cash' | 'transfer' | 'card'

/** all datetimes are local "YYYY-MM-DDTHH:mm:ss" strings (Europe/Bratislava) */
export interface AccUnit {
  id: number
  name: string
  slug: string
  description: { sk?: string; en?: string } | null
  base_guests: number
  max_guests: number
  base_price: number
  extra_bed_price: number
  min_nights: number
  default_check_in_time: string
  default_check_out_time: string
  active: boolean
  sort: number
}

export interface AccRatePeriod {
  id: number
  unit_id: number | null
  name: string
  date_from: string
  date_to: string
  price_per_night: number
  min_nights: number | null
}

export interface AccGuest {
  id: number
  name: string
  email: string | null
  phone: string | null
  country: string | null
  note: string | null
  bookings_count?: number
  bookings?: AccBooking[]
}

export interface AccAdjustment {
  id: number
  label: string
  amount: number
  created_by_name: string | null
  created_at: string
}

export interface AccPayment {
  id: number
  amount: number
  method: PaymentMethod
  paid_at: string
  note: string | null
}

export interface AccBreakdownLine {
  date: string
  rate: number
  label: string | null
  extra_bed: number
}

export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

export interface AccBooking {
  id: number
  code: string
  status: BookingStatus
  source: BookingSource
  external_ref: string | null
  unit_id: number
  unit?: AccUnit
  guest_id: number
  guest?: AccGuest
  check_in_at: string
  check_out_at: string
  nights: number
  adults: number
  children: number
  extra_bed: boolean
  price_calculated: number
  price_breakdown: AccBreakdownLine[] | null
  price_total: number
  deposit_amount: number
  paid: number
  balance: number
  payment_status: PaymentStatus
  note: string | null
  internal_note: string | null
  adjustments?: AccAdjustment[]
  payments?: AccPayment[]
  confirmed_at: string | null
  cancelled_at: string | null
}

export interface AccBlock {
  id: number
  unit_id: number
  starts_at: string
  ends_at: string
  reason: string | null
}

export interface AccQuote {
  nights: number
  min_nights: number
  guests: number
  extra_bed: boolean
  accommodation_total: number
  extra_bed_total: number
  total: number
  breakdown: AccBreakdownLine[]
  violations: string[]
  available?: boolean
  conflict?: { type: 'booking' | 'block'; label: string } | null
}

export interface AccCurrentQuote {
  total: number
  breakdown: AccBreakdownLine[]
  violations: string[]
  differs: boolean
}

export interface AccBookingPayload {
  unit_id: number
  guest_id?: number | null
  guest?: { name: string; email?: string | null; phone?: string | null }
  check_in_at: string
  check_out_at: string
  adults: number
  children: number
  extra_bed: boolean
  source: BookingSource
  status?: 'pending' | 'confirmed'
  deposit_amount: number
  note?: string | null
  internal_note?: string | null
}

export interface AccStatsBrief {
  id: number
  code: string
  status: BookingStatus
  unit: string | null
  guest: string | null
  time: string
}

export interface AccStats {
  from: string
  to: string
  occupancy_percent: number
  booked_nights: number
  revenue: number
  paid: number
  unpaid_balance: number
  pending_count: number
  arrivals_today: AccStatsBrief[]
  departures_today: AccStatsBrief[]
}

export interface Paginated<T> {
  data: T[]
  meta: { current_page: number; per_page: number; total: number }
}
