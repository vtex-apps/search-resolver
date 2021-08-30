import { convertBiggyProduct } from './compatibility-layer'
import { map, prop, isEmpty, sort, indexOf } from 'ramda'
import { queries } from '../resolvers/search'
import { flags } from '../featureFlags'

interface ConvertProductInput {
  searchResult: any
  ctx: any
  simulationBehavior?: 'skip' | 'default' | null
  tradePolicy?: string | null
  regionId?: string | null
}

export const productsBiggy = async ({ searchResult, ctx, simulationBehavior = 'default', tradePolicy, regionId }: ConvertProductInput) => {
  const { segment } = ctx.vtex
  const checkout = ctx.clients.checkout
  let products: any[] = []

  const startTime = process.hrtime();
  if (Math.random() < (flags.VTEX_PARALLELIZED_PRODUCT_CONVERTION_RATIO || 0.0)) {
    const convert = async (product: any) => {
      try {
        return await convertBiggyProduct(
          product, checkout, simulationBehavior, segment, tradePolicy ?? segment?.channel, regionId)
      } catch (err) {
        return null
      }
    }
    const results = await Promise.all(searchResult.products.map(convert))
    products = products.concat(results.filter(p => p !== null))
    const errors = results.length - products.length;
    if (errors > 0) {
      console.error(`productsBiggy products: ${products.length} errors: ${errors}`)
    }
    ctx.metrics[`productsBiggy-convertBiggyProduct-parallel`] = process.hrtime(startTime)
  } else {
    searchResult.products.forEach((product: any) => {
      try {
        products.push(convertBiggyProduct(product, checkout, simulationBehavior, segment, tradePolicy ?? segment?.channel, regionId))
      } catch (err) {
        console.error(err)
      }
    })
    ctx.metrics[`productsBiggy-convertBiggyProduct-serial`] = process.hrtime(startTime)
  }

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
