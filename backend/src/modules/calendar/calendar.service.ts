import axios from 'axios'
import { authService } from '../auth/auth.service.js'
import { withCache } from '../../lib/redis.js'

const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3'

async function getAuthHeaders(userId: string) {
  const tokens = await authService.getUserGoogleTokens(userId)
  if (!tokens?.access_token) throw new Error('No Google tokens found')
  return { Authorization: `Bearer ${tokens.access_token}` }
}

export const calendarService = {
  async getEvents(
    userId: string,
    options: { timeMin?: string; timeMax?: string; maxResults?: number } = {},
  ) {
    const cacheKey = `calendar:events:${userId}:${options.timeMin}:${options.timeMax}`
    return withCache(cacheKey, 60 * 5, async () => {
      const headers = await getAuthHeaders(userId)
      const { data } = await axios.get(`${CALENDAR_BASE}/calendars/primary/events`, {
        headers,
        params: {
          timeMin: options.timeMin ?? new Date().toISOString(),
          timeMax:
            options.timeMax ??
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          maxResults: options.maxResults ?? 20,
          singleEvents: true,
          orderBy: 'startTime',
        },
      })
      return data.items ?? []
    })
  },

  async getCalendars(userId: string) {
    const cacheKey = `calendar:list:${userId}`
    return withCache(cacheKey, 60 * 30, async () => {
      const headers = await getAuthHeaders(userId)
      const { data } = await axios.get(`${CALENDAR_BASE}/users/me/calendarList`, {
        headers,
      })
      return data.items ?? []
    })
  },
}
