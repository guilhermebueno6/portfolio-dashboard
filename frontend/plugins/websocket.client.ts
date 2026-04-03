/**
 * Nuxt plugin (client-only) that establishes the WebSocket connection once
 * the user is authenticated. Runs on every client-side navigation.
 */
export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  const { connect, disconnect } = useWebSocket()

  // Connect when auth state becomes truthy
  watch(
    () => authStore.isAuthenticated,
    (authenticated) => {
      if (authenticated) connect()
      else disconnect()
    },
    { immediate: true },
  )
})
