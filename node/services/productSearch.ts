import {
  buildAttributePath,
  convertOrderBy,
} from '../commons/compatibility-layer'
import { getWorkspaceSearchParamsFromStorage } from '../routes/workspaceSearchParams'
import {
  compareApiResults,
  type ExistenceComparePattern,
  type IgnoredDifference,
} from '../utils/compareResults'
import { fetchAppSettings } from './settings'
import type { ProductSearchInput } from '../typings/Search'
import { decodeQuery } from '../clients/intelligent-search-api'
import { parseState } from '../utils/searchState'

/**
 * Fields that should use existence-based (key-based) comparison instead of
 * position-based comparison when diffing product_search responses.
 * Must match the config used in intelligent-search/test-local-product-search-api.js.
 */
export const PRODUCT_SEARCH_EXISTENCE_COMPARE_FIELDS: ExistenceComparePattern[] =
  [
    'products[*].categories',
    'products[*].categoriesIds',
    { path: 'products[*].specificationGroups', key: 'name' },
    { path: 'products[*].properties', key: 'name' },
    { path: 'products[*].skuSpecifications', key: 'field.name' },
  ]

/**
 * Known expected differences to ignore when comparing product_search responses.
 * Must match the IGNORED_PATHS in intelligent-search/test-local-product-search-api.js.
 *
 * Type mapping from intelligent-search → search-resolver:
 *   value_mismatch       → different_value
 *   missing_in_production → missing_key   (exists in b/intsch but not in a/biggy)
 *   missing_in_local      → extra_key     (exists in a/biggy but not in b/intsch)
 *   null_mismatch         → null_mismatch
 *   array_length_mismatch → array_length_mismatch
 */
export const PRODUCT_SEARCH_IGNORED_DIFFERENCES: IgnoredDifference[] = [
  // recordsFiltered can differ because the request might go to different nodes
  { path: 'recordsFiltered', type: 'different_value' },
  // Pagination proxy URLs are assembled differently
  { path: 'pagination.before[*].proxyUrl', type: 'different_value' },
  { path: 'pagination.after[*].proxyUrl', type: 'different_value' },
  { path: 'pagination.next.proxyUrl', type: 'different_value' },
  { path: 'pagination.last.proxyUrl', type: 'different_value' },
  { path: 'pagination.current.proxyUrl', type: 'different_value' },
  // cacheId differs because of sponsored products middleware on node
  { path: 'products[*].cacheId', type: 'different_value' },
  // productReference: intsch sends this but biggy always returns ""
  { path: 'products[*].productReference', type: 'different_value' },
  { path: 'products[*].productReference', type: 'missing_key' },
  // metaTagDescription: intsch sends this but biggy always returns ""
  { path: 'products[*].metaTagDescription', type: 'different_value' },
  // isKit: intsch sends this but biggy always returns "false"
  { path: 'products[*].items[*].isKit', type: 'different_value' },
  // modalType: intsch sends this but biggy always returns ""
  { path: 'products[*].items[*].modalType', type: 'different_value' },
  // PriceValidUntil changes with each request
  {
    path: 'products[*].items[*].sellers[*].commertialOffer.PriceValidUntil',
    type: 'different_value',
  },
  // imageText: intsch sends this but biggy always returns ""
  { path: 'products[*].items[*].images[*].imageText', type: 'different_value' },
  // attachments: intsch sends this but biggy always returns an empty array
  {
    path: 'products[*].items[*].attachments',
    type: 'array_length_mismatch',
  },
  { path: 'products[*].items[*].attachments[*]', type: 'missing_key' },
  // sellerId in specificationGroups/properties: no longer sent by intsch
  {
    path: 'products[*].specificationGroups[name:allSpecifications].specifications[name:sellerId]',
    type: 'extra_key',
  },
  { path: 'products[*].properties[name:sellerId]', type: 'extra_key' },
  // productTitle: no longer sent by intsch because it is always empty
  { path: 'products[*].productTitle', type: 'extra_key' },
  // description: differs because intsch gets the raw value from catalog without cropping
  { path: 'products[*].description', type: 'different_value' },
  // taxPercentage: biggy sends 0 or null, intsch always sends 0
  {
    path: 'products[*].items[*].sellers[*].commertialOffer.taxPercentage',
    type: 'null_mismatch',
  },
  // searchId is always different
  { path: 'searchId', type: 'different_value' },
  // allSpecifications group can be missing when product has no specs (biggy always returns sellerId there)
  {
    path: 'products[*].specificationGroups[name:allSpecifications]',
    type: 'extra_key',
  },
]

/**
 * Builds a query string from an object of params, filtering out undefined/null values
 */
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  }

  return searchParams.toString()
}

/**
 * Builds curl commands for debugging API requests
 */
// eslint-disable-next-line max-params
function buildCurlCommands(
  ctx: Context,
  path: string,
  params: Record<string, any>,
  shippingOptions?: string[]
): { biggyCurl: string; intschCurl: string } {
  const { account } = ctx.vtex
  const queryString = buildQueryString(params)

  const shippingHeader = shippingOptions?.length
    ? ` -H "x-vtex-shipping-options: ${shippingOptions.join(',')}"`
    : ''

  const segmentHeader = ctx.vtex.segmentToken
    ? ` -H "x-vtex-segment: ${ctx.vtex.segmentToken}"`
    : ''

  const biggyCurl = `curl "https://${account}.myvtex.com/_v/api/intelligent-search/product_search/${path}?${queryString}"${shippingHeader}${segmentHeader}`
  const intschCurl = `curl "https://${account}.myvtex.com/api/intelligent-search/v0/product-search/${path}?${queryString}"${shippingHeader}${segmentHeader}`

  return { biggyCurl, intschCurl }
}

