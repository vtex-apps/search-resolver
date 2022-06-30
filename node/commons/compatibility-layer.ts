import { removeDiacriticsFromURL } from '../utils/string'

export enum IndexingType {
  API = 'API',
  XML = 'XML',
}

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
