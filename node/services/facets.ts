import { buildAttributePath } from '../commons/compatibility-layer'
import { compareApiResults } from '../utils/compareResults'
import { fetchAppSettings } from './settings'
import type { FacetsInput } from '../typings/Search'
import type { SegmentParams } from '../clients/intsch/index'
import { decodeQuery } from '../clients/intelligent-search-api'
import { parseState } from '../utils/searchState'

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
  selectedFacets: SelectedFacet[],
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

  const segment = ctx.vtex.segment as Record<string, any> | undefined
  let intschPath = path
  let intschParams = params

  if (segment) {
    const data = extractSegmentData(segment, selectedFacets)

    intschParams = { ...(data.segmentParams as Record<string, any>), ...params }
    if (data.extraFacets.length > 0) {
      intschPath = `${intschPath}${buildAttributePath(data.extraFacets)}`
    }
  }

  const intschQueryString = buildQueryString(intschParams)

  const biggyCurl = `curl "https://${account}.myvtex.com/_v/api/intelligent-search/facets/${path}?${queryString}"${shippingHeader}${segmentHeader}`
  const intschCurl = `curl "https://${account}.myvtex.com/api/intelligent-search/v1/facets/${intschPath}?${intschQueryString}"${shippingHeader}`

  return { biggyCurl, intschCurl }
}

/**
 * Extracts segment-derived query params and extra path facets for the v1 endpoint.
 * Parses the segment `facets` string to separate shipping/geo keys (sent as query params)
 * from general facets (appended to the path if not already in selectedFacets).
 */
function extractSegmentData(
  segment: Record<string, any>,
  selectedFacets: SelectedFacet[]
): { segmentParams: SegmentParams; extraFacets: SelectedFacet[] } {
  const SHIPPING_KEYS = new Set([
    'zip-code',
    'pickupPoint',
    'country',
    'coordinates',
    'deliveryZonesHash',
    'pickupPointsHash',
  ])

  const shipping: Record<string, string> = {}
  const existingKeys = new Set(selectedFacets.map((f) => f.key))
  const extraFacets: SelectedFacet[] = []

  if (typeof segment.facets === 'string' && segment.facets) {
    const facetsStr: string = segment.facets

    for (const pair of facetsStr.split(';')) {
      const eqIdx = pair.indexOf('=')

      if (eqIdx < 0) continue

      const key = pair.slice(0, eqIdx)
      const value = pair.slice(eqIdx + 1)

      if (!key || !value) continue

      if (SHIPPING_KEYS.has(key)) {
        shipping[key] = value
      } else if (!existingKeys.has(key)) {
        extraFacets.push({ key, value })
      }
    }
  }

  return {
    segmentParams: {
      sc: segment.channel,
      regionId: segment.regionId,
      country: segment.countryCode ?? shipping.country,
      locale: segment.cultureInfo,
      'zip-code': shipping['zip-code'],
      coordinates: shipping.coordinates,
      pickupPoint: shipping.pickupPoint,
      deliveryZonesHash: shipping.deliveryZonesHash,
      pickupPointHash: shipping.pickupPointsHash,
    },
    extraFacets,
  }
}

type FetchFacetsOptions = {
  args: FacetsInput
  selectedFacets: SelectedFacet[]
  shippingOptions?: string[]
}

/**
 * Fetches facets using the intelligentSearchApi client (Biggy)
 */
async function fetchFacetsFromBiggy(ctx: Context, options: FetchFacetsOptions) {
  const { args, selectedFacets, shippingOptions } = options
  const {
    clients: { intelligentSearchApi },
  } = ctx

  const biggyArgs: { [key: string]: any } = {
    ...args,
  }

  // unnecessary field. It's is an object and breaks the @vtex/api cache
  delete biggyArgs.selectedFacets

  const result: any = await intelligentSearchApi.facets(
    { ...biggyArgs, query: args.fullText },
    buildAttributePath(selectedFacets),
    shippingOptions
  )

  if (ctx.vtex.tenant) {
    ctx.translated = result.translated
  }

  return result
}

/**
 * Fetches facets using the intsch client (Intelligent Search) v1 endpoint.
 * Unpacks the segment and sends relevant fields as query params instead of the segment header.
 */
async function fetchFacetsFromIntsch(
  ctx: Context,
  options: FetchFacetsOptions
) {
  const { args, selectedFacets, shippingOptions } = options
  const {
    clients: { intsch },
  } = ctx

  const intschArgs: { [key: string]: any } = {
    ...args,
  }

  // unnecessary field. It's is an object and breaks the @vtex/api cache
  delete intschArgs.selectedFacets

  const segment = ctx.vtex.segment as Record<string, any> | undefined
  let segmentParams: SegmentParams | undefined
  let allFacets = selectedFacets

  if (segment) {
    const data = extractSegmentData(segment, selectedFacets)

    segmentParams = data.segmentParams
    allFacets = [...selectedFacets, ...data.extraFacets]
  }

  const intschPath = buildAttributePath(allFacets)

  const result: any = await intsch.facets(
    { ...intschArgs, query: args.fullText },
    intschPath,
    { segmentParams, shippingHeader: shippingOptions }
  )

  if (ctx.vtex.tenant) {
    ctx.translated = result.translated
  }

  return result
}

/**
 * Facets service that extracts facets fetching logic and implements comparison or flag-based routing
 */
export async function fetchFacets(ctx: Context, options: FetchFacetsOptions) {
  const { args, selectedFacets, shippingOptions } = options
  const { shouldUseNewPLPEndpoint } = await fetchAppSettings(ctx)

  // If flag is explicitly true, use intsch
  if (shouldUseNewPLPEndpoint) {
    return fetchFacetsFromIntsch(ctx, options)
  }

  // Build the exact request params as the clients do for debugging
  const path = buildAttributePath(selectedFacets)
  const clientArgs: { [key: string]: any } = { ...args }

  delete clientArgs.selectedFacets

  const query = args.fullText
  const { leap, searchState } = args as { leap?: boolean; searchState?: string }

  const requestParams = {
    ...clientArgs,
    query: query && decodeQuery(query),
    locale: ctx.vtex.locale ?? ctx.vtex.tenant?.locale,
    bgy_leap: leap ? true : undefined,
    ...parseState(searchState),
  }

  const { biggyCurl, intschCurl } = buildCurlCommands(
    ctx,
    path,
    requestParams,
    selectedFacets,
    shippingOptions
  )

  // If flag is undefined, compare both APIs
  return compareApiResults(
    () => fetchFacetsFromBiggy(ctx, options),
    () => fetchFacetsFromIntsch(ctx, options),
    ctx.vtex.production ? 10 : 100,
    ctx.vtex.logger,
    {
      logPrefix: 'Facets',
      args: {
        biggyCurl,
        intschCurl,
      },
    }
  )
}
