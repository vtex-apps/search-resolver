import './globals'

import { Cached, LRUCache, RecorderState, Service } from '@vtex/api'
import schema from 'vtex.search-graphql/graphql'

import { Clients } from './clients'
import { schemaDirectives } from './directives'
import { resolvers } from './resolvers'

const TWO_SECONDS_MS = 2 * 1000
const THREE_SECONDS_MS = 3 * 1000
const SIX_SECONDS_MS = 6 * 1000

// Segments are small and immutable.
const MAX_SEGMENT_CACHE = 10000
const segmentCache = new LRUCache<string, Cached>({ max: MAX_SEGMENT_CACHE })
const searchCache = new LRUCache<string, Cached>({ max: 3000 })
const messagesCache = new LRUCache<string, Cached>({ max: 3000 })
const vbaseCache = new LRUCache<string, Cached>({ max: 3000 })

const biggySearchCache = new LRUCache<string, Cached>({ max: 300 })

metrics.trackCache('segment', segmentCache)
metrics.trackCache('search', searchCache)
metrics.trackCache('messages', messagesCache)
metrics.trackCache('vbase', vbaseCache)
metrics.trackCache('biggySearch', biggySearchCache)

export default new Service<Clients, RecorderState, CustomContext>({
  clients: {
    implementation: Clients,
    options: {
      default: {
        retries: 2,
        timeout: THREE_SECONDS_MS,
      },
      messagesGraphQL: {
        concurrency: 10,
        memoryCache: messagesCache,
        timeout: TWO_SECONDS_MS,
      },
      segment: {
        concurrency: 10,
        memoryCache: segmentCache,
        timeout: THREE_SECONDS_MS,
      },
      search: {
        concurrency: 10,
        memoryCache: searchCache,
        timeout: SIX_SECONDS_MS,
      },
      biggySearch: {
        concurrency: 10,
        memoryCache: biggySearchCache,
        timeout: SIX_SECONDS_MS,
      },
      vbase: {
        concurrency: 2,
        memoryCache: vbaseCache,
        timeout: TWO_SECONDS_MS,
      },
    },
  },
  graphql: {
    resolvers,
    schema,
    schemaDirectives,
  },
})
