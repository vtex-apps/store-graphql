import { join } from 'ramda'

const paths = {
  /** Checkout API
   * Docs: https://documenter.getpostman.com/view/18468/vtex-checkout-api/6Z2QYJM
   */
  addItem: (account, { orderFormId }) => `${paths.orderForm(account)}/${orderFormId}/items`,
  changeToAnonymousUser: (account, { orderFormId }) => `http://${account}.vtexcommercestable.com.br/checkout/changeToAnonymousUser/${orderFormId}`,
  orderForm: account => `http://${account}.vtexcommercestable.com.br/api/checkout/pub/orderForm`,
  orderFormCustomData: (account, { orderFormId, appId, field }) => `${paths.orderForm(account)}/${orderFormId}/customData/${appId}/${field}`,
  orderFormIgnoreProfile: (account, { orderFormId }) => `${paths.orderForm(account)}/${orderFormId}/profile`,
  orderFormPayment: (account, { orderFormId }) => `${paths.orderForm(account)}/${orderFormId}/attachments/paymentData`,
  orderFormPaymentToken: (account, { orderFormId }) => `${paths.orderForm(account)}/${orderFormId}/paymentData/paymentToken`,
  orderFormPaymentTokenId: (account, { orderFormId, tokenId }) => `${paths.orderForm(account)}/${orderFormId}/paymentData/paymentToken/${tokenId}`,
  orderFormProfile: (account, { orderFormId }) => `${paths.orderForm(account)}/${orderFormId}/attachments/clientProfileData`,
  orderFormShipping: (account, { orderFormId }) => `${paths.orderForm(account)}/${orderFormId}/attachments/shippingData`,
  orderFormSimulation: (account, { querystring }) => `http://${account}.vtexcommercestable.com.br/api/checkout/pvt/orderForms/simulation?${querystring}`,
  shipping: account => `http://${account}.vtexcommercestable.com.br/api/checkout/pub/orderForms/simulation`,
  updateItems: (account, data) => `${paths.addItem(account, data)}/update`,

  cancelOrder: (account, { orderFormId }) => `${paths.orders(account)}/${orderFormId}/user-cancel-request`,
  orders: account => `http://${account}.vtexcommercestable.com.br/api/checkout/pub/orders`,

  /** PCI Gateway API
   * Docs: https://documenter.getpostman.com/view/322855/pci/Hs3y#intro
   */
  gateway: account => `http://${account}.vtexpayments.com.br/api`,
  gatewayPaymentSession: account => `${paths.gateway(account)}/pvt/sessions`,
  gatewayTokenizePayment: (account, { sessionId }) => `${paths.gateway(account)}/pub/sessions/${sessionId}/tokens`,

  /** VTEX ID API */
  accessKeySignIn: (token, email, code) => `${paths.vtexId}/authentication/accesskey/validate?authenticationToken=${token}&login=${email}&accesskey=${code}`,
  classicSignIn: (token, email, password) => `${paths.vtexId}/authentication/classic/validate?authenticationToken=${token}&login=${email}&password=${password}`,
  oAuth: (authenticationToken, providerName) => `${paths.vtexId}/authentication/oauth/redirect?authenticationToken=${authenticationToken}&providerName=${providerName}`,
  recoveryPassword: (token, email, password, code) => `${paths.vtexId}/authentication/classic/setpassword?authenticationToken=${token}&login=${email}&newPassword=${password}&accessKey=${code}`,
  redefinePassword: (token, email, currentPassword, newPassword) => `${paths.vtexId}/authentication/classic/setpassword?authenticationToken=${token}&login=${email}&newPassword=${newPassword}&currentPassword=${currentPassword}`,
  sendEmailVerification: (email, token) => `${paths.vtexId}/authentication/accesskey/send?authenticationToken=${token}&email=${email}`,
  sessionToken: (scope, account, redirect = '/', returnUrl = '/'
  ) => `${paths.vtexId}/authentication/start?appStart=true&scope=${scope}&accountName=${account}${redirect && `&callbackUrl=${redirect}`}${returnUrl && `&returnUrl=${returnUrl}`}`,
  vtexId: `http://vtexid.vtex.com.br/api/vtexid/pub`,

  /** Sessions API */
  /**
   * The path session can initialize Session, impersonate and depersonify
   * an user according to the body data that is passed to it.
   */
  getSession: account => `${paths.session(account)}?items=*`,
  session: account => `http://${account}.vtexcommercestable.com.br/api/sessions`,

  /** Master Data API v1
   * Docs: https://documenter.getpostman.com/view/164907/masterdata-api-v102/2TqWsD
   */
  profile: account => ({
    address: (id) => `http://api.vtex.com/${account}/dataentities/AD/documents/${id}`,
    attachments: (id, field) => `http://api.vtex.com/${account}/dataentities/CL/documents/${id}/${field}/attachments`,
    filterAddress: (id) => `http://api.vtex.com/${account}/dataentities/AD/search?userId=${id}&_fields=userId,id,receiverName,complement,neighborhood,country,state,number,street,postalCode,city,reference,addressName,addressType,geoCoordinate`,
    filterUser: (email, customFields?) => join(',', [`http://api.vtex.com/${account}/dataentities/CL/search?email=${email}&_fields=userId,id,firstName,lastName,birthDate,gender,homePhone,businessPhone,document,email,isCorporate,tradeName,corporateName,stateRegistration,corporateDocument,profilePicture`, customFields]),
    payments: (id) => `http://${account}.vtexcommercestable.com.br/api/profile-system/pvt/profiles/${id}/vcs-checkout`,
    profile: (id) => `http://api.vtex.com/${account}/dataentities/CL/documents/${id}`,
  }),

  // https://documenter.getpostman.com/view/3848/vtex-logistics-api/Hs42#405fae80-9bbc-471b-92b5-3071bdbfa527
  logisticsConfig: (account: string) => ({
    pickupById: (id: string) => `http://logistics.vtexcommercestable.com.br/api/logistics/pvt/configuration/pickuppoints/${id}?an=${account}`,
    pickupPoints: (lat: string, long: string, maxDistance: number) => `http://logistics.vtexcommercestable.com.br/api/logistics/pvt/configuration/pickuppoints/_search?an=${account}&page=1&pageSize=100&lat=${lat}&$lon=${long}&maxDistance=${maxDistance}`,
    shipping: `http://${account}.vtexcommercestable.com.br/api/logistics/pub/shipping/configuration`
  }),

  /** Catalog API
   * Docs: https://documenter.getpostman.com/view/845/vtex-catalog-api/Hs44#dc127f25-fc71-8188-1de3-0d2dff8fed11
   */
  skuById: account => `http://${account}.vtexcommercestable.com.br/api/catalog_system/pvt/sku/stockkeepingunitbyid/`
}

export default paths
