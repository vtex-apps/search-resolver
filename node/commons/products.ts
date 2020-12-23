import { convertBiggyProduct } from './compatibility-layer'
import { map, prop, isEmpty, sort, indexOf } from 'ramda'
import { queries } from '../resolvers/search'

interface ConvertProductInput {
  searchResult: any
  ctx: any
  simulationBehavior?: 'skip' | 'default' | null
  tradePolicy?: string | null
  regionId?: string | null
}

export const productsBiggy = async ({ searchResult, ctx, simulationBehavior = 'default', tradePolicy, regionId }: ConvertProductInput) => {
  const { segment, locale: ctxLocale, tenant } = ctx.vtex
  const checkout = ctx.clients.checkout
  const locale = ctxLocale ?? tenant?.locale;
  const products: any[] = []

  searchResult.products.forEach((product: any) => {
    try {
      products.push(convertBiggyProduct(product, checkout, simulationBehavior, tradePolicy ?? segment?.channel, segment?.priceTables, regionId, locale))
    } catch (err) {
      console.error(err)
    }
  })

  return products
}

export const productsCatalog = async ({ searchResult, ctx, tradePolicy, regionId }: ConvertProductInput) => {
  let biggyProducts: any[] = searchResult.products
  let products: any[] = []
  const productIds = map<any, string>((product: any) => {
    return prop('product', product) || prop('id', product) || ''
  }, biggyProducts)

  if (!isEmpty(productIds)) {
    // Get products' model from VTEX search API
    products = await queries.productsByIdentifier(
      undefined,
      {
        field: 'id',
        values: productIds,
        salesChannel: tradePolicy,
        regionId
      },
      ctx
    )

    // Add extra data and correct index
    products.forEach((product: any) => {
      const idx = indexOf(product.productId, productIds)
      const biggyProduct = biggyProducts[idx]

      // This will help to sort the products
      product.biggyIndex = idx

      if (biggyProduct.extraData && biggyProduct.extraData.length) {
        product.allSpecifications = product.allSpecifications || []

        biggyProduct.extraData.forEach(({ key, value }: BiggyProductExtraData) => {
          if (indexOf(key, product.allSpecifications) < 0) {
            product.allSpecifications.push(key)
            product[key] = [value]
          }
        })
      }
    })

    // Maintain biggySearch's order.
    products = sort((a, b) => a.biggyIndex - b.biggyIndex, products)
  }

  return products
}
