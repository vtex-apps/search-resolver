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
    { path: 'products[*].specificationGroups[*].specifications', key: 'name' },
    { path: 'products[*].properties', key: 'name' },
    { path: 'products[*].skuSpecifications', key: 'field.name' },
    { path: 'products[*].productClusters', key: 'id' },
    { path: 'products[*].clusterHighlights', key: 'id' },
    {
      path: 'products[*].items[*].sellers[*].commertialOffer.teasers[*].generalValues',
      key: 'key',
    },
    {
      path: 'products[*].items[*].sellers[*].commertialOffer.discountHighlights[*].additionalInfo',
      key: 'key',
    },
    'products[*].items[*].activeSubscriptions',
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
  { path: 'pagination.first.proxyUrl', type: 'different_value' },
  { path: 'pagination.last.proxyUrl', type: 'different_value' },
  { path: 'pagination.current.proxyUrl', type: 'different_value' },
  { path: 'pagination.previous.proxyUrl', type: 'different_value' },
  // searchId is always different
  { path: 'searchId', type: 'different_value' },
  // PDP differences (from intelligent-search/tests), mapped under `products[*].*`
  // New data that intsch sends and production doesn't (extra in local)
  { path: 'products[*].items[*].kitItems', type: 'extra_key' },
  { path: 'products[*].items[*].estimatedDateArrival', type: 'extra_key' },
  { path: 'products[*].items[*].manufacturerCode', type: 'extra_key' },
  // productReference: intsch sends this but production always returns ""
  { path: 'products[*].productReference', type: 'different_value' },
  { path: 'products[*].productReference', type: 'extra_key' },
  // metaTagDescription: intsch sends this but production always returns ""
  { path: 'products[*].metaTagDescription', type: 'different_value' },
  // isKit: intsch sends this but production always returns "false"
  { path: 'products[*].items[*].isKit', type: 'different_value' },
  // modalType: intsch sends this but production always returns ""
  { path: 'products[*].items[*].modalType', type: 'different_value' },
  // PriceValidUntil changes with each request
  {
    path: 'products[*].items[*].sellers[*].commertialOffer.PriceValidUntil',
    type: 'different_value',
  },
  // PriceValidUntil can also be null and we are defaulting to an empty string
  {
    path: 'products[*].items[*].sellers[*].commertialOffer.PriceValidUntil',
    type: 'null_mismatch',
  },
  // imageText: intsch sends this but production always returns ""
  { path: 'products[*].items[*].images[*].imageText', type: 'different_value' },
  // attachments: intsch sends this but production always returns an empty array
  { path: 'products[*].items[*].attachments', type: 'array_length_mismatch' },
  { path: 'products[*].items[*].attachments[*]', type: 'extra_key' },
  // sellerId in specificationGroups/properties: no longer sent by intsch (missing from local)
  {
    path: 'products[*].specificationGroups[name:allSpecifications].specifications[name:sellerId]',
    type: 'missing_key',
  },
  { path: 'products[*].properties[name:sellerId]', type: 'missing_key' },
  // taxPercentage: production sends 0 or null, intsch always sends 0
  {
    path: 'products[*].items[*].sellers[*].commertialOffer.taxPercentage',
    type: 'null_mismatch',
  },
  // cacheId differs because of sponsored products middleware on node
  { path: 'products[*].cacheId', type: 'different_value' },
  // productTitle: no longer sent because it is always empty (missing from local)
  { path: 'products[*].productTitle', type: 'missing_key' },
  // description: differs because intsch gets the raw value from catalog without cropping
  { path: 'products[*].description', type: 'different_value' },
  // allSpecifications group can be missing when product has no specs (missing from local)
  {
    path: 'products[*].specificationGroups[name:allSpecifications]',
    type: 'missing_key',
  },
  // Potential indexing differences
  { path: 'products[*].productClusters[name:*]', type: 'extra_key' },
  { path: 'products[*].productClusters[name:*]', type: 'missing_key' },
  { path: 'products[*].clusterHighlights[name:*]', type: 'extra_key' },
  { path: 'products[*].clusterHighlights[name:*]', type: 'missing_key' },
  {
    path: 'products[*].specificationGroups[name:*].specifications[name:*]',
    type: 'missing_key',
  },
  {
    path: 'products[*].specificationGroups[name:*].specifications[name:*].values',
    type: 'array_length_mismatch',
  },
  {
    path: 'products[*].specificationGroups[name:*].specifications[name:*].values[*]',
    type: 'missing_key',
  },
  {
    path: 'products[*].specificationGroups[name:*].specifications[name:*].values[*]',
    type: 'extra_key',
  },
  {
    path: 'products[*].specificationGroups[name:*].specifications[name:*].values[*]',
    type: 'different_value',
  },
  {
    path: 'products[*].properties[name:*].values',
    type: 'array_length_mismatch',
  },
  { path: 'products[*].properties[name:*].values[*]', type: 'extra_key' },
  { path: 'products[*].properties[name:*].values[*]', type: 'different_value' },
  { path: 'products[*].categoriesIds', type: 'extra_key' },
  { path: 'products[*].productClusters[name:*].name', type: 'different_value' },
  { path: 'products[*].items[*].variations[*].name', type: 'different_value' },
  { path: 'products[*].releaseDate', type: 'different_value' },
  {
    path: 'products[*].items[*].sellers[*].commertialOffer.GetInfoErrorMessage',
    type: 'null_mismatch',
  },
  { path: 'products[*].items[*].variations[*]', type: 'missing_key' },
  { path: 'products[*].items[*].variations', type: 'array_length_mismatch' },
  { path: 'products[*].items[*].variations[*].values[*]', type: 'extra_key' },
  {
    path: 'products[*].items[*].variations[*].values',
    type: 'array_length_mismatch',
  },
  { path: 'products[*].items[*].activeSubscriptions[*]', type: 'extra_key' },
  { path: 'products[*].items[0].nameComplete', type: 'different_value' },
]

