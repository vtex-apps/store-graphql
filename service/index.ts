import {merge} from 'ramda'
import handleEndpoint from './handleEndpoint'
import {profileCustomHeaders, handleProfileEndpoint} from './handleProfileEndpoint'
import handleRecommendationsEndpoint from './handleRecommendationsEndpoint'
import paths from './paths'
import ResolverError from './ResolverError'

import axios from 'axios'
axios.interceptors.response.use(response => response, function (error) {
  if (error.response) {
    throw new ResolverError(error.response.data, error.response.status)
  }
  throw error
})

Promise = require('bluebird')

const facadeHeaders = {accept: 'application/vnd.vtex.search-api.v0+json'}

const api = {
  '/query/product': handleEndpoint({
    url: paths.product,
    headers: facadeHeaders,
  }),

  '/query/products': handleEndpoint({
    url: paths.products,
    headers: facadeHeaders,
  }),

  '/query/category': handleEndpoint({
    url: paths.category,
    headers: facadeHeaders,
  }),

  '/query/categories': handleEndpoint({
    url: paths.categories,
    headers: facadeHeaders,
  }),

  '/query/brand': handleEndpoint({
    url: paths.brand,
    headers: facadeHeaders,
  }),

  '/query/shipping': handleEndpoint({url: paths.shipping}),

  '/query/orderForm': handleEndpoint({
    method: 'POST',
    enableCookies: true,
    url: paths.orderForm,
    data: {expectedOrderFormSections: ['items']},
  }),

  '/query/orders': handleEndpoint({
    enableCookies: true,
    url: paths.orders,
  }),

  '/query/profile': handleProfileEndpoint,

  '/query/autocomplete': handleEndpoint({url: paths.autocomplete}),

  '/mutation/addItem': handleEndpoint({
    method: 'POST',
    enableCookies: true,
    url: paths.addItem,
    data: ({items}) => ({orderItems: items, expectedOrderFormSections: ['items']}),
  }),

  '/mutation/cancelOrder': handleEndpoint({
    method: 'POST',
    enableCookies: true,
    url: paths.cancelOrder,
    data: ({reason}) => ({reason}),
    merge: () => ({success: true}),
  }),

  '/mutation/updateItems': handleEndpoint({
    method: 'POST',
    enableCookies: true,
    url: paths.updateItems,
    data: ({items}) => ({orderItems: items, expectedOrderFormSections: ['items']}),
  }),

  '/mutation/updateProfile': handleEndpoint({
    method: 'PATCH',
    url: (account, {id}) => paths.profile(account).profile(id),
    data: ({fields}) => fields,
    headers: profileCustomHeaders(),
    merge: ({id, fields}) => merge({id}, fields),
  }),

  '/mutation/updateAddress': handleEndpoint({
    method: 'PATCH',
    url: (account, {id}) => paths.profile(account).address(id),
    data: ({fields}) => fields,
    headers: profileCustomHeaders(),
    merge: ({id, fields}) => merge({id}, fields),
  }),

  '/mutation/createAddress': handleEndpoint({
    method: 'PATCH',
    url: account => paths.profile(account).address(''),
    data: ({fields}) => fields,
    headers: profileCustomHeaders(),
    merge: ({id, fields}) => merge({id}, fields),
  }),

  '/mutation/deleteAddress': handleEndpoint({
    method: 'DELETE',
    url: (account, {id}) => paths.profile(account).address(id),
    headers: profileCustomHeaders(),
  }),

  '/mutation/setPlaceholder': handleEndpoint({
    method: 'PUT',
    enableCookies: true,
    url: paths.placeholders,
    data: ({fields}) => merge(merge({}, fields), {settings: JSON.parse(fields.settings)}),
  }),

  '/mutation/updateOrderFormProfile': handleEndpoint({
    method: 'POST',
    url: paths.orderFormProfile,
    headers: profileCustomHeaders('application/json'),
    data: ({fields}) => merge({expectedOrderFormSections: ['items']}, fields),
  }),

  '/mutation/updateOrderFormShipping': handleEndpoint({
    method: 'POST',
    url: paths.orderFormShipping,
    headers: profileCustomHeaders('application/json'),
    data: (data) => merge({expectedOrderFormSections: ['items']}, data),
  }),

  '/mutation/updateOrderFormIgnoreProfile': handleEndpoint({
    method: 'PATCH',
    url: paths.orderFormIgnoreProfile,
    headers: profileCustomHeaders('application/json'),
    data: ({ignoreProfileData}) => ({expectedOrderFormSections: ['items'], ignoreProfileData}),
  }),

  '/mutation/createPaymentSession': handleEndpoint({
    method: 'POST',
    url: paths.gatewayPaymentSession,
    headers: profileCustomHeaders('application/json'),
  }),

  '/mutation/createPaymentTokens': handleEndpoint({
    method: 'POST',
    url: paths.gatewayTokenizePayment,
    headers: profileCustomHeaders('application/json'),
    data: ({payments}) => payments,
  }),

  '/mutation/setOrderFormCustomData': handleEndpoint({
    method: 'PUT',
    url: paths.orderFormCustomData,
    headers: profileCustomHeaders('application/json'),
    data: ({value}) => ({expectedOrderFormSections: ['customData'], value}),
  }),


  '/product/recommendations': handleRecommendationsEndpoint,
}

const handler = async (req, res, ctx) => {
  try {
    const prefix = `/${ctx.account}/${ctx.workspace}`
    const resolverPath = req.path.substr(prefix.length)
    const methodHandlers = api[resolverPath]
    if (!methodHandlers) {
      throw new ResolverError(`No resolver found for the path "${resolverPath}"`, 404)
    }

    const handle = methodHandlers[req.method.toLowerCase()]
    if (handle) {
      return await handle(req, res, ctx)
    }
  } catch (error) {
    res.set('Content-Type', 'application/json')
    res.status = error.statusCode || 500
    res.body = {error: error.message}
  }
}

export default {handler}
