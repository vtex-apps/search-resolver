import { compose, last, map, omit, pathOr, split } from 'ramda'

import {
  addContextToTranslatableString,
  formatTranslatableProp,
  shouldTranslateForBinding,
} from '../../utils/i18n'
import { getBenefits } from '../benefits'
import { buildCategoryMap } from './utils'

const objToNameValue = (
  keyName: string,
  valueName: string,
  record: Record<string, any> | null | undefined
) => {
  if (!record) {
    return []
  }
  return Object.keys(record).reduce(
    (acc, key: any) => {
      const value = record[key]
      if (typeof value === 'string') {
        acc.push({ [keyName]: key, [valueName]: value })
      }
      return acc
    },
    [] as Record<string, string>[]
  )
}

type SearchProductWithCache = SearchProduct & { cacheId?: string }
enum ItemsFilterEnum {
  ALL = 'ALL',
  FIRST_AVAILABLE = 'FIRST_AVAILABLE',
  ALL_AVAILABLE = 'ALL_AVAILABLE',
}
interface ItemArg {
  filter?: ItemsFilterEnum
}

const isSellerAvailable = (seller: Seller) =>
  pathOr(0, ['commertialOffer', 'AvailableQuantity'], seller) > 0

const isAvailable = (item: SearchItem): boolean => {
  return item.sellers.find(isSellerAvailable) !== undefined
}

const knownNotPG = [
  'allSpecifications',
  'brand',
  'categoriesIds',
  'categoryId',
  'clusterHighlights',
  'productClusters',
  'items',
  'productId',
  'link',
  'linkText',
  'productReference',
]

const removeTrailingSlashes = (str: string) =>
  str.endsWith('/') ? str.slice(0, str.length - 1) : str

const removeStartingSlashes = (str: string) =>
  str.startsWith('/') ? str.slice(1) : str

const getLastCategory = compose<string, string, string[], string>(
  last,
  split('/'),
  removeTrailingSlashes
)

const treeStringToArray = compose(
  split('/'),
  removeTrailingSlashes,
  removeStartingSlashes
)

const findMainTree = (categoriesIds: string[], prodCategoryId: string) => {
  const mainTree = categoriesIds.find(
    treeIdString => getLastCategory(treeIdString) === prodCategoryId
  )
  if (mainTree) {
    return treeStringToArray(mainTree)
  }

  // If we are here, did not find the specified main category ID in given strings. It is probably a bug.
  // We will return the biggest tree we find

  const trees = categoriesIds.map(treeStringToArray)

  return trees.reduce(
    (acc, currTree) => (currTree.length > acc.length ? currTree : acc),
    []
  )
}

const productCategoriesToCategoryTree = async (
  { categories, categoriesIds, categoryId: prodCategoryId }: SearchProduct,
  _: any,
  { clients: { search }, vtex: { platform } }: Context
) => {
  if (!categories || !categoriesIds) {
    return []
  }

  const mainTreeIds = findMainTree(categoriesIds, prodCategoryId)

  if (platform === 'vtex') {
    return mainTreeIds.map(categoryId => search.category(Number(categoryId)))
  }
  const categoriesTree = await search.categories(mainTreeIds.length)
  const categoryMap = buildCategoryMap(categoriesTree)
  const mappedCategories = mainTreeIds
    .map(id => categoryMap[id])
    .filter(Boolean)

  return mappedCategories.length ? mappedCategories : null
}

