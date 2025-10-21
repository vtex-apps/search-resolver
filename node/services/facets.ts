import { buildAttributePath } from '../commons/compatibility-layer'
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
 * Facets service that extracts facets fetching logic and implements flag-based routing
 * using intelligentSearchApi as primary and intsch as alternative based on shouldUseNewPLPEndpoint flag
 */
export async function fetchFacets(
  ctx: Context,
  args: FacetsInput,
  selectedFacets: SelectedFacet[],
  shippingOptions?: string[]
) {
  const { shouldUseNewPLPEndpoint } = await fetchAppSettings(ctx)

  // Check if current account should use intsch directly
  if (shouldUseNewPLPEndpoint) {
    return fetchFacetsFromIntsch(ctx, args, selectedFacets, shippingOptions)
  }

  return fetchFacetsFromBiggy(ctx, args, selectedFacets, shippingOptions)
}

