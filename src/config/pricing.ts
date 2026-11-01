/** Prices of a lesson by number of persons and duration in hours. */
export const priceList: Record<string, Record<string, number>> = {
  person_1: {
    hours_1: 30,
    hours_1_5: 43,
    hours_2: 56,
    hours_3: 81,
    hours_4: 108,
    hours_5: 135,
    hours_6: 156,
    hours_7: 182,
  },
  person_2: {
    hours_1: 45,
    hours_1_5: 58,
    hours_2: 71,
    hours_3: 96,
    hours_4: 123,
    hours_5: 150,
    hours_6: 171,
    hours_7: 197,
  },
  person_3: {
    hours_1: 55,
    hours_1_5: 68,
    hours_2: 81,
    hours_3: 106,
    hours_4: 133,
    hours_5: 160,
    hours_6: 181,
    hours_7: 207,
  },
}

export const pricePerHour = 30

/** What an instructor earns per taught hour (€). */
export const instructorPayoutPerHour = 10

/** The price list has no column for 4+ persons yet; the 3 persons column is used until decided. */
const PRICE_COLUMN_MAX_PERSONS = 3

export const durationToPrice = (hours: number, persons: number): number => {
  const column = Math.min(Math.max(Math.round(persons) || 1, 1), PRICE_COLUMN_MAX_PERSONS)
  const row = priceList[`person_${column}`]
  const exact = row[`hours_${hours}`.replace('.', '_')]
  if (exact) return exact
  return Math.round(hours * pricePerHour * 100) / 100
}
