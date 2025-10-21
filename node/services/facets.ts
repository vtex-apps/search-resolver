import { buildAttributePath } from '../commons/compatibility-layer'
import { compareApiResults } from '../utils/compareResults'
import { fetchAppSettings } from './settings'
import type { FacetsInput } from '../typings/Search'

/**
 * Fetches facets using the intelligentSearchApi client (Biggy)
 */
async function fetchFacetsFromBiggy(
  ctx: Context,
  args: FacetsInput,
  selectedFacets: SelectedFacet[],
  shippingOptions?: string[]
) {
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
  args: FacetsInput,
  selectedFacets: SelectedFacet[],
  shippingOptions?: string[]
) {
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
export async function fetchFacets(
  ctx: Context,
  args: FacetsInput,
  selectedFacets: SelectedFacet[],
  shippingOptions?: string[]
) {
  const { shouldUseNewPLPEndpoint } = await fetchAppSettings(ctx)

  // If flag is explicitly true, use intsch
  if (shouldUseNewPLPEndpoint) {
    return fetchFacetsFromIntsch(ctx, args, selectedFacets, shippingOptions)
  }

  // If flag is undefined, compare both APIs
  return compareApiResults(
    () => fetchFacetsFromBiggy(ctx, args, selectedFacets, shippingOptions),
    () => fetchFacetsFromIntsch(ctx, args, selectedFacets, shippingOptions),
    ctx.vtex.production ? 10 : 100,
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
