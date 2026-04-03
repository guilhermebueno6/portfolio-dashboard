import { prisma } from '../../lib/prisma.js'
import { TaskStatus, Priority } from '@prisma/client'

export interface CreateTaskDto {
  title: string
  description?: string
  status?: TaskStatus
  priority?: Priority
  dueDate?: string
  tags?: string[]
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {
  order?: number
}

export const tasksService = {
  async list(userId: string, filters?: { status?: TaskStatus }) {
    return prisma.task.findMany({
      where: { userId, ...(filters?.status ? { status: filters.status } : {}) },
      include: { subtasks: { orderBy: { order: 'asc' } } },
      orderBy: [{ status: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
    })
  },

  async getById(id: string, userId: string) {
    return prisma.task.findFirst({
      where: { id, userId },
      include: { subtasks: { orderBy: { order: 'asc' } } },
    })
  },

  async create(userId: string, data: CreateTaskDto) {
    return prisma.task.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        status: data.status ?? TaskStatus.TODO,
        priority: data.priority ?? Priority.MEDIUM,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        tags: data.tags ?? [],
      },
      include: { subtasks: true },
    })
  },

  async update(id: string, userId: string, data: UpdateTaskDto) {
    return prisma.task.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.dueDate !== undefined && { dueDate: new Date(data.dueDate) }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.order !== undefined && { order: data.order }),
      },
      include: { subtasks: true },
    })
  },

  async delete(id: string, userId: string) {
    return prisma.task.delete({ where: { id } })
  },

  async addSubtask(taskId: string, userId: string, title: string) {
    // Verify ownership
    const task = await prisma.task.findFirst({ where: { id: taskId, userId } })
    if (!task) return null

    const count = await prisma.subtask.count({ where: { taskId } })
    return prisma.subtask.create({ data: { taskId, title, order: count } })
  },

  async toggleSubtask(subtaskId: string) {
    const sub = await prisma.subtask.findUnique({ where: { id: subtaskId } })
    if (!sub) return null
    return prisma.subtask.update({
      where: { id: subtaskId },
      data: { done: !sub.done },
    })
  },
}
