import { AppGraphQLClient, IOContext, InstanceOptions } from '@vtex/api'

import { itemsWithSimulation } from './queries'

interface ItemsWithSimulationPayload {
  items: {
    itemId: string
    sellers: { sellerId: string }[]
  }[],
  regionId?: string
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
        metric: 'search-items-with-simulation',
      }
    )
  }
}
