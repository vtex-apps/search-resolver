import type { SegmentParams } from '../utils/segment'
import { removeDiacriticsFromURL } from '../utils/string'

/**
 * Convert from VTEX OrderBy into Biggy's sort.
 *
 * @export
 * @param {OrderBy} orderBy VTEX OrderBy.
 * @returns {string} Biggy's sort.
 */
export const convertOrderBy = (orderBy?: string | null): string => {
  switch (orderBy?.toLowerCase()) {
    case 'orderbypricedesc':
      return 'price:desc'

    case 'orderbypriceasc':
      return 'price:asc'

    case 'orderbytopsaledesc':
      return 'orders:desc'

    case 'orderbyreviewratedesc':
      return '' // TODO: Not Supported

    case 'orderbynamedesc':
      return 'name:desc'

    case 'orderbynameasc':
      return 'name:asc'

    case 'orderbyreleasedatedesc':
      return 'release:desc'

    case 'orderbybestdiscountdesc':
      return 'discount:desc'

    case 'orderbyscoredesc':
      return ''

    default:
      return orderBy || ''
  }
}

const encodeSafeURI = (uri: string) => encodeURI(decodeURI(uri))

/**
 * Path URLs may encode the pickup point as `shipping/pickup-in-point-{pickupPointId}`.
 * Intelligent Search expects `shipping/pickup-in-point` in the attribute path (same as
 * intelligent-search-api's normalizePickupInPointShippingFacets). Values that are
 * exactly `pickup-in-point` (no id suffix) are unchanged.
 */
const PICKUP_IN_POINT_SUFFIX_RE = /^pickup-in-point-(.+)$/

function extractPickupPointIdFromShippingFacetValue(
  value: string
): string | undefined {
  const match = PICKUP_IN_POINT_SUFFIX_RE.exec(value)

  return match?.[1]
}

/**
 * Reads `shipping/pickup-in-point-{id}` from path facets only (not segment extras).
 * Matches intelligent-search-api searchContext: path pickup id wins over segment.
 */
export function extractPickupPointIdFromPathShippingFacet(
  selectedFacetsFromPath: SelectedFacet[]
): string | undefined {
  const shipping = selectedFacetsFromPath.find((f) => f.key === 'shipping')
  const rawId = shipping
    ? extractPickupPointIdFromShippingFacetValue(shipping.value)
    : undefined

  if (rawId === undefined) {
    return undefined
  }

  try {
    return decodeURIComponent(rawId)
  } catch {
    return rawId
  }
}

/**
 * When the URL encodes `pickup-in-point-{id}`, that id must be sent as `pickupPoint`
 * to intelligent-search v1 and override the segment cookie value — same as intsch
 * searchContext merging path into shipping info.
 */
export function mergeSegmentParamsWithPickupFromPath(
  segmentParams: SegmentParams | undefined,
  selectedFacetsFromPath: SelectedFacet[]
): SegmentParams | undefined {
  const pathPickupId = extractPickupPointIdFromPathShippingFacet(
    selectedFacetsFromPath
  )

  if (pathPickupId === undefined) {
    return segmentParams
  }

  return {
    ...(segmentParams ?? {}),
    pickupPoint: pathPickupId,
  }
}

function normalizePickupInPointShippingFacets(
  selectedFacets: SelectedFacet[]
): SelectedFacet[] {
  return selectedFacets.map((facet) => {
    if (facet.key !== 'shipping') {
      return facet
    }

    const id = extractPickupPointIdFromShippingFacetValue(facet.value)

    if (id === undefined) {
      return facet
    }

    return { ...facet, value: 'pickup-in-point' }
  })
}

/**
 * Concatenates path-selected facets with segment-derived facets, matching the
 * behavior of intelligent-search-api's concatSelectedFacets, then applies the same
 * pickup-in-point normalization used by intsch productSearch/facets:
 *
 * - The `shipping` facet from the path takes precedence: if the path already
 *   contains a `shipping` facet, segment `shipping` entries are skipped.
 * - A `shipping=ignore` value signals the user explicitly deselected a shipping
 *   filter present in the segment; when found, ALL `shipping` entries are removed.
 * - `shipping/pickup-in-point-{id}` facet values are collapsed to `pickup-in-point`
 *   so the attribute path matches what intelligent-search-api builds for the v2 route.
 */
export function concatSelectedFacets(
  selectedFacets: SelectedFacet[],
  selectedFacetsFromSegment: SelectedFacet[]
): SelectedFacet[] {
  let result = [...selectedFacets]
  const hasShipping = result.some((f) => f.key === 'shipping')

  for (const facet of selectedFacetsFromSegment) {
    if (!hasShipping || facet.key !== 'shipping') {
      result.push(facet)
    }
  }

  if (result.some((f) => f.key === 'shipping' && f.value === 'ignore')) {
    result = result.filter((f) => f.key !== 'shipping')
  }

  return normalizePickupInPointShippingFacets(result)
}

export const buildAttributePath = (selectedFacets: SelectedFacet[]) => {
  return selectedFacets
    ? selectedFacets.reduce((attributePath, facet) => {
        if (facet.key === 'priceRange') {
          facet.key = 'price'
          facet.value = facet.value.replace(` TO `, ':')
        }

        return facet.key !== 'ft'
          ? `${attributePath}${encodeSafeURI(
              facet.key
            )}/${removeDiacriticsFromURL(encodeSafeURI(facet.value)).replace(
              / |%20/,
              '-'
            )}/`
          : attributePath
      }, '')
    : ''
}
