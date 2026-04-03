import { FastifyInstance } from 'fastify'
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate.js'
import { calendarService } from './calendar.service.js'

export async function calendarRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  app.get('/events', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const { timeMin, timeMax, maxResults } = request.query as {
      timeMin?: string
      timeMax?: string
      maxResults?: string
    }
    try {
      const events = await calendarService.getEvents(user.id, {
        timeMin,
        timeMax,
        maxResults: maxResults ? parseInt(maxResults, 10) : undefined,
      })
      return reply.send({ events })
    } catch (err) {
      app.log.error(err)
      return reply.code(503).send({ error: 'Failed to fetch calendar events' })
    }
  })

  app.get('/calendars', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    try {
      const calendars = await calendarService.getCalendars(user.id)
      return reply.send({ calendars })
    } catch (err) {
      app.log.error(err)
      return reply.code(503).send({ error: 'Failed to fetch calendars' })
    }
  })
}
