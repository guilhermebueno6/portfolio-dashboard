import type { User } from '~/types'

export function useAuth() {
  const authStore = useAuthStore()
  const { $api } = useApi()
  const router = useRouter()

  async function fetchMe(): Promise<User | null> {
    try {
      const { user } = await $api<{ user: User }>('/api/auth/me')
      authStore.setUser(user)
      return user
    } catch {
      authStore.clearUser()
      return null
    }
  }

  async function logout() {
    await $api('/api/auth/logout', { method: 'POST' })
    authStore.clearUser()
    router.push('/auth/login')
  }

  function loginWithGoogle() {
    const config = useRuntimeConfig()
    window.location.href = `${config.public.apiBase}/api/auth/google`
  }

  return {
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    fetchMe,
    logout,
    loginWithGoogle,
  }
}
