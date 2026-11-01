import { describe, expect, it } from 'vitest'
import { durationToPrice } from './pricing'

describe('durationToPrice', () => {
  it('reads the price list', () => {
    expect(durationToPrice(1, 1)).toBe(30)
    expect(durationToPrice(1.5, 2)).toBe(58)
    expect(durationToPrice(2, 3)).toBe(81)
  })
  it('falls back to hours * 30 for unlisted durations', () => {
    expect(durationToPrice(0.5, 1)).toBe(15)
    expect(durationToPrice(2.5, 1)).toBe(75)
  })
  it('does not crash for 4 persons', () => {
    expect(durationToPrice(1, 4)).toBe(55)
  })
})
