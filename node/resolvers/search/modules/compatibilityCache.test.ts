import { getOrSet } from '../../../utils/cache'
import {
  categoryTreeChildrenCache,
  categoryTreeRootCache,
  searchUrlsCache,
  facetsCache,
  clearCompatibilityCaches,
} from './compatibilityCache'

describe('clearCompatibilityCaches', () => {
  it('empties every compatibility cache', async () => {
    const caches = [
      categoryTreeChildrenCache,
      categoryTreeRootCache,
      searchUrlsCache,
      facetsCache,
    ]

    await Promise.all(
      caches.map(cache => getOrSet(cache, 'some-key', async () => 'some-value'))
    )

    caches.forEach(cache => expect(cache.has('some-key')).toBe(true))

    clearCompatibilityCaches()

    caches.forEach(cache => expect(cache.has('some-key')).toBe(false))
  })
})
