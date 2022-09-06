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
        vtexIdclientAutCookie: ctx.authToken
      },
    })
  }

  private getChannelQueryString = (tradePolicy?: string) => {
    const { segment } = this.context as CustomIOContext
    const channel = segment && segment.channel
    const selectedTradePolicy = tradePolicy ? tradePolicy : (channel ? channel : "")
    return selectedTradePolicy ? `?sc=${selectedTradePolicy}` : ''
  }

  public simulation = (simulation: SimulationPayload, tradePolicy?: string) =>
    this.post<OrderForm>(
      this.routes.simulation(this.getChannelQueryString(tradePolicy)),
      simulation,
      {
        metric: 'checkout-simulation',
      }
    )

  protected post = <T>(url: string, data?: any, config: RequestConfig = {}) => {
    return this.http.post<T>(url, data, config).catch(statusToError) as Promise<
      T
    >
  }

  private get routes() {
    const base = '/api/checkout'
    return {
      simulation: (queryString: string) =>
        `${base}/pvt/orderForms/simulation${queryString}`,
    }
  }
}
