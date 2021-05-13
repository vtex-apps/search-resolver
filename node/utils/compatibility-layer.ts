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

export const convertProducts = (products: BiggySearchProduct[], ctx: Context) => {
  const {
    vtex: { segment },
    clients: { store },
  } = ctx
  const tradePolicy = segment?.channel?.toString()

  return products
    .map(product => convertISProduct(product, tradePolicy))
    .map(product => fillProductWithSimulation(product as SearchProduct, store))
}
