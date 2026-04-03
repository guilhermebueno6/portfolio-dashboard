import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../lib/prisma.js'

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string
    email: string
    name: string
    avatarUrl: string | null
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify()

    const payload = request.user as { id: string }
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, name: true, avatarUrl: true },
    })

    if (!user) {
      return reply.code(401).send({ error: 'User not found' })
    }

    // Attach full user to request
    ;(request as AuthenticatedRequest).user = user
  } catch (err) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }
}
