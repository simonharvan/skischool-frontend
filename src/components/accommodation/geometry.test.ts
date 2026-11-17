import { describe, expect, it } from 'vitest'
import {
  addDays,
  barRect,
  dayNumber,
  daysInMonth,
  euro,
  nightsBetween,
  nightsToStay,
  occupiedNights,
  selectNights,
  toFractionalDay,
  xToDayIndex,
} from './geometry'

const START = dayNumber('2026-12-21')
const W = 100

describe('dates', () => {
  it('counts calendar days across DST changes', () => {
    expect(dayNumber('2027-03-29') - dayNumber('2027-03-27')).toBe(2)
    expect(nightsBetween('2026-12-21T15:00:00', '2026-12-26T10:00:00')).toBe(5)
    expect(nightsBetween('2026-12-21T23:00:00', '2026-12-22T01:00:00')).toBe(1)
  })
  it('adds days and handles month lengths', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(daysInMonth(2028, 2)).toBe(29)
    expect(daysInMonth(2026, 12)).toBe(31)
  })
  it('gives fractional days', () => {
    expect(toFractionalDay('2026-12-21T12:00:00') - dayNumber('2026-12-21')).toBe(0.5)
  })
})

describe('barRect', () => {
  it('places a bar at its real arrival and departure time', () => {
    const r = barRect('2026-12-21T15:00:00', '2026-12-26T10:00:00', START, 31, W)!
    expect(r.left).toBeCloseTo(62.5)
    expect(r.width).toBeCloseTo((5 - 5 / 24) * W) // 15:00 -> 10:00 five days later
    expect(r.clippedStart).toBe(false)
  })
  it('same-day changeover bars sit side by side', () => {
    const a = barRect('2026-12-21T15:00:00', '2026-12-26T10:00:00', START, 31, W)!
    const b = barRect('2026-12-26T15:00:00', '2026-12-28T10:00:00', START, 31, W)!
    expect(a.left + a.width).toBeLessThan(b.left)
  })
  it('clips to the visible range and hides outside bars', () => {
    const r = barRect('2026-12-15T15:00:00', '2026-12-23T10:00:00', START, 31, W)!
    expect(r.left).toBe(0)
    expect(r.clippedStart).toBe(true)
    expect(barRect('2026-11-01T15:00:00', '2026-11-05T10:00:00', START, 31, W)).toBeNull()
    expect(barRect('2027-02-01T15:00:00', '2027-02-05T10:00:00', START, 31, W)).toBeNull()
  })
})

describe('xToDayIndex', () => {
  it('maps and clamps', () => {
    expect(xToDayIndex(0, W, 31)).toBe(0)
    expect(xToDayIndex(250, W, 31)).toBe(2)
    expect(xToDayIndex(-40, W, 31)).toBe(0)
    expect(xToDayIndex(99999, W, 31)).toBe(30)
  })
})

describe('occupiedNights', () => {
  const taken = occupiedNights([{ start: '2026-12-21T15:00:00', end: '2026-12-26T10:00:00' }], START, 10, 15 * 60, 10 * 60)
  it('marks the nights of the stay and frees the departure day', () => {
    expect(taken.slice(0, 7)).toEqual([true, true, true, true, true, false, false])
  })
  it('a late departure takes the following night', () => {
    const late = occupiedNights([{ start: '2026-12-21T15:00:00', end: '2026-12-26T17:00:00' }], START, 10, 15 * 60, 10 * 60)
    expect(late[5]).toBe(true)
  })
})

describe('selectNights', () => {
  const occ = [false, false, true, false, false, false, true, false]
  it('selects between anchor and current', () => {
    expect(selectNights(3, 5, occ)).toEqual({ from: 3, to: 5 })
    expect(selectNights(5, 3, occ)).toEqual({ from: 3, to: 5 })
  })
  it('cannot grow through a taken night', () => {
    expect(selectNights(3, 7, occ)).toEqual({ from: 3, to: 5 })
    expect(selectNights(4, 0, occ)).toEqual({ from: 3, to: 4 })
  })
  it('returns null when the anchor is taken', () => {
    expect(selectNights(2, 3, occ)).toBeNull()
  })
})

describe('nightsToStay', () => {
  it('turns nights into default-time datetimes, checkout the day after the last night', () => {
    expect(nightsToStay(0, 4, START, '15:00', '10:00')).toEqual({
      checkIn: '2026-12-21T15:00:00',
      checkOut: '2026-12-26T10:00:00',
    })
  })
})

describe('euro', () => {
  it('formats', () => {
    expect(euro(149)).toBe('149 €')
    expect(euro(12.5)).toBe('12.50 €')
  })
})
