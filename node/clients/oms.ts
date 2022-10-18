import {
  InstanceOptions,
  IOContext,
  JanusClient,
  RequestConfig,
} from '@vtex/api'

import { statusToError } from '../utils'

type OrdersPagination = {
  paging: {
    total: number
    pages: number
    currentPage: number
    perPage: number
  }
}

export class OMS extends JanusClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...options?.headers,
        ...(ctx.storeUserAuthToken
          ? { VtexIdclientAutCookie: ctx.storeUserAuthToken }
          : null),
      },
    })
  }

  public userLastOrder = () =>
    this.get(this.routes.lastOrder, { metric: 'oms-userLastOrder' })

  public order = (id: string) =>
    this.get(this.routes.order(id), { metric: 'oms-order' })

  public orders = async () => {
    const initialOrders: OrdersPagination = (await this.get(
      this.routes.orders,
      {
        metric: 'oms-orders',
      }
    )) as OrdersPagination

    const {
      paging: { pages, perPage },
    } = initialOrders

    return this.getAllOrders(pages, perPage)
  }

  protected get = <T>(url: string, config: RequestConfig = {}) => {
    const { segmentToken, sessionToken } = this.context as CustomIOContext
    const segmentTokenCookie = segmentToken
      ? `vtex_segment=${segmentToken};`
      : ''

    const sessionTokenCookie = sessionToken
      ? `vtex_session=${sessionToken};`
      : ''

    config.headers = {
      ...config.headers,
      Cookie: `${segmentTokenCookie}${sessionTokenCookie}`,
    }

    return this.http.get<T>(url, config).catch(statusToError)
  }

  private getAllOrders = async (pages: number, perPage: number) => {
    const fetchPages = Array.from({ length: pages }, (_, k) => k + 1).map(
      (page) => {
        const ordersPath = `${this.routes.orders}?page=${page}&per_page=${perPage}`

        return this.get(ordersPath, {
          metric: 'oms-orders',
        })
      }
    )

    const pagesResponse = await Promise.all(fetchPages)

    return pagesResponse.reduce(
      (previousValue, currentValue) => [
        ...(previousValue as any[]),
        ...(currentValue as { list: any[] }).list,
      ],
      []
    )
  }

  private get routes() {
    const base = '/api/oms'

    return {
      lastOrder: `${base}/user/orders/last`,
      order: (id: string) => `${base}/pvt/orders/${id}`,
      orders: `${base}/user/orders`,
    }
  }
}
