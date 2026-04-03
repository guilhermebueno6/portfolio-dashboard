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

// ─── Financials ───────────────────────────────────────────────────────────────

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED'
export type PaymentMethod = 'BANK_TRANSFER' | 'CREDIT_CARD' | 'PAYPAL' | 'CRYPTO' | 'CASH' | 'OTHER'

export interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
}

export interface Payment {
  id: string
  amount: number
  method: PaymentMethod
  paidAt: string
  notes: string | null
}

export interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  clientEmail: string | null
  clientAddress: string | null
  issueDate: string
  dueDate: string
  status: InvoiceStatus
  currency: string
  notes: string | null
  lineItems: LineItem[]
  payments: Payment[]
  totals?: { subtotal: number; taxTotal: number; total: number }
  paid?: number
  outstanding?: number
}

export interface FinancialSummary {
  totalBilled: number
  totalPaid: number
  totalOutstanding: number
  invoiceCount: number
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
