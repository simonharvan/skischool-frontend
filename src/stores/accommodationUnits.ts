import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUnits } from '@/api/accommodation/units'
import type { AccUnit } from '@/types/accommodation'

export const useAccommodationUnitsStore = defineStore('accommodationUnits', () => {
  const units = ref<AccUnit[]>([])
  const loaded = ref(false)

  async function load(force = false) {
    if (loaded.value && !force) return
    units.value = await getUnits()
    loaded.value = true
  }

  const byId = (id: number | null | undefined) => units.value.find((u) => u.id === id)

  return { units, loaded, load, byId }
})
