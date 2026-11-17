import type { AccRatePeriod } from '@/types/accommodation'
import http from './http'

export const getRatePeriods = () => http.get<{ data: AccRatePeriod[] }>('/rate-periods').then((r) => r.data)
export const createRatePeriod = (p: Partial<AccRatePeriod>) => http.post('/rate-periods', p)
export const updateRatePeriod = (id: number, p: Partial<AccRatePeriod>) => http.put(`/rate-periods/${id}`, p)
export const deleteRatePeriod = (id: number) => http.delete(`/rate-periods/${id}`)
