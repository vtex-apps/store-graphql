export default (account) => {
  const product = (slug) =>
    `http://api.vtex.com/${account}/products/${slug}`

  const products = ({query, category, brands, collection, pageSize, availableOnly, sort}) =>
    `http://api.vtex.com/${account}/products/?query=${encodeURIComponent(query)}&category=${category}&brands=${brands}&collection=${collection}&pageSize=${pageSize}&availableOnly=${availableOnly}&sort=${sort}`

  const productById = (id) =>
    `http://api.vtex.com/${account}/products/?id=${id}`

  const recommendation = (productId, type) =>
    `http://edge.vtexcommerce.com.br/api/pub/edge/Entries/MarketPlace/${account}/${productId}/${type}?limit=8`

  const category = (slug) =>
    `http://api.vtex.com/${account}/categories/${slug}`

  const categories = `http://api.vtex.com/${account}/categories`

  const brand = (slug) =>
    `http://api.vtex.com/${account}/brands/${slug}`

  const shipping = (skuId, postalCode) =>
    `http://${account}.vtexcommercestable.com.br/api/checkout/pub/orderForms/simulation?request.items[0].id=${skuId}&request.items[0].quantity=1&request.items[0].seller=1&request.postalCode=${postalCode}&request.country=BRA`

  const orderForm = `http://${account}.vtexcommercestable.com.br/api/checkout/pub/orderForm`

  const addItem = (orderFormId) => `${orderForm}/${orderFormId}/items/`

  const updateItems = (orderFormId) => `${addItem(orderFormId)}/update`

  const orders = `http://${account}.vtexcommercestable.com.br/api/checkout/pub/orders`

  const cancelOrder = (orderFormId) => `${orders}/${orderFormId}/user-cancel-request`

  const identity = (token) => `http://vtexid.vtex.com.br/api/vtexid/pub/authenticated/user?authToken=${encodeURIComponent(token)}`

  const profile = {
    filterUser: (email) => `http://api.vtex.com/${account}/dataentities/CL/search?email=${email}&_fields=userId,id,firstName,lastName,birthDate,gender,homePhone,businessPhone,document,email`,
    filterAddress: (id) => `http://api.vtex.com/${account}/dataentities/AD/search?userId=${id}&_fields=userId,id,receiverName,complement,neighborhood,state,number,street,postalCode,city,reference,addressName,addressType`,
    profile: (id) => `http://api.vtex.com/${account}/dataentities/CL/documents/${id}`,
    address: (id) => `http://api.vtex.com/${account}/dataentities/AD/documents/${id}`,
  }

  const placeholders = `http://${account}.myvtex.com/placeholders`

  const autocomplete = (maxRows, searchTerm) => `http://portal.vtexcommercestable.com.br/buscaautocomplete/?an=${account}&maxRows=${maxRows}&productNameContains=${encodeURIComponent(searchTerm)}`

  return {
    product,
    products,
    productById,
    recommendation,
    category,
    categories,
    brand,
    shipping,
    orderForm,
    addItem,
    updateItems,
    orders,
    cancelOrder,
    identity,
    profile,
    placeholders,
    autocomplete,
  }
}
