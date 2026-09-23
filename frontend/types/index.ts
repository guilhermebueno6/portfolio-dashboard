// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  avatarUrl: string | null
  createdAt: string
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Subtask {
  id: string
  taskId: string
  title: string
  done: boolean
  order: number
}

export interface Task {
  id: string
  userId: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  dueDate: string | null
  order: number
  tags: string[]
  createdAt: string
  updatedAt: string
  subtasks: Subtask[]
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export interface Note {
  id: string
  userId: string
  title: string
  content: string
  color: string
  pinned: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end: { dateTime?: string; date?: string; timeZone?: string }
  htmlLink: string
  colorId?: string
}

// ─── Feeds ────────────────────────────────────────────────────────────────────

export interface Weather {
  city: string
  country: string
  temp: number
  feelsLike: number
  humidity: number
  description: string
  icon: string
  wind: number
  sunrise: number
  sunset: number
}

export interface NewsArticle {
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
  source: string
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

export type WsEvent =
  | { type: 'connected'; userId: string }
  | { type: 'task:updated'; payload: { task?: Task; id?: string; action: string } }
  | { type: 'note:updated'; payload: { note?: Note; id?: string; action: string } }
  | { type: 'calendar:updated'; payload: Record<string, unknown> }
  | { type: 'pong' }
  | { type: 'error'; message: string }
