import { buildAttributePath, convertOrderBy } from '../commons/compatibility-layer'
import { getWorkspaceSearchParamsFromStorage } from '../routes/workspaceSearchParams'
import { fetchAppSettings } from './settings'
import type { ProductSearchInput } from '../typings/Search'

const defaultAdvertisementOptions = {
  showSponsored: false,
  sponsoredCount: 3,
  repeatSponsoredProducts: true,
}

/**
 * Fetches product search results using the intelligentSearchApi client (Biggy)
 */
async function fetchProductSearchFromBiggy(
  ctx: Context,
  args: ProductSearchInput,
  selectedFacets: SelectedFacet[],
  shippingOptions?: string[]
) {
  const { intelligentSearchApi } = ctx.clients
  const {
    fullText,
    advertisementOptions = defaultAdvertisementOptions,
  } = args

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
async function fetchProductSearchFromIntsch(
  ctx: Context,
  args: ProductSearchInput,
  selectedFacets: SelectedFacet[],
  shippingOptions?: string[]
) {
  const { intsch } = ctx.clients
  const {
    fullText,
    advertisementOptions = defaultAdvertisementOptions,
  } = args

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
 * ProductSearch service that extracts product search fetching logic and implements flag-based routing
 * using intelligentSearchApi as primary and intsch as alternative based on shouldUseNewPLPEndpoint flag
 */
export async function fetchProductSearch(
  ctx: Context,
  args: ProductSearchInput,
  selectedFacets: SelectedFacet[],
  shippingOptions?: string[]
) {
  const { shouldUseNewPLPEndpoint } = await fetchAppSettings(ctx)

  // Check if current account should use intsch directly
  if (shouldUseNewPLPEndpoint) {
    return fetchProductSearchFromIntsch(ctx, args, selectedFacets, shippingOptions)
  }

  return fetchProductSearchFromBiggy(ctx, args, selectedFacets, shippingOptions)
}

