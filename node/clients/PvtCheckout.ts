import {
  InstanceOptions,
  IOContext,
  JanusClient,
  RequestConfig,
} from '@vtex/api'

import { statusToError } from '../utils'

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

  private getChannelQueryString = () => {
    const { segment } = this.context as CustomIOContext
    const channel = segment?.channel
    const queryString = channel ? `?sc=${channel}` : ''

    return queryString
  }

  public simulation = (simulation: SimulationPayload) =>
    this.post<SimulationOrderForm>(
      this.routes.simulation(this.getChannelQueryString()),
      simulation,
      {
        metric: 'pvt-checkout-simulation',
      }
    )

  protected post = <T>(url: string, data?: any, config: RequestConfig = {}) => {
    config.headers = {
      ...config.headers,
      ...this.getCommonHeaders(),
    }

    return this.http.post<T>(url, data, config).catch(statusToError) as Promise<
      T
    >
  }

  private get routes() {
    return {
      simulation: (queryString: string) =>
        `/api/checkout/pvt/orderForms/simulation${queryString}`,
    }
  }
}
