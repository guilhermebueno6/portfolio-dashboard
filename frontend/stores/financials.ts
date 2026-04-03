import { defineStore } from 'pinia'
import type { Invoice, FinancialSummary, InvoiceStatus } from '~/types'

export const useFinancialsStore = defineStore('financials', () => {
  const invoices = ref<Invoice[]>([])
  const summary = ref<FinancialSummary | null>(null)
  const loading = ref(false)
  const { $api } = useApi()

  async function fetchInvoices(status?: InvoiceStatus) {
    loading.value = true
    try {
      const params = status ? `?status=${status}` : ''
      const { invoices: data } = await $api<{ invoices: Invoice[] }>(`/api/financials/invoices${params}`)
      invoices.value = data
    } finally {
      loading.value = false
    }
  }

  async function fetchSummary() {
    const { summary: data } = await $api<{ summary: FinancialSummary }>('/api/financials/summary')
    summary.value = data
    return data
  }

  async function getInvoice(id: string) {
    const { invoice } = await $api<{ invoice: Invoice }>(`/api/financials/invoices/${id}`)
    return invoice
  }

  async function createInvoice(payload: Partial<Invoice> & { lineItems: any[] }) {
    const { invoice } = await $api<{ invoice: Invoice }>('/api/financials/invoices', {
      method: 'POST',
      body: payload,
    })
    invoices.value.unshift(invoice)
    return invoice
  }

  async function addPayment(invoiceId: string, payload: { amount: number; method?: string; notes?: string }) {
    const { payment } = await $api<{ payment: any }>(
      `/api/financials/invoices/${invoiceId}/payments`,
      { method: 'POST', body: payload },
    )
    // Refresh the invoice to get updated status
    const { invoice } = await $api<{ invoice: Invoice }>(`/api/financials/invoices/${invoiceId}`)
    const idx = invoices.value.findIndex((i) => i.id === invoiceId)
    if (idx !== -1) invoices.value[idx] = invoice
    return payment
  }

  async function updateStatus(invoiceId: string, status: InvoiceStatus) {
    const { invoice } = await $api<{ invoice: Invoice }>(
      `/api/financials/invoices/${invoiceId}/status`,
      { method: 'PATCH', body: { status } },
    )
    const idx = invoices.value.findIndex((i) => i.id === invoiceId)
    if (idx !== -1) invoices.value[idx] = { ...invoices.value[idx], ...invoice }
    return invoice
  }

  async function deleteInvoice(id: string) {
    await $api(`/api/financials/invoices/${id}`, { method: 'DELETE' })
    invoices.value = invoices.value.filter((i) => i.id !== id)
  }

  return {
    invoices,
    summary,
    loading,
    fetchInvoices,
    fetchSummary,
    getInvoice,
    createInvoice,
    addPayment,
    updateStatus,
    deleteInvoice,
  }
})
