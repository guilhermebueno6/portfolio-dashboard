/**
 * Route middleware: redirect to /auth/login if the user is not authenticated.
 * Used on all protected pages via definePageMeta({ middleware: 'auth' })
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  // If we already have a user in the store, allow navigation
  if (authStore.isAuthenticated) return

  // Otherwise try to hydrate from the server (cookie-based)
  const { fetchMe } = useAuth()
  const user = await fetchMe()

  if (!user) {
    return navigateTo('/auth/login')
  }
})
