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
  switch (orderBy) {
    case 'OrderByPriceDESC':
      return 'price:desc'
    case 'OrderByPriceASC':
      return 'price:asc'
    case 'OrderByTopSaleDESC':
      return 'orders:desc'
    case 'OrderByReviewRateDESC':
      return '' // TODO: Not Supported
    case 'OrderByNameDESC':
      return 'name:desc'
    case 'OrderByNameASC':
      return 'name:asc'
    case 'OrderByReleaseDateDESC':
      return 'release:desc'
    case 'OrderByBestDiscountDESC':
      return 'discount:desc'
    case 'OrderByScoreDESC':
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
