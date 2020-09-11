import {
  InstanceOptions,
  IOContext,
  RequestConfig,
  ExternalClient,
} from '@vtex/api'

import { statusToError } from '../utils'

export class Checkout extends ExternalClient {
  public constructor(context: IOContext, options?: InstanceOptions) {
    super(`https://${context.account}.vtexcommercebeta.com.br/`, context, {
      ...options,
      headers: {
        ...(options && options.headers),
      },
    })
  }

  private getChannelQueryString = () => {
    const { segment } = this.context as CustomIOContext
    const channel = segment && segment.channel
    const queryString = channel ? `?sc=${channel}` : ''
    return queryString
  }

  public simulation = (simulation: SimulationPayload) =>
    this.post<OrderForm>(
      this.routes.simulation(this.getChannelQueryString()),
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
