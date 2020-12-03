import {
  InstanceOptions,
  IOContext,
  JanusClient,
  RequestConfig,
} from '@vtex/api'

import { statusToError } from '../utils'

export class Checkout extends JanusClient {
  public constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...(options && options.headers),
      },
    })
  }

  private getChannelQueryString = (tradePolicy?: string) => {
    const { segment } = this.context as CustomIOContext
    const channel = segment && segment.channel
    const queryString = channel ? `?sc=${tradePolicy ?? channel}` : ''
    return queryString
  }

  public simulation = (simulation: SimulationPayload, tradePolicy?: string) =>
    this.post<OrderForm>(
      this.routes.simulation(this.getChannelQueryString(tradePolicy)),
      simulation,
      {
        metric: 'checkout-simulation',
      }
    )

  public regions = (regionId: string, channel?: number) =>
    this.http.get(this.routes.regions(regionId, channel))

  protected post = <T>(url: string, data?: any, config: RequestConfig = {}) => {
    return this.http.post<T>(url, data, config).catch(statusToError) as Promise<
      T
    >
  }

  private get routes() {
    const base = '/api/checkout/pub'
    return {
      simulation: (queryString: string) =>
        `${base}/orderForms/simulation${queryString}`,
      regions: (regionId: string, channel?: number) =>
        `${base}/regions/${regionId}${channel ? `?sc=${channel}` : ''}`,
    }
  }
}
