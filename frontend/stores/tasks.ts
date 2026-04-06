import { defineStore } from 'pinia'
import type { Task, TaskStatus } from '~/types'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const { $api } = useApi()

  const byStatus = computed(() => ({
    TODO: tasks.value.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: tasks.value.filter((t) => t.status === 'IN_PROGRESS'),
    DONE: tasks.value.filter((t) => t.status === 'DONE'),
    ARCHIVED: tasks.value.filter((t) => t.status === 'ARCHIVED'),
  }))

  async function fetchTasks(status?: TaskStatus) {
    loading.value = true
    error.value = null
    try {
      const params = status ? `?status=${status}` : ''
      const { tasks: data } = await $api<{ tasks: Task[] }>(`/api/tasks${params}`)
      tasks.value = data
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createTask(payload: Partial<Task>) {
    const { task } = await $api<{ task: Task }>('/api/tasks', {
      method: 'POST',
      body: payload,
    })
    // Guard against race condition: WS event may have already added the task
    if (!tasks.value.some((t) => t.id === task.id)) {
      tasks.value.unshift(task)
    }
    return task
  }

  async function updateTask(id: string, payload: Partial<Task>) {
    const { task } = await $api<{ task: Task }>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: payload,
    })
    const idx = tasks.value.findIndex((t) => t.id === id)
    if (idx !== -1) tasks.value[idx] = task
    return task
  }

  async function deleteTask(id: string) {
    await $api(`/api/tasks/${id}`, { method: 'DELETE' })
    tasks.value = tasks.value.filter((t) => t.id !== id)
  }

  async function toggleSubtask(taskId: string, subtaskId: string) {
    const { subtask } = await $api<{ subtask: any }>(
      `/api/tasks/subtasks/${subtaskId}/toggle`,
      { method: 'PATCH' },
    )
    const task = tasks.value.find((t) => t.id === taskId)
    if (task) {
      const sub = task.subtasks.find((s) => s.id === subtaskId)
      if (sub) sub.done = subtask.done
    }
    return subtask
  }

  // WebSocket: patch in real-time updates from other sessions
  function applyWsUpdate(payload: { task?: Task; id?: string; action: string }) {
    if (payload.action === 'deleted' && payload.id) {
      tasks.value = tasks.value.filter((t) => t.id !== payload.id)
    } else if (payload.task) {
      const idx = tasks.value.findIndex((t) => t.id === payload.task!.id)
      if (idx !== -1) tasks.value[idx] = payload.task
      else if (payload.action === 'created') tasks.value.unshift(payload.task)
    }
  }

  return {
    tasks,
    loading,
    error,
    byStatus,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleSubtask,
    applyWsUpdate,
  }
})
