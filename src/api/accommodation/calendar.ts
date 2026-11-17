import type { AccBlock, AccBooking, AccStats, AccUnit } from '@/types/accommodation'
import http from './http'

export const getCalendar = (from: string, to: string) =>
  http.get<{ units: AccUnit[]; bookings: AccBooking[]; blocks: AccBlock[] }>('/calendar', {
    params: { from, to },
  })

export const getAccStats = (params: { from?: string; to?: string; season?: number } = {}) =>
  http.get<AccStats>('/stats', { params })
