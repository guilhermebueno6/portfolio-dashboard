import type { WsEvent } from '~/types'

type EventHandler = (event: WsEvent) => void

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
const handlers = new Set<EventHandler>()

export function useWebSocket() {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  function connect() {
    if (ws && ws.readyState === WebSocket.OPEN) return

    const token = authStore.token
    const url = `${config.public.wsUrl}/ws${token ? `?token=${token}` : ''}`

    ws = new WebSocket(url)

    ws.onopen = () => {
      console.log('🔌 WebSocket connected')
      if (reconnectTimer) clearTimeout(reconnectTimer)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsEvent
        handlers.forEach((h) => h(data))
      } catch (e) {
        console.error('WS parse error', e)
      }
    }

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected — reconnecting in 3s')
      reconnectTimer = setTimeout(connect, 3000)
    }

    ws.onerror = (err) => {
      console.error('WS error', err)
      ws?.close()
    }
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer)
    ws?.close()
    ws = null
  }

  function on(handler: EventHandler) {
    handlers.add(handler)
    return () => handlers.delete(handler)
  }

  function send(event: WsEvent) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event))
    }
  }

  // Heartbeat
  if (import.meta.client) {
    setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        send({ type: 'ping' })
      }
    }, 30_000)
  }

  return { connect, disconnect, on, send }
}