const urlToSlug = (slug: string | undefined) => {
  if (!slug) {
    return slug
  }
  const erasedSlash = slug.replace(/^\//g, '') //removing starting / char
  const finalSlug = erasedSlash.replace(/(\/p)$/g, '') //remove ending /p chars
  return finalSlug
}

export const resolvers = {
  Product: {
    brand: formatTranslatableProp<SearchProduct, 'brand', 'brandId'>(
      'brand',
      'brandId'
    ),

    benefits: ({ productId }: SearchProduct, _: any, ctx: Context) =>
      getBenefits(productId, ctx),

    categoryTree: productCategoriesToCategoryTree,

    cacheId: ({ linkText, cacheId }: SearchProductWithCache) =>
      cacheId || linkText,

    clusterHighlights: ({ clusterHighlights = {} }: SearchProduct) =>
      objToNameValue('id', 'name', clusterHighlights),

    jsonSpecifications: (product: SearchProduct) => {
      const { Specifications = [] } = product
      const specificationsMap = Specifications.reduce(
        (acc: Record<string, string>, key: string) => {
          acc[key] = (product as any)[key]
          return acc
        },
        {}
      )
      return JSON.stringify(specificationsMap)
    },

    productClusters: ({ productClusters = {} }: SearchProduct) =>
      objToNameValue('id', 'name', productClusters),

    properties: (product: SearchProduct) =>
      map(
        (name: string) => ({ name, values: (product as any)[name] }),
        product.allSpecifications || []
      ),

    propertyGroups: (product: SearchProduct) => {
      const { allSpecifications = [] } = product
      const notPG = knownNotPG.concat(allSpecifications)
      return objToNameValue('name', 'values', omit(notPG, product))
    },

    recommendations: (product: SearchProduct) => product,

    description: formatTranslatableProp<SearchProduct, 'description', 'productId'>(
      'description',
      'productId'
    ),

    metaTagDescription: formatTranslatableProp<SearchProduct, 'metaTagDescription', 'productId'>(
      'metaTagDescription',
      'productId'
    ),

    titleTag: ({ productId, productTitle, productName }: SearchProduct, _: unknown, ctx: Context) =>
      addContextToTranslatableString(
        {
          content: productTitle ?? productName ?? '',
          context: productId
        },
        ctx
      ),

    productName: formatTranslatableProp<SearchProduct, 'productName', 'productId'>(
      'productName',
      'productId'
    ),

    linkText: async ({ productId, linkText }: SearchProduct, _: unknown, ctx: Context) => {
      const { clients: { rewriter }, vtex: { binding } } = ctx

      if (!shouldTranslateForBinding(ctx)) {
        return linkText
      }
      const route = await rewriter.getRoute(productId, 'product', binding!.id!)
      return urlToSlug(route) ?? linkText
    },

    specificationGroups: (product: SearchProduct, _: unknown, ctx: Context) => {
      const allSpecificationsGroups = (product.allSpecificationsGroups ?? []).concat(['allSpecifications'])
      const specificationGroups = allSpecificationsGroups.map(
        (groupName: string) => ({
          name: addContextToTranslatableString({ content: groupName, context: product.productId }, ctx),
          specifications: ((product as any)[groupName] || []).map(
            (name: string) => ({
              name: addContextToTranslatableString({ content: name, context: product.productId }, ctx),
              values: (product as any)[addContextToTranslatableString({ content: name, context: product.productId }, ctx)] || [],
            })
          ),
        })
      )
      return specificationGroups || []
    },
    items: ({ items: searchItems }: SearchProduct, { filter }: ItemArg) => {
      if (filter === ItemsFilterEnum.ALL) {
        return searchItems
      }
      if (filter === ItemsFilterEnum.FIRST_AVAILABLE) {
        const firstAvailable = searchItems.find(isAvailable)
        return firstAvailable ? [firstAvailable] : [searchItems[0]]
      }
      if (filter === ItemsFilterEnum.ALL_AVAILABLE) {
        const onlyAvailable = searchItems.filter(isAvailable)
        return onlyAvailable.length > 0 ? onlyAvailable : [searchItems[0]]
      }
      return searchItems
    },
    priceRange: ({ items: searchItems }: SearchProduct) => {
      const offers = searchItems.reduce<CommertialOffer[]>(
        (acc, currentItem) => {
          for (const seller of currentItem.sellers) {
            if (isSellerAvailable(seller)) {
              acc.push(seller.commertialOffer)
            }
          }
          return acc
        },
        []
      )

      return { offers }
    },
  },
  OnlyProduct: {
    categoryTree: productCategoriesToCategoryTree,
  },
}
