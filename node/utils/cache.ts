import type { LRUCache } from '@vtex/api'

export const DEFAULT_TTL_MS = 30 * 60 * 1000

export interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export const getOrSet = async <T>(
  cache: LRUCache<string, CacheEntry<T>>,
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> => {
  const cached = cache.get(key)

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value
  }

  const value = await fetcher()
  const now: number = Date.now()
  const expiresAt: number = now + ttlMs

  cache.set(key, { value, expiresAt })

  return value
}
