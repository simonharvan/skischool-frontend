import { describe, expect, it } from 'vitest'
import {
  cellIndex,
  hasCollision,
  isClick,
  minutesToFraction,
  moveRange,
  overlaps,
  pxToMinutes,
  resizeRange,
  selectionToRange,
  snapMinutes,
} from './geometry'

const S = 8 * 60 + 30 // 08:30
const E = 16 * 60 // 16:00
const t = (h: number, m = 0) => h * 60 + m

describe('snapMinutes', () => {
  it.each([
    [t(10, 0), t(10, 0)],
    [t(10, 15), t(10, 0)],
    [t(10, 16), t(10, 30)],
    [t(10, 30), t(10, 30)],
    [t(10, 44), t(10, 30)],
    [t(10, 45), t(11, 0)],
    [t(10, 59), t(11, 0)],
  ])('%i -> %i', (input, expected) => {
    expect(snapMinutes(input)).toBe(expected)
  })
})

describe('time <-> px', () => {
  it('maps the window edges to 0 and 1', () => {
    expect(minutesToFraction(S, S, E)).toBe(0)
    expect(minutesToFraction(E, S, E)).toBe(1)
    expect(minutesToFraction(t(12, 15), S, E)).toBeCloseTo(0.5)
  })
  it('converts px to minutes', () => {
    expect(pxToMinutes(0, 750, S, E)).toBe(S)
    expect(pxToMinutes(750, 750, S, E)).toBe(E)
    expect(pxToMinutes(375, 750, S, E)).toBeCloseTo(t(12, 15))
  })
})

describe('collisions', () => {
  const items = [
    { id: 1, rowId: 1, start: t(10), end: t(11) },
    { id: 2, rowId: 2, start: t(10), end: t(11) },
  ]
  it('touching ranges do not overlap', () => {
    expect(overlaps({ start: t(10), end: t(11) }, { start: t(11), end: t(12) })).toBe(false)
  })
  it('detects overlap in the same row only', () => {
    expect(hasCollision(items, { rowId: 1, start: t(10, 30), end: t(11, 30) })).toBe(true)
    expect(hasCollision(items, { rowId: 3, start: t(10, 30), end: t(11, 30) })).toBe(false)
  })
  it('ignores the moved item itself', () => {
    expect(hasCollision(items, { rowId: 1, start: t(10, 30), end: t(11, 30) }, 1)).toBe(false)
  })
})

describe('moveRange', () => {
  it('keeps the duration and snaps', () => {
    expect(moveRange({ start: t(10), end: t(11) }, 40, S, E)).toEqual({ start: t(10, 30), end: t(11, 30) })
  })
  it('clamps to the window', () => {
    expect(moveRange({ start: t(10), end: t(11, 30) }, 600, S, E)).toEqual({ start: t(14, 30), end: E })
    expect(moveRange({ start: t(10), end: t(11) }, -600, S, E)).toEqual({ start: S, end: S + 60 })
  })
})

describe('resizeRange', () => {
  const origin = { start: t(10), end: t(11) }
  it('resizes the end', () => {
    expect(resizeRange(origin, 'end', 35, S, E)).toEqual({ start: t(10), end: t(11, 30) })
  })
  it('resizes the start', () => {
    expect(resizeRange(origin, 'start', -35, S, E)).toEqual({ start: t(9, 30), end: t(11) })
  })
  it('never gets shorter than 30 minutes', () => {
    expect(resizeRange(origin, 'end', -300, S, E)).toEqual({ start: t(10), end: t(10, 30) })
    expect(resizeRange(origin, 'start', 300, S, E)).toEqual({ start: t(10, 30), end: t(11) })
  })
  it('stays in the window', () => {
    expect(resizeRange(origin, 'end', 900, S, E).end).toBe(E)
    expect(resizeRange(origin, 'start', -900, S, E).start).toBe(S)
  })
})

describe('selectionToRange', () => {
  const items = [{ start: t(11), end: t(12) }]
  const cell = (m: number) => cellIndex(m, S)

  it('selects a single cell', () => {
    expect(selectionToRange(cell(t(9)), cell(t(9)), items, S, E)).toEqual({ start: t(9), end: t(9, 30) })
  })
  it('extends in both directions', () => {
    expect(selectionToRange(cell(t(9)), cell(t(10)), items, S, E)).toEqual({ start: t(9), end: t(10, 30) })
    expect(selectionToRange(cell(t(10)), cell(t(9)), items, S, E)).toEqual({ start: t(9), end: t(10, 30) })
  })
  it("can't cross an existing item", () => {
    expect(selectionToRange(cell(t(10)), cell(t(14)), items, S, E)).toEqual({ start: t(10), end: t(11) })
    expect(selectionToRange(cell(t(13)), cell(t(9)), items, S, E)).toEqual({ start: t(12), end: t(13, 30) })
  })
  it('does not start on an occupied cell', () => {
    expect(selectionToRange(cell(t(11)), cell(t(11)), items, S, E)).toBeNull()
  })
})

describe('isClick', () => {
  it('small movement is a click', () => {
    expect(isClick({ x: 10, y: 10 }, { x: 12, y: 11 })).toBe(true)
  })
  it('larger movement is a drag', () => {
    expect(isClick({ x: 10, y: 10 }, { x: 20, y: 10 })).toBe(false)
  })
})
