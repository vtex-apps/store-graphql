import {merge} from 'ramda'
import handleEndpoint from './handleEndpoint'
import {profileCustomHeaders, handleProfileEndpoint} from './handleProfileEndpoint'
import handleRecommendationsEndpoint from './handleRecommendationsEndpoint'
import paths from './paths'
import {buildResolvers, ResolverError} from 'vtex-graphql-builder'
import handlePaymentTokenEndpoint from './handlePaymentTokenEndpoint'

import axios from 'axios'
axios.interceptors.response.use(response => response, function (error) {
  if (error.response) {
    throw new ResolverError(error.response.data, error.response.status)
  }
  throw error
})

Promise = require('bluebird')

const facadeHeaders = {accept: 'application/vnd.vtex.search-api.v0+json'}

export default buildResolvers({
  Query: {
    product: handleEndpoint({
      url: paths.product,
      headers: facadeHeaders,
    }),

    products: handleEndpoint({
      url: paths.products,
      headers: facadeHeaders,
    }),

    category: handleEndpoint({
      url: paths.category,
      headers: facadeHeaders,
    }),

    categories: handleEndpoint({
      url: paths.categories,
      headers: facadeHeaders,
    }),

    brand: handleEndpoint({
      url: paths.brand,
      headers: facadeHeaders,
    }),

    shipping: handleEndpoint({url: paths.shipping}),

    orderForm: handleEndpoint({
      method: 'POST',
      enableCookies: true,
      url: paths.orderForm,
      data: {expectedOrderFormSections: ['items']},
    }),

    orders: handleEndpoint({
      enableCookies: true,
      url: paths.orders,
    }),

    profile: handleProfileEndpoint,

    autocomplete: handleEndpoint({url: paths.autocomplete}),
  },

  Mutation: {
    addItem: handleEndpoint({
      method: 'POST',
      enableCookies: true,
      url: paths.addItem,
      data: ({items}) => ({orderItems: items, expectedOrderFormSections: ['items']}),
    }),

    cancelOrder: handleEndpoint({
      method: 'POST',
      enableCookies: true,
      url: paths.cancelOrder,
      data: ({reason}) => ({reason}),
      merge: () => ({success: true}),
    }),

    updateItems: handleEndpoint({
      method: 'POST',
      enableCookies: true,
      url: paths.updateItems,
      data: ({items}) => ({orderItems: items, expectedOrderFormSections: ['items']}),
    }),

    updateProfile: handleEndpoint({
      method: 'PATCH',
      url: (account, {id}) => paths.profile(account).profile(id),
      data: ({fields}) => fields,
      headers: profileCustomHeaders(),
      merge: ({id, fields}) => merge({id}, fields),
    }),

    updateAddress: handleEndpoint({
      method: 'PATCH',
      url: (account, {id}) => paths.profile(account).address(id),
      data: ({fields}) => fields,
      headers: profileCustomHeaders(),
      merge: ({id, fields}) => merge({id}, fields),
    }),

    createAddress: handleEndpoint({
      method: 'PATCH',
      url: account => paths.profile(account).address(''),
      data: ({fields}) => fields,
      headers: profileCustomHeaders(),
      merge: ({id, fields}) => merge({id}, fields),
    }),

    deleteAddress: handleEndpoint({
      method: 'DELETE',
      url: (account, {id}) => paths.profile(account).address(id),
      headers: profileCustomHeaders(),
    }),

    setPlaceholder: handleEndpoint({
      method: 'PUT',
      enableCookies: true,
      url: paths.placeholders,
      data: ({fields}) => merge(merge({}, fields), {settings: JSON.parse(fields.settings)}),
    }),

    updateOrderFormProfile: handleEndpoint({
      method: 'POST',
      url: paths.orderFormProfile,
      headers: profileCustomHeaders('application/json'),
      data: ({fields}) => merge({expectedOrderFormSections: ['items']}, fields),
    }),

    updateOrderFormShipping: handleEndpoint({
      method: 'POST',
      url: paths.orderFormShipping,
      headers: profileCustomHeaders('application/json'),
      data: (data) => merge({expectedOrderFormSections: ['items']}, data),
    }),

    updateOrderFormPayment: handleEndpoint({
      method: 'POST',
      url: paths.orderFormPayment,
      headers: profileCustomHeaders('application/json'),
      data: ({payments}) => merge({expectedOrderFormSections: ['items']}, {payments}),
    }),

    addOrderFormPaymentToken: handlePaymentTokenEndpoint,

    updateOrderFormIgnoreProfile: handleEndpoint({
      method: 'PATCH',
      url: paths.orderFormIgnoreProfile,
      headers: profileCustomHeaders('application/json'),
      data: ({ignoreProfileData}) => ({expectedOrderFormSections: ['items'], ignoreProfileData}),
    }),

    createPaymentSession: handleEndpoint({
      method: 'POST',
      url: paths.gatewayPaymentSession,
      headers: profileCustomHeaders('application/json'),
    }),

    createPaymentTokens: handleEndpoint({
      method: 'POST',
      url: paths.gatewayTokenizePayment,
      headers: profileCustomHeaders('application/json'),
      data: ({payments}) => payments,
    }),

    setOrderFormCustomData: handleEndpoint({
      method: 'PUT',
      url: paths.orderFormCustomData,
      headers: profileCustomHeaders('application/json'),
      data: ({value}) => ({expectedOrderFormSections: ['customData'], value}),
    }),
  },

  Product: {
    recommendations: handleRecommendationsEndpoint,
  },
})
