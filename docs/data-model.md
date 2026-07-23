<!-- managed-by: golden-path v1 -->
# Data Model

`vtex.search-resolver` does not own a persistent data model — it composes GraphQL resolvers over the catalog, messages, rewriter, and Intelligent Search services. The schema-of-record is `vtex.search-graphql/graphql/schema.graphql`.

## Resolver composition

```ts
// node/resolvers/index.ts
import { fieldResolvers as benefitsFieldResolvers } from './benefits'
import {
  fieldResolvers as searchFieldResolvers,
  queries as searchQueries,
} from './search'
import { queries as statsQueries } from './stats'

export const resolvers = {
  ...searchFieldResolvers,
  ...benefitsFieldResolvers,
  Query: {
    ...searchQueries,
    ...statsQueries,
  },
}
```

| Module | Owns | Key files |
|---|---|---|
| `node/resolvers/search/` | All catalog / search / autocomplete / product / brand / category / facets fields | `index.ts`, `product.ts`, `brand.ts`, `category.ts`, `autocomplete.ts`, `productPriceRange.ts`, `offer.ts`, `discount.ts`, `assemblyOption.ts`, `itemMetadata*.ts`, `newURLs.ts`, plus `modules/` |
| `node/resolvers/benefits/` | Product benefits (promotions, discount lists) field resolvers | — |
| `node/resolvers/stats/` | Statistics queries (top searches, etc.) | — |
| `node/directives/` | Schema directives (`@cacheControl`, `@withSegment`, etc.) | — |
| `node/commons/` | Shared helpers (caching keys, segment parsing) | — |
| `node/services/` | Higher-level service objects composed in resolvers | — |
| `node/utils/` | Pure utilities (`searchState`, query parsing, sluggers) | — |

## Clients (outbound)

| Client | File | Talks to | Notes |
|---|---|---|---|
| `search` | `node/clients/search.ts` | Legacy VTEX search backend | Cached (`searchCache`, capacity 3000, 6s timeout) |
| `intelligentSearchApi` | `node/clients/intelligent-search-api.ts` | `vtex.intelligent-search-api` (the IO app) | `ExternalClient`; routed through the IO mesh |
| `intsch` | `node/clients/intsch/` | Intelligent Search platform service directly | Lower-level; used when going through the IO app is not desirable |
| `checkout` | `node/clients/checkout.ts` | Checkout APIs | — |
| `rewriter` | `node/clients/rewriter.ts` | `vtex.rewriter` | URL/slug resolution |

## LRU caches (set in `node/index.ts`)

| Cache | Capacity | Backs |
|---|---|---|
| `segmentCache` | 1000 | Segment client |
| `searchCache` | 3000 | Legacy search client |
| `messagesCache` | 3000 | `messagesGraphQL` (translations) |
| `vbaseCache` | 3000 | `vbase` (per-account JSON storage) |
| `appsCache` | 1500 | `apps` client (`@vtex/api`) |
| `intschCache` | 3000 | Direct IS client |

## Settings (per-account behavior)

`manifest.json:settingsSchema` exposes three boolean flags:

| Flag | Default | Effect |
|---|---|---|
| `slugifyLinks` | `false` | When `true`, links are slugified via `slugify`; when `false`, the default catalog slug is used. |
| `shouldUseNewPDPEndpoint` | `false` | Routes PDP queries through the new IS endpoint instead of the legacy search backend. |
| `shouldUseNewPLPEndpoint` | `false` | Same as above, for PLP queries. |

These are read from VTEX **app settings** at runtime, not from FeatureHub.

## In-code feature flags

`node/featureFlags.ts` currently exports:

```ts
export const flags = {
  VTEX_ASSETS_URL: true,
}
```

Code-level toggles for behaviors not yet exposed as app settings. Treat as transitional.
