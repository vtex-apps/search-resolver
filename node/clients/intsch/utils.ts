/**
 * Drops keys whose value is `undefined` from a plain object.
 * Keeps `false`, '' and `0` (needed for valid API semantics).
 */
export function filterUndefinedNonNull<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null)
  ) as Partial<T>
}

/**
 * Query parameter names accepted by intelligent-search API `GetQuery`
 * (`intelligent-search-api` crate, `product_search_api.rs`).
 * Used to strip unknown keys (e.g. from GraphQL args spread or `searchState` JSON).
 *
 * Includes serde `rename` query keys (`biggy-search`, `show-invisible-items`, `zip-code`)
 * and common aliases (`q`, `p`, …).
 */
export const INTELLIGENT_SEARCH_PRODUCT_QUERY_KEYS = new Set<string>([
  'an',
  'query',
  'q',
  'page',
  'p',
  'count',
  'c',
  'sort',
  's',
  'operator',
  'o',
  'fuzzy',
  'f',
  'from',
  'to',
  'biggy-search',
  'location',
  'image',
  'hideUnavailableItems',
  'locale',
  'letorEnabled',
  'letorModel',
  'merchRulesEnabled',
  'priorityBoostsEnabled',
  'secondaryBoostsEnabled',
  'privateSellersFiltersEnabled',
  'regionalizationTradePolicy',
  'regionalizationV2',
  'regionalizationBehavior',
  'regionId',
  'allowRedirect',
  'bgy_leap',
  'initialAttributes',
  'searchState',
  'term',
  'letorWindowSize',
  'v',
  'dynamicRule',
  'show-invisible-items',
  'metaId',
  'seller',
  'deliveryChannel',
  'deliveryZonesHash',
  'pickupPointHash',
  'pickupPoint',
  'timeZone',
  'semanticProducts',
  'semanticModel',
  'semanticCandidates',
  'semanticRatio',
  'semanticSimilarity',
  'semanticBinning',
  'semanticBinningPower',
  'semanticFusionFunction',
  'origin',
  'sc',
  'advertisementPlacement',
  'showSponsored',
  'sponsoredCount',
  'repeatSponsoredProducts',
  'productOriginVtex',
  'zip-code',
  'coordinates',
  'country',
  'utmSource',
  'utmCampaign',
  'utmiCampaign',
  'campaigns',
  'priceTables',
  'simulationBehavior',
  'variant',
])

export function filterByAllowedIntelligentSearchQueryKeys(
  obj: Record<string, unknown>,
  allowedKeys: Set<string> = INTELLIGENT_SEARCH_PRODUCT_QUERY_KEYS
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => allowedKeys.has(key))
  )
}
