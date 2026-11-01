import dayjs from 'dayjs'
import { defineStore } from 'pinia'
import { ref } from 'vue'

/** Selected day of the lessons screen; it lives here so it survives navigation. */
export const useLessonsStore = defineStore('lessons', () => {
  const selectedDate = ref(dayjs().format('YYYY-MM-DD'))

  function setDate(date: string | Date | dayjs.Dayjs) {
    selectedDate.value = dayjs(date).format('YYYY-MM-DD')
  }
  function shift(days: number) {
    setDate(dayjs(selectedDate.value).add(days, 'day'))
  }

  return { selectedDate, setDate, shift }
})
