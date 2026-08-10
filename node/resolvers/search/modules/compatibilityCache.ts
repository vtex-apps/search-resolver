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
