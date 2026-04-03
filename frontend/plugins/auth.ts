/**
 * Nuxt plugin that hydrates the auth store from the backend on first load
 * (universal — runs on both server and client).
 */
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  if (authStore.isAuthenticated) return

  const { fetchMe } = useAuth()
  await fetchMe()
})
