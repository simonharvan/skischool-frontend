import dayjs from 'dayjs'

type DateInput = Date | string | number | dayjs.Dayjs

/** The backend works with local wall-clock time, without any timezone. */
export const toBackendDateTime = (d: DateInput): string => dayjs(d).format('YYYY-MM-DD HH:mm:ss')

export const toBackendDate = (d: DateInput): string => dayjs(d).format('YYYY-MM-DD')

export const minutesToHHMM = (minutes: number): string => {
  const total = Math.max(0, Math.round(minutes))
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${h}:${String(m).padStart(2, '0')}`
}

export const formatNiceDate = (d: DateInput): string => dayjs(d).format('D.M.YYYY')

export const formatNiceDateTime = (d: DateInput): string => dayjs(d).format('D.M.YYYY H:mm')

/** Duration between two instants as H:MM, for any span (also longer than a day). */
export const durationLabel = (from: DateInput, to: DateInput): string =>
  minutesToHHMM(Math.abs(dayjs(to).diff(dayjs(from), 'minute')))

export const durationHours = (from: DateInput, to: DateInput): number =>
  Math.abs(dayjs(to).diff(dayjs(from), 'minute')) / 60

/** Set the time of `base` to the given minutes since midnight (returns a new Dayjs). */
export const atMinutes = (base: DateInput, minutes: number): dayjs.Dayjs =>
  dayjs(base).startOf('day').add(minutes, 'minute')

export const minutesOfDay = (d: DateInput): number => {
  const x = dayjs(d)
  return x.hour() * 60 + x.minute()
}

/** Old behaviour of the "new lesson" default start: up to :15 -> :00, :16-:44 -> :30, :45+ -> next hour. */
export const roundToHalfHour = (d: DateInput): dayjs.Dayjs => {
  const x = dayjs(d).second(0).millisecond(0)
  const m = x.minute()
  if (m <= 15) return x.minute(0)
  if (m < 45) return x.minute(30)
  return x.add(1, 'hour').minute(0)
}
