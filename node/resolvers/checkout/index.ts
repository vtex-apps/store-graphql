import { parse } from 'cookie'
import { equals, map, path } from 'ramda'
import { SimulationData } from '../../dataSources/checkout'
import { SegmentData } from '../../dataSources/session'
import { headers, withAuthToken } from '../headers'
import httpResolver from '../httpResolver'
import paths from '../paths'
import paymentTokenResolver from './paymentTokenResolver'

import { queries as sessionQueries } from '../session'
import { SessionFields } from '../session/sessionResolver'

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

const shouldUpdateMarketingData = (orderFormMarketingTags, segmentData: SegmentData) => {
  const {utmSource=null, utmCampaign=null, utmiCampaign=null} = orderFormMarketingTags || {}
  const {utm_source, utm_campaign, utmi_campaign} = segmentData

  return (utm_source || utm_campaign || utmi_campaign)
    && (utmSource !== utm_source
    || utmCampaign !== utm_campaign
    || utmiCampaign !== utmi_campaign)
}

const syncOrderFormAndSessionAddress = async (orderFormAddress, orderFormId, sessionAddress, ctx) => {
  const {dataSources: {session, checkout}} = ctx

  if (!orderFormAddress && sessionAddress) {
    return checkout.updateOrderFormShipping(orderFormId, { clearAddressIfPostalCodeNotFound: false, selectedAddresses: [sessionAddress] })
  }

  if (orderFormAddress && !equals(orderFormAddress, sessionAddress)) {
    // salva na session
    await session.editSession('address', orderFormAddress)
  }
  return null
}

type Resolver<TArgs=any, TRoot=any> =
  (root: TRoot, args: TArgs, context: Context) => Promise<any>

export const fieldResolvers = {
  OrderForm: {
    cacheId: (orderForm) => {
      return orderForm.orderFormId
    },
    items: (orderForm) => {
      return map((item: OrderFormItem) => ({
        ...item,
        listPrice: convertIntToFloat(item.listPrice),
        price: convertIntToFloat(item.price),
        sellingPrice: convertIntToFloat(item.sellingPrice)
      }), orderForm.items)
    },
    value: (orderForm) => {
      return convertIntToFloat(orderForm.value)
    },
  }
}

export const queries: Record<string, Resolver> = {
  orderForm: async (root, args, ctx) => {
    const {dataSources: {checkout, session}, request: { headers: { cookie } }} = ctx

    const cookieParsed = parse(cookie)
    const coOrderFormId = cookieParsed['checkout.vtex.com'] && cookieParsed['checkout.vtex.com'].split('=')[1]
    const sessionData = await sessionQueries.getSession(root, args, ctx) as SessionFields
    if (sessionData.orderFormId) {
      if (!coOrderFormId) {
        ctx.request.headers.cookie = `${cookie}; checkout.vtex.com=__ofid=${sessionData.orderFormId}`
      } else if (sessionData.orderFormId !== coOrderFormId) {
        await session.editSession('orderFormId', coOrderFormId)
      }
    }

    const orderForm = await checkout.orderForm()

    if (!sessionData.orderFormId) {
      // Saving orderFormId on session
      await session.editSession('orderFormId', orderForm.orderFormId)
    }

    const orderFormAddress = path(['shippingData', 'selectedAddresses', '0'], orderForm)
    const newOrderForm = await syncOrderFormAndSessionAddress(orderFormAddress, orderForm.orderFormId, sessionData.address, ctx)
    return newOrderForm || orderForm
  },

  orders: (root, args, {dataSources: {checkout}}) => {
    return checkout.orders()
  },

  shipping: (root, args: SimulationData, {dataSources: {checkout}}) => {
    return checkout.shipping(args)
  },
}

export const mutations: Record<string, Resolver> = {
  addItem: async (root, {orderFormId, items}, {dataSources: {checkout, session}}) => {
    const [{marketingData}, segmentData] = await Promise.all([
      checkout.orderForm(),
      session.getSegmentData().catch((err) => {
        // todo: log error using colossus
        console.error(err)
        return {} as SegmentData
      })
    ])

    if (shouldUpdateMarketingData(marketingData, segmentData)) {
      const newMarketingData = {
        ...marketingData || {},
        utmCampaign: segmentData.utm_campaign,
        utmSource: segmentData.utm_source,
        utmiCampaign: segmentData.utmi_campaign,
      }
      await checkout.updateOrderFormMarketingData(orderFormId, newMarketingData)
    }

    return await checkout.addItem(orderFormId, items)
  },

  addOrderFormPaymentToken: paymentTokenResolver,

  cancelOrder: async (root, {orderFormId, reason}, {dataSources: {checkout}}) => {
    await checkout.cancelOrder(orderFormId, reason)
    return true
  },

  createPaymentSession: httpResolver({
    enableCookies: true,
    headers: withAuthToken(headers.json),
    method: 'POST',
    secure: true,
    url: paths.gatewayPaymentSession,
  }),

  createPaymentTokens: httpResolver({
    data: ({ payments }) => payments,
    enableCookies: true,
    headers: withAuthToken(headers.json),
    method: 'POST',
    url: paths.gatewayTokenizePayment,
  }),

  setOrderFormCustomData: (root, {orderFormId, appId, field, value}, {dataSources: {checkout}}) => {
    return checkout.setOrderFormCustomData(orderFormId, appId, field, value)
  },

  updateItems: (root, {orderFormId, items}, {dataSources: {checkout}}) => {
    return checkout.updateItems(orderFormId, items)
  },

  updateOrderFormIgnoreProfile: (root, {orderFormId, ignoreProfileData}, {dataSources: {checkout}}) => {
    return checkout.updateOrderFormIgnoreProfile(orderFormId, ignoreProfileData)
  },

  updateOrderFormPayment: (root, {orderFormId, payments}, {dataSources: {checkout}}) => {
    return checkout.updateOrderFormPayment(orderFormId, payments)
  },

  updateOrderFormProfile: (root, {orderFormId, fields}, {dataSources: {checkout}}) => {
    return checkout.updateOrderFormProfile(orderFormId, fields)
  },

  updateOrderFormShipping: async (root, {orderFormId, address}, ctx) => {
    const {dataSources: {checkout}} = ctx
    const [sessionData, orderForm] = await Promise.all([
      sessionQueries.getSession(root, {}, ctx) as SessionFields,
      checkout.updateOrderFormShipping(orderFormId, { clearAddressIfPostalCodeNotFound: false, selectedAddresses: [address] }),
    ])
    await syncOrderFormAndSessionAddress(address, orderFormId, sessionData.address, ctx)
    return orderForm
  }
}
