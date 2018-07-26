import { map, merge } from 'ramda'
import { headers, withAuthToken } from '../headers'
import httpResolver from '../httpResolver'
import paths from '../paths'
import paymentTokenResolver from './paymentTokenResolver'

/**
 * It will convert an integer to float moving the
 * float point two positions left.
 *
 * The OrderForm REST API return an integer
 * colapsing the floating point into the integer
 * part. We needed to make a convention of the product
 * price on different API's. Once the Checkout API
 * returns an integer instead of a float, and the
 * Catalog API returns a float.
 *
 * @param int An integer number
 */
const convertIntToFloat = int => int * 0.01

export const queries = {
  orderForm: httpResolver({
    data: { expectedOrderFormSections: ['items'] },
    merge: (bodyData, responseData) => ({
      ...responseData,
      cacheId: responseData.orderFormId,
      value: convertIntToFloat(responseData.value),
      items: map((item) => ({
        ...item,
        price: convertIntToFloat(item.price),
        listPrice: convertIntToFloat(item.listPrice),
        sellingPrice: convertIntToFloat(item.sellingPrice)
      }), responseData.items)
    }),
    enableCookies: true,
    headers: withAuthToken(headers.json),
    method: 'POST',
    url: paths.orderForm,
  }),

  orders: httpResolver({
    enableCookies: true,
    headers: withAuthToken(headers.json),
    url: paths.orders,
  }),

  shipping: httpResolver({
    data: ({ items, postalCode, country }) => ({
      items,
      postalCode,
      country
    }),
    headers: withAuthToken(headers.json),
    url: paths.shipping,
    method: 'POST',
  }),
}

export const mutations = {
  addItem: httpResolver({
    data: ({ items }) => ({
      expectedOrderFormSections: ['items'],
      orderItems: items,
    }),
    enableCookies: true,
    headers: withAuthToken(headers.json),
    merge: (bodyData, responseData) => ({
      ...responseData,
      cacheId: responseData.orderFormId
    }),
    method: 'POST',
    url: paths.addItem,
  }),

  addOrderFormPaymentToken: paymentTokenResolver,

  cancelOrder: httpResolver({
    data: ({ reason }) => ({ reason }),
    enableCookies: true,
    merge: () => ({ success: true }),
    method: 'POST',
    headers: withAuthToken(headers.json),
    url: paths.cancelOrder,
  }),

  createPaymentSession: httpResolver({
    headers: withAuthToken(headers.json),
    method: 'POST',
    enableCookies: true,
    secure: true,
    url: paths.gatewayPaymentSession,
  }),

  createPaymentTokens: httpResolver({
    data: ({ payments }) => payments,
    headers: withAuthToken(headers.json),
    method: 'POST',
    url: paths.gatewayTokenizePayment,
  }),

  setOrderFormCustomData: httpResolver({
    data: ({ value }) => ({
      expectedOrderFormSections: ['customData'],
      value,
    }),
    headers: withAuthToken(headers.json),
    merge: (bodyData, responseData) => ({
      ...responseData,
      cacheId: responseData.orderFormId
    }),
    method: 'PUT',
    url: paths.orderFormCustomData,
  }),

  updateItems: httpResolver({
    data: ({ items }) => ({
      expectedOrderFormSections: ['items'],
      orderItems: items,
    }),
    enableCookies: true,
    headers: withAuthToken(headers.json),
    merge: (bodyData, responseData) => ({
      ...responseData,
      cacheId: responseData.orderFormId
    }),
    method: 'POST',
    url: paths.updateItems,
  }),

  updateOrderFormIgnoreProfile: httpResolver({
    data: ({ ignoreProfileData }) => ({
      expectedOrderFormSections: ['items'],
      ignoreProfileData,
    }),
    headers: withAuthToken(headers.json),
    merge: (bodyData, responseData) => ({
      ...responseData,
      cacheId: responseData.orderFormId
    }),
    method: 'PATCH',
    url: paths.orderFormIgnoreProfile,
  }),

  updateOrderFormPayment: httpResolver({
    data: ({ payments }) => merge({ expectedOrderFormSections: ['items'] }, { payments }),
    headers: withAuthToken(headers.json),
    merge: (bodyData, responseData) => ({
      ...responseData,
      cacheId: responseData.orderFormId
    }),
    method: 'POST',
    url: paths.orderFormPayment,
  }),

  updateOrderFormProfile: httpResolver({
    data: ({ fields }) => merge({ expectedOrderFormSections: ['items'] }, fields),
    headers: withAuthToken(headers.json),
    merge: (bodyData, responseData) => ({
      ...responseData,
      cacheId: responseData.orderFormId
    }),
    method: 'POST',
    url: paths.orderFormProfile,
  }),

  updateOrderFormShipping: httpResolver({
    data: data => merge({ expectedOrderFormSections: ['items'] }, data),
    headers: withAuthToken(headers.json),
    merge: (bodyData, responseData) => ({
      ...responseData,
      cacheId: responseData.orderFormId
    }),
    method: 'POST',
    url: paths.orderFormShipping,
  }),
}
