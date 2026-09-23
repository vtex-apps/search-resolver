import type { InstanceOptions, IOContext } from '@vtex/api'
import { JanusClient } from '@vtex/api'

export interface DataplaneCategory {
  id: number
  isActive: boolean
  keyWords: string
  name: string
  fullPath: string
  fullPathUriName: string
  acceptedGlobalCategoryId: number | null
  suggestedGlobalCategoryId: number | null
  text: string | null
  title: string | null
}

export interface DataplaneProductResponse {
  categories: DataplaneCategory[] | null
}

export class CatalogDataplane extends JanusClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    const env = context.production ? 'stable' : 'beta'

    super(
      context,
      {
        ...options,
        headers: {
          ...options?.headers,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
      env
    )
  }

  public productById = (id: string | number, acceptLanguage?: string) => {
    const path = `/api/catalog-dataplane/product/${id}`
    const headers = acceptLanguage ? { 'Accept-Language': acceptLanguage } : {}

    return this.http.get<DataplaneProductResponse>(path, {
      metric: 'catalog-dataplane-product',
      headers,
    })
  }
}
