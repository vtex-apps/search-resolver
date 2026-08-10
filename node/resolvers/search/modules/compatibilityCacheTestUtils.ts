import {
  categoryTreeChildrenCache,
  categoryTreeRootCache,
  searchUrlsCache,
  facetsCache,
} from './compatibilityCache'

// Test-only helper: resets all compatibility caches between test cases, since they
// are module-level singletons shared across the whole test run.
//
// @vtex/api's LRUCache only exposes get/getOrSet/set/has/getStats — no public
// clear()/reset(). `reset()` lives on the underlying lru-cache@5 instance kept in
// the private `storage` field, so we reach in via `as any`. If @vtex/api ever bumps
// to lru-cache@7+, this method is renamed (e.g. to `.clear()`) and this call throws a
// TypeError at runtime — acceptable here since this file is test-only infrastructure,
// so any such breakage surfaces immediately as a failing test run, not a production bug.
export const clearCompatibilityCaches = (): void => {
  const caches = [
    categoryTreeChildrenCache,
    categoryTreeRootCache,
    searchUrlsCache,
    facetsCache,
  ]

  caches.forEach((cache) => {
    const internalCache = cache as any

    internalCache.storage.reset()
  })
}
