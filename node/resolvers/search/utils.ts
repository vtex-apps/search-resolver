import crypto from 'crypto'
import { compose, last, split, toLower, zip } from 'ramda'
import { Functions } from '@gocommerce/utils'

import { searchSlugify, Slugify } from '../../utils/slug'
import { Logger } from '@vtex/api'

export enum SearchCrossSellingTypes {
  whoboughtalsobought = 'whoboughtalsobought',
  similars = 'similars',
  whosawalsosaw = 'whosawalsosaw',
  whosawalsobought = 'whosawalsobought',
  accessories = 'accessories',
  suggestions = 'suggestions',
}

export enum GroupByCrossSellingTypes {
  PRODUCT = 'PRODUCT',
  NONE = 'NONE',
}

const pageTypeMapping: Record<string, string> = {
  Brand: 'brand',
  Department: 'department',
  Category: 'category',
  SubCategory: 'subcategory',
  NotFound: 'search',
  FullText: 'search',
  Search: 'search',
}

const lastSegment = compose<string, string[], string>(
  last,
  split('/')
)

export const zipQueryAndMap = (query?: string | null, map?: string | null) => {
  const cleanQuery = query || ''
  const cleanMap = map || ''
  return zip(
    cleanQuery
      .toLowerCase()
      .split('/')
      .map(decodeURIComponent),
    cleanMap.split(',')
  )
}

export function hashMD5(text: string) {
  const hash = crypto.createHash('md5')
  return hash.update(text).digest('hex')
}

export function unveil(encryptedData: string): ServiceSettings | undefined {
  const VEIL_KEY = 'a2c4e6g8i0k2m4o6q8s0u2w4y6A8C0E2'
  const VEIL_IV = 'G4I6K8M0O2Q4S6U8'
  const VEIL_ALGORITHM = 'aes-256-cbc'
   try {
     const unveil = crypto.createDecipheriv(
       VEIL_ALGORITHM,
       Buffer.from(VEIL_KEY),
       Buffer.from(VEIL_IV)
     )

     let unveiled = unveil.update(encryptedData, 'base64', 'utf8')
     unveiled += unveil.final('utf8')

     try {
       return JSON.parse(unveiled) ?? undefined
     } catch (e) {
       return undefined;
     }
   } catch (error) {
     return undefined
   }
 }

export function findCategoryInTree(
  tree: CategoryTreeResponse[],
  values: string[],
  index = 0
): CategoryTreeResponse | null {
  for (const node of tree) {
    const slug = lastSegment(node.url)
    if (slug.toUpperCase() === values[index].toUpperCase()) {
      if (index === values.length - 1) {
        return node
      }
      return findCategoryInTree(node.children, values, index + 1)
    }
  }
  return null
}

export const getBrandFromSlug = async (
  brandSlug: string,
  search: Context['clients']['search']
) => {
  const brands = await search.brands()
  return brands.find(
    brand =>
      brand.isActive &&
      (toLower(searchSlugify(brand.name)) === brandSlug ||
        toLower(Slugify(brand.name)) === brandSlug)
  )
}

type CategoryMap = Record<string, CategoryTreeResponse>

/**
 * We are doing this because the `get category` API is not returning the values
 * for slug and href. So we get the whole category tree and get that info from
 * there instead until the Search team fixes this issue with the category API.
 */
export async function getCategoryInfo(
  search: Context['clients']['search'],
  id: number,
  levels: number
) {
  const categories = await search.categories(levels)
  const mapCategories = categories.reduce(appendToMap, {}) as CategoryMap

  const category = mapCategories[id] || { url: '' }

  return category
}

export function buildCategoryMap(categoryTree: CategoryTreeResponse[]) {
  return categoryTree.reduce(appendToMap, {}) as CategoryMap
}

/**
 * That's a recursive function to fill an object like { [categoryId]: Category }
 * It will go down the category.children appending its children and so on.
 */
function appendToMap(
  mapCategories: CategoryMap,
  category: CategoryTreeResponse
) {
  mapCategories[category.id] = category

  mapCategories = category.children.reduce(appendToMap, mapCategories)

  return mapCategories
}

export function translatePageType(searchPageType: string): string {
  return pageTypeMapping[searchPageType] || 'search'
}

export const searchEncodeURI = (account: string) => (str: string) => {
  if (!Functions.isGoCommerceAcc(account)) {
    return str.replace(/[%"'.()]/g, (c: string) => {
      switch (c) {
        case '%':
          return '@perc@'
        case '"':
          return '@quo@'
        case "'":
          return '@squo@'
        case '.':
          return '@dot@'
        case '(':
          return '@lpar@'
        case ')':
          return '@rpar@'
        default: {
          return c
        }
      }
    })
  }
  return str
}

export const searchDecodeURI = (str: string) => {
  return str.replace(/(\@perc\@|\@slash\@|\@quo\@|\@squo\@|\@dot\@|\@lpar\@|\@rpar\@)/g, (c: string) => {
    switch (c) {
      case '@perc@':
        return '%'
      case '@quo@':
        return "\""
      case '@squo@':
        return "\'"
      case '@dot@':
        return "."
      case '@lpar@':
        return "("
      case '@rpar@':
        return ")"
      case '@slash@':
        return "/"
      default: {
        return c
      }
    }
  })
}

export const getMapAndPriceRangeFromSelectedFacets = (
  selectedFacets: SelectedFacet[]
) => {
  const priceRangeIndex = selectedFacets.findIndex(
    facet => facet.key === 'priceRange'
  )
  const priceRange =
    priceRangeIndex > -1
      ? selectedFacets.splice(priceRangeIndex, 1)[0].value
      : undefined

  const map = selectedFacets.map(facet => facet.key).join(',')

  return [map, priceRange]
}

export const breadcrumbMapKey = (queryUnit: string, mapUnit: string) => {
  return `${queryUnit}-${mapUnit}`
}

export const validMapAndQuery = (query?: string, map?: string) => {
  const values = query?.split('/').filter(value => value)
  const facets = map?.split(',').filter(facetKey => facetKey)
  return values?.length === facets?.length
}

export const logDegradedSearchError = (
  logger: Logger,
  error: DegradedSearchError
) => {
  logger.warn({
    message: 'Degraded search',
    ...error,
  })
}

export const getShippingOptionsFromSelectedFacets = (
  selectedFacets: SelectedFacet[] = []
): [string[], SelectedFacet[]] => {
  const shippingOptions: string[] = []
  const filteredFacets: SelectedFacet[] = []

  selectedFacets.forEach((facet) => {
    if (facet.key === 'shipping-option') {
      shippingOptions.push(facet.value)
    } else {
      filteredFacets.push(facet)
    }
  })

  return [shippingOptions, filteredFacets]
}
