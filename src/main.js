import Promise from 'bluebird'
import handleEndpoint from './handleEndpoint'
import {profileCustomHeaders, handleProfileEndpoint} from './handleProfileEndpoint'
import handleRecommendationsEndpoint from './handleRecommendationsEndpoint'
import paths from './paths'
import {merge} from 'ramda'

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
    headers: profileCustomHeaders,
    merge: ({id, fields}) => merge({id}, fields),
  }),

  '/mutation/updateAddress': handleEndpoint({
    method: 'PATCH',
    url: (account, {id}) => paths.profile(account).address(id),
    data: ({fields}) => fields,
    headers: profileCustomHeaders,
    callback: ({id, fields}) => merge({id}, fields),
  }),

  '/mutation/createAddress': handleEndpoint({
    method: 'PATCH',
    url: account => paths.profile(account).address(''),
    data: ({fields}) => fields,
    headers: profileCustomHeaders,
    callback: ({id, fields}) => merge({id}, fields),
  }),

  '/mutation/deleteAddress': handleEndpoint({
    method: 'DELETE',
    url: (account, {id}) => paths.profile(account).address(id),
    headers: profileCustomHeaders,
  }),

  '/mutation/setPlaceholder': handleEndpoint({
    method: 'PUT',
    enableCookies: true,
    url: paths.placeholders,
    data: ({fields}) => merge({}, fields, {settings: JSON.parse(fields.settings)}),
  }),

  '/mutation/updateOrderFormProfile': handleEndpoint({
    method: 'PUT',
    url: paths.orderFormProfile,
    data: ({id, fields}) => merge({id, expectedOrderFormSections: ['items']}, fields)
  }),

  '/mutation/updateOrderFormShipping': handleEndpoint({
    method: 'PUT',
    url: paths.orderFormShipping,
    data: ({id, fields}) => merge({id}, fields)
  }),

  '/mutation/updateOrderFormIgnoreProfile': handleEndpoint({
    method: 'PUT',
    url: paths.orderFormIgnoreProfile,
    data: ({id, fields}) => merge({id}, fields)
  }),

  '/product/recommendations': handleRecommendationsEndpoint,
}

export default {api}
