import { InstanceOptions, IOContext, JanusClient, RequestConfig } from '@vtex/api'
import { statusToError } from '../utils'

export class OMS extends JanusClient {
  public constructor (ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...options && options.headers,
        ...(ctx.storeUserAuthToken
          ? { VtexIdclientAutCookie: ctx.storeUserAuthToken }
          : null),
      }
    })
  }

  public userLastOrder = () => this.get(
    this.routes.lastOrder,
    {metric: 'oms-userLastOrder'}
  )

  public order = (id: string) => this.get(
    this.routes.order(id),
    {metric: 'oms-order'}
  )

  protected get = <T>(url: string, config: RequestConfig = {}) => {
    config.headers = {
      ...config.headers,
      Cookie: `vtex_segment=${this.context.segmentToken};vtex_session=${this.context.sessionToken};`,
    }
    return this.http.get<T>(url, config).catch(statusToError)
  }
  private get routes () {
    const base = '/api/oms'
    return {
      lastOrder: `${base}/user/orders/last`,
      order: (id: string) => `${base}/pvt/orders/${id}`,
    }
  }
}
