# Pickup-point availability and catalog count via search-resolver (with dpPreview)

## Context

`vtex.delivery-promise-components` calls two Intelligent Search (IS) endpoints
straight from the browser (`credentials: 'omit'`):

- `GET /api/intelligent-search/v0/pickup-point-availability/trade-policy/{sc}?zip-code&country`
- `GET /api/intelligent-search/v1/catalog-count?zip-code&coordinates`

Because these calls skip search-resolver, `dpPreview` is never sent, even on
accounts with the `enableDeliveryPromisePreview` app setting on. search-resolver
already forwards `dpPreview` for `productSearch` and `facets`. This change
exposes both endpoints as GraphQL queries so they get the same behavior.

Both IS routes build their search params through the shared
`build_search_params`, which forwards `dpPreview` only when it is `true`. No IS
change is needed.

## Scope

In scope: two `Intsch` client methods, two `Query` resolvers, tests,
CHANGELOG, a docs note, and the schema snippet for `vtex.search-graphql`.

Out of scope: the `vtex.search-graphql` PR itself, migrating
`delivery-promise-components` to the new queries, and `vtex link`, publish or
release.

## Design

No service layer. Each query is a pass-through: the resolver reads app
settings and calls the client, and the client builds the IS request.

### Client: `node/clients/intsch/index.ts`

```ts
pickupPointAvailability(args: {
  salesChannel: string
  zipCode: string
  country: string
  coordinates?: string // "longitude,latitude"
  dpPreview?: boolean
}): Promise<PickupPointAvailabilityResponse>
```

- Path: `/api/intelligent-search/v0/pickup-point-availability/trade-policy/${encodeURIComponent(salesChannel)}`
- Query: `zip-code`, `country`, `coordinates` (when present), and `dpPreview=true` only when `dpPreview` is true.
- Metric: `pickup-point-availability-new`.

```ts
catalogCount(args: {
  zipCode: string
  coordinates?: string // "longitude,latitude"
  salesChannel?: string
  dpPreview?: boolean
}): Promise<CatalogCountResponse>
```

- Path: `/api/intelligent-search/v1/catalog-count`, plus `/trade-policy/${encodeURIComponent(salesChannel)}` when `salesChannel` is set. The sales channel travels in the path, never as `sc`.
- Query: `zip-code`, `coordinates` (when present), and `dpPreview=true` only when `dpPreview` is true.
- Metric: `catalog-count-new-v1`.

Shared rules for both methods:

- Params go through `filterUndefinedNonNull`, so absent values are dropped.
- Header `VtexIdclientAutCookie` = `storeUserAuthToken ?? adminUserAuthToken` when present, same as `facets`.
- No hardcoded `x-vtex-user-agent`. `@vtex/api` stamps the app identity (`vtex.search-resolver`) on every request.

Response types go in `node/clients/intsch/types.ts` and mirror IS:

```ts
type PickupPointAvailabilityResponse = {
  pickupPointDistances?: Array<{
    pickupId: string
    pickupName: string
    distance: number
    isActive: boolean
    address?: {
      street?: string | null
      number?: string | null
      neighborhood?: string | null
      city?: string | null
      state?: string | null
      postalCode?: string | null
    }
  }>
}

type CatalogCountResponse = { total: number }
```

### Resolvers: `node/resolvers/search/index.ts`

```ts
pickupPointAvailability: async (_, args, ctx) => {
  const { enableDeliveryPromisePreview } = await fetchAppSettings(ctx)
  return ctx.clients.intsch.pickupPointAvailability({
    ...args,
    dpPreview: enableDeliveryPromisePreview,
  })
}

catalogCount: async (_, args, ctx) => {
  const [{ enableDeliveryPromisePreview }, segment] = await Promise.all([
    fetchAppSettings(ctx),
    args.salesChannel ? undefined : getOrCreateSegment(ctx),
  ])
  return ctx.clients.intsch.catalogCount({
    ...args,
    salesChannel: args.salesChannel || segment?.channel?.toString(),
    dpPreview: enableDeliveryPromisePreview,
  })
}
```

- `catalogCount` sales channel: the `salesChannel` arg if given, otherwise the
  shopper's segment channel (`getOrCreateSegment`, as `facets` uses). With neither, the path has no `trade-policy`,
  which matches today's browser call.
