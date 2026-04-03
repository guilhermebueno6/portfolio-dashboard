import { FastifyInstance } from 'fastify'
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate.js'
import { tasksService } from './tasks.service.js'
import { publishEvent } from '../../lib/socket.js'
import { z } from 'zod'

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
})

export async function tasksRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  // GET /api/tasks
  app.get('/', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const query = request.query as { status?: string }
    const tasks = await tasksService.list(user.id, {
      status: query.status as any,
    })
    return reply.send({ tasks })
  })

  // GET /api/tasks/:id
  app.get('/:id', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const { id } = request.params as { id: string }
    const task = await tasksService.getById(id, user.id)
    if (!task) return reply.code(404).send({ error: 'Task not found' })
    return reply.send({ task })
  })

  // POST /api/tasks
  app.post('/', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const body = CreateTaskSchema.parse(request.body)
    const task = await tasksService.create(user.id, body)
    await publishEvent(user.id, { type: 'task:updated', payload: { task, action: 'created' } })
    return reply.code(201).send({ task })
  })

  // PATCH /api/tasks/:id
  app.patch('/:id', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const { id } = request.params as { id: string }
    const body = CreateTaskSchema.partial().parse(request.body)
    const task = await tasksService.update(id, user.id, body)
    await publishEvent(user.id, { type: 'task:updated', payload: { task, action: 'updated' } })
    return reply.send({ task })
  })

  // DELETE /api/tasks/:id
  app.delete('/:id', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const { id } = request.params as { id: string }
    await tasksService.delete(id, user.id)
    await publishEvent(user.id, { type: 'task:updated', payload: { id, action: 'deleted' } })
    return reply.code(204).send()
  })

  // POST /api/tasks/:id/subtasks
  app.post('/:id/subtasks', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const { id } = request.params as { id: string }
    const { title } = request.body as { title: string }
    const subtask = await tasksService.addSubtask(id, user.id, title)
    if (!subtask) return reply.code(404).send({ error: 'Task not found' })
    return reply.code(201).send({ subtask })
  })

  // PATCH /api/tasks/subtasks/:subtaskId/toggle
  app.patch('/subtasks/:subtaskId/toggle', async (request, reply) => {
    const { subtaskId } = request.params as { subtaskId: string }
    const subtask = await tasksService.toggleSubtask(subtaskId)
    if (!subtask) return reply.code(404).send({ error: 'Subtask not found' })
    return reply.send({ subtask })
  })
}
