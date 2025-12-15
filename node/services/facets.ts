import { buildAttributePath } from '../commons/compatibility-layer'
import { compareApiResults, NO_TRAFFIC } from '../utils/compareResults'
import { fetchAppSettings } from './settings'
import type { FacetsInput } from '../typings/Search'

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

  // If flag is undefined, compare both APIs
  return compareApiResults(
    () => fetchFacetsFromBiggy(ctx, options),
    () => fetchFacetsFromIntsch(ctx, options),
    ctx.vtex.production ? NO_TRAFFIC : 100,
    ctx.vtex.logger,
    {
      logPrefix: 'Facets',
      args: {
        fullText: args.fullText,
        selectedFacets,
        shippingOptions,
      },
    }
  )
}
