import {
  buildAttributePath,
  concatSelectedFacets,
  convertOrderBy,
} from '../commons/compatibility-layer'
import { extractSegmentData, getOrCreateSegment } from '../utils/segment'
import { getWorkspaceSearchParamsFromStorage } from '../routes/workspaceSearchParams'
import {
  compareApiResults,
  type ExistenceComparePattern,
  type IgnoredDifference,
} from '../utils/compareResults'
import { fetchAppSettings } from './settings'
import type { ProductSearchInput } from '../typings/Search'
import type { ProductSearchRequestInfo } from '../clients/intsch/types'

type SegmentData = ReturnType<typeof extractSegmentData>

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

function formatHeaderValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(',')
  }

  if (value === undefined || value === null) {
    return ''
  }

  return String(value)
}

/**
 * Builds a curl command from request metadata returned by productSearch (no auth header).
 */
function buildCurl(
  account: string,
  hostAndPrefix: string,
  requestInfo: ProductSearchRequestInfo
): string {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(requestInfo.params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  }

  const headerFlags = Object.entries(requestInfo.headers)
    .map(([k, v]) => ({ k, v: formatHeaderValue(v) }))
    .filter(({ v }) => v !== '')
    .map(({ k, v }) => ` -H "${k}: ${v}"`)
    .join('')

  return `curl "https://${account}.${hostAndPrefix}${requestInfo.path}?${searchParams}"${headerFlags}`
}

function omitRequestInfo<T extends { requestInfo: ProductSearchRequestInfo }>(
  res: T
): Omit<T, 'requestInfo'> {
  // Drop requestInfo only; keep all API payload fields for callers / comparators
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { requestInfo, ...rest } = res

  return rest as Omit<T, 'requestInfo'>
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

  const raw = await intelligentSearchApi.productSearch(
    { ...biggyArgs },
    buildAttributePath(selectedFacets),
    { shippingHeader: shippingOptions }
  )

  const { requestInfo, ...result } = raw

  if (
    ctx.vtex.tenant &&
    !args.productOriginVtex &&
    raw.translated !== undefined &&
    raw.translated !== null
  ) {
    ctx.translated = raw.translated
  }

  return {
    searchState: args.searchState,
    ...result,
    requestInfo,
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
  shippingOptions?: string[],
  segmentData?: SegmentData
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

  const allFacets = segmentData
    ? concatSelectedFacets(selectedFacets, segmentData.extraFacets)
    : selectedFacets

  const raw = await intsch.productSearch(
    { ...intschArgs },
    buildAttributePath(allFacets),
    {
      segmentParams: segmentData?.segmentParams,
      shippingHeader: shippingOptions,
    }
  )

  const { requestInfo, ...result } = raw

  if (
    ctx.vtex.tenant &&
    !args.productOriginVtex &&
    raw.translated !== undefined &&
    raw.translated !== null
  ) {
    ctx.translated = raw.translated
  }

  return {
    searchState: args.searchState,
    ...result,
    requestInfo,
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
  const segment = await getOrCreateSegment(ctx)
  const segmentData = extractSegmentData(segment)

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
      shippingOptions,
      segmentData
    )

    logSponsoredProducts(ctx, result)

    return omitRequestInfo(result)
  }

  // Use catalog-specific comparison configs when productOriginVtex is enabled
  // since the response format differs (uses catalog data plane)
  const isProductOriginVtex = args.productOriginVtex ?? false
  const existenceCompareFields = isProductOriginVtex
    ? CATALOG_PRODUCT_SEARCH_EXISTENCE_COMPARE_FIELDS
    : PRODUCT_SEARCH_EXISTENCE_COMPARE_FIELDS

  const ignoredDifferences = isProductOriginVtex
    ? CATALOG_PRODUCT_SEARCH_IGNORED_DIFFERENCES
    : PRODUCT_SEARCH_IGNORED_DIFFERENCES

  const { account } = ctx.vtex
  const logArgs: {
    biggyCurl?: string
    intschCurl?: string
    productOriginVtex: boolean
  } = { productOriginVtex: isProductOriginVtex }

  const result = await compareApiResults(
    async () => {
      const res = await fetchProductSearchFromBiggy(
        ctx,
        args,
        selectedFacets,
        shippingOptions
      )

      logArgs.biggyCurl = buildCurl(
        account,
        'myvtex.com/_v/api/intelligent-search',
        res.requestInfo
      )

      return omitRequestInfo(res)
    },
    async () => {
      const res = await fetchProductSearchFromIntsch(
        ctx,
        args,
        selectedFacets,
        shippingOptions,
        segmentData
      )

      logArgs.intschCurl = buildCurl(account, 'myvtex.com', {
        path: res.requestInfo.path,
        params: { ...res.requestInfo.params, an: account },
        headers: res.requestInfo.headers,
      })

      return omitRequestInfo(res)
    },
    ctx.vtex.production ? 1 : 100,
    ctx.vtex.logger,
    {
      logPrefix: 'ProductSearch',
      args: logArgs,
      existenceCompareFields,
      ignoredDifferences,
    }
  )

  logSponsoredProducts(ctx, result)

  return result
}
