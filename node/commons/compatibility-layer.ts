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
 * Concatenates path-selected facets with segment-derived facets, matching the
 * behavior of intelligent-search-api's concatSelectedFacets:
 *
 * - The `shipping` facet from the path takes precedence: if the path already
 *   contains a `shipping` facet, segment `shipping` entries are skipped.
 * - A `shipping=ignore` value signals the user explicitly deselected a shipping
 *   filter present in the segment; when found, ALL `shipping` entries are removed.
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

  return result
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
