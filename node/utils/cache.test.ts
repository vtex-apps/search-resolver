import { LRUCache } from '@vtex/api'

import type { CacheEntry } from './cache'
import { getOrSet } from './cache'

describe('getOrSet', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns the cached value without calling the fetcher again on a hit within TTL', async () => {
    const cache = new LRUCache<string, CacheEntry<string>>({ max: 10 })
    const fetcher = jest.fn().mockResolvedValue('fresh-value')

    const first = await getOrSet(cache, 'key', fetcher)
    const second = await getOrSet(cache, 'key', fetcher)

    expect(first).toBe('fresh-value')
    expect(second).toBe('fresh-value')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('calls the fetcher again once the cached entry has expired', async () => {
    const cache = new LRUCache<string, CacheEntry<string>>({ max: 10 })
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce('first-value')
      .mockResolvedValueOnce('second-value')

    jest.spyOn(Date, 'now').mockReturnValue(1000)
    const first = await getOrSet(cache, 'key', fetcher, 10)

    jest.spyOn(Date, 'now').mockReturnValue(1011)
    const second = await getOrSet(cache, 'key', fetcher, 10)

    expect(first).toBe('first-value')
    expect(second).toBe('second-value')
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('stores a fresh entry keyed independently per cache key', async () => {
    const cache = new LRUCache<string, CacheEntry<string>>({ max: 10 })
    const fetcherA = jest.fn().mockResolvedValue('value-a')
    const fetcherB = jest.fn().mockResolvedValue('value-b')

    const a = await getOrSet(cache, 'key-a', fetcherA)
    const b = await getOrSet(cache, 'key-b', fetcherB)

    expect(a).toBe('value-a')
    expect(b).toBe('value-b')
  })

  it('propagates a fetcher rejection instead of swallowing it', async () => {
    const cache = new LRUCache<string, CacheEntry<string>>({ max: 10 })
    const fetcher = jest
      .fn()
      .mockRejectedValue(new Error('backend unavailable'))

    await expect(getOrSet(cache, 'key', fetcher)).rejects.toThrow(
      'backend unavailable'
    )
    expect(cache.has('key')).toBe(false)
  })
})
