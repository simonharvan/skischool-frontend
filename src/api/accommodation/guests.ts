import type { AccGuest, Paginated } from '@/types/accommodation'
import http from './http'

export const getGuests = (params: { q?: string; page?: number; per_page?: number }) =>
  http.get<Paginated<AccGuest>>('/guests', { params })
export const getGuest = (id: number) => http.get<{ data: AccGuest }>(`/guests/${id}`).then((r) => r.data)
export const updateGuest = (id: number, g: Partial<AccGuest>) => http.put(`/guests/${id}`, g)
export const createGuest = (g: Partial<AccGuest>) => http.post<{ data: AccGuest }>('/guests', g).then((r) => r.data)
