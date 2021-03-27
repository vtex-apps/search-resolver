import { JanusClient } from '@vtex/api'
import type {
    IProductInventory,
    IProductInventoryByAccount,
    IProductInventoryUpdate,
} from './types'

export class InventoryClient extends JanusClient {


    public getProductInventoryByAccount = async (
        sku: string,
        account: string
    ) => {
        const requestConfig = {
            metric: 'manage- franchises - product - inventory',
            params: {
                an: account,
            },
    }
    const result = await this.http.get<IProductInventory>(
        this.routes.productInventory(sku),
        requestConfig
    )
    const data: IProductInventoryByAccount = { account, ...result }
    return data
  }
  public updateProductInventoryByAccount = async (
        product: IProductInventoryUpdate
    ) => {
    const { skuId, account, warehouseId, ...rest } = product
    const requestConfig = {
        metric: 'manage- franchises - product - inventory - update',
        params: {
            an: account,
        },
}
const result = await this.http.put<boolean>(
    this.routes.updateProductInventory(skuId, warehouseId),
    { ...rest, dateUtcOnBalanceSystem: null },
    requestConfig
)
return result
  }
  private get routes() {
    return {
        productInventory: (sku: string) =>
            `/api/logistics/pvt/inventory/skus/${sku}`,
        updateProductInventory: (sku: string, warehouseId: string) =>
            `/api/logistics/pvt/inventory/skus/${sku}/warehouses/${warehouseId}`,
    }
}
}





