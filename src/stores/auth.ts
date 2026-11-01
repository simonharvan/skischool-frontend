import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const TOKEN_KEY = 'skischool_admin_token'

const readToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(readToken())
  const user = ref<{ name: string; email: string } | null>(null)
  const isLoggedIn = computed(() => !!token.value)

  function setToken(value: string | null) {
    token.value = value
    try {
      if (value) localStorage.setItem(TOKEN_KEY, value)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* storage unavailable, the token stays in memory */
    }
  }

  function clear() {
    setToken(null)
    user.value = null
  }

  return { token, user, isLoggedIn, setToken, clear }
})
