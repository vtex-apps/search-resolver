import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'

export interface SkuStockKeepingUnitByIdReponse {
  'ProductSpecifications': {
    "FieldGroupId": number,
    "FieldGroupName": string
  }[]
}

export class Catalog extends ExternalClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super(
      `http://${context.account}.vtexcommercestable.com.br/api/catalog_system`,
      context,
      {
        ...(options ?? {}),
        headers: {
          ...(options?.headers ?? {}),
          'Content-Type': 'application/json',
          'VtexIdclientAutCookie': context.authToken,
          'X-Vtex-Use-Https': 'true',
        },
      }
    )
  }

  public skuStockKeepingUnitById (id: string | number) {
    return this.http.get<SkuStockKeepingUnitByIdReponse>(`/pvt/sku/stockkeepingunitbyid/${id}`, {
      metric: 'sku-stock-kepping-unit-by-id',
    })
  }
}
