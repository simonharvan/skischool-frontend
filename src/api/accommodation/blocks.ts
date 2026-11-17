import type { AccBlock } from '@/types/accommodation'
import http from './http'

export const getBlocks = (params: { from?: string; unit_id?: number } = {}) =>
  http.get<{ data: AccBlock[] }>('/blocks', { params }).then((r) => r.data)
export const createBlock = (b: Partial<AccBlock>) => http.post('/blocks', b)
export const updateBlock = (id: number, b: Partial<AccBlock>) => http.put(`/blocks/${id}`, b)
export const deleteBlock = (id: number) => http.delete(`/blocks/${id}`)
