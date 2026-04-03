<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const store = useFinancialsStore()
await Promise.all([store.fetchInvoices(), store.fetchSummary()])

const statusColors = {
  DRAFT: 'gray',
  SENT: 'blue',
  PARTIAL: 'orange',
  PAID: 'green',
  OVERDUE: 'red',
  CANCELLED: 'gray',
} as const

const isCreateOpen = ref(false)
const form = ref({
  invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
  clientName: '',
  clientEmail: '',
  dueDate: '',
  currency: 'USD',
  notes: '',
  lineItems: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0 }],
})

function addLineItem() {
  form.value.lineItems.push({ description: '', quantity: 1, unitPrice: 0, taxRate: 0 })
}

function removeLineItem(i: number) {
  form.value.lineItems.splice(i, 1)
}

const formTotal = computed(() =>
  form.value.lineItems.reduce((sum, li) => {
    const line = li.quantity * li.unitPrice
    return sum + line + line * (li.taxRate / 100)
  }, 0),
)

async function createInvoice() {
  await store.createInvoice(form.value as any)
  isCreateOpen.value = false
}

function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}
</script>

<template>
  <div class="p-4 lg:p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Financials</h1>
      <UButton icon="i-heroicons-plus" @click="isCreateOpen = true">New Invoice</UButton>
    </div>

    <!-- Summary cards -->
    <div v-if="store.summary" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard>
        <p class="text-xs text-gray-500 uppercase tracking-wide">Total Billed</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {{ formatCurrency(store.summary.totalBilled) }}
        </p>
      </UCard>
      <UCard>
        <p class="text-xs text-gray-500 uppercase tracking-wide">Collected</p>
        <p class="text-2xl font-bold text-green-600 mt-1">
          {{ formatCurrency(store.summary.totalPaid) }}
        </p>
      </UCard>
      <UCard>
        <p class="text-xs text-gray-500 uppercase tracking-wide">Outstanding</p>
        <p class="text-2xl font-bold text-orange-500 mt-1">
          {{ formatCurrency(store.summary.totalOutstanding) }}
        </p>
      </UCard>
      <UCard>
        <p class="text-xs text-gray-500 uppercase tracking-wide">Invoices</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
          {{ store.summary.invoiceCount }}
        </p>
      </UCard>
    </div>

    <!-- Invoices table -->
    <UCard>
      <template #header>
        <h2 class="font-semibold text-gray-900 dark:text-white">Invoices</h2>
      </template>

      <UTable
        :rows="store.invoices"
        :columns="[
          { key: 'invoiceNumber', label: 'Invoice #' },
          { key: 'clientName', label: 'Client' },
          { key: 'dueDate', label: 'Due Date' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: '' },
        ]"
      >
        <template #dueDate-data="{ row }">
          {{ new Date(row.dueDate).toLocaleDateString() }}
        </template>

        <template #status-data="{ row }">
          <UBadge :color="statusColors[row.status as keyof typeof statusColors]" variant="subtle">
            {{ row.status }}
          </UBadge>
        </template>

        <template #actions-data="{ row }">
          <div class="flex items-center gap-2">
            <NuxtLink :to="`/financials/invoices/${row.id}`">
              <UButton size="xs" variant="ghost" icon="i-heroicons-eye">View</UButton>
            </NuxtLink>
            <UButton
              size="xs"
              color="red"
              variant="ghost"
              icon="i-heroicons-trash"
              @click="store.deleteInvoice(row.id)"
            />
          </div>
        </template>
      </UTable>
    </UCard>

    <!-- Create invoice modal -->
    <UModal v-model="isCreateOpen" :ui="{ width: 'max-w-3xl' }">
      <UCard>
        <template #header>
          <h3 class="font-semibold text-gray-900 dark:text-white">New Invoice</h3>
        </template>

        <div class="space-y-6">
          <!-- Client info -->
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Invoice #">
              <UInput v-model="form.invoiceNumber" />
            </UFormGroup>
            <UFormGroup label="Currency">
              <USelect v-model="form.currency" :options="['USD', 'EUR', 'GBP', 'BRL']" />
            </UFormGroup>
            <UFormGroup label="Client Name" required>
              <UInput v-model="form.clientName" placeholder="Acme Corp" />
            </UFormGroup>
            <UFormGroup label="Client Email">
              <UInput v-model="form.clientEmail" type="email" placeholder="client@example.com" />
            </UFormGroup>
            <UFormGroup label="Due Date" required>
              <UInput v-model="form.dueDate" type="date" />
            </UFormGroup>
          </div>

          <!-- Line items -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <p class="text-sm font-medium text-gray-900 dark:text-white">Line Items</p>
              <UButton size="xs" variant="ghost" icon="i-heroicons-plus" @click="addLineItem">
                Add item
              </UButton>
            </div>

            <div class="space-y-2">
              <div
                v-for="(item, i) in form.lineItems"
                :key="i"
                class="grid grid-cols-12 gap-2 items-center"
              >
                <UInput v-model="item.description" placeholder="Description" class="col-span-5" />
                <UInput v-model.number="item.quantity" type="number" min="1" placeholder="Qty" class="col-span-2" />
                <UInput v-model.number="item.unitPrice" type="number" min="0" step="0.01" placeholder="Price" class="col-span-2" />
                <UInput v-model.number="item.taxRate" type="number" min="0" max="100" placeholder="Tax %" class="col-span-2" />
                <UButton icon="i-heroicons-x-mark" color="red" variant="ghost" size="xs" class="col-span-1" @click="removeLineItem(i)" />
              </div>
            </div>

            <div class="flex justify-end mt-4">
              <p class="text-lg font-bold text-gray-900 dark:text-white">
                Total: {{ formatCurrency(formTotal, form.currency) }}
              </p>
            </div>
          </div>

          <UFormGroup label="Notes">
            <UTextarea v-model="form.notes" placeholder="Payment terms, additional info..." :rows="2" />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="isCreateOpen = false">Cancel</UButton>
            <UButton @click="createInvoice">Create Invoice</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
