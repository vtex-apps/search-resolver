import { LRUCache } from '@vtex/api'

import type { CacheEntry } from '../../../utils/cache'

export const categoryTreeChildrenCache = new LRUCache<string, CacheEntry<any>>({
  max: 2000,
})
export const categoryTreeRootCache = new LRUCache<string, CacheEntry<any>>({
  max: 5,
})
export const searchUrlsCache = new LRUCache<string, CacheEntry<any>>({
  max: 3000,
})
export const facetsCache = new LRUCache<string, CacheEntry<any>>({ max: 3000 })

export const clearCompatibilityCaches = (): void => {
  const caches = [
    categoryTreeChildrenCache,
    categoryTreeRootCache,
    searchUrlsCache,
    facetsCache,
  ]

  caches.forEach((cache) => {
    // @vtex/api's LRUCache only exposes get/getOrSet/set/has/getStats — no public
    // clear()/reset(). `reset()` lives on the underlying lru-cache@5 instance kept in
    // the private `storage` field, so we reach in via `as any`. If @vtex/api ever bumps
    // to lru-cache@7+, this method is renamed (e.g. to `.clear()`) and this call will
    // throw a TypeError at runtime.
    const internalCache = cache as any

    internalCache.storage.reset()
  })
}
