import { AuthenticationError, ForbiddenError, InstanceOptions, IOContext, JanusClient, RequestConfig, UserInputError } from '@vtex/api'
import { AxiosError } from 'axios'

const statusToError = (e: any) => {
  if (!e.response) {
    throw e
  }
  const { response } = e as AxiosError
  const { status } = response!
  if (status === 401) {
    throw new AuthenticationError(e)
  }
  if (status === 403) {
    throw new ForbiddenError(e)
  }
  if (status === 400) {
    throw new UserInputError(e)
  }
  throw e
}

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
