/**
 * Pure helpers of the accommodation calendar. Datetimes are local "YYYY-MM-DDTHH:mm[:ss]" strings,
 * parsed by hand (no Date/timezone) so DST changes can never shift a bar. A "day number" is the
 * count of days since 1970-01-01 of the calendar date.
 */

export const MINUTES_PER_DAY = 1440

export interface Range {
  start: number // fractional day number
  end: number
}

export const dayNumber = (date: string): number => {
  const [y, m, d] = date.slice(0, 10).split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000)
}

export const dayToDate = (day: number): string => new Date(day * 86_400_000).toISOString().slice(0, 10)

export const addDays = (date: string, n: number): string => dayToDate(dayNumber(date) + n)

export const timeToMinutes = (time: string): number => {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  return h * 60 + (m || 0)
}

export const minutesToTime = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/** Fractional day number of a datetime string, e.g. 12:00 is day + 0.5. */
export const toFractionalDay = (datetime: string): number => {
  const time = datetime.length > 10 ? datetime.slice(11, 16) : '00:00'
  return dayNumber(datetime) + timeToMinutes(time) / MINUTES_PER_DAY
}

export const daysInMonth = (year: number, month: number): number => new Date(Date.UTC(year, month, 0)).getUTCDate()

export interface BarRect {
  left: number
  width: number
  clippedStart: boolean
  clippedEnd: boolean
}

/** Horizontal position of a booking/block bar, clipped to the visible range. null when outside it. */
export const barRect = (
  startAt: string,
  endAt: string,
  rangeStartDay: number,
  rangeDays: number,
  dayWidth: number,
): BarRect | null => {
  const s = toFractionalDay(startAt) - rangeStartDay
  const e = toFractionalDay(endAt) - rangeStartDay
  if (e <= 0 || s >= rangeDays) return null
  const cs = Math.max(s, 0)
  const ce = Math.min(e, rangeDays)
  return { left: cs * dayWidth, width: Math.max((ce - cs) * dayWidth, 2), clippedStart: s < 0, clippedEnd: e > rangeDays }
}

/** Day index (0-based, inside the range) under a horizontal pixel offset. */
export const xToDayIndex = (x: number, dayWidth: number, rangeDays: number): number =>
  Math.min(Math.max(Math.floor(x / dayWidth), 0), rangeDays - 1)

/**
 * Which nights of the range are taken? Night i runs from day i at `checkInMin` to day i+1 at
 * `checkOutMin`, so a stay leaving at 10:00 leaves that day's night free for the next guest.
 */
export const occupiedNights = (
  items: { start: string; end: string }[],
  rangeStartDay: number,
  rangeDays: number,
  checkInMin: number,
  checkOutMin: number,
): boolean[] => {
  const nights = Array<boolean>(rangeDays).fill(false)
  for (const item of items) {
    const s = toFractionalDay(item.start)
    const e = toFractionalDay(item.end)
    for (let i = 0; i < rangeDays; i++) {
      const day = rangeStartDay + i
      const nightStart = day + checkInMin / MINUTES_PER_DAY
      const nightEnd = day + 1 + checkOutMin / MINUTES_PER_DAY
      if (s < nightEnd && e > nightStart) nights[i] = true
    }
  }
  return nights
}

/**
 * Drag selection between two day cells. It is limited by taken nights around the anchor and
 * returns the inclusive night index range, or null when the anchor night is taken.
 */
export const selectNights = (
  anchor: number,
  current: number,
  occupied: boolean[],
): { from: number; to: number } | null => {
  if (occupied[anchor] !== false) return null
  let lo = anchor
  let hi = anchor
  while (lo > 0 && lo > Math.min(anchor, current) && !occupied[lo - 1]) lo--
  while (hi < occupied.length - 1 && hi < Math.max(anchor, current) && !occupied[hi + 1]) hi++
  return { from: lo, to: hi }
}

/** Check-in / check-out datetimes for the nights from..to (inclusive) of a range. */
export const nightsToStay = (
  from: number,
  to: number,
  rangeStartDay: number,
  checkInTime: string,
  checkOutTime: string,
): { checkIn: string; checkOut: string } => ({
  checkIn: `${dayToDate(rangeStartDay + from)}T${checkInTime.slice(0, 5)}:00`,
  checkOut: `${dayToDate(rangeStartDay + to + 1)}T${checkOutTime.slice(0, 5)}:00`,
})

/** Nights between the calendar dates of two datetimes (times are ignored). */
export const nightsBetween = (checkIn: string, checkOut: string): number => dayNumber(checkOut) - dayNumber(checkIn)

export const euro = (value: number): string => `${Number.isInteger(value) ? value : value.toFixed(2)} €`
