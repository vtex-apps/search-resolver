import {
  buildAttributePath,
  concatSelectedFacets,
  convertOrderBy,
  mergeSegmentParamsWithPickupFromPath,
} from '../commons/compatibility-layer'
import { extractSegmentData, getOrCreateSegment } from '../utils/segment'
import { applyHideUnavailableItemsDefaultForDP } from '../utils/hideUnavailableItems'
import type {
  AdvertisementOptions,
  ProductSearchInput,
} from '../typings/Search'
import type {
  IntschProductSearchParams,
  ProductSearchRequestInfo,
} from '../clients/intsch/types'
import { fetchAppSettings } from './settings'
import { buildSemanticSearchParams } from '../utils/semanticSearch'

type SegmentData = ReturnType<typeof extractSegmentData>

function omitRequestInfo<T extends { requestInfo: ProductSearchRequestInfo }>(
  res: T
): Omit<T, 'requestInfo'> {
  // Drop requestInfo only; keep all API payload fields for callers / comparators
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { requestInfo, ...rest } = res

  return rest as Omit<T, 'requestInfo'>
}

const defaultAdvertisementOptions: AdvertisementOptions = {
  showSponsored: false,
  sponsoredCount: 3,
  repeatSponsoredProducts: true,
}

function buildProductSearchRequestParams(
  args: ProductSearchInput,
  fullText: string | undefined,
  advertisementOptionsResolved: AdvertisementOptions,
  semanticParams: Partial<IntschProductSearchParams> = {}
): IntschProductSearchParams {
  const {
    selectedFacets: _omitSelectedFacets,
    advertisementOptions: _omitAdvertisementOptions,
    options: searchOptions,
    ...restSearchInput
  } = args

  return {
    ...advertisementOptionsResolved,
    ...restSearchInput,
    query: fullText,
    sort: convertOrderBy(args.orderBy),
    ...(searchOptions ?? {}),
    ...semanticParams,
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
  segmentData?: SegmentData,
  enableHybridSearch = false,
  enableDeliveryPromisePreview = false
) {
  const { intsch } = ctx.clients
  const { fullText } = args

  const advertisementOptionsResolved =
    args.advertisementOptions ?? defaultAdvertisementOptions

  const intschArgs = buildProductSearchRequestParams(
    args,
    fullText,
    advertisementOptionsResolved,
    {
      ...buildSemanticSearchParams(enableHybridSearch),
      dpPreview: enableDeliveryPromisePreview,
    }
  )

  const finalArgs = applyHideUnavailableItemsDefaultForDP(
    intschArgs,
    segmentData?.segmentParams
  )

  const allFacets = segmentData
    ? concatSelectedFacets(selectedFacets, segmentData.extraFacets)
    : selectedFacets

  const raw = await intsch.productSearch(
    { ...finalArgs },
    buildAttributePath(allFacets),
    {
      segmentParams: mergeSegmentParamsWithPickupFromPath(
        segmentData?.segmentParams,
        selectedFacets
      ),
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
 * ProductSearch service that always routes PLP requests through intsch.
 */
// eslint-disable-next-line max-params
export async function fetchProductSearch(
  ctx: Context,
  args: ProductSearchInput,
  selectedFacets: SelectedFacet[],
  shippingOptions?: string[]
) {
  const { enableHybridSearch, enableDeliveryPromisePreview } =
    await fetchAppSettings(ctx)

  const segment = await getOrCreateSegment(ctx)
  const segmentData = extractSegmentData(segment)

  if (segment && segment.channel === null && !args.salesChannel) {
    ctx.vtex.logger.warn({
      message: 'Couldnt detect a sales channel',
    })
  }

  const result = await fetchProductSearchFromIntsch(
    ctx,
    args,
    selectedFacets,
    shippingOptions,
    segmentData,
    enableHybridSearch,
    enableDeliveryPromisePreview
  )

  logSponsoredProducts(ctx, result)

  return omitRequestInfo(result)
}
