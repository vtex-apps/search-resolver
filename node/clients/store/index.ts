import { AppGraphQLClient, IOContext, InstanceOptions } from '@vtex/api'

import { itemsWithSimulation } from './queries'

interface ItemsWithSimulationPayload {
  items: Array<{
    itemId: string
    sellers: Array<{ sellerId: string }>
  }>
}

export class Store extends AppGraphQLClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super('vtex.store-graphql@2.x', context, {
      ...options,
      headers: {
        ...options?.headers,
      },
    })
  }

  public itemsWithSimulation = (variables: ItemsWithSimulationPayload) => {
    return this.graphql.query<
      { itemsWithSimulation: SearchItem[] },
      ItemsWithSimulationPayload
    >(
      {
        query: itemsWithSimulation,
        variables,
      },
      {
        metric: 'recommendation-items-with-simulation',
      }
    )
  }
}
