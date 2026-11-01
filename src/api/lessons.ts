import type { Lesson, LessonPayload } from '@/types'
import http from './http'

export const getLessons = (params: Record<string, unknown>) =>
  http.get<{ lessons: Lesson[] }>('/lessons', { params }).then((r) => r.lessons)

export const createLesson = (lesson: LessonPayload) =>
  http.post<{ lesson: Lesson }>('/lessons', { lesson }).then((r) => r.lesson)

export const updateLesson = (id: number, lesson: LessonPayload) =>
  http.put<{ lesson: Lesson }>(`/lessons/${id}`, { lesson }).then((r) => r.lesson)

export const deleteLesson = (id: number) => http.delete(`/lessons/${id}`)

export const preparePayLesson = (id: number) =>
  http.get<{ lessons: Lesson[] }>(`/lessons/${id}/prepare-pay`).then((r) => r.lessons)

export const payLessons = (ids: number[], price: number) =>
  http.post('/lessons/pay', { lesson: { ids, price } })
