import {
  InstanceOptions,
  IOContext,
  JanusClient,
  RequestConfig,
} from '@vtex/api'

import { Order } from '../typings/Order'
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

  public orders = async ({ email }: CurrentProfile) => {
    const initialOrders = (await this.get(
      `${this.routes.orders}?clientEmail=${email}
    `,
      {
        metric: 'oms-orders',
      }
    )) as OrdersPagination

    const {
      paging: { pages, perPage },
    } = initialOrders

    return this.getAllOrders(pages, perPage, email)
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

  private getAllOrders = async (
    pages: number,
    perPage: number,
    email: string
  ) => {
    const fetchPages = Array.from({ length: pages }, (_, k) => k + 1).map(
      (page) => {
        const ordersPath = `${this.routes.orders}?clientEmail=${email}&page=${page}&per_page=${perPage}`

        return this.get(ordersPath, {
          metric: 'oms-orders',
        })
      }
    )

    const pagesResponse = await Promise.all(fetchPages)

    return (pagesResponse.reduce(
      (previousValue, currentValue) => [
        ...(previousValue as Order[]),
        ...(currentValue as { list: Order[] }).list,
      ],
      []
    ) as Order[]).map(this.mapOrder)
  }

  private mapOrder(order: Order) {
    return {
      allowCancellation: null,
      orderId: order.orderId,
      orderGroup: order.affiliateId,
      state: null,
      status: order.status,
      statusDescription: order.statusDescription,
      value: order.totalValue,
      salesChannel: order.salesChannel,
      creationDate: order.creationDate,
      customData: null,
      lastChange: order.lastChange,
      timeZoneCreationDate: order.creationDate,
      timeZoneLastChange: order.lastChange, // ????
      invoicedDate: null,
      isCompleted: order.orderIsComplete,
      items: order.items,
      sellers: null,
      totals: order.totalItems, // ???
      paymentData: order.paymentNames, // ????
      shippingData: order.ShippingEstimatedDate, // ???
      storePreferencesData: null,
    }
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
