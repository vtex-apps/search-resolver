import { InstanceOptions, IOContext, JanusClient } from '@vtex/api'
export default class Catalog extends JanusClient {
  private SKU_ENDPOINT: string =
    '/api/catalog_system/pvt/sku/stockkeepingunitbyid'

  constructor(context: IOContext, options?: InstanceOptions) {
    super(context, options)
  }

  public async skuStockKeepingUnitById(skuId: number | string) {
    let headers = this.headers()
    return this.http.get(`${this.SKU_ENDPOINT}/${skuId}`, { headers: headers })
  }

  private headers() {
    return {
      'X-Vtex-Use-Https': true,
      VtexIdclientAutCookie: this.context.authToken,
    }
  }
}
