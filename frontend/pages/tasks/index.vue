<script setup lang="ts">
import type { Task, TaskStatus, Priority } from '~/types'

definePageMeta({ middleware: 'auth' })

const tasksStore = useTasksStore()
await tasksStore.fetchTasks()

const { connect, on } = useWebSocket()
onMounted(() => {
  connect()
  on((event) => {
    if (event.type === 'task:updated') {
      tasksStore.applyWsUpdate(event.payload)
    }
  })
})

// Kanban columns
const columns: { label: string; key: TaskStatus; color: string }[] = [
  { label: 'To Do', key: 'TODO', color: 'gray' },
  { label: 'In Progress', key: 'IN_PROGRESS', color: 'blue' },
  { label: 'Done', key: 'DONE', color: 'green' },
]

const isCreateOpen = ref(false)
const newTask = ref({ title: '', description: '', priority: 'MEDIUM' as Priority, dueDate: '' })
const creating = ref(false)

async function createTask() {
  if (!newTask.value.title.trim()) return
  creating.value = true
  try {
    await tasksStore.createTask({
      title: newTask.value.title,
      description: newTask.value.description || undefined,
      priority: newTask.value.priority,
      dueDate: newTask.value.dueDate || undefined,
    })
    newTask.value = { title: '', description: '', priority: 'MEDIUM', dueDate: '' }
    isCreateOpen.value = false
  } finally {
    creating.value = false
  }
}

async function moveTask(task: Task, status: TaskStatus) {
  await tasksStore.updateTask(task.id, { status })
}

const priorityColors = { LOW: 'gray', MEDIUM: 'blue', HIGH: 'orange', URGENT: 'red' } as const
</script>

<template>
  <div class="p-4 lg:p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {{ tasksStore.tasks.filter(t => t.status !== 'DONE').length }} active tasks
        </p>
      </div>
      <UButton icon="i-heroicons-plus" @click="isCreateOpen = true">New Task</UButton>
    </div>

    <!-- Kanban board -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div
        v-for="col in columns"
        :key="col.key"
        class="rounded-xl bg-gray-100 dark:bg-gray-800/50 p-4"
      >
        <div class="flex items-center gap-2 mb-4">
          <UBadge :color="col.color as any" variant="subtle" class="font-semibold">
            {{ col.label }}
          </UBadge>
          <span class="text-xs text-gray-500">{{ tasksStore.byStatus[col.key].length }}</span>
        </div>

        <div class="space-y-3">
          <UCard
            v-for="task in tasksStore.byStatus[col.key]"
            :key="task.id"
            class="cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
          >
            <div class="space-y-2">
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ task.title }}</p>
                <UBadge
                  :color="priorityColors[task.priority]"
                  variant="subtle"
                  size="xs"
                  class="flex-shrink-0"
                >
                  {{ task.priority }}
                </UBadge>
              </div>

              <p v-if="task.description" class="text-xs text-gray-500 line-clamp-2">
                {{ task.description }}
              </p>

              <!-- Subtasks progress -->
              <div v-if="task.subtasks.length > 0" class="space-y-1">
                <div class="flex items-center justify-between text-xs text-gray-500">
                  <span>Subtasks</span>
                  <span>{{ task.subtasks.filter(s => s.done).length }}/{{ task.subtasks.length }}</span>
                </div>
                <UProgress
                  :value="task.subtasks.filter(s => s.done).length"
                  :max="task.subtasks.length"
                  size="xs"
                />
              </div>

              <!-- Footer -->
              <div class="flex items-center justify-between">
                <span v-if="task.dueDate" class="text-xs text-gray-400">
                  <UIcon name="i-heroicons-calendar" class="h-3 w-3 inline mr-0.5" />
                  {{ new Date(task.dueDate).toLocaleDateString() }}
                </span>

                <!-- Move buttons -->
                <div class="flex gap-1">
                  <UButton
                    v-if="col.key !== 'TODO'"
                    icon="i-heroicons-arrow-left"
                    size="2xs"
                    color="gray"
                    variant="ghost"
                    @click.stop="moveTask(task, columns[columns.findIndex(c => c.key === col.key) - 1].key)"
                  />
                  <UButton
                    v-if="col.key !== 'DONE'"
                    icon="i-heroicons-arrow-right"
                    size="2xs"
                    color="gray"
                    variant="ghost"
                    @click.stop="moveTask(task, columns[columns.findIndex(c => c.key === col.key) + 1].key)"
                  />
                  <UButton
                    icon="i-heroicons-trash"
                    size="2xs"
                    color="red"
                    variant="ghost"
                    @click.stop="tasksStore.deleteTask(task.id)"
                  />
                </div>
              </div>
            </div>
          </UCard>

          <!-- Empty state -->
          <div
            v-if="tasksStore.byStatus[col.key].length === 0"
            class="text-center py-8 text-xs text-gray-400"
          >
            No tasks here
          </div>
        </div>
      </div>
    </div>

    <!-- Create task modal -->
    <UModal v-model="isCreateOpen">
      <UCard>
        <template #header>
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">New Task</h3>
        </template>

        <div class="space-y-4">
          <UFormGroup label="Title" required>
            <UInput v-model="newTask.title" placeholder="What needs to be done?" autofocus />
          </UFormGroup>

          <UFormGroup label="Description">
            <UTextarea v-model="newTask.description" placeholder="Add details..." :rows="3" />
          </UFormGroup>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Priority">
              <USelect
                v-model="newTask.priority"
                :options="['LOW', 'MEDIUM', 'HIGH', 'URGENT']"
              />
            </UFormGroup>

            <UFormGroup label="Due Date">
              <UInput v-model="newTask.dueDate" type="date" />
            </UFormGroup>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="isCreateOpen = false">Cancel</UButton>
            <UButton :loading="creating" @click="createTask">Create Task</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>
