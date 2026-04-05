import { prisma } from '../../lib/prisma.js'
import { InvoiceStatus, PaymentMethod } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export interface LineItemDto {
  description: string
  quantity: number
  unitPrice: number
  taxRate?: number
}

export interface CreateInvoiceDto {
  invoiceNumber: string
  clientName: string
  clientEmail?: string
  clientAddress?: string
  dueDate: string
  currency?: string
  notes?: string
  lineItems: LineItemDto[]
}

export interface AddPaymentDto {
  amount: number
  method?: PaymentMethod
  paidAt?: string
  notes?: string
}

function calcInvoiceTotals(lineItems: { quantity: Decimal; unitPrice: Decimal; taxRate: Decimal }[]) {
  let subtotal = 0
  let taxTotal = 0
  for (const item of lineItems) {
    const line = Number(item.quantity) * Number(item.unitPrice)
    const tax = line * (Number(item.taxRate) / 100)
    subtotal += line
    taxTotal += tax
  }
  return { subtotal, taxTotal, total: subtotal + taxTotal }
}

export const financialsService = {
  async listInvoices(userId: string, status?: InvoiceStatus) {
    return prisma.invoice.findMany({
      where: { userId, ...(status ? { status } : {}) },
      include: { lineItems: true, payments: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  async getInvoice(id: string, userId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: { lineItems: true, payments: true },
    })
    if (!invoice) return null

    const totals = calcInvoiceTotals(invoice.lineItems)
    const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    return { ...invoice, totals, paid, outstanding: totals.total - paid }
  },

  async createInvoice(userId: string, data: CreateInvoiceDto) {
    return prisma.invoice.create({
      data: {
        userId,
        invoiceNumber: data.invoiceNumber,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientAddress: data.clientAddress,
        dueDate: new Date(data.dueDate),
        currency: data.currency ?? 'USD',
        notes: data.notes,
        status: InvoiceStatus.DRAFT,
        lineItems: {
          create: data.lineItems.map((li) => ({
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            taxRate: li.taxRate ?? 0,
          })),
        },
      },
      include: { lineItems: true, payments: true },
    })
  },

  async updateStatus(id: string, userId: string, status: InvoiceStatus) {
    return prisma.invoice.update({
      where: { id },
      data: { status },
    })
  },

  async addPayment(invoiceId: string, userId: string, data: AddPaymentDto) {
    // Verify ownership
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: { lineItems: true, payments: true },
    })
    if (!invoice) return null

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        amount: data.amount,
        method: data.method ?? PaymentMethod.BANK_TRANSFER,
        paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
        notes: data.notes,
      },
    })

    // Auto-update status
    const totals = calcInvoiceTotals(invoice.lineItems)
    const totalPaid =
      invoice.payments.reduce((s, p) => s + Number(p.amount), 0) + data.amount

    let newStatus: InvoiceStatus = InvoiceStatus.PARTIAL
    if (totalPaid >= totals.total) newStatus = InvoiceStatus.PAID

    await prisma.invoice.update({ where: { id: invoiceId }, data: { status: newStatus } })
    return payment
  },

  async deleteInvoice(id: string, userId: string) {
    return prisma.invoice.delete({ where: { id } })
  },

  async getSummary(userId: string) {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      include: { lineItems: true, payments: true },
    })

    return invoices.reduce(
      (acc, inv) => {
        const totals = calcInvoiceTotals(inv.lineItems)
        const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0)
        acc.totalBilled += totals.total
        acc.totalPaid += paid
        acc.totalOutstanding += totals.total - paid
        acc.invoiceCount++
        return acc
      },
      { totalBilled: 0, totalPaid: 0, totalOutstanding: 0, invoiceCount: 0 },
    )
  },
}
