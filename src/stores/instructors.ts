import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getInstructors } from '@/api/instructors'
import type { Instructor } from '@/types'

export const PLACEHOLDER_INSTRUCTOR_EMAIL = 'docasny@instruktor.sk'

export const useInstructorsStore = defineStore('instructors', () => {
  const all = ref<Instructor[]>([])

  async function load() {
    all.value = await getInstructors()
  }

  return { all, load }
})
