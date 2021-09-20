import {
  convertISProduct,
  mergeProductWithItems,
} from '@vtex/vtexis-compatibility-layer'
import { Store } from '../clients/store'

const fillProductWithSimulation = async (
  product: SearchProduct,
  store: Store,
  ctx: Context,
  regionId?: string,
) => {
  const { vtex: { logger } } = ctx

  const payload = {
    items: product.items.map(item => ({
      itemId: item.itemId,
      sellers: item.sellers.map(seller => ({
        sellerId: seller.sellerId,
      })),
    })),
    regionId,
  }

  try {
    const itemsWithSimulation = await store.itemsWithSimulation(payload)

    if (!itemsWithSimulation.data) {
      return product
    }

    return mergeProductWithItems(
      product,
      itemsWithSimulation.data.itemsWithSimulation
    )
  } catch(error) {
    logger.error({
      message: error.message,
      error,
    })

    return product
  }
}

export const convertProducts = async (products: BiggySearchProduct[], ctx: Context, simulationBehavior: 'skip' | 'default' | null, channel?: string, regionId?: string) => {
  const {
    vtex: { segment },
    clients: { store },
  } = ctx
  const salesChannel = channel ?? segment?.channel?.toString()

  let convertedProducts =  products
    .map(product => convertISProduct(product, salesChannel))

  if (simulationBehavior === 'default') {
    const simulationPromises = convertedProducts.map(product => fillProductWithSimulation(product as SearchProduct, store, ctx, regionId))
    convertedProducts = (await Promise.all(simulationPromises)) as SearchProduct[]
  }

  return convertedProducts
}
