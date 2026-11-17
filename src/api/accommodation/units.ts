import type { AccUnit } from '@/types/accommodation'
import http from './http'

export const getUnits = () => http.get<{ data: AccUnit[] }>('/units').then((r) => r.data)
export const createUnit = (unit: Partial<AccUnit>) => http.post<{ data: AccUnit }>('/units', unit).then((r) => r.data)
export const updateUnit = (id: number, unit: Partial<AccUnit>) =>
  http.put<{ data: AccUnit }>(`/units/${id}`, unit).then((r) => r.data)
export const deleteUnit = (id: number) => http.delete(`/units/${id}`)
