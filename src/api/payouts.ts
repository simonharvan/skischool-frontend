import type { Payout } from '@/types'
import http from './http'

export const getPayouts = (params: { includePaid: boolean; from: string; to: string }) =>
  http.get<{ payouts: Payout[] }>('/payout', { params }).then((r) => r.payouts)

export const sendPayout = (lessonIds: number[], amount: number, instructorId: number) =>
  http.post('/payout', { payout: { lesson_ids: lessonIds, amount, instructor_id: instructorId } })
