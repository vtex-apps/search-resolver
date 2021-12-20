import unescape from 'unescape'
import { clone } from 'ramda'

import { removeDiacriticsFromURL } from '../utils/string'
import type { FilterValue, Attribute } from '../utils/attributes'

// eslint-disable-next-line no-restricted-syntax
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
      return orderBy ?? ''
  }
}

const canCleanMap = (attributeKey: string, map: string[]) => {
  const categoryKeys = ['category-1', 'category-2', 'category-3', 'category-4']

  // If there is more than one category of the same level, the rewriter cannot handle the link without map
  if (map.length > 4 || map.length !== Array.from(new Set(map)).length) {
    return false
  }

  return categoryKeys.includes(attributeKey) || (attributeKey === 'brand' && map.length === 1)
}

export const buildBreadcrumb = (
  attributes: ElasticAttribute[],
  fullText: string,
  selectedFacets: SelectedFacet[]
) => {
  const pivotValue: string[] = []
  const pivotMap: string[] = []

  const breadcrumb: Breadcrumb[] = []

  if (fullText) {
    pivotValue.push(fullText)
    pivotMap.push('ft')

    breadcrumb.push({
      name: fullText,
      href: `/${pivotValue.join('/')}?map=${pivotMap.join(',')}`,
    })
  }

  const activeAttributes = attributes.filter(attribute => attribute.active)
  const activeValues: Array<ElasticAttributeValue & {
    visible: boolean
    attributeKey: string
  }> = []

  activeAttributes.forEach(attribute => {
    attribute.values.forEach(value => {
      if (value.active) {
        activeValues.push({
          ...value,
          visible: attribute.visible,
          attributeKey: attribute.originalKey,
        })
      }
    })
  })

  const selectedFacetsValues = selectedFacets.map(
    selectedFacet => selectedFacet.value
  )

  activeValues.sort((a, b) =>
    selectedFacetsValues.indexOf(a.originalKey ?? a.key) < selectedFacetsValues.indexOf(b.originalKey ?? b.key)
      ? -1
      : 1
  )

  const hiddenActiveValues = ["trade-policy", "private-seller", "activeprivatesellers"]

  activeValues.filter(x => !hiddenActiveValues.includes(x.attributeKey.toLowerCase())).forEach(value => {
    pivotValue.push(value.key)
    pivotMap.push(value.attributeKey)

    if (value.attributeKey === "productClusterIds") {
      const clusterName = attributes
        .find(attribute => attribute.key === "productclusternames")
        ?.values
        .find(attrValue => attrValue.id === value.key)
        ?.label

      if (clusterName) {
        breadcrumb.push({
          name: unescape(clusterName),
          href: `/${pivotValue.join('/')}?map=${pivotMap.join(',')}`,
        })
      }

      return
    }

    if (canCleanMap(value.attributeKey, pivotMap)) {
      breadcrumb.push({
        name: unescape(value.label),
        href: `/${pivotValue.join('/')}`,
      })
    } else {
      breadcrumb.push({
        name: unescape(value.label),
        href: `/${pivotValue.join('/')}?map=${pivotMap.join(',')}`,
      })
    }
  })

  return breadcrumb
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
        ? `${attributePath}${encodeSafeURI(facet.key)}/${removeDiacriticsFromURL(encodeSafeURI(facet.value)).replace(/ |%20/, '-')}/`
        : attributePath
    }, '')
    : ''
}

export const buildCategoryTreeBasedOnIntelligentSearch = (solrTree: SearchFacetCategory[], intelligentSearchTree: Attribute[]): any => {
  const removeInvalidChildren = (tree: { Children: SearchFacetCategory[] }, intelligentSearchTree: Attribute[], currentDepth = 0): any => {
    if (currentDepth >= intelligentSearchTree.length) {
      return
    }

    const currentNode = intelligentSearchTree[currentDepth]

    tree.Children = tree.Children.filter(category => currentNode.values.some((facet: any) => facet.label === category.Name))

    tree.Children.forEach(child => {
      removeInvalidChildren(child, intelligentSearchTree, currentDepth + 1)
    })
  }

  const newSolrTree = clone(solrTree)

  removeInvalidChildren({ Children: newSolrTree }, intelligentSearchTree)

  return newSolrTree
}

export const convertSolrTree = (node: SearchFacetCategory, selectedFaces: SelectedFacet[]): FilterValue => {
  const children = node.Children.map((child) => convertSolrTree(child, selectedFaces))

  const isSelected = selectedFaces.some(facet =>
    facet.key === node.Map && facet.value.toLocaleLowerCase() === node.Value.toLocaleLowerCase()
  )

  return {
    id: node.Id?.toString(),
    quantity: node.Quantity,
    name: node.Name,
    key: node.Map,
    selected: isSelected,
    value: node.Value,
    children,
  }
}
