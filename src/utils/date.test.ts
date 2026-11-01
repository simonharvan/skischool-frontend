import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  durationLabel,
  formatNiceDate,
  formatNiceDateTime,
  minutesToHHMM,
  roundToHalfHour,
  toBackendDate,
  toBackendDateTime,
} from './date'

describe('date helpers', () => {
  it('formats local wall-clock time for the backend', () => {
    expect(toBackendDateTime(new Date(2025, 0, 5, 9, 30, 0))).toBe('2025-01-05 09:30:00')
  })
  it('uses the local date (no UTC shift near midnight)', () => {
    expect(toBackendDate(new Date(2025, 0, 5, 0, 10))).toBe('2025-01-05')
    expect(toBackendDate(new Date(2025, 0, 5, 23, 50))).toBe('2025-01-05')
  })
  it('does not mutate its input', () => {
    const d = new Date(2025, 0, 5, 9, 30)
    const before = d.getTime()
    toBackendDateTime(d)
    toBackendDate(d)
    expect(d.getTime()).toBe(before)
  })
  it('formats minutes as H:MM', () => {
    expect(minutesToHHMM(0)).toBe('0:00')
    expect(minutesToHHMM(95)).toBe('1:35')
    expect(minutesToHHMM(1500)).toBe('25:00')
  })
  it('formats nice dates', () => {
    expect(formatNiceDate(new Date(2025, 0, 5))).toBe('5.1.2025')
    expect(formatNiceDateTime(new Date(2025, 11, 25, 8, 5))).toBe('25.12.2025 8:05')
  })
  it('computes a duration for any span', () => {
    expect(durationLabel('2025-01-05 10:00:00', '2025-01-05 11:30:00')).toBe('1:30')
    expect(durationLabel('2025-01-05 10:00:00', '2025-01-07 10:00:00')).toBe('48:00')
  })
  it.each([
    ['10:10', '10:00'],
    ['10:15', '10:00'],
    ['10:30', '10:30'],
    ['10:44', '10:30'],
    ['10:45', '11:00'],
  ])('rounds %s to %s', (input, expected) => {
    expect(roundToHalfHour(dayjs(`2025-01-05 ${input}`)).format('HH:mm')).toBe(expected)
  })
})
