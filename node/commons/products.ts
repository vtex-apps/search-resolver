import { convertBiggyProduct } from './compatibility-layer'
import { map, prop, isEmpty, sort, indexOf } from 'ramda'
import { queries } from '../resolvers/search'

export const productsBiggy = async (searchResult: any, ctx: any) => {
  const { segment } = ctx.vtex
  const products: any[] = []

  searchResult.products.forEach((product: any) => {
    try {
      products.push(convertBiggyProduct(product, segment && segment.channel))
    } catch (e) {
      // TODO: add logging
    }
  })

  return products
}

export const productsCatalog = async (searchResult: any, ctx: any) => {
  let products: any[] = searchResult.products
  const productIds = map<any, string>((product: any) => {
    return prop('product', product) || prop('id', product) || ''
  }, products)

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

    // Maintain biggySearch's order.
    products = sort(
      (a, b) =>
        indexOf(a.productId, productIds) - indexOf(b.productId, productIds),
      products
    )
  }

  return products
}
