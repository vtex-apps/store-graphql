import { Request, RequestOptions, Response, RESTDataSource } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

export interface SimulationData {
  country: string
  items: any[]
  postalCode: string
}

const orderFormIdCookie = 'checkout.vtex.com'

const SetCookieWhitelist = [
  orderFormIdCookie,
  '.ASPXAUTH',
]

const isWhitelistedSetCookie = (cookie: string) => {
  const [key] = cookie.split('=')
  return SetCookieWhitelist.includes(key)
}

export class CheckoutDataSource extends RESTDataSource<ServiceContext> {
  public addItem = (items: any) => this.post(
    `/pub/orderForm/${this.getOrderFormIdFromCookie()}/items`,
    {
      orderItems: items,
    }
  )

  public cancelOrder = (reason: string) => this.post(
    `/pub/orders/${this.getOrderFormIdFromCookie()}/user-cancel-request`,
    {reason},
  )

  public setOrderFormCustomData = (appId: string, field: string, value: any) => this.put(
    `/pub/orderForm/${this.getOrderFormIdFromCookie()}/customData/${appId}/${field}`,
    {
      value,
    }
  )

  public updateItems = (orderItems: any) => this.post(
    `/pub/orderForm/${this.getOrderFormIdFromCookie()}/items/update`,
    {
      orderItems,
    }
  )

  public updateOrderFormIgnoreProfile = (ignoreProfileData: boolean) => this.patch(
    `/pub/orderForm/${this.getOrderFormIdFromCookie()}/profile`,
    {
      ignoreProfileData,
    }
  )

  public updateOrderFormPayment = (payments: any) => this.post(
    `/pub/orderForm/${this.getOrderFormIdFromCookie()}/attachments/paymentData`,
    payments
  )

  public updateOrderFormProfile = (fields: any) => this.post(
    `/pub/orderForm/${this.getOrderFormIdFromCookie()}/attachments/clientProfileData`,
    fields
  )

  public updateOrderFormShipping = (shipping: any) => this.post(
    `/pub/orderForm/${this.getOrderFormIdFromCookie()}/attachments/shippingData`,
    shipping
  )

  public updateOrderFormShippingAddress = (address: any) => this.post(
    `/pub/orderForm/${this.getOrderFormIdFromCookie()}/attachments/shippingData`,
    {
      address
    }
  )

  public updateOrderFormMarketingData = (marketingData: any) => this.post(
    `/pub/orderForm/${this.getOrderFormIdFromCookie()}/attachments/marketingData`,
    marketingData
  )

  public orderForm = (): Promise<OrderForm> => this.post(
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
    const {vtex: {authToken}, headers} = this.context
    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        Accept: 'application/json',
        Authorization: authToken,
        'Content-Type': 'application/json',
        'Cookie': headers.cookie,
        Host: headers['x-forwarded-host'],
        'Proxy-Authorization': authToken,
      }
    )
  }

  private getOrderFormIdFromCookie = () => {
    const ofidCookieValue = this.context.cookies.get(orderFormIdCookie)
    return ofidCookieValue.split('=')[1]
  }
}
