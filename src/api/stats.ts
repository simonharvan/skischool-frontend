import type { InstructorStats, Stats } from '@/types'
import http from './http'

export const getStats = (params: { from: string; to: string }) =>
  http.get<{ stats: Stats }>('/stats', { params }).then((r) => r.stats)

export const getInstructorsStats = (params: { from: string; to: string }) =>
  http.get<{ stats: InstructorStats[] }>('/instructors-stats', { params }).then((r) => r.stats)
