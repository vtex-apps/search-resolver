import { path } from 'ramda'
import { IOResponse } from '@vtex/api'
import { Functions } from '@gocommerce/utils'
import { zipQueryAndMap, breadcrumbMapKey } from './utils'
import { shouldTranslateForBinding } from '../../utils/i18n'

interface ProductSearchParent {
  productsRaw: IOResponse<SearchProduct[]>
  translatedArgs: SearchArgs
  searchMetaData: {
    titleTag: string | null
    metaTagDescription: string | null
  }
}

interface Metadata {
  id: string
  name: string
}

const getTypeForCategory = (index: number) => {
  if (index === 0) {
    return 'department'
  }
  if (index === 1) {
    return 'category'
  }
  return 'subcategory'
}

const getRouteForQueryUnit = async (queryUnit: string, mapUnit: string, categoriesSearched: string[], index: number, ctx: Context) => {
  const bindingId = ctx.vtex.binding!.id!
  const key = `${queryUnit}-${mapUnit}`
  if (mapUnit === 'b') {
    const brandPageType = await ctx.clients.search.pageType(queryUnit, 'map=b')

    if (index === 0) {
      // if it is a brand page, we should check if there is a route on rewriter for this brand
      const brandFromRewriter = await ctx.clients.rewriter.getRoute(brandPageType.id, 'brand', bindingId)
      if (brandFromRewriter) {
        return { path: brandFromRewriter, key, name: brandPageType.name, id: brandPageType.id }
      }
    }
    return { path: queryUnit, key, name: brandPageType.name, id: brandPageType.id }
  }
  if (mapUnit === 'c') {
    const categoryPosition = categoriesSearched.findIndex(cat => cat === queryUnit)
    const category = await ctx.clients.search.pageType(categoriesSearched.slice(0, categoryPosition + 1).join('/'))
    const route = await ctx.clients.rewriter.getRoute(category.id, getTypeForCategory(categoryPosition), bindingId)
    return { path: route ?? queryUnit, key, name: category.name, id: category.id }
  }
  return { path: queryUnit, key, name: null, id: null }
}

const breadcrumbDataWithBinding = async (queryAndMap: [string, string][], categoriesSearched: string[], mapArray: string[], ctx: Context) => {
  const queryTranslationsAndKeys = await Promise.all(queryAndMap.map(([queryUnit, mapUnit], index) => {
    return getRouteForQueryUnit(queryUnit, mapUnit, categoriesSearched, index, ctx)
  }))
  const queryTranslations = queryTranslationsAndKeys.reduce((acc, curr) => {
    acc[curr.key] = curr.path
    return acc
  }, {} as Record<string, string>)

  const metadataMap = queryTranslationsAndKeys.filter(({ name }) => Boolean(name)).reduce((acc, curr) => {
    acc[curr.key] = { name: curr.name!, id: curr.id! }
    return acc
  }, {} as Record<string, Metadata>)

  const indexFirstCategory = mapArray.findIndex(m => m === 'c')
  const hrefs = queryAndMap.reduce((acc, curr) => {
    const [queryUnit, mapUnit] = curr
    const slug = mapUnit === 'c' || mapUnit === 'b' ? queryTranslations[breadcrumbMapKey(queryUnit, mapUnit)] : queryUnit
    let prefix = acc.length > 0 ? acc[acc.length - 1] : ''
    if (mapUnit === 'c') {
      prefix = indexFirstCategory > 0 ? acc[indexFirstCategory - 1] : ''
    }
    const noSlashSlug = slug.startsWith('/') ? slug.slice(1) : slug
    const url = `${prefix}/${noSlashSlug}`
    acc.push(url)
    return acc
  }, [] as string[])

  return { hrefs, metadataMap }
}

export const resolvers = {
  ProductSearch: {
    titleTag: path(['searchMetaData', 'titleTag']),
    metaTagDescription: path(['searchMetaData', 'metaTagDescription']),
    recordsFiltered: ({ productsRaw }: ProductSearchParent) => {
      const {
        headers: { resources },
      } = productsRaw
      const quantity = resources.split('/')[1]
      return parseInt(quantity, 10)
    },
    products: ({ productsRaw }: ProductSearchParent, _: any, ctx: Context) => {
      let hasBroken = false
      for (const product of productsRaw.data) {
        for (const item of product.items) {
          if (item.sellers == null) {
            const config: any = (productsRaw as any).config
            ctx.vtex.logger.error({
              message: 'Item missing sellers!',
              searchUrl: config.url.replace(/\/proxy\/authenticated\/catalog|\/proxy\/catalog/, ''),
              params: JSON.stringify(config.params)
            })
            hasBroken = true
            break
          }
        }
        if (hasBroken) {
          break
        }
      }
      return productsRaw.data
    },
    breadcrumb: async (
      { translatedArgs, productsRaw: { data: products } }: ProductSearchParent,
      _: any,
      ctx: Context
    ) => {
      const { vtex: { account }, clients: { search } } = ctx
      const query = translatedArgs?.query || ''
      const map = translatedArgs?.map || ''
      const queryAndMap = zipQueryAndMap(
        translatedArgs?.query,
        translatedArgs?.map
      )
      const categoriesSearched = queryAndMap
        .filter(([_, m]) => m === 'c')
        .map(([q]) => q)

      const categoriesCount = map.split(',').filter(m => m === 'c').length
      const categories =
        !!categoriesCount && Functions.isGoCommerceAcc(account)
          ? await search.categories(categoriesCount)
          : []

      const queryArray = query.split('/')
      const mapArray = map.split(',')

      const { metadataMap, hrefs } =
        shouldTranslateForBinding(ctx) ?
          await breadcrumbDataWithBinding(queryAndMap, categoriesSearched, mapArray, ctx)
          : { metadataMap: {}, hrefs: null }

      return queryAndMap.map(
        ([queryUnit, mapUnit]: [string, string], index: number) => ({
          queryUnit,
          mapUnit,
          index,
          queryArray,
          mapArray,
          categories,
          categoriesSearched,
          products,
          metadataMap,
          hrefs
        })
      )
    },
  },
}
