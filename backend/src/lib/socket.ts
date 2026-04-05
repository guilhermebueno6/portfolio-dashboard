import { FastifyInstance } from 'fastify'
import { WebSocket } from 'ws'
import { redis } from './redis.js'

interface Client {
  ws: WebSocket
  userId: string
  subscriptions: Set<string>
}

const clients = new Map<string, Client>()

export type WsEvent =
  | { type: 'task:updated'; payload: Record<string, unknown> }
  | { type: 'note:updated'; payload: Record<string, unknown> }
  | { type: 'calendar:updated'; payload: Record<string, unknown> }
  | { type: 'ping' }

/** Broadcast an event to all WebSocket connections for a given userId */
export function broadcastToUser(userId: string, event: WsEvent): void {
  for (const [, client] of clients) {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(event))
    }
  }
}

/** Subscribe to Redis pub/sub and forward messages to WebSocket clients */
async function startRedisSub() {
  const sub = redis.duplicate()
  await sub.subscribe('dashboard:events')

  sub.on('message', (_channel, message) => {
    try {
      const { userId, event } = JSON.parse(message)
      broadcastToUser(userId, event)
    } catch (e) {
      console.error('WS Redis sub parse error:', e)
    }
  })
}

/** Publish an event via Redis (use from any backend service) */
export async function publishEvent(userId: string, event: WsEvent): Promise<void> {
  await redis.publish('dashboard:events', JSON.stringify({ userId, event }))
}

export async function wsRoutes(app: FastifyInstance): Promise<void> {
  await startRedisSub()

  app.get('/ws', { websocket: true }, (socket, request) => {
    const clientId = crypto.randomUUID()

    // Auth: expect ?token=<jwt> in query or cookie
    let userId: string
    try {
      const token =
        (request.query as Record<string, string>).token ||
        request.cookies?.auth_token
      if (!token) throw new Error('No token')
      const decoded = app.jwt.verify<{ id: string }>(token)
      userId = decoded.id
    } catch {
      socket.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }))
      socket.close(1008, 'Unauthorized')
      return
    }

    clients.set(clientId, { ws: socket, userId, subscriptions: new Set() })
    socket.send(JSON.stringify({ type: 'connected', userId }))

    socket.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as WsEvent
        if (msg.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong' }))
        }
      } catch {
        // ignore malformed messages
      }
    })

    socket.on('close', () => {
      clients.delete(clientId)
    })
  })
}
