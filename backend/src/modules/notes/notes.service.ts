import { prisma } from '../../lib/prisma.js'

export interface CreateNoteDto {
  title: string
  content?: string
  color?: string
  pinned?: boolean
  tags?: string[]
}

export const notesService = {
  async list(userId: string, search?: string) {
    return prisma.note.findMany({
      where: {
        userId,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    })
  },

  async getById(id: string, userId: string) {
    return prisma.note.findFirst({ where: { id, userId } })
  },

  async create(userId: string, data: CreateNoteDto) {
    return prisma.note.create({
      data: {
        userId,
        title: data.title,
        content: data.content ?? '',
        color: data.color ?? '#ffffff',
        pinned: data.pinned ?? false,
        tags: data.tags ?? [],
      },
    })
  },

  async update(id: string, userId: string, data: Partial<CreateNoteDto>) {
    return prisma.note.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.pinned !== undefined && { pinned: data.pinned }),
        ...(data.tags !== undefined && { tags: data.tags }),
      },
    })
  },

  async delete(id: string, userId: string) {
    return prisma.note.delete({ where: { id } })
  },
}
