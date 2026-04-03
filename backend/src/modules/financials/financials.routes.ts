import { FastifyInstance } from 'fastify'
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate.js'
import { financialsService } from './financials.service.js'
import { InvoiceStatus } from '@prisma/client'

export async function financialsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticate)

  app.get('/summary', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const summary = await financialsService.getSummary(user.id)
    return reply.send({ summary })
  })

  app.get('/invoices', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const { status } = request.query as { status?: InvoiceStatus }
    const invoices = await financialsService.listInvoices(user.id, status)
    return reply.send({ invoices })
  })

  app.get('/invoices/:id', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const { id } = request.params as { id: string }
    const invoice = await financialsService.getInvoice(id, user.id)
    if (!invoice) return reply.code(404).send({ error: 'Invoice not found' })
    return reply.send({ invoice })
  })

  app.post('/invoices', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const invoice = await financialsService.createInvoice(user.id, request.body as any)
    return reply.code(201).send({ invoice })
  })

  app.patch('/invoices/:id/status', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const { id } = request.params as { id: string }
    const { status } = request.body as { status: InvoiceStatus }
    const invoice = await financialsService.updateStatus(id, user.id, status)
    return reply.send({ invoice })
  })

  app.post('/invoices/:id/payments', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const { id } = request.params as { id: string }
    const payment = await financialsService.addPayment(id, user.id, request.body as any)
    if (!payment) return reply.code(404).send({ error: 'Invoice not found' })
    return reply.code(201).send({ payment })
  })

  app.delete('/invoices/:id', async (request, reply) => {
    const user = (request as AuthenticatedRequest).user
    const { id } = request.params as { id: string }
    await financialsService.deleteInvoice(id, user.id)
    return reply.code(204).send()
  })
}
