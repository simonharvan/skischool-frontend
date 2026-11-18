import type {
  AccBooking,
  AccBookingPayload,
  AccCurrentQuote,
  AccQuote,
  Paginated,
  PaymentMethod,
} from '@/types/accommodation'
import http from './http'

export interface BookingResponse {
  data: AccBooking
  current_quote?: AccCurrentQuote
}

export interface BookingFilters {
  from?: string
  to?: string
  unit_id?: number
  status?: string
  source?: string
  payment?: 'unpaid' | 'partial' | 'paid' | 'open'
  q?: string
  page?: number
  per_page?: number
}

export const getBookings = (params: BookingFilters) => http.get<Paginated<AccBooking>>('/bookings', { params })
export const getBooking = (id: number) => http.get<BookingResponse>(`/bookings/${id}`)
export const createBooking = (payload: AccBookingPayload) => http.post<BookingResponse>('/bookings', payload)
export const updateBooking = (id: number, payload: Partial<AccBookingPayload>) =>
  http.put<BookingResponse>(`/bookings/${id}`, payload)

export const bookingAction = (id: number, action: 'confirm' | 'cancel' | 'check-in' | 'check-out' | 'reprice') =>
  http.post<BookingResponse>(`/bookings/${id}/${action}`)

export const addPayment = (
  id: number,
  payload: { amount: number; method: PaymentMethod; note?: string; adjustment?: { label: string; amount: number } },
) => http.post<BookingResponse>(`/bookings/${id}/payments`, payload)
/** The guest's bookings that still owe money (including this one if it does). */
export const preparePay = (id: number) => http.get<{ data: AccBooking[] }>(`/bookings/${id}/prepare-pay`).then((r) => r.data)
/** Pays the full outstanding balance of each booking. */
export const payBookings = (payload: { booking_ids: number[]; method: PaymentMethod; note?: string }) =>
  http.post<{ data: AccBooking[] }>('/bookings/pay', payload).then((r) => r.data)
export const deletePayment = (id: number) => http.delete<BookingResponse>(`/payments/${id}`)

export const addAdjustment = (id: number, payload: { label: string; amount: number }) =>
  http.post<BookingResponse>(`/bookings/${id}/adjustments`, payload)
export const deleteAdjustment = (id: number) => http.delete<BookingResponse>(`/adjustments/${id}`)

export const quote = (payload: {
  unit_id: number
  check_in_at: string
  check_out_at: string
  adults: number
  children: number
  extra_bed: boolean
  booking_id?: number
}) => http.post<AccQuote>('/quote', payload, { silent: true })
