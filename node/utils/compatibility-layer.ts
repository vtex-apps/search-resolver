import {
  convertISProduct,
  mergeProductWithItems,
} from 'vtexis-compatibility-layer'
import { Store } from '../clients/store'

const fillProductWithSimulation = async (
  product: SearchProduct,
  store: Store
) => {
  const payload = {
    items: product.items.map(item => ({
      itemId: item.itemId,
      sellers: item.sellers.map(seller => ({
        sellerId: seller.sellerId,
      })),
    })),
  }

  const itemsWithSimulation = await store.itemsWithSimulation(payload)

  if (!itemsWithSimulation.data) {
    return product
  }

  return mergeProductWithItems(
    product,
    itemsWithSimulation.data.itemsWithSimulation
  )
}

export const convertProducts = async (products: BiggySearchProduct[], ctx: Context, simulationBehavior: 'skip' | 'default' | null) => {
  const {
    vtex: { segment },
    clients: { store },
  } = ctx
  const tradePolicy = segment?.channel?.toString()

  let convertedProducts =  products
    .map(product => convertISProduct(product, tradePolicy))

  if (simulationBehavior === 'default') {
    const simulationPromises = convertedProducts.map(product => fillProductWithSimulation(product as SearchProduct, store))
    convertedProducts = (await Promise.all(simulationPromises)) as SearchProduct[]
  }

  return convertedProducts
}
