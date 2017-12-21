import { map, merge } from 'ramda'
import {headers, withAuthToken} from '../headers'
import httpResolver from '../httpResolver'
import paths from '../paths'
import paymentTokenResolver from './paymentTokenResolver'

export default {
  addItem: httpResolver({
    data: ({ items }) => ({
      expectedOrderFormSections: ['items'],
      orderItems: items,
    }),
    enableCookies: true,
    headers: withAuthToken(headers.json),
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
    headers: withAuthToken({...headers.json}),
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

  orderForm: httpResolver({
    data: { expectedOrderFormSections: ['items'] },
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

  setOrderFormCustomData: httpResolver({
    data: ({ value }) => ({
      expectedOrderFormSections: ['customData'],
      value,
    }),
    headers: withAuthToken(headers.json),
    method: 'PUT',
    url: paths.orderFormCustomData,
  }),

  shipping: httpResolver({
    url: paths.shipping,
    headers: withAuthToken(headers.json),
  }),

  updateItems: httpResolver({
    data: ({ items }) => ({
      expectedOrderFormSections: ['items'],
      orderItems: items,
    }),
    enableCookies: true,
    method: 'POST',
    headers: withAuthToken(headers.json),
    url: paths.updateItems,
  }),

  updateOrderFormIgnoreProfile: httpResolver({
    data: ({ ignoreProfileData }) => ({
      expectedOrderFormSections: ['items'],
      ignoreProfileData,
    }),
    headers: withAuthToken(headers.json),
    method: 'PATCH',
    url: paths.orderFormIgnoreProfile,
  }),

  updateOrderFormPayment: httpResolver({
    data: ({ payments }) => merge({ expectedOrderFormSections: ['items'] }, { payments }),
    headers: withAuthToken(headers.json),
    method: 'POST',
    url: paths.orderFormPayment,
  }),

  updateOrderFormProfile: httpResolver({
    data: ({ fields }) => merge({ expectedOrderFormSections: ['items'] }, fields),
    headers: withAuthToken(headers.json),
    method: 'POST',
    url: paths.orderFormProfile,
  }),

  updateOrderFormShipping: httpResolver({
    data: data => merge({ expectedOrderFormSections: ['items'] }, data),
    headers: withAuthToken(headers.json),
    method: 'POST',
    url: paths.orderFormShipping,
  }),
}
