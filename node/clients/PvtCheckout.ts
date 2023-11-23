import {
  InstanceOptions,
  IOContext,
  JanusClient,
  RequestConfig,
} from '@vtex/api'

import { statusToError } from '../utils'
import jsonToQuerystring from '../utils/jsonToQuerystring'

export class PvtCheckout extends JanusClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...options?.headers,
        ...(ctx.authToken ? { VtexIdclientAutCookie: ctx.authToken } : null),
        'x-vtex-user-agent': ctx.userAgent,
      },
    })
  }

  private getCommonHeaders = () => {
    const { segmentToken, sessionToken } = this.context as CustomIOContext

    const segmentTokenCookie = segmentToken
      ? `vtex_segment=${segmentToken};`
      : ''

    const sessionTokenCookie = sessionToken
      ? `vtex_session=${sessionToken};`
      : ''

    return {
      Cookie: `${segmentTokenCookie}${sessionTokenCookie}`,
    }
  }

  private getChannelQueryString = (salesChannel?: string) => {
    const { segment } = this.context as CustomIOContext
    const channel = salesChannel ?? segment?.channel

    return channel ? `?sc=${channel}` : ''
  }

  public simulation = (simulation: SimulationPayload, salesChannel?: string) =>
    this.get<SimulationOrderForm>(
      this.routes.simulation(
        `${this.getChannelQueryString(salesChannel)}&${jsonToQuerystring(
          'request',
          simulation
        )}`
      ),
      {
        metric: 'pvt-checkout-simulation',
      }
    )

  protected get = <T>(url: string, config: RequestConfig = {}) => {
    config.headers = {
      ...config.headers,
      ...this.getCommonHeaders(),
    }

    return this.http.get<T>(url, config).catch(statusToError) as Promise<T>
  }

  private get routes() {
    return {
      simulation: (queryString: string) =>
        `/api/checkout/pvt/orderForms/simulation${queryString}`,
    }
  }
}
