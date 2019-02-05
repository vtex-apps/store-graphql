import { Request, RequestOptions, Response } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

import { RESTDataSource } from './RESTDataSource'
import { SegmentData } from './session'

const DEFAULT_TIMEOUT_MS = 4 * 1000
const LONG_TIMEOUT_MS = 11 * 1000

export interface SimulationData {
  country: string
  items: any[]
  postalCode: string
}

export interface UpdateCheckinArgs {
  orderFormId: string,
  checkin: CheckinArgs,
}

interface CheckinArgs {
  isCheckedIn: boolean,
  pickupPointId?: string,
}

const SetCookieWhitelist = [
  'checkout.vtex.com',
  '.ASPXAUTH',
]

const isWhitelistedSetCookie = (cookie: string) => {
  const [key] = cookie.split('=')
  return SetCookieWhitelist.includes(key)
}

export class CheckoutDataSource extends RESTDataSource {
  public constructor() {
    super()
  }

  public addItem = (orderFormId: string, items: any) => this.post(
    `/pub/orderForm/${orderFormId}/items`,
    {
      orderItems: items,
    },
    {
      metric: 'checkout-addItem',
      timeout: LONG_TIMEOUT_MS
    }
  )

  public cancelOrder = (orderFormId: string, reason: string) => this.post(
    `/pub/orders/${orderFormId}/user-cancel-request`,
    {reason},
    {metric: 'checkout-cancelOrder'}
  )

  public setOrderFormCustomData = (orderFormId: string, appId: string, field: string, value: any) => this.put(
    `/pub/orderForm/${orderFormId}/customData/${appId}/${field}`,
    {
      value,
    },
    {metric: 'checkout-setOrderFormCustomData'}
  )

  public updateItems = (orderFormId: string, orderItems: any) => this.post(
    `/pub/orderForm/${orderFormId}/items/update`,
    {
      orderItems,
    },
    {
      metric: 'checkout-updateItems',
      timeout: LONG_TIMEOUT_MS,
    }
  )

  public updateOrderFormIgnoreProfile = (orderFormId: string, ignoreProfileData: boolean) => this.patch(
    `/pub/orderForm/${orderFormId}/profile`,
    {
      ignoreProfileData,
    },
    {metric: 'checkout-updateOrderFormIgnoreProfile'}
  )

  public updateOrderFormPayment = (orderFormId: string, payments: any) => this.post(
    `/pub/orderForm/${orderFormId}/attachments/paymentData`,
    {
      payments,
    },
    {metric: 'checkout-updateOrderFormPayment'}
  )

  public updateOrderFormProfile = (orderFormId: string, fields: any) => this.post(
    `/pub/orderForm/${orderFormId}/attachments/clientProfileData`,
    fields,
    {metric: 'checkout-updateOrderFormPayment'}
  )

  public updateOrderFormShipping = (orderFormId: string, shipping: any) => this.post(
    `/pub/orderForm/${orderFormId}/attachments/shippingData`,
    shipping,
    {metric: 'checkout-updateOrderFormShipping'}
  )

  public updateOrderFormMarketingData = (orderFormId: string, marketingData: any) => this.post(
    `/pub/orderForm/${orderFormId}/attachments/marketingData`,
    marketingData,
    {metric: 'checkout-updateOrderFormMarketingData'}
  )

  public addAssemblyOptions = async (orderFormId: string, itemId: string, assemblyOptionsId: string, body: any) =>
    this.post(
      `pub/orderForm/${orderFormId}/items/${itemId}/assemblyOptions/${assemblyOptionsId}`,
      body,
      {metric: 'checkout-addAssemblyOptions'}
    )

  public removeAssemblyOptions = async (orderFormId: string, itemId: string, assemblyOptionsId: string, body: any) =>
    this.delete(
      `pub/orderForm/${orderFormId}/items/${itemId}/assemblyOptions/${assemblyOptionsId}`,
      null as any,
      {
        body,
        metric: 'checkout-removeAssemblyOptions'
      }
    )


  public updateOrderFormCheckin = (orderFormId: string, checkinPayload: CheckinArgs) => this.post(
    `pub/orderForm/${orderFormId}/checkIn`,
    checkinPayload,
    {metric: 'checkout-updateOrderFormCheckin'}
  )

  public orderForm = () => this.post(
    `/pub/orderForm`,
    {expectedOrderFormSections: ['items']},
    {metric: 'checkout-orderForm'}
  )

  public orders = () => this.get(
    '/pub/orders',
    undefined,
    {metric: 'checkout-orders'}
  )

  public simulation = (simulation: SimulationData) => this.post(
    '/pub/orderForms/simulation',
    simulation,
    {metric: 'checkout-shipping'}
  )

  public get baseURL() {
    const {vtex: {account}} = this.context
    return `http://${account}.vtexcommercestable.com.br/api/checkout`
  }

  protected async didReceiveResponse (response: Response, request: Request) {
    const result = await super.didReceiveResponse(response, request)

    const rawHeaders = (response.headers as any).raw() as Record<string, any>
    const responseSetCookies: string[] = rawHeaders && rawHeaders['set-cookie']

    if (responseSetCookies) {
      const forwardedSetCookies = responseSetCookies.filter(isWhitelistedSetCookie)
      if (forwardedSetCookies.length > 0) {
        this.context.set('set-cookie', forwardedSetCookies)
      }
    }

    return result
  }

  protected willSendRequest (request: RequestOptions) {
    const {vtex: {account, authToken}, headers} = this.context
    const segmentData: SegmentData | null = (this.context.vtex as any).segment
    const { channel: salesChannel = '' } = segmentData || {}

    if (!request.timeout) {
      request.timeout = DEFAULT_TIMEOUT_MS
    }

    if (salesChannel) {
      request.params.set('sc', salesChannel.toString())
    }

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        Accept: 'application/json',
        Authorization: authToken,
        'Content-Type': 'application/json',
        'Cookie': headers.cookie,
        Host: headers['x-forwarded-host'],
        'Proxy-Authorization': authToken,
        'X-Vtex-Proxy-To': `http://${account}.vtexcommercestable.com.br`,
      }
    )
  }
}
