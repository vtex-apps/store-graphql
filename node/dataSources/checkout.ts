import { Request, RequestOptions, Response, RESTDataSource } from 'apollo-datasource-rest'
import { forEachObjIndexed } from 'ramda'

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

export class CheckoutDataSource extends RESTDataSource<ServiceContext> {
  constructor() {
    super()
  }

  public addItem = (orderFormId: string, items: any) => this.post(
    `/pub/orderForm/${orderFormId}/items`,
    {
      expectedOrderFormSections: ['items'],
      orderItems: items,
    }
  )

  public cancelOrder = (orderFormId: string, reason: string) => this.post(
    `/pub/orders/${orderFormId}/user-cancel-request`,
    { reason },
  )

  public setOrderFormCustomData = (orderFormId: string, appId: string, field: string, value: any) => this.put(
    `/pub/orderForm/${orderFormId}/customData/${appId}/${field}`,
    {
      expectedOrderFormSections: ['customData'],
      value,
    }
  )

  public updateItems = (orderFormId: string, orderItems: any) => this.post(
    `/pub/orderForm/${orderFormId}/items/update`,
    {
      expectedOrderFormSections: ['items'],
      orderItems,
    }
  )

  public updateOrderFormIgnoreProfile = (orderFormId: string, ignoreProfileData: boolean) => this.patch(
    `/pub/orderForm/${orderFormId}/profile`,
    {
      expectedOrderFormSections: ['items'],
      ignoreProfileData,
    }
  )

  public updateOrderFormPayment = (orderFormId: string, payments: any) => this.post(
    `/pub/orderForm/${orderFormId}/attachments/paymentData`,
    {
      expectedOrderFormSections: ['items'],
      payments,
    }
  )

  public updateOrderFormProfile = (orderFormId: string, fields: any) => this.post(
    `/pub/orderForm/${orderFormId}/attachments/clientProfileData`,
    {
      expectedOrderFormSections: ['items'],
      ...fields,
    }
  )

  public updateOrderFormShipping = (orderFormId: string, shipping: any) => this.post(
    `/pub/orderForm/${orderFormId}/attachments/shippingData`,
    {
      expectedOrderFormSections: ['items'],
      ...shipping,
    }
  )

  public updateOrderFormMarketingData = (orderFormId: string, marketingData: any) => this.post(
    `/pub/orderForm/${orderFormId}/attachments/marketingData`,
    {
      expectedOrderFormSections: ['items'],
      ...marketingData,
    }
  )

  public updateOrderFormAssemblyOptions = (orderFormId: string, itemIndex: number, assemblyOptionId: string, assemblyData: any) => this.post(
    `/pub/orderForm/${orderFormId}/items/${itemIndex}/assemblyOptions/${assemblyOptionId}`,
    assemblyData
  )

  public orderForm = () => this.post(
    `/pub/orderForm`,
    { expectedOrderFormSections: ['items'] },
  )

  public orders = () => this.get(
    '/pub/orders'
  )

  public shipping = (simulation: SimulationData) => this.post(
    '/pub/orderForms/simulation',
    simulation,
  )

  get baseURL() {
    const { vtex: { account } } = this.context
    return `http://${account}.vtexcommercestable.com.br/api/checkout`
  }

  protected async didReceiveResponse(response: Response, request: Request) {
    const result = await super.didReceiveResponse(response, request)

    const rawHeaders = (response.headers as any).raw() as Record<string, any>
    const responseSetCookies: string[] = rawHeaders ? rawHeaders['set-cookie'] : []
    const forwardedSetCookies = responseSetCookies.filter(isWhitelistedSetCookie)
    if (forwardedSetCookies.length > 0) {
      this.context.set('set-cookie', forwardedSetCookies)
    }

    return result
  }

  protected willSendRequest(request: RequestOptions) {
    const { vtex: { account, authToken }, headers } = this.context
    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        Accept: 'application/json',
        Authorization: authToken,
        'Content-Type': 'application/json',
        'Cookie': headers.cookie,
        'Host': headers['x-forwarded-host'],
        'Proxy-Authorization': authToken,
        'X-VTEX-Janus-Router-CurrentApp-EnvironmentType': 'beta',
        'X-VTEX-Proxy-To': `http://${account}.vtexcommercestable.com.br`,
      }
    )
  }
}
