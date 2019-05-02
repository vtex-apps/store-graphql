import { AuthenticationError, ForbiddenError, InstanceOptions, IOContext, JanusClient, RequestConfig, UserInputError, SegmentData } from '@vtex/api'
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

export interface SimulationData {
  country: string
  items: any[]
  postalCode: string
}

export class Checkout extends JanusClient {
  constructor (ctx: IOContext, options?: InstanceOptions) {
    super(ctx, {
      ...options,
      headers: {
        ...options && options.headers,
        ...ctx.adminUserAuthToken ? {VtexIdclientAutCookie: ctx.adminUserAuthToken} : null,
        ...ctx.storeUserAuthToken ? {[`VtexIdclientAutCookie_${ctx.account}`]: ctx.storeUserAuthToken} : null,
      }
    })
  }

  private getCommonHeaders = () => {
    const { orderFormId } = this.context as CustomIOContext
    const checkoutCookie = orderFormId ? `checkout.vtex.com=__ofid=${orderFormId};` : ''
    return {
      Cookie: `${checkoutCookie};vtex_segment=${this.context.segmentToken};vtex_session=${this.context.sessionToken};`,
    }
  }

  private getChannelQueryString = () => {
    const { segment } = this.context as CustomIOContext
    const channel = segment && segment.channel
    const queryString = channel ? `?sc=${channel}` : ''
    return queryString
  }

  public addItem = (orderFormId: string, items: any) => this.post(
    this.routes.addItem(orderFormId, this.getChannelQueryString()),
    { orderItems: items },
    { metric: 'checkout-addItem' }
  )

  public cancelOrder = (orderFormId: string, reason: string) => this.post(
    this.routes.cancelOrder(orderFormId),
    { reason },
    {metric: 'checkout-cancelOrder'}
  )

  public setOrderFormCustomData = (orderFormId: string, appId: string, field: string, value: any) => this.put(
    this.routes.orderFormCustomData(orderFormId, appId, field),
    { value },
    {metric: 'checkout-setOrderFormCustomData'}
  )

  public updateItems = (orderFormId: string, orderItems: any) => this.post(
    this.routes.updateItems(orderFormId),
    { orderItems },
    {metric: 'checkout-updateItems'}
  )

  public updateOrderFormIgnoreProfile = (orderFormId: string, ignoreProfileData: boolean) => this.patch(
    this.routes.profile(orderFormId),
    { ignoreProfileData },
    {metric: 'checkout-updateOrderFormIgnoreProfile'}
  )
  
  public updateOrderFormPayment = (orderFormId: string, payments: any) => this.post(
    this.routes.attachmentsData(orderFormId, 'paymentData'),
    { payments },
    {metric: 'checkout-updateOrderFormPayment'}
  )

  public updateOrderFormProfile = (orderFormId: string, fields: any) => this.post(
    this.routes.attachmentsData(orderFormId, 'clientProfileData'),
    fields,
    {metric: 'checkout-updateOrderFormProfile'}
  )

  public updateOrderFormShipping = (orderFormId: string, shipping: any) => this.post(
    this.routes.attachmentsData(orderFormId, 'shippingData'),
    shipping,
    {metric: 'checkout-updateOrderFormShipping'}
  )

  public updateOrderFormMarketingData = (orderFormId: string, marketingData: any) => this.post(
    this.routes.attachmentsData(orderFormId, 'marketingData'),
    marketingData,
    {metric: 'checkout-updateOrderFormMarketingData'}
  )

  public addAssemblyOptions = async (orderFormId: string, itemId: string, assemblyOptionsId: string, body: any) =>
    this.post(
      this.routes.assemblyOptions(orderFormId, itemId, assemblyOptionsId),
      body,
      {metric: 'checkout-addAssemblyOptions'}
    )
  
  public removeAssemblyOptions = async (orderFormId: string, itemId: string, assemblyOptionsId: string, body: any) =>
    this.delete(
      this.routes.assemblyOptions(orderFormId, itemId, assemblyOptionsId),
      {metric: 'checkout-removeAssemblyOptions', params: body}
    )

  public updateOrderFormCheckin = (orderFormId: string, checkinPayload: any) => this.post(
    this.routes.checkin(orderFormId),
    checkinPayload,
    {metric: 'checkout-updateOrderFormCheckin'}
  )

  public orderForm = (useRaw?: boolean) => {
    const method = useRaw ? this.postRaw : this.post
    return method(
      this.routes.orderForm,
      {expectedOrderFormSections: ['items']},
      {metric: 'checkout-orderForm'}
    )
  } 

  public orders = () => this.get(
    this.routes.orders,
    {metric: 'checkout-orders'}
  )

  public shipping = (simulation: SimulationData) => this.post(
    this.routes.shipping(this.getChannelQueryString()),
    simulation,
    {metric: 'checkout-shipping'}
  )

  protected get = <T>(url: string, config: RequestConfig = {}) => {
    config.headers = {
      ...config.headers,
      ...this.getCommonHeaders(),
    }
    return this.http.get<T>(url, config).catch(statusToError)
  }

  protected post = (url: string, data?: any, config: RequestConfig = {}) => {
    config.headers = {
      ...config.headers,
      ...this.getCommonHeaders(),
    }
    return this.http.post<any>(url, data, config).catch(statusToError)
  }

  protected postRaw = async (url: string, data?: any, config: RequestConfig = {}) => {
    config.headers = {
      ...config.headers,
      ...this.getCommonHeaders(),
    }
    return this.http.postRaw<any>(url, data, config).catch(statusToError)
    
  }

  protected delete = <T>(url: string, config: RequestConfig = {}) => {
    config.headers = {
      ...config.headers,
      ...this.getCommonHeaders(),
    }
    return this.http.delete<T>(url, config).catch(statusToError)
  }

  protected patch = <T>(url: string, data?: any, config: RequestConfig = {}) => {
    config.headers = {
      ...config.headers,
      ...this.getCommonHeaders(),
    }
    return this.http.patch<T>(url, data, config).catch(statusToError)
  }

  protected put = <T>(url: string, data?: any, config: RequestConfig = {}) => {
    config.headers = {
      ...config.headers,
      ...this.getCommonHeaders(),
    }
    return this.http.put<T>(url, data, config).catch(statusToError)
  }

  private get routes () {
    const base = '/api/checkout/pub'
    return {
      addItem: (orderFormId: string, queryString: string) => `${base}/orderForm/${orderFormId}/items${queryString}`,
      cancelOrder: (orderFormId: string) => `${base}/orders/${orderFormId}/user-cancel-request`,
      orderFormCustomData: (orderFormId: string, appId: string, field: string) =>
       `${base}/orderForm/${orderFormId}/customData/${appId}/${field}`,
      updateItems: (orderFormId: string) => `${base}/orderForm/${orderFormId}/items/update`,
      profile: (orderFormId: string) => `${base}/orderForm/${orderFormId}/profile`,
      attachmentsData: (orderFormId: string, field: string) => `${base}/orderForm/${orderFormId}/attachments/${field}`,
      assemblyOptions: (orderFormId: string, itemId: string, assemblyOptionsId: string) =>
       `${base}/orderForm/${orderFormId}/items/${itemId}/assemblyOptions/${assemblyOptionsId}`,
      checkin: (orderFormId: string) => `${base}/orderForm/${orderFormId}/checkIn`,
      orderForm: `${base}/orderForm`,
      orders: `${base}/pub/orders`,
      shipping: (queryString: string) => `${base}/pub/orderForms/simulation${queryString}`,
   }
  }
}