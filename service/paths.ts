const paths = {
  product: (account, {slug}) => `http://api.vtex.com/${account}/products/${slug}`,

  productById: (account, {id}) => `http://api.vtex.com/${account}/products/?id=${id}`,

  products: (account, {query, category, brands, collection, pageSize, availableOnly, sort}) =>
    `http://api.vtex.com/${account}/products/?query=${encodeURIComponent(query)}&category=${category}&brands=${brands}&collection=${collection}&pageSize=${pageSize}&availableOnly=${availableOnly}&sort=${sort}`,

  recommendation: (account, {id, type}) =>
    `http://edge.vtexcommerce.com.br/api/pub/edge/Entries/MarketPlace/${account}/${id}/${type}?limit=8`,

  category: (account, {slug}) => `http://api.vtex.com/${account}/categories/${slug}`,

  categories: account => `http://api.vtex.com/${account}/categories`,

  brand: (account, {slug}) => `http://api.vtex.com/${account}/brands/${slug}`,

  shipping: (account, {skuId, postalCode}) =>
    `http://${account}.vtexcommercestable.com.br/api/checkout/pub/orderForms/simulation?request.items[0].id=${skuId}&request.items[0].quantity=1&request.items[0].seller=1&request.postalCode=${postalCode}&request.country=BRA`,

  orderForm: (account, env = 'stable') => `http://${account}.vtexcommerce${env}.com.br/api/checkout/pub/orderForm`,

  orderFormProfile: (account, {orderFormId}) => `${paths.orderForm(account, 'beta')}/${orderFormId}/attachments/clientProfileData`,

  orderFormShipping: (account, {orderFormId}) => `${paths.orderForm(account, 'beta')}/${orderFormId}/attachments/shippingData`,

  orderFormPayment: (account, {orderFormId}) => `${paths.orderForm(account, 'beta')}/${orderFormId}/attachments/paymentData`,

  orderFormPaymentToken: (account, {orderFormId}) => `${paths.orderForm(account, 'beta')}/${orderFormId}/paymentData/paymentToken`,

  orderFormPaymentTokenId: (account, {orderFormId, tokenId}) => `${paths.orderForm(account, 'beta')}/${orderFormId}/paymentData/paymentToken/${tokenId}`,

  orderFormIgnoreProfile: (account, {orderFormId}) => `${paths.orderForm(account, 'beta')}/${orderFormId}/profile`,

  orderFormCustomData: (account, {orderFormId, appId, field}) => `${paths.orderForm(account, 'beta')}/${orderFormId}/customData/${appId}/${field}`,

  addItem: (account, {orderFormId}) => `${paths.orderForm(account)}/${orderFormId}/items`,

  updateItems: (account, data) => `${paths.addItem(account, data)}/update`,

  orders: account => `http://${account}.vtexcommercestable.com.br/api/checkout/pub/orders`,

  cancelOrder: (account, {orderFormId}) => `${paths.orders(account)}/${orderFormId}/user-cancel-request`,

  identity: (account, {token}) => `http://vtexid.vtex.com.br/api/vtexid/pub/authenticated/user?authToken=${encodeURIComponent(token)}`,

  profile: account => ({
    filterUser: (email) => `http://api.vtex.com/${account}/dataentities/CL/search?email=${email}&_fields=userId,id,firstName,lastName,birthDate,gender,homePhone,businessPhone,document,email`,
    filterAddress: (id) => `http://api.vtex.com/${account}/dataentities/AD/search?userId=${id}&_fields=userId,id,receiverName,complement,neighborhood,state,number,street,postalCode,city,reference,addressName,addressType`,
    profile: (id) => `http://api.vtex.com/${account}/dataentities/CL/documents/${id}`,
    address: (id) => `http://api.vtex.com/${account}/dataentities/AD/documents/${id}`,
  }),

  gateway: account => `https://${account}.vtexpayments.com.br/api`,

  gatewayPaymentSession: account => `${paths.gateway(account)}/pvt/sessions`,

  gatewayTokenizePayment: (account, {sessionId}) => `${paths.gateway(account)}/pub/sessions/${sessionId}/tokens`,

  placeholders: account => `http://${account}.myvtex.com/placeholders`,

  autocomplete: (account, {maxRows, searchTerm}) => `http://portal.vtexcommercestable.com.br/buscaautocomplete/?an=${account}&maxRows=${maxRows}&productNameContains=${encodeURIComponent(searchTerm)}`,
}

export default paths
