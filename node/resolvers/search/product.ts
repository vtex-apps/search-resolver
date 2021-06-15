import { compose, last, omit, pathOr, split, flatten } from 'ramda'

import {
  addContextToTranslatableString,
  formatTranslatableProp,
  shouldTranslateToBinding,
  shouldTranslateToUserLocale,
} from '../../utils/i18n'
import { getBenefits } from '../benefits'
import { buildCategoryMap } from './utils'

type DynamicKey<T> = Record<string, T>

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

const getProductFilterIdMap = async (product: SearchProduct, ctx: Context) => {
  const filters = await ctx.clients.search.filtersInCategoryFromId(product.categoryId)
  const filterMapFromName = filters.reduce(
    (acc, curr) => {
      acc[curr.Name] = curr.FieldId.toString()
      return acc
    },
    {} as Record<string, string>
  )
  return filterMapFromName
}

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

const addTranslationParamsToSpecification = (filterIdFromNameMap: Record<string, string>, ctx: Context) => (specification: { name: string, values: string[] }) => {
  const { name, values } = specification
  const filterId = filterIdFromNameMap[name]
  return {
    originalName: name,
    name: addContextToTranslatableString({ content: name, context: filterId }, ctx),
    values: values.map(value => addContextToTranslatableString({ content: value, context: filterId }, ctx))
  }
}

export const resolvers = {
  Product: {
    brand: formatTranslatableProp<SearchProduct, 'brand', 'brandId'>(
      'brand',
      'brandId'
    ),

    benefits: async ({ items }: SearchProduct, _: any, ctx: Context) =>
      flatten(await Promise.all(items?.map(item => getBenefits(item.itemId, ctx)))),

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

    properties: async (product: SearchProduct, _: unknown, ctx: Context) => {
      const valuesUntranslated = (product.allSpecifications ?? []).map((name: string) => {
        const value = (product as unknown as DynamicKey<string[]>)[name]
        return { name, originalName: name, values: value }
      })
      if (!shouldTranslateToUserLocale(ctx)) {
        return valuesUntranslated
      }

      const filterIdFromNameMap = await getProductFilterIdMap(product, ctx)
      const valuesWithTranslations = valuesUntranslated.map(addTranslationParamsToSpecification(filterIdFromNameMap, ctx))
      return valuesWithTranslations
    },

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

      if (!shouldTranslateToBinding(ctx)) {
        return linkText
      }
      const route = await rewriter.getRoute(productId, 'product', binding!.id!)
      return urlToSlug(route) ?? linkText
    },

    specificationGroups: async (product: SearchProduct, _: unknown, ctx: Context) => {
      const allSpecificationsGroups = (product.allSpecificationsGroups ?? []).concat(['allSpecifications'])

      const visibleSpecifications = product.completeSpecifications
        ? product.completeSpecifications.reduce<Record<string, boolean>>((acc, specification) => {
            acc[specification.Name] = specification.IsOnProductDetails
            return acc
          }, {})
        : null

      let noTranslationSpecificationGroups = allSpecificationsGroups.map(
        (groupName: string) => {
          let groupSpecifications = (product as unknown as DynamicKey<string[]>)?.[groupName] ?? []

          groupSpecifications = groupSpecifications.filter(specificationName => {
            if (visibleSpecifications && visibleSpecifications[specificationName] != null)
              return visibleSpecifications[specificationName]
            return true
          })

          return {
            originalName: groupName,
            name: groupName,
            specifications: groupSpecifications.map((name) => {
                const values = (product as unknown as DynamicKey<string[]>)[name] || []
                return {
                  originalName: name,
                  name,
                  values,
                }
              }
            ),
          }
        }
      )

      noTranslationSpecificationGroups = noTranslationSpecificationGroups.filter(group => group.specifications.length > 0)

      if (!shouldTranslateToUserLocale(ctx)) {
        return noTranslationSpecificationGroups
      }

      const filterIdFromNameMap = await getProductFilterIdMap(product, ctx)
      const translatedGroups = noTranslationSpecificationGroups.map(group => {
        return {
          originalName: group.name,
          name: addContextToTranslatableString({ content: group.name, context: product.productId }, ctx),
          specifications: group.specifications.map(addTranslationParamsToSpecification(filterIdFromNameMap, ctx))
        }
      })

      return translatedGroups
    },
    items: ({ items: searchItems, skuSpecifications = [] }: SearchProduct, { filter }: ItemArg) => {
      const searchItemsWithVariations = searchItems.map(item => ({ ...item, skuSpecifications }))
      if (filter === ItemsFilterEnum.ALL) {
        return searchItemsWithVariations
      }
      if (filter === ItemsFilterEnum.FIRST_AVAILABLE) {
        const firstAvailable = searchItemsWithVariations.find(isAvailable)
        return firstAvailable ? [firstAvailable] : [searchItemsWithVariations[0]]
      }
      if (filter === ItemsFilterEnum.ALL_AVAILABLE) {
        const onlyAvailable = searchItemsWithVariations.filter(isAvailable)
        return onlyAvailable.length > 0 ? onlyAvailable : [searchItemsWithVariations[0]]
      }
      return searchItemsWithVariations
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
