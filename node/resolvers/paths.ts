import { join } from 'ramda'

const paths = {
  /** Checkout API
   * Docs: https://documenter.getpostman.com/view/18468/vtex-checkout-api/6Z2QYJM
  */
  orderForm: account => `http://${account}.vtexcommercestable.com.br/api/checkout/pub/orderForm`,
  orderFormProfile: (account, { orderFormId }) => `${paths.orderForm(account)}/${orderFormId}/attachments/clientProfileData`,
  orderFormShipping: (account, { orderFormId }) => `${paths.orderForm(account)}/${orderFormId}/attachments/shippingData`,
  orderFormPayment: (account, { orderFormId }) => `${paths.orderForm(account)}/${orderFormId}/attachments/paymentData`,
  orderFormPaymentToken: (account, { orderFormId }) => `${paths.orderForm(account)}/${orderFormId}/paymentData/paymentToken`,
  orderFormPaymentTokenId: (account, { orderFormId, tokenId }) => `${paths.orderForm(account)}/${orderFormId}/paymentData/paymentToken/${tokenId}`,
  orderFormIgnoreProfile: (account, { orderFormId }) => `${paths.orderForm(account)}/${orderFormId}/profile`,
  orderFormCustomData: (account, { orderFormId, appId, field }) => `${paths.orderForm(account)}/${orderFormId}/customData/${appId}/${field}`,
  addItem: (account, { orderFormId }) => `${paths.orderForm(account)}/${orderFormId}/items`,
  updateItems: (account, data) => `${paths.addItem(account, data)}/update`,
  shipping: account => `http://${account}.vtexcommercestable.com.br/api/checkout/pub/orderForms/simulation`,
  changeToAnonymousUser: (account, { orderFormId }) => `http://${account}.vtexcommercestable.com.br/checkout/changeToAnonymousUser/${orderFormId}`,

  orders: account => `http://${account}.vtexcommercestable.com.br/api/checkout/pub/orders`,
  cancelOrder: (account, { orderFormId }) => `${paths.orders(account)}/${orderFormId}/user-cancel-request`,

  /** PCI Gateway API
   * Docs: https://documenter.getpostman.com/view/322855/pci/Hs3y#intro
   */
  gateway: account => `http://${account}.vtexpayments.com.br/api`,
  gatewayPaymentSession: account => `${paths.gateway(account)}/pvt/sessions`,
  gatewayTokenizePayment: (account, { sessionId }) => `${paths.gateway(account)}/pub/sessions/${sessionId}/tokens`,

  /** VTEX ID API */
  vtexId: `http://vtexid.vtex.com.br/api/vtexid/pub`,
  identity: (account, { token }) => `${paths.vtexId}/authenticated/user?authToken=${encodeURIComponent(token)}`,
  sessionToken: (scope, account, redirect = '/', returnUrl = '/'
    ) => `${paths.vtexId}/authentication/start?appStart=true&scope=${scope}&accountName=${account}${redirect && `&callbackUrl=${redirect}`}${returnUrl && `&returnUrl=${returnUrl}`}`,
  sendEmailVerification: (email, token) => `${paths.vtexId}/authentication/accesskey/send?authenticationToken=${token}&email=${email}`,
  accessKeySignIn: (token, email, code) => `${paths.vtexId}/authentication/accesskey/validate?authenticationToken=${token}&login=${email}&accesskey=${code}`,
  classicSignIn: (token, email, password) => `${paths.vtexId}/authentication/classic/validate?authenticationToken=${token}&login=${email}&password=${password}`,
  recoveryPassword: (token, email, password, code) => `${paths.vtexId}/authentication/classic/setpassword?authenticationToken=${token}&login=${email}&newPassword=${password}&accessKey=${code}`,
  redefinePassword: (token, email, currentPassword, newPassword) => `${paths.vtexId}/authentication/classic/setpassword?authenticationToken=${token}&login=${email}&newPassword=${newPassword}&currentPassword=${currentPassword}`,
  oAuth: (authenticationToken, providerName) => `${paths.vtexId}/authentication/oauth/redirect?authenticationToken=${authenticationToken}&providerName=${providerName}`,

  /** Sessions API */
  /**
   * The path session can initialize Session, impersonate and depersonify
   * an user according to the body data that is passed to it.
   */
  session: account => `http://${account}.vtexcommercestable.com.br/api/sessions`,
  getSession: account => `${paths.session(account)}?items=*`,

  /** Master Data API v1
   * Docs: https://documenter.getpostman.com/view/164907/masterdata-api-v102/2TqWsD
   */
  searchDocument: (account, acronym, { fields, where }) => `http://api.vtex.com/${account}/dataentities/${acronym}/search?_fields=${fields}${where ? `&_where=${encodeURIComponent(where)}` : ''}`,
  documents: (account, acronym) => `http://api.vtex.com/${account}/dataentities/${acronym}/documents`,
  document: (account, acronym, id) => `${paths.documents(account, acronym)}/${id}`,
  documentFields: (account, acronym, fields = '_all', id) => `${paths.document(account, acronym, id)}?_fields=${fields}`,
  attachment: (account, acronym, id, field, filename?) => `${paths.document(account, acronym, id)}/${field}/attachments${filename ? `/${filename}` : ''}`,

  profile: account => ({
    address: (id) => `http://api.vtex.com/${account}/dataentities/AD/documents/${id}`,
    attachments: (id, field) => `http://api.vtex.com/${account}/dataentities/CL/documents/${id}/${field}/attachments`,
    filterAddress: (id) => `http://api.vtex.com/${account}/dataentities/AD/search?userId=${id}&_fields=userId,id,receiverName,complement,neighborhood,country,state,number,street,postalCode,city,reference,addressName,addressType,geoCoordinate`,
    filterUser: (email, customFields?) => join(',', [`http://api.vtex.com/${account}/dataentities/CL/search?email=${email}&_fields=userId,id,firstName,lastName,birthDate,gender,homePhone,businessPhone,document,email,isCorporate,tradeName,corporateName,stateRegistration,corporateDocument,profilePicture`, customFields]),
    profile: (id) => `http://api.vtex.com/${account}/dataentities/CL/documents/${id}`,
    payments: (id) => `http://${account}.vtexcommercestable.com.br/api/profile-system/pvt/profiles/${id}/vcs-checkout`
  }),

  logisticsConfig: account => ({
    shipping: `http://${account}.vtexcommercestable.com.br/api/logistics/pub/shipping/configuration`
  })
}

export default paths
