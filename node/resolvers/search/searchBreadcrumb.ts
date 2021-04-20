import { Functions } from '@gocommerce/utils'
import { equals, includes, toLower } from 'ramda'

import { formatTranslatableProp } from '../../utils/i18n'
import { getSpecificationFilterName } from './modules/metadata'
import { findCategoryInTree, getBrandFromSlug, breadcrumbMapKey } from './utils'

interface BreadcrumbParams {
  queryUnit: string
  mapUnit: string
  index: number
  queryArray: string[]
  mapArray: string[]
  categories: CategoryTreeResponse[]
  categoriesSearched: string[]
  products: SearchProduct[]
  hrefs: string[] | null
  metadataMap: Record<string, { id: string, name: string }>
}

const findClusterNameFromId = (
  products: SearchProduct[],
  clusterId: string
) => {
  const productWithCluster = products.find(
    ({ productClusters }) => !!productClusters[clusterId]
  )

  return productWithCluster && productWithCluster.productClusters[clusterId]
}

const findSellerFromSellerId = (
  products: SearchProduct[],
  sellerId: string
) => {
  for (const product of products) {
    for (const item of product.items) {
      const seller = item.sellers.find(sel => sel.sellerId === sellerId)

      if (seller) {
        return seller.sellerName
      }
    }
  }

  return null
}

const sliceAndJoin = (array: string[], max: number, joinChar: string) =>
  array.slice(0, max).join(joinChar)

const isCategoryMap = equals('c')
const isBrandMap = equals('b')
const isProductClusterMap = equals('productClusterIds')
const isSellerMap = equals('sellerIds')
const isSpecificationFilter = includes('specificationFilter')

const getCategoryInfo = (
  { categoriesSearched, queryUnit, categories }: BreadcrumbParams,
  isVtex: boolean,
  ctx: Context
) => {
  const queryPosition = categoriesSearched.findIndex(cat => cat === queryUnit)

  if (!isVtex) {
    return findCategoryInTree(
      categories,
      categoriesSearched.slice(0, queryPosition + 1)
    )
  }

  return ctx.clients.search
    .pageType(categoriesSearched.slice(0, queryPosition + 1).join('/'))
    .catch(() => null)
}

const getBrandInfo = async (
  { queryUnit }: BreadcrumbParams,
  isVtex: boolean,
  { clients: { search } }: Context
) => {
  if (!isVtex) {
    return getBrandFromSlug(toLower(queryUnit), search)
  }

  return search.pageType(queryUnit).catch(() => null)
}

interface TranslatableData {
  id?: string
  name: string
}

export const resolvers = {
  SearchBreadcrumb: {
    name: async (obj: BreadcrumbParams, _: any, ctx: Context) => {
      const {
        vtex: { account },
      } = ctx

      const { queryUnit, mapUnit, index, queryArray, products, metadataMap } = obj
      const defaultName = queryArray[index]
      const isVtex = !Functions.isGoCommerceAcc(account)

      if (isProductClusterMap(mapUnit)) {
        const clusterName = findClusterNameFromId(products, queryUnit)

        if (clusterName) {
          const translatableData = {
            id: queryUnit,
            name: clusterName,
          }

          return formatTranslatableProp<TranslatableData, 'name', 'id'>('name', 'id')(translatableData, _, ctx)
        }
      }

      if (isCategoryMap(mapUnit)) {
        const categoryData = (metadataMap[breadcrumbMapKey(queryUnit, mapUnit)] ?? (await getCategoryInfo(obj, isVtex, ctx))) as TranslatableData

        if (categoryData) {
          return formatTranslatableProp<TranslatableData, 'name', 'id'>('name', 'id')(categoryData, _, ctx)
        }
      }

      if (isSellerMap(mapUnit)) {
        const sellerName = findSellerFromSellerId(products, queryUnit)

        if (sellerName) {
          return sellerName
        }
      }

      if (isBrandMap(mapUnit)) {
        const brandData = (metadataMap[breadcrumbMapKey(queryUnit, mapUnit)] ?? (await getBrandInfo(obj, isVtex, ctx))) as TranslatableData

        if (brandData) {
          return formatTranslatableProp<TranslatableData, 'name', 'id'>('name', 'id')(brandData, _, ctx)
        }
      }

      if (isSpecificationFilter(mapUnit)) {
        return getSpecificationFilterName(queryUnit)
      }

      return defaultName && decodeURI(defaultName)
    },
    href: (params: BreadcrumbParams) => {
      const {
        index,
        queryArray,
        mapArray,
        mapUnit,
        hrefs,
      } = params

      const noMapQueryString = mapArray.slice(0, index + 1).every(isCategoryMap) || (isBrandMap(mapUnit) && index === 0)

      if (hrefs) {
        // Will fall here only if store translated data for different binding on upper resolver
        const href = hrefs[index]

        if (noMapQueryString) {
          return href
        }

        return `${href}?map=${sliceAndJoin(
          mapArray,
          index + 1,
          ','
        )}`
      }

      const queryString = noMapQueryString ? '' : `?map=${sliceAndJoin(
        mapArray,
        index + 1,
        ','
      )}`

      return `/${sliceAndJoin(queryArray, index + 1, '/')}${queryString}`
    },
  },
}
