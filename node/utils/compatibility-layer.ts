import {
  convertISProduct,
  mergeProductWithItems,
} from '@vtex/vtexis-compatibility-layer'
import { Store } from '../clients/store'

const fillProductWithSimulation = async (
  product: SearchProduct,
  store: Store,
  simulationBehavior: 'default' | 'only1P',
  regionId?: string,
) => {
  const payload = {
    items: product.items.map(item => ({
      itemId: item.itemId,
      sellers: simulationBehavior === 'only1P' ? [{sellerId: "1"}] : item.sellers.map(seller => ({
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
      itemsWithSimulation.data.itemsWithSimulation,
      simulationBehavior
    )
  } catch(error) {
    // TODO: PER-2503 - Improve error observability
    if (process.env.VTEX_APP_LINK) {
      console.error(error)
    }

    return product
  }
}

export const convertProducts = async (products: BiggySearchProduct[], ctx: Context, simulationBehavior: 'skip' | 'default' | 'only1P' | null, channel?: string, regionId?: string) => {
  const {
    vtex: { segment },
    clients: { store },
  } = ctx
  const salesChannel = channel ?? segment?.channel?.toString()

  let convertedProducts =  products
    .map(product => convertISProduct(product, salesChannel))

  if (simulationBehavior === 'default' || simulationBehavior === 'only1P') {
    const simulationPromises = convertedProducts.map(product => fillProductWithSimulation(product as SearchProduct, store, simulationBehavior, regionId))
    convertedProducts = (await Promise.all(simulationPromises)) as SearchProduct[]
  }

  return convertedProducts
}
