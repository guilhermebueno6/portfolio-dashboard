<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const store = useFinancialsStore()
const { $api } = useApi()

const invoice = ref(await store.getInvoice(route.params.id as string))

const statusColors = {
  DRAFT: 'gray', SENT: 'blue', PARTIAL: 'orange', PAID: 'green', OVERDUE: 'red', CANCELLED: 'gray',
} as const

const isPaymentOpen = ref(false)
const paymentForm = ref({ amount: 0, method: 'BANK_TRANSFER', notes: '' })

async function addPayment() {
  if (!invoice.value) return
  await store.addPayment(invoice.value.id, paymentForm.value)
  invoice.value = await store.getInvoice(invoice.value.id)
  isPaymentOpen.value = false
}

function formatCurrency(amount: number | undefined) {
  if (!amount) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice.value?.currency || 'USD' }).format(amount)
}
</script>

<template>
  <div class="p-4 lg:p-6 max-w-4xl mx-auto">
    <div class="flex items-center gap-4 mb-6">
      <NuxtLink to="/financials">
        <UButton icon="i-heroicons-arrow-left" color="gray" variant="ghost" size="sm">Back</UButton>
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Invoice {{ invoice?.invoiceNumber }}
      </h1>
      <UBadge v-if="invoice" :color="statusColors[invoice.status]" variant="subtle">
        {{ invoice.status }}
      </UBadge>
    </div>

    <div v-if="invoice" class="space-y-6">
      <!-- Invoice details -->
      <UCard>
        <div class="grid grid-cols-2 gap-6">
          <div>
            <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Client</p>
            <p class="font-semibold text-gray-900 dark:text-white">{{ invoice.clientName }}</p>
            <p v-if="invoice.clientEmail" class="text-sm text-gray-500">{{ invoice.clientEmail }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">Due Date</p>
            <p class="font-semibold text-gray-900 dark:text-white">
              {{ new Date(invoice.dueDate).toLocaleDateString() }}
            </p>
          </div>
        </div>

        <!-- Line items -->
        <UDivider class="my-4" />
        <UTable
          :rows="invoice.lineItems"
          :columns="[
            { key: 'description', label: 'Description' },
            { key: 'quantity', label: 'Qty' },
            { key: 'unitPrice', label: 'Unit Price' },
            { key: 'taxRate', label: 'Tax %' },
            { key: 'total', label: 'Total' },
          ]"
        >
          <template #unitPrice-data="{ row }">{{ formatCurrency(row.unitPrice) }}</template>
          <template #total-data="{ row }">
            {{ formatCurrency(Number(row.quantity) * Number(row.unitPrice) * (1 + Number(row.taxRate) / 100)) }}
          </template>
        </UTable>

        <!-- Totals -->
        <div class="flex flex-col items-end gap-1 mt-4">
          <div class="flex gap-8 text-sm text-gray-500">
            <span>Subtotal</span>
            <span>{{ formatCurrency(invoice.totals?.subtotal) }}</span>
          </div>
          <div class="flex gap-8 text-sm text-gray-500">
            <span>Tax</span>
            <span>{{ formatCurrency(invoice.totals?.taxTotal) }}</span>
          </div>
          <UDivider class="w-40 my-1" />
          <div class="flex gap-8 text-base font-bold text-gray-900 dark:text-white">
            <span>Total</span>
            <span>{{ formatCurrency(invoice.totals?.total) }}</span>
          </div>
        </div>
      </UCard>

      <!-- Payments -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-gray-900 dark:text-white">Payments</h2>
            <div class="flex items-center gap-3">
              <div class="text-sm text-gray-500">
                Outstanding: <span class="font-semibold text-orange-500">{{ formatCurrency(invoice.outstanding) }}</span>
              </div>
              <UButton
                v-if="invoice.status !== 'PAID' && invoice.status !== 'CANCELLED'"
                size="sm"
                icon="i-heroicons-plus"
                @click="isPaymentOpen = true"
              >
                Add Payment
              </UButton>
            </div>
          </div>
        </template>

        <div v-if="!invoice.payments.length" class="text-center py-6 text-sm text-gray-400">
          No payments recorded
        </div>

        <UTable
          v-else
          :rows="invoice.payments"
          :columns="[
            { key: 'paidAt', label: 'Date' },
            { key: 'amount', label: 'Amount' },
            { key: 'method', label: 'Method' },
            { key: 'notes', label: 'Notes' },
          ]"
        >
          <template #paidAt-data="{ row }">
            {{ new Date(row.paidAt).toLocaleDateString() }}
          </template>
          <template #amount-data="{ row }">
            <span class="font-semibold text-green-600">{{ formatCurrency(Number(row.amount)) }}</span>
          </template>
        </UTable>
      </UCard>
    </div>

    <!-- Add payment modal -->
    <UModal v-model="isPaymentOpen">
      <UCard>
        <template #header>
          <h3 class="font-semibold">Add Payment</h3>
        </template>
        <div class="space-y-4">
          <UFormGroup label="Amount" required>
            <UInput v-model.number="paymentForm.amount" type="number" min="0" step="0.01" />
          </UFormGroup>
          <UFormGroup label="Method">
            <USelect
              v-model="paymentForm.method"
              :options="['BANK_TRANSFER', 'CREDIT_CARD', 'PAYPAL', 'CRYPTO', 'CASH', 'OTHER']"
            />
          </UFormGroup>
          <UFormGroup label="Notes">
            <UInput v-model="paymentForm.notes" placeholder="Reference number, etc." />
          </UFormGroup>
        </div>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="isPaymentOpen = false">Cancel</UButton>
            <UButton @click="addPayment">Record Payment</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
