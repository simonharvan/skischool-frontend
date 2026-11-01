/** Pure helpers of the day timeline. All times are minutes since midnight. */

export interface TimelineItem {
  id: number
  rowId: number
  start: number
  end: number
}

export interface Range {
  start: number
  end: number
}

export const CELL_MINUTES = 30
export const MIN_DURATION = 30
/** Pointer movement (px) under which a press is a click, not a drag. */
export const CLICK_THRESHOLD = 4

/** Snap to :00 / :30 – up to :15 -> :00, :16-:44 -> :30, :45+ -> next hour. */
export const snapMinutes = (minutes: number): number => {
  const hour = Math.floor(minutes / 60)
  const rest = minutes - hour * 60
  if (rest > 15 && rest < 45) return hour * 60 + 30
  if (rest >= 45) return (hour + 1) * 60
  return hour * 60
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

export const minutesToFraction = (minutes: number, dayStart: number, dayEnd: number): number =>
  (minutes - dayStart) / (dayEnd - dayStart)

export const pxToMinutes = (px: number, widthPx: number, dayStart: number, dayEnd: number): number =>
  dayStart + (px / widthPx) * (dayEnd - dayStart)

export const deltaPxToMinutes = (dx: number, widthPx: number, dayStart: number, dayEnd: number): number =>
  (dx / widthPx) * (dayEnd - dayStart)

export const overlaps = (a: Range, b: Range): boolean => a.start < b.end && b.start < a.end

export const hasCollision = (
  items: TimelineItem[],
  candidate: { rowId: number; start: number; end: number },
  ignoreId?: number,
): boolean =>
  items.some(
    (i) => i.id !== ignoreId && i.rowId === candidate.rowId && overlaps(i, candidate),
  )

/** Move keeping the duration; snapped and clamped into the day window. */
export const moveRange = (
  origin: Range,
  deltaMinutes: number,
  dayStart: number,
  dayEnd: number,
): Range => {
  const duration = origin.end - origin.start
  const start = clamp(snapMinutes(origin.start + deltaMinutes), dayStart, dayEnd - duration)
  return { start, end: start + duration }
}

/** Resize one edge; snapped, never shorter than MIN_DURATION and inside the day window. */
export const resizeRange = (
  origin: Range,
  edge: 'start' | 'end',
  deltaMinutes: number,
  dayStart: number,
  dayEnd: number,
): Range => {
  if (edge === 'start') {
    const start = clamp(snapMinutes(origin.start + deltaMinutes), dayStart, origin.end - MIN_DURATION)
    return { start, end: origin.end }
  }
  const end = clamp(snapMinutes(origin.end + deltaMinutes), origin.start + MIN_DURATION, dayEnd)
  return { start: origin.start, end }
}

/** Index of the 30-minute cell a time falls in. */
export const cellIndex = (minutes: number, dayStart: number): number =>
  Math.floor((minutes - dayStart) / CELL_MINUTES)

export const cellRange = (index: number, dayStart: number): Range => ({
  start: dayStart + index * CELL_MINUTES,
  end: dayStart + (index + 1) * CELL_MINUTES,
})

/**
 * Selection between two cells of one row. The selection can't grow through an existing item:
 * it is limited by the nearest items on both sides of the anchor cell.
 */
export const selectionToRange = (
  anchorCell: number,
  currentCell: number,
  rowItems: Range[],
  dayStart: number,
  dayEnd: number,
): Range | null => {
  const anchor = cellRange(anchorCell, dayStart)
  if (anchor.start < dayStart || anchor.end > dayEnd) return null
  if (rowItems.some((i) => overlaps(i, anchor))) return null

  let lower = dayStart
  let upper = dayEnd
  for (const i of rowItems) {
    if (i.end <= anchor.start) lower = Math.max(lower, i.end)
    if (i.start >= anchor.end) upper = Math.min(upper, i.start)
  }
  const a = cellRange(Math.min(anchorCell, currentCell), dayStart)
  const b = cellRange(Math.max(anchorCell, currentCell), dayStart)
  return { start: clamp(a.start, lower, upper), end: clamp(b.end, lower, upper) }
}

/** A press that moved less than the threshold is a click, not a drag. */
export const isClick = (
  down: { x: number; y: number },
  up: { x: number; y: number },
  threshold = CLICK_THRESHOLD,
): boolean => Math.hypot(up.x - down.x, up.y - down.y) < threshold