/**
 * Known expected differences to ignore when comparing productOriginVtex=true (catalog/portal) responses.
 * These are based on CATALOG_IGNORED_DIFFERENCES from intelligent-search tests, with paths prefixed for product_search context.
 */
export const CATALOG_PRODUCT_SEARCH_IGNORED_DIFFERENCES: IgnoredDifference[] = [
  // recordsFiltered can differ because the request might go to different nodes
  { path: 'recordsFiltered', type: 'different_value' },
  // Pagination proxy URLs are assembled differently
  { path: 'pagination.before[*].proxyUrl', type: 'different_value' },
  { path: 'pagination.after[*].proxyUrl', type: 'different_value' },
  { path: 'pagination.next.proxyUrl', type: 'different_value' },
  { path: 'pagination.first.proxyUrl', type: 'different_value' },
  { path: 'pagination.last.proxyUrl', type: 'different_value' },
  { path: 'pagination.current.proxyUrl', type: 'different_value' },
  { path: 'pagination.previous.proxyUrl', type: 'different_value' },
  // searchId is always different
  { path: 'searchId', type: 'different_value' },
  // skuSpecifications[*].field.type: present in intsch but not in catalog
  { path: 'products[*].skuSpecifications[*].field.type', type: 'missing_key' },
  // origin: intsch sends this but catalog doesn't
  { path: 'products[*].origin', type: 'extra_key' },
  // productReference: catalog data plane does not always carry the product-level refId
  { path: 'products[*].productReference', type: 'different_value' },
  // PriceToken: generated internally by the catalog search API, not available in simulation
  {
    path: 'products[*].items[*].sellers[*].commertialOffer.PriceToken',
    type: 'missing_key',
  },
  // PriceValidUntil: timezone differences between simulation and catalog search snapshots
  {
    path: 'products[*].items[*].sellers[*].commertialOffer.PriceValidUntil',
    type: 'different_value',
  },
  {
    path: 'products[*].items[*].sellers[*].commertialOffer.PaymentOptions.paymentSystems[*].dueDate',
    type: 'different_value',
  },
  {
    // For some reason the portal proxy returns a link starting with portal.vtexcommercestable.com.br/ instead of ACCOUNt.vtexcommercestable.com.br
    path: 'products[*].link',
    type: 'different_value',
  },
  {
    path: 'products[*].items[*].sellers[*].addToCartLink',
    type: 'different_value',
  },
  //
  {
    path: 'products[*].specification',
    type: 'missing_key',
  },
  {
    path: 'products[*].biggyIndex',
    type: 'missing_key',
  },
  {
    path: 'products[*].sellerId',
    type: 'missing_key',
  },
  {
    path: 'products[*].allSpecifications[name:sellerId]',
    type: 'missing_key',
  },
  // Potential indexing differences
  {
    path: 'products[*].items[*].sellers[*].commertialOffer.GetInfoErrorMessage',
    type: 'null_mismatch',
  },
  {
    path: 'products[*].allSpecificationsGroups',
    type: 'array_length_mismatch',
  },
  {
    path: 'products[*].allSpecificationsGroups[*]',
    type: 'different_value',
  },
  {
    path: 'products[*].allSpecificationsGroups[*]',
    type: 'extra_key',
  },
]

