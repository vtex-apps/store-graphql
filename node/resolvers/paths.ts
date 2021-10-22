import { join } from 'ramda'

const paths = {
  /** Checkout API
   * Docs: https://documenter.getpostman.com/view/18468/vtex-checkout-api/6Z2QYJM
   */
  addItem: (account: any, { orderFormId }: any) =>
    `${paths.orderForm(account)}/${orderFormId}/items`,
  changeToAnonymousUser: (account: any, { orderFormId }: any) =>
    `http://${account}.vtexcommercestable.com.br/checkout/changeToAnonymousUser/${orderFormId}`,
  orderForm: (account: any) =>
    `http://${account}.vtexcommercestable.com.br/api/checkout/pub/orderForm`,
  orderFormCustomData: (account: any, { orderFormId, appId, field }: any) =>
    `${paths.orderForm(account)}/${orderFormId}/customData/${appId}/${field}`,
  orderFormIgnoreProfile: (account: any, { orderFormId }: any) =>
    `${paths.orderForm(account)}/${orderFormId}/profile`,
  orderFormPayment: (account: any, { orderFormId }: any) =>
    `${paths.orderForm(account)}/${orderFormId}/attachments/paymentData`,
  orderFormPaymentToken: (account: any, { orderFormId }: any) =>
    `${paths.orderForm(account)}/${orderFormId}/paymentData/paymentToken`,
  orderFormPaymentTokenId: (account: any, { orderFormId, tokenId }: any) =>
    `${paths.orderForm(
      account
    )}/${orderFormId}/paymentData/paymentToken/${tokenId}`,
  orderFormProfile: (account: any, { orderFormId }: any) =>
    `${paths.orderForm(account)}/${orderFormId}/attachments/clientProfileData`,
  orderFormShipping: (account: any, { orderFormId }: any) =>
    `${paths.orderForm(account)}/${orderFormId}/attachments/shippingData`,
  orderFormSimulation: (account: any, { querystring }: any) =>
    `http://${account}.vtexcommercestable.com.br/api/checkout/pvt/orderForms/simulation?${querystring}`,
  shipping: (account: any) =>
    `http://${account}.vtexcommercestable.com.br/api/checkout/pub/orderForms/simulation`,
  updateItems: (account: any, data: any) =>
    `${paths.addItem(account, data)}/update`,

  cancelOrder: (account: any, { orderFormId }: any) =>
    `${paths.orders(account)}/${orderFormId}/user-cancel-request`,
  orders: (account: any) =>
    `http://${account}.vtexcommercestable.com.br/api/checkout/pub/orders`,

  /** PCI Gateway API
   * Docs: https://documenter.getpostman.com/view/322855/pci/Hs3y#intro
   */
  gateway: (account: any) => `http://${account}.vtexpayments.com.br/api`,
  gatewayPaymentSession: (account: any) =>
    `${paths.gateway(account)}/pvt/sessions`,
  gatewayTokenizePayment: (account: any, { sessionId }: any) =>
    `${paths.gateway(account)}/pub/sessions/${sessionId}/tokens`,

  /** VTEX ID API */
  accessKeySignIn: () => `${paths.vtexIdPub}/authentication/accesskey/validate`,
  classicSignIn: () => `${paths.vtexIdPub}/authentication/classic/validate`,
  getUser: (accountName: any) =>
    `${paths.vtexIdPvt}/user/detailedinfo?scope=${accountName}`,
  oAuth: (authenticationToken: any, providerName: any) =>
    `${paths.vtexIdPub}/authentication/oauth/redirect?authenticationToken=${authenticationToken}&providerName=${providerName}`,
  setPassword: () => `${paths.vtexIdPub}/authentication/classic/setpassword`,
  sendEmailVerification: () =>
    `${paths.vtexIdPub}/authentication/accesskey/send`,
  sessionToken: (scope: any, account: any, redirect = '/', returnUrl = '/') =>
    `${
      paths.vtexIdPub
    }/authentication/start?appStart=true&scope=${scope}&accountName=${account}${
      redirect && `&callbackUrl=${redirect}`
    }${returnUrl && `&returnUrl=${returnUrl}`}`,
  loginSessions: (scope: string, account: string) =>
    `${paths.vtexId}/sessions?scope=${scope}&an=${account}`,
  logOutFromSession: ({
    scope,
    account,
    sessionId,
  }: {
    scope: string
    account: string
    sessionId: string
  }) =>
    `${paths.vtexId}/sessions/${sessionId}/revoke?scope=${scope}&an=${account}`,
  vtexId: `http://vtexid.vtex.com.br/api/vtexid`,
  vtexIdPub: `http://vtexid.vtex.com.br/api/vtexid/pub`,
  vtexIdPvt: `http://vtexid.vtex.com.br/api/vtexid/pvt`,

  /** Sessions API */
  /**
   * The path session can initialize Session, impersonate and depersonify
   * an user according to the body data that is passed to it.
   */
  getSession: (account: any) => `${paths.session(account)}?items=*`,
  session: (account: any) =>
    `http://${account}.vtexcommercestable.com.br/api/sessions`,

  /** Master Data API v1
   * Docs: https://documenter.getpostman.com/view/164907/masterdata-api-v102/2TqWsD
   */
  profile: (account: any) => ({
    address: (id: any) =>
      `http://api.vtex.com/${account}/dataentities/AD/documents/${id}`,
    attachments: (id: any, field: any) =>
      `http://api.vtex.com/${account}/dataentities/CL/documents/${id}/${field}/attachments`,
    filterAddress: (id: any) =>
      `http://api.vtex.com/${account}/dataentities/AD/search?userId=${id}&_fields=userId,id,receiverName,complement,neighborhood,country,state,number,street,postalCode,city,reference,addressName,addressType,geoCoordinate`,
    filterUser: (email: any, customFields?: any) =>
      join(',', [
        `http://api.vtex.com/${account}/dataentities/CL/search?email=${email}&_fields=userId,id,firstName,lastName,birthDate,gender,homePhone,businessPhone,document,email,isCorporate,tradeName,corporateName,stateRegistration,corporateDocument,profilePicture`,
        customFields,
      ]),
    payments: (id: any) =>
      `http://${account}.vtexcommercestable.com.br/api/profile-system/pvt/profiles/${id}/vcs-checkout`,
    profile: (id: any) =>
      `http://api.vtex.com/${account}/dataentities/CL/documents/${id}`,
  }),

  // https://documenter.getpostman.com/view/3848/vtex-logistics-api/Hs42#405fae80-9bbc-471b-92b5-3071bdbfa527
  logisticsConfig: (account: string) => ({
    pickupById: (id: string) =>
      `http://logistics.vtexcommercestable.com.br/api/logistics/pvt/configuration/pickuppoints/${id}?an=${account}`,
    pickupPoints: (lat: string, long: string, maxDistance: number) =>
      `http://logistics.vtexcommercestable.com.br/api/logistics/pvt/configuration/pickuppoints/_search?an=${account}&page=1&pageSize=100&lat=${lat}&$lon=${long}&maxDistance=${maxDistance}`,
    shipping: `http://${account}.vtexcommercestable.com.br/api/logistics/pub/shipping/configuration`,
  }),

  /** Catalog API
   * Docs: https://documenter.getpostman.com/view/845/vtex-catalog-api/Hs44#dc127f25-fc71-8188-1de3-0d2dff8fed11
   */
  skuById: (account: any) =>
    `http://${account}.vtexcommercestable.com.br/api/catalog_system/pvt/sku/stockkeepingunitbyid/`,
}

export default paths
