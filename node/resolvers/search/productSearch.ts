import { path } from 'ramda'
import { IOResponse } from '@vtex/api'
import { Functions } from '@gocommerce/utils'
import { zipQueryAndMap } from './utils'

interface ProductSearchParent {
  productsRaw: IOResponse<SearchProduct[]>
  translatedArgs: SearchArgs
  searchMetaData: {
    titleTag: string | null
    metaTagDescription: string | null
  }
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
      { vtex: { account }, clients: { search } }: Context
    ) => {
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
        })
      )
    },
  },
}
