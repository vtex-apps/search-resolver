import { buildAttributePath } from '../commons/compatibility-layer'
import { compareApiResults } from '../utils/compareResults'
import { fetchAppSettings } from './settings'
import type { FacetsInput } from '../typings/Search'
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
function buildCurlCommands(
  ctx: Context,
  path: string,
  params: Record<string, any>,
  shippingOptions?: string[]
): { biggyCurl: string; intschCurl: string } {
  const { workspace, account } = ctx.vtex
  const queryString = buildQueryString(params)
  const shippingHeader = shippingOptions?.length
    ? ` -H "x-vtex-shipping-options: ${shippingOptions.join(',')}"`
    : ''

  const biggyCurl = `curl "https://${workspace}--${account}.myvtex.com/_v/api/intelligent-search/facets/${path}?${queryString}"${shippingHeader}`
  const intschCurl = `curl "https://${account}.myvtex.com/api/intelligent-search/v0/facets/${path}?${queryString}"${shippingHeader}`

  return { biggyCurl, intschCurl }
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
 * Fetches facets using the intsch client (Intelligent Search)
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

  const result: any = await intsch.facets(
    { ...intschArgs, query: args.fullText },
    buildAttributePath(selectedFacets),
    shippingOptions
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
    shippingOptions
  )

  // If flag is undefined, compare both APIs
  return compareApiResults(
    () => fetchFacetsFromBiggy(ctx, options),
    () => fetchFacetsFromIntsch(ctx, options),
    ctx.vtex.production ? 1 : 100,
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