/**
 * Existence-based comparison fields for productOriginVtex=true (catalog/portal) responses.
 * These are based on CATALOG_EXISTENCE_COMPARE_FIELDS from intelligent-search tests, with paths prefixed for product_search context.
 */
export const CATALOG_PRODUCT_SEARCH_EXISTENCE_COMPARE_FIELDS: ExistenceComparePattern[] =
  [
    'products[*].categories',
    'products[*].categoriesIds',
    'products[*].allSpecifications',
    { path: 'products[*].completeSpecifications', key: 'Name' },
    { path: 'products[*].skuSpecifications', key: 'field.name' },
    { path: 'products[*].skuSpecifications[*].values', key: 'id' },
    {
      path: 'products[*].items[*].sellers[*].commertialOffer.PaymentOptions.paymentSystems',
      key: 'id',
    },
    {
      path: 'products[*].items[*].sellers[*].commertialOffer.Installments',
      key: 'Name',
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

function logSponsoredProducts(ctx: Context, result: any) {
  const products = result?.products

  if (!Array.isArray(products)) return

  const sponsoredCount = products.filter((p: any) => p.advertisement).length

  if (sponsoredCount > 0) {
    ctx.vtex.logger.info({
      message: `ProductSearch migration: response contains ${sponsoredCount} sponsored product(s)`,
      account: ctx.vtex.account,
      sponsoredCount,
    })
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

  if (Math.random() < 0.1) {
    const logMethod = shouldUseNewPLPEndpoint ? 'info' : 'warn'

    ctx.vtex.logger[logMethod]({
      message: `ProductSearch migration: intsch ${
        shouldUseNewPLPEndpoint ? 'used' : 'not used'
      } as final response`,
    })
  }

  if (shouldUseNewPLPEndpoint) {
    const result = await fetchProductSearchFromIntsch(
      ctx,
      args,
      selectedFacets,
      shippingOptions
    )

    logSponsoredProducts(ctx, result)

    return result
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

  // Use catalog-specific comparison configs when productOriginVtex is enabled
  // since the response format differs (uses catalog data plane)
  const isProductOriginVtex = args.productOriginVtex ?? false
  const existenceCompareFields = isProductOriginVtex
    ? CATALOG_PRODUCT_SEARCH_EXISTENCE_COMPARE_FIELDS
    : PRODUCT_SEARCH_EXISTENCE_COMPARE_FIELDS

  const ignoredDifferences = isProductOriginVtex
    ? CATALOG_PRODUCT_SEARCH_IGNORED_DIFFERENCES
    : PRODUCT_SEARCH_IGNORED_DIFFERENCES

  const result = await compareApiResults(
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
        productOriginVtex: isProductOriginVtex,
      },
      existenceCompareFields,
      ignoredDifferences,
    }
  )

  logSponsoredProducts(ctx, result)

  return result
}
