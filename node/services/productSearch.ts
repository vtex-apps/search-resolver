import {
  buildAttributePath,
  convertOrderBy,
} from '../commons/compatibility-layer'
import { getWorkspaceSearchParamsFromStorage } from '../routes/workspaceSearchParams'
import { compareApiResults, NO_TRAFFIC } from '../utils/compareResults'
import { fetchAppSettings } from './settings'
import type { ProductSearchInput } from '../typings/Search'
import { decodeQuery } from '../clients/intelligent-search-api'
import { parseState } from '../utils/searchState'

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

  const { leap, searchState } = args as { leap?: boolean; searchState?: string }

  const requestParams = {
    query: args.fullText && decodeQuery(args.fullText),
    locale: ctx.vtex.locale ?? ctx.vtex.tenant?.locale,
    bgy_leap: leap ? true : undefined,
    ...parseState(searchState),
    ...clientArgs,
  }

  return compareApiResults(
    () =>
      fetchProductSearchFromBiggy(ctx, args, selectedFacets, shippingOptions),
    () =>
      fetchProductSearchFromIntsch(ctx, args, selectedFacets, shippingOptions),
    ctx.vtex.production ? NO_TRAFFIC : 100,
    ctx.vtex.logger,
    {
      logPrefix: 'ProductSearch',
      args: {
        biggyPath: `/_v/api/intelligent-search/product_search/${path}`,
        intschPath: `/api/intelligent-search/v0/product-search/${path}`,
        queryParams: requestParams,
        headers: {
          'x-vtex-shipping-options': shippingOptions ?? '',
        },
      },
    }
  )
}
