import type { Cached, RecorderState } from '@vtex/api'
import { LRUCache, Service, method } from '@vtex/api'
import schema from 'vtex.search-graphql/graphql'

import { Clients } from './clients'
import { schemaDirectives } from './directives'
import { resolvers } from './resolvers'
import {
  setWorkspaceSearchParams,
  getWorkspaceSearchParams,
} from './routes/workspaceSearchParams'

const TWO_SECONDS_MS = 2 * 1000
const THREE_SECONDS_MS = 3 * 1000
const SIX_SECONDS_MS = 6 * 1000
const NINE_SECONDS_MS = 9 * 1000

// Segments are small and immutable.
const MAX_SEGMENT_CACHE = 10000
const segmentCache = new LRUCache<string, Cached>({ max: MAX_SEGMENT_CACHE })
const searchCache = new LRUCache<string, Cached>({ max: 3000 })
const messagesCache = new LRUCache<string, Cached>({ max: 3000 })
const vbaseCache = new LRUCache<string, Cached>({ max: 3000 })
const appsCache = new LRUCache<string, Cached>({ max: 3000 })

metrics.trackCache('segment', segmentCache)
metrics.trackCache('search', searchCache)
metrics.trackCache('messages', messagesCache)
metrics.trackCache('vbase', vbaseCache)

export default new Service<Clients, RecorderState, CustomContext>({
  clients: {
    implementation: Clients,
    options: {
      default: {
        retries: 2,
        timeout: THREE_SECONDS_MS,
      },
      apps: {
        retries: 2,
        concurrency: 5,
        memoryCache: appsCache,
        timeout: TWO_SECONDS_MS,
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
      intelligentSearchApi: {
        retries: 0,
        concurrency: 10,
        timeout: NINE_SECONDS_MS,
      },
      rewriter: {
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
  routes: {
    setWorkspaceSearchParams: method({
      GET: setWorkspaceSearchParams,
    }),
    getWorkspaceSearchParams: method({
      GET: getWorkspaceSearchParams,
    }),
  },
})
