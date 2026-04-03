/**
 * Typed API client using Nuxt's $fetch, automatically pointing at the backend.
 * Credentials (cookies) are included on every request.
 */
export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase as string

  const $api = <T>(path: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> => {
    return $fetch<T>(path, {
      baseURL,
      credentials: 'include',
      ...options,
    })
  }

  return { $api }
}
