import { FastifyInstance } from 'fastify'
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate.js'
import { notesService } from './notes.service.js'
import { publishEvent } from '../../lib/socket.js'

export async function notesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  app.get('/', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const { q } = request.query as { q?: string }
    const notes = await notesService.list(user.id, q)
    return reply.send({ notes })
  })

  app.get('/:id', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const { id } = request.params as { id: string }
    const note = await notesService.getById(id, user.id)
    if (!note) return reply.code(404).send({ error: 'Note not found' })
    return reply.send({ note })
  })

  app.post('/', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const note = await notesService.create(user.id, request.body as any)
    await publishEvent(user.id, { type: 'note:updated', payload: { note, action: 'created' } })
    return reply.code(201).send({ note })
  })

  app.patch('/:id', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const { id } = request.params as { id: string }
    const note = await notesService.update(id, user.id, request.body as any)
    await publishEvent(user.id, { type: 'note:updated', payload: { note, action: 'updated' } })
    return reply.send({ note })
  })

  app.delete('/:id', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const { id } = request.params as { id: string }
    await notesService.delete(id, user.id)
    return reply.code(204).send()
  })
}
