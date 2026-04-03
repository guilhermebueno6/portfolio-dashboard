import { FastifyInstance } from 'fastify'
import { authenticate } from '../../middleware/authenticate.js'
import { feedsService } from './feeds.service.js'

export async function feedsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  app.get('/weather', async (request, reply) => {
    const { city = 'London' } = request.query as { city?: string }
    try {
      const weather = await feedsService.getWeather(city)
      return reply.send({ weather })
    } catch (err) {
      app.log.error(err)
      return reply.code(503).send({ error: 'Failed to fetch weather' })
    }
  })

  app.get('/weather/forecast', async (request, reply) => {
    const { city = 'London' } = request.query as { city?: string }
    try {
      const forecast = await feedsService.getForecast(city)
      return reply.send({ forecast })
    } catch (err) {
      return reply.code(503).send({ error: 'Failed to fetch forecast' })
    }
  })

  app.get('/news', async (request, reply) => {
    const { q, pageSize } = request.query as { q?: string; pageSize?: string }
    try {
      const articles = await feedsService.getNews(q, pageSize ? parseInt(pageSize) : 10)
      return reply.send({ articles })
    } catch (err) {
      app.log.error(err)
      return reply.code(503).send({ error: 'Failed to fetch news' })
    }
  })
}
