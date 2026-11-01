import type { Attendance } from '@/types'
import http from './http'

export const getAttendance = (date: string) =>
  http.get<{ attendances: Attendance[] }>('/attendance', { params: { date } }).then((r) => r.attendances)

export const bulkCreateAttendance = (instructorIds: number[], from: string, to: string) =>
  http.post('/attendance/bulk', { attendances: { instructor_ids: instructorIds, from, to } })

export const bulkDeleteAttendance = (instructorIds: number[], date: string) =>
  http.delete('/attendance/bulk', { data: { attendances: { instructor_ids: instructorIds, date } } })
