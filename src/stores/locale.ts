import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Locale = 'sk' | 'en'
const KEY = 'skischool_admin_locale'

export const readLocale = (): Locale => {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'sk' || v === 'en') return v
  } catch {
    /* ignore */
  }
  return 'sk'
}

export const useLocaleStore = defineStore('locale', () => {
  const locale = ref<Locale>(readLocale())
  function setLocale(value: Locale) {
    locale.value = value
    try {
      localStorage.setItem(KEY, value)
    } catch {
      /* ignore */
    }
  }
  return { locale, setLocale }
})
