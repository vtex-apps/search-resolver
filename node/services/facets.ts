import {
  buildAttributePath,
  concatSelectedFacets,
  mergeSegmentParamsWithPickupFromPath,
} from '../commons/compatibility-layer'
import { extractSegmentData, getOrCreateSegment } from '../utils/segment'
import type { FacetsInput } from '../typings/Search'

type SegmentData = ReturnType<typeof extractSegmentData>

type FetchFacetsOptions = {
  args: FacetsInput
  selectedFacets: SelectedFacet[]
  shippingOptions?: string[]
}

/**
 * Fetches facets using the intsch client (Intelligent Search) v1 endpoint.
 * Unpacks the segment and sends relevant fields as query params instead of the segment header.
 */
async function fetchFacetsFromIntsch(
  ctx: Context,
  options: FetchFacetsOptions,
  segmentData: SegmentData
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

  const allFacets = concatSelectedFacets(
    selectedFacets,
    segmentData.extraFacets
  )

  const intschPath = buildAttributePath(allFacets)

  const result: any = await intsch.facets(
    { ...intschArgs, query: args.fullText },
    intschPath,
    {
      segmentParams: mergeSegmentParamsWithPickupFromPath(
        segmentData.segmentParams,
        selectedFacets
      ),
      shippingHeader: shippingOptions,
    }
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
  const segment = await getOrCreateSegment(ctx)
  const segmentData = extractSegmentData(segment)

  return fetchFacetsFromIntsch(ctx, options, segmentData)
}
