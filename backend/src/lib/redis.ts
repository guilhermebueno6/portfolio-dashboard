import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
  retryStrategy: (times) => Math.min(times * 100, 3000),
})

redis.on('connect', () => console.log('✅ Redis connected'))
redis.on('error', (err) => console.error('❌ Redis error:', err))

// Helper: Cache wrapper
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached) as T

  const result = await fn()
  await redis.set(key, JSON.stringify(result), 'EX', ttlSeconds)
  return result
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) await redis.del(...keys)
}