- The IS body is returned unchanged.
- Errors (for example IS `400` when the delivery context can't be resolved)
  propagate as GraphQL errors. Today the browser turns pickup errors into an
  empty list; that choice moves to the consumer.

### Schema additions for `vtex.search-graphql`

Apply these in a separate PR to `vtex.search-graphql`. The resolvers fail at
runtime until the fields exist in the schema.

```graphql
type Query {
  """
  Pickup points available for a trade policy and delivery location,
  sorted by distance. Mirrors IS v0 pickup-point-availability.
  """
  pickupPointAvailability(
    """Trade policy (sales channel) ID"""
    salesChannel: String!
    """Postal code"""
    zipCode: String!
    """ISO 3166 alpha-3 country code, e.g. BRA"""
    country: String!
    """Format: longitude,latitude. Used to sort pickup points by proximity."""
    coordinates: String
  ): PickupPointAvailability @cacheControl(scope: PRIVATE, maxAge: 120) @withSegment

  """
  Number of products deliverable to a location. Mirrors IS v1 catalog-count.
  A total of 0 means the postal code has no products.
  """
  catalogCount(
    """Postal code"""
    zipCode: String!
    """Format: longitude,latitude. Skips the postal-code lookup when present."""
    coordinates: String
    """Trade policy (sales channel) ID. Defaults to the segment sales channel."""
    salesChannel: String
  ): CatalogCount @cacheControl(scope: SEGMENT, maxAge: 120) @withSegment
}

type PickupPointAvailability {
  pickupPointDistances: [PickupPointDistance!]
}

type PickupPointDistance {
  pickupId: String!
  pickupName: String!
  distance: Float
  isActive: Boolean
  address: PickupPointAddress
}

type PickupPointAddress {
  street: String
  number: String
  neighborhood: String
  city: String
  state: String
  postalCode: String
}

type CatalogCount {
  total: Int!
}
```

## Decisions

**Auth token and caching.** The resolver sends the store auth token, as
`facets` does. IS treats both routes as public. Pickup v0 also runs a
sales-channel privacy check, so sending the token makes private sales channels
work; they fail today because the browser omits credentials. On the IS side,
catalog-count v1 sets `Cache-Control: public, max-age=600`, and pickup only
caches public sales channels. On the GraphQL side, `SEGMENT` scope plus the
query args form the cache key, so results are kept apart per zip code, country,
coordinates and sales channel. `catalogCount` uses `SEGMENT` scope, like
`facets` and `productSearch`: IS does no privacy check there and returns only a
count. `pickupPointAvailability` uses `PRIVATE` scope instead. Its
`salesChannel` is a free argument, not tied to the segment, and IS checks
private sales channels against the forwarded token. A `SEGMENT`-scoped cache
could therefore serve a private channel's pickup list to an anonymous shopper
on the same segment. IS still caches public sales channels for 10 minutes, so
the cost is small.

**`x-vtex-user-agent`.** Not hardcoded and not passed by the caller.
`@vtex/api` sets the app identity on outbound requests, so IS sees
`vtex.search-resolver` instead of `vtex.delivery-promise-components@1.x`. Any
dashboard that filters catalog-count traffic by the components' user agent
will need updating after the consumer migrates.

**`catalogCount` uses the catalog-count endpoint, not
`productSearch.recordsFiltered`.** The count could be derived from
`productSearch`, but catalog-count is cheaper: it asks the search engine for
the count only, with no product hydration and no price or availability
simulation. It also keeps the consumer's "`total === 0` means the postal code
is rejected" semantics exact, and it has its own 10-minute IS cache.

**Fields left out.** `businessHours` on pickup points (no consumer reads it)
and `locale`. Add them when a consumer needs them.

## Testing

- `node/clients/intsch/index.test.ts`
  - `pickupPointAvailability`: sends `dpPreview=true` when the flag is on and
    omits it when off; puts the sales channel in the path; sends
    `coordinates` only when given.
  - `catalogCount`: sends `dpPreview=true` when on and omits it when off;
    adds `/trade-policy/{sc}` only when a sales channel is given.
- Resolver test: with `enableDeliveryPromisePreview` on and off, the client
  receives `dpPreview: true` / `false`. `catalogCount` falls back to the
  segment channel when no `salesChannel` arg is given.
- `make check` (tsc + jest) passes.

## Docs

- `CHANGELOG.md`, under `Unreleased → Added`: the `pickupPointAvailability` and
  `catalogCount` queries, which forward `dpPreview` when
  `enableDeliveryPromisePreview` is on.
- `docs/data-model.md`: extend the `enableDeliveryPromisePreview` row to cover
  pickup-point-availability and catalog-count.
