import { Request, RequestOptions, Response, RESTDataSource } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

import { SegmentData } from './session'

const DEFAULT_TIMEOUT_MS = 4 * 1000

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

const withHost: Modifier = (opts: ModOptions, ctx: Context) => {
  const {headers} = opts
  headers.set('Host', ctx.headers['x-forwarded-host'])
  return opts
}

const withVtexProxyTo: Modifier = (opts: ModOpts, {vtex: {account}}: Context) => {
  const {headers} = opts
  headers.set('X-Vtex-Proxy-To', `http://${account}.vtexcommercestable.com.br`)
  return opts
}
  
export class CheckoutDataSource extends OutboundDataSource<Context> {
  constructor() {
    super()
  }

  protected modifiers = [
    withTimeout(DEFAULT_TIMEOUT_MS),
    withHeader('Accept', 'application/json'),
    withAuth,
    withHeader('Content-Type', 'application/json'),
    withCookies,
    withHost,
    withOutboundAuth,
    withVtexProxyTo,
  ]

  public addItem = (orderFormId: string, items: any) => this.http.post(
    `/pub/orderForm/${orderFormId}/items`,
    {
      orderItems: items,
    }
  )

  public cancelOrder = (orderFormId: string, reason: string) => this.http.post(
    `/pub/orders/${orderFormId}/user-cancel-request`,
    {reason},
  )

  public setOrderFormCustomData = (orderFormId: string, appId: string, field: string, value: any) => this.http.put(
    `/pub/orderForm/${orderFormId}/customData/${appId}/${field}`,
    {
      value,
    }
  )

  public updateItems = (orderFormId: string, orderItems: any) => this.http.post(
    `/pub/orderForm/${orderFormId}/items/update`,
    {
      orderItems,
    }
  )

  public updateOrderFormIgnoreProfile = (orderFormId: string, ignoreProfileData: boolean) => this.http.patch(
    `/pub/orderForm/${orderFormId}/profile`,
    {
      ignoreProfileData,
    }
  )

  public updateOrderFormPayment = (orderFormId: string, payments: any) => this.http.post(
    `/pub/orderForm/${orderFormId}/attachments/paymentData`,
    {
      payments,
    }
  )

  public updateOrderFormProfile = (orderFormId: string, fields: any) => this.http.post(
    `/pub/orderForm/${orderFormId}/attachments/clientProfileData`,
    fields,
  )

  public updateOrderFormShipping = (orderFormId: string, shipping: any) => this.http.post(
    `/pub/orderForm/${orderFormId}/attachments/shippingData`,
    shipping,
  )

  public updateOrderFormMarketingData = (orderFormId: string, marketingData: any) => this.http.post(
    `/pub/orderForm/${orderFormId}/attachments/marketingData`,
    marketingData,
  )

  public addAssemblyOptions = async (orderFormId: string, itemId: string, assemblyOptionsId: string, body) =>
    this.http.post(
      `pub/orderForm/${orderFormId}/items/${itemId}/assemblyOptions/${assemblyOptionsId}`,
      body
    )

  public removeAssemblyOptions = async (orderFormId: string, itemId: string, assemblyOptionsId: string, body) =>
    this.http.delete(
      `pub/orderForm/${orderFormId}/items/${itemId}/assemblyOptions/${assemblyOptionsId}`,
      null as any,
      {
        body
      }
    )


  public updateOrderFormCheckin = (orderFormId: string, checkinPayload: CheckinArgs) => this.http.post(
    `pub/orderForm/${orderFormId}/checkIn`,
    checkinPayload,
  )

  public orderForm = () => this.http.post(
    `/pub/orderForm`,
    {expectedOrderFormSections: ['items']},
  )

  public orders = () => this.http.get(
    '/pub/orders'
  )

  public shipping = (simulation: SimulationData) => this.http.post(
    '/pub/orderForms/simulation',
    simulation,
  )

  get baseURL() {
    const {vtex: {account}} = this.context
    return `http://${account}.vtexcommercestable.com.br/api/checkout`
  }

  protected async didReceiveResponse (response: Response, request: Request) {
    const result = await super.didReceiveResponse(response, request)

    const rawHeaders = (response.headers as any).raw() as Record<string, any>
    const responseSetCookies: string[] = rawHeaders ? rawHeaders['set-cookie'] : []
    const forwardedSetCookies = responseSetCookies.filter(isWhitelistedSetCookie)
    if (forwardedSetCookies.length > 0) {
      this.context.set('set-cookie', forwardedSetCookies)
    }

    return result
  }

  protected willSendRequest (request: RequestOptions) {
    const {vtex: {account, authToken}, headers} = this.context
    const segmentData: SegmentData | null = (this.context.vtex as any).segment
    const { channel: salesChannel = '' } = segmentData || {}

    // if (!request.timeout) {
    //   request.timeout = DEFAULT_TIMEOUT_MS
    // }

    if (!!salesChannel) {
      request.params.set('sc', salesChannel)
    }

    // forEachObjIndexed(
    //   (value: string, header) => request.headers.set(header, value),
    //   {
    //     Accept: 'application/json',
    //     Authorization: authToken,
    //     'Content-Type': 'application/json',
    //     'Cookie': headers.cookie,
    //     Host: headers['x-forwarded-host'],
    //     'Proxy-Authorization': authToken,
    //     'X-Vtex-Proxy-To': `http://${account}.vtexcommercestable.com.br`,
    //   }
    // )
  }
}