const defaultAdvertisementOptions = {
  showSponsored: false,
  sponsoredCount: 3,
  repeatSponsoredProducts: true,
}

/**
 * Fetches product search results using the intelligentSearchApi client (Biggy)
 */
// eslint-disable-next-line max-params
async function fetchProductSearchFromBiggy(
  ctx: Context,
  args: ProductSearchInput,
  selectedFacets: SelectedFacet[],
  shippingOptions?: string[]
) {
  const { intelligentSearchApi } = ctx.clients
  const { fullText, advertisementOptions = defaultAdvertisementOptions } = args

  const workspaceSearchParams = await getWorkspaceSearchParamsFromStorage(ctx)

  const biggyArgs: { [key: string]: any } = {
    ...advertisementOptions,
    ...args,
    query: fullText,
    sort: convertOrderBy(args.orderBy),
    ...args.options,
    ...workspaceSearchParams,
  }

  // unnecessary field. It's is an object and breaks the @vtex/api cache
  delete biggyArgs.selectedFacets
  delete biggyArgs.advertisementOptions

  const result: any = await intelligentSearchApi.productSearch(
    { ...biggyArgs },
    buildAttributePath(selectedFacets),
    shippingOptions
  )

  if (ctx.vtex.tenant && !args.productOriginVtex) {
    ctx.translated = result.translated
  }

  return {
    searchState: args.searchState,
    ...result,
  }
}

/**
 * Fetches product search results using the intsch client (Intelligent Search)
 */
// eslint-disable-next-line max-params
async function fetchProductSearchFromIntsch(
  ctx: Context,
  args: ProductSearchInput,
  selectedFacets: SelectedFacet[],
  shippingOptions?: string[]
) {
  const { intsch } = ctx.clients
  const { fullText, advertisementOptions = defaultAdvertisementOptions } = args

  const workspaceSearchParams = await getWorkspaceSearchParamsFromStorage(ctx)

  const intschArgs: { [key: string]: any } = {
    ...advertisementOptions,
    ...args,
    query: fullText,
    sort: convertOrderBy(args.orderBy),
    ...args.options,
    ...workspaceSearchParams,
  }

  // unnecessary field. It's is an object and breaks the @vtex/api cache
  delete intschArgs.selectedFacets
  delete intschArgs.advertisementOptions

  const result: any = await intsch.productSearch(
    { ...intschArgs },
    buildAttributePath(selectedFacets),
    shippingOptions
  )

  if (ctx.vtex.tenant && !args.productOriginVtex) {
    ctx.translated = result.translated
  }

  return {
    searchState: args.searchState,
    ...result,
  }
}

/**
 * ProductSearch service that extracts product search fetching logic and implements comparison or flag-based routing
 */
// eslint-disable-next-line max-params
export async function fetchProductSearch(
  ctx: Context,
  args: ProductSearchInput,
  selectedFacets: SelectedFacet[],
  shippingOptions?: string[]
) {
  const { shouldUseNewPLPEndpoint } = await fetchAppSettings(ctx)

  if (shouldUseNewPLPEndpoint) {
    return fetchProductSearchFromIntsch(
      ctx,
      args,
      selectedFacets,
      shippingOptions
    )
  }

  // Build the exact request params as the clients do for debugging
  const path = buildAttributePath(selectedFacets)
  const workspaceSearchParams = await getWorkspaceSearchParamsFromStorage(ctx)
  const { advertisementOptions = defaultAdvertisementOptions } = args

  const clientArgs: { [key: string]: any } = {
    ...advertisementOptions,
    ...args,
    query: args.fullText,
    sort: convertOrderBy(args.orderBy),
    ...args.options,
    ...workspaceSearchParams,
  }

  delete clientArgs.selectedFacets
  delete clientArgs.advertisementOptions

  const { leap, searchState } = args as { leap?: boolean; searchState?: string }

  const requestParams = {
    query: args.fullText && decodeQuery(args.fullText),
    locale: ctx.vtex.locale ?? ctx.vtex.tenant?.locale,
    bgy_leap: leap ? true : undefined,
    ...parseState(searchState),
    ...clientArgs,
  }

  const { biggyCurl, intschCurl } = buildCurlCommands(
    ctx,
    path,
    requestParams,
    shippingOptions
  )

  return compareApiResults(
    () =>
      fetchProductSearchFromBiggy(ctx, args, selectedFacets, shippingOptions),
    () =>
      fetchProductSearchFromIntsch(ctx, args, selectedFacets, shippingOptions),
    ctx.vtex.production ? 1 : 100,
    ctx.vtex.logger,
    {
      logPrefix: 'ProductSearch',
      args: {
        biggyCurl,
        intschCurl,
      },
      existenceCompareFields: PRODUCT_SEARCH_EXISTENCE_COMPARE_FIELDS,
      ignoredDifferences: PRODUCT_SEARCH_IGNORED_DIFFERENCES,
    }
  )
}
