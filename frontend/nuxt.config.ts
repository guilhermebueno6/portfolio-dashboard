// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode',
  ],

  // Nuxt UI uses Tailwind under the hood
  ui: {
    icons: ['heroicons', 'lucide'],
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
  },

  runtimeConfig: {
    // Server-only
    jwtSecret: process.env.NUXT_JWT_SECRET || '',

    // Exposed to client
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
      wsUrl: process.env.NUXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    },
  },

  routeRules: {
    // API routes proxied to backend (avoids CORS in production)
    '/api/**': { proxy: { to: process.env.NUXT_PUBLIC_API_BASE + '/**' } },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  imports: {
    dirs: ['stores', 'composables'],
  },

  // SSR with hydration — keeps the app fast
  ssr: true,

  app: {
    head: {
      title: 'Dashboard',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Personal productivity dashboard' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
        },
      ],
    },
  },
})
