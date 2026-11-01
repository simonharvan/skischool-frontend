import { createI18n } from 'vue-i18n'
import { watch } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/sk'
import 'dayjs/locale/en'
import sk from './sk'
import en from './en'
import { readLocale, type Locale } from '@/stores/locale'

export const i18n = createI18n({
  legacy: false,
  locale: readLocale(),
  fallbackLocale: 'sk',
  messages: { sk, en },
})

export function applyLocale(locale: Locale) {
  i18n.global.locale.value = locale
  dayjs.locale(locale)
  document.documentElement.lang = locale
}

export function watchLocale(source: () => Locale) {
  watch(source, applyLocale, { immediate: true })
}
