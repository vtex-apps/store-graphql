import { forward, OutboundDataSource, useHttps, withAuth, withCookies, withHeader, withOutboundAuth, withTimeout } from '@vtex/api'
import { Request, Response } from 'apollo-datasource-rest'

const DEFAULT_TIMEOUT_MS = 4 * 1000

export interface SimulationData {
  country: string
  items: any[]
  postalCode: string
}

const SetCookieWhitelist = [
  'checkout.vtex.com',
  '.ASPXAUTH',
]

const isWhitelistedSetCookie = (cookie: string) => {
  const [key] = cookie.split('=')
  return SetCookieWhitelist.includes(key)
}

export class CheckoutDataSource extends OutboundDataSource<Context> {
  protected modifiers = [
    withAuth,
    withOutboundAuth,
    withCookies,
    useHttps,
    withHeader('Content-Type', 'application/json'),
    withHeader('Accept', 'application/json'),
    withTimeout(DEFAULT_TIMEOUT_MS),
    forward('x-forwarded-host')
  ]

  get baseURL() {
    const {vtex: {account}} = this.context
    return `http://${account}.vtexcommercestable.com.br/api/checkout`
  }

  public addItem = (orderFormId: string, items: any) => this.post(
    `/pub/orderForm/${orderFormId}/items`,
    {
      orderItems: items,
    }
  )

  public cancelOrder = (orderFormId: string, reason: string) => this.post(
    `/pub/orders/${orderFormId}/user-cancel-request`,
    {reason},
  )

  public setOrderFormCustomData = (orderFormId: string, appId: string, field: string, value: any) => this.put(
    `/pub/orderForm/${orderFormId}/customData/${appId}/${field}`,
    {
      value,
    }
  )

  public updateItems = (orderFormId: string, orderItems: any) => this.post(
    `/pub/orderForm/${orderFormId}/items/update`,
    {
      orderItems,
    }
  )

  public updateOrderFormIgnoreProfile = (orderFormId: string, ignoreProfileData: boolean) => this.patch(
    `/pub/orderForm/${orderFormId}/profile`,
    {
      ignoreProfileData,
    }
  )

  public updateOrderFormPayment = (orderFormId: string, payments: any) => this.post(
    `/pub/orderForm/${orderFormId}/attachments/paymentData`,
    {
      payments,
    }
  )

  public updateOrderFormProfile = (orderFormId: string, fields: any) => this.post(
    `/pub/orderForm/${orderFormId}/attachments/clientProfileData`,
    fields,
  )

  public updateOrderFormShipping = (orderFormId: string, shipping: any) => this.post(
    `/pub/orderForm/${orderFormId}/attachments/shippingData`,
    shipping,
  )

  public updateOrderFormMarketingData = (orderFormId: string, marketingData: any) => this.post(
    `/pub/orderForm/${orderFormId}/attachments/marketingData`,
    marketingData,
  )

  public orderForm = () => this.post(
    `/pub/orderForm`,
    {expectedOrderFormSections: ['items']},
  )

  public orders = () => this.get(
    '/pub/orders'
  )

  public shipping = (simulation: SimulationData) => this.post(
    '/pub/orderForms/simulation',
    simulation,
  )

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
}
