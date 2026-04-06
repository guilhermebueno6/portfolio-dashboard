/**
 * Typed API client using Nuxt's $fetch, automatically pointing at the backend.
 * Credentials (cookies) are included on every request.
 * On the server (SSR), the incoming request's Cookie header is forwarded so
 * the backend can authenticate the user during server-side rendering.
 */
export function useApi() {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase as string
  // Forward cookies from the browser's request when running on the server.
  // On the client this is empty — the browser handles cookies automatically.
  const requestHeaders = useRequestHeaders(['cookie'])

  const $api = <T>(path: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> => {
    return $fetch<T>(path, {
      baseURL,
      credentials: 'include',
      headers: requestHeaders,
      ...options,
    })
  }

  return { $api }
}
