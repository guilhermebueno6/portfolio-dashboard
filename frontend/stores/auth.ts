import { defineStore } from 'pinia'
import type { User } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  function setUser(u: User) {
    user.value = u
  }

  function setToken(t: string) {
    token.value = t
  }

  function clearUser() {
    user.value = null
    token.value = null
  }

  return { user, token, isAuthenticated, setUser, setToken, clearUser }
})
