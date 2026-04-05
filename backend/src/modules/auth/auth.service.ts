import { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma.js'

interface GoogleProfile {
  id: string
  email: string
  name: string
  picture?: string
}

interface GoogleTokens {
  access_token: string
  refresh_token?: string
  expiry_date?: number
}

export const authService = {
  async upsertGoogleUser(profile: GoogleProfile, tokens: GoogleTokens) {
    const tokenJson = tokens as unknown as Prisma.InputJsonValue
    return prisma.user.upsert({
      where: { googleId: profile.id },
      create: {
        googleId: profile.id,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture,
        googleTokens: tokenJson,
      },
      update: {
        name: profile.name,
        avatarUrl: profile.picture,
        googleTokens: tokenJson,
      },
    })
  },

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, avatarUrl: true, createdAt: true },
    })
  },

  async getUserGoogleTokens(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { googleTokens: true },
    })
    return user?.googleTokens as GoogleTokens | null
  },
}
