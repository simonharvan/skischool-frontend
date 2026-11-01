import type { Gender, Instructor, Teaching } from '@/types'
import http from './http'

export interface InstructorPayload {
  name: string
  email: string
  phone: string
  gender: Gender
  teaching: Teaching
  password?: string
}

export const getInstructors = (params: Record<string, unknown> = {}) =>
  http.get<{ instructors: Instructor[] }>('/instructors', { params }).then((r) => r.instructors)

export const createInstructor = (instructor: InstructorPayload) =>
  http.post<{ instructor: Instructor }>('/instructors', { instructor }).then((r) => r.instructor)

export const updateInstructor = (id: number, instructor: InstructorPayload) =>
  http.put<{ instructor: Instructor }>(`/instructors/${id}`, { instructor }).then((r) => r.instructor)

export const deleteInstructor = (id: number) => http.delete(`/instructors/${id}`)
