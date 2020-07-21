import { map, prop, isEmpty, sort, indexOf } from 'ramda'

import { convertBiggyProduct } from './compatibility-layer'
import { queries } from '../resolvers/search'

export const productsBiggy = async (
  searchResult: any,
  ctx: Context & { vtex: { segment: { channel: string } } }
) => {
  const { segment, logger } = ctx.vtex
  const products: any[] = []

  searchResult.products.forEach((product: any) => {
    try {
      products.push(convertBiggyProduct(product, segment?.channel))
    } catch (err) {
      console.log(err) // eslint-disable-line no-console
      logger.error(err)
    }
  })

  return products
}

export const productsCatalog = async (
  searchResult: any,
  ctx: Context & { vtex: { segment: { channel: string } } }
) => {
  let products: any[] = []
  const biggyProducts: any[] = searchResult.products
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

        biggyProduct.extraData.forEach(
          ({ key, value }: BiggyProductExtraData) => {
            if (indexOf(key, product.allSpecifications) < 0) {
              product.allSpecifications.push(key)
              product[key] = [value]
            }
          }
        )
      }
    })

    // Maintain biggySearch's order.
    products = sort((a, b) => a.biggyIndex - b.biggyIndex, products)
  }

  return products
}
