import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import websocket from '@fastify/websocket'
import rateLimit from '@fastify/rate-limit'
import { redis } from './lib/redis.js'

// Route modules
import { authRoutes } from './modules/auth/auth.routes.js'
import { tasksRoutes } from './modules/tasks/tasks.routes.js'
import { notesRoutes } from './modules/notes/notes.routes.js'
import { financialsRoutes } from './modules/financials/financials.routes.js'
import { calendarRoutes } from './modules/calendar/calendar.routes.js'
import { feedsRoutes } from './modules/feeds/feeds.routes.js'
import { wsRoutes } from './lib/socket.js'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  })

  // ── Plugins ────────────────────────────────────────────────────────────────

  await app.register(cors, {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  await app.register(cookie, {
    secret: process.env.JWT_SECRET || 'cookie-secret',
    parseOptions: {},
  })

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'jwt-secret-change-me',
    cookie: { cookieName: 'auth_token', signed: false },
    sign: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  })

  await app.register(websocket, {
    options: { maxPayload: 1024 * 1024 }, // 1MB max WS message
  })

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis,
    keyGenerator: (request) =>
      request.headers['x-forwarded-for'] as string || request.ip,
  })

  // ── Health check ───────────────────────────────────────────────────────────

  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // ── Routes ─────────────────────────────────────────────────────────────────

  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(tasksRoutes, { prefix: '/api/tasks' })
  await app.register(notesRoutes, { prefix: '/api/notes' })
  await app.register(financialsRoutes, { prefix: '/api/financials' })
  await app.register(calendarRoutes, { prefix: '/api/calendar' })
  await app.register(feedsRoutes, { prefix: '/api/feeds' })
  await app.register(wsRoutes)  // WebSocket hub at /ws

  // ── Graceful shutdown ──────────────────────────────────────────────────────

  const onShutdown = async () => {
    app.log.info('Shutting down gracefully...')
    await app.close()
    await redis.quit()
    process.exit(0)
  }

  process.on('SIGINT', onShutdown)
  process.on('SIGTERM', onShutdown)

  return app
}
