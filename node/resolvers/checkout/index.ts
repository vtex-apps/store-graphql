import { map } from 'ramda'
import { SimulationData } from '../../dataSources/checkout'
import { SegmentData } from '../../dataSources/session'
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

const shouldUpdateMarketingData = (orderFormMarketingTags, segmentData: SegmentData) => {
  const {utmSource=null, utmCampaign=null, utmiCampaign=null} = orderFormMarketingTags || {}
  const {utm_source, utm_campaign, utmi_campaign} = segmentData

  return (utm_source || utm_campaign || utmi_campaign)
    && (utmSource !== utm_source
    || utmCampaign !== utm_campaign
    || utmiCampaign !== utmi_campaign)
}

type Resolver<TArgs=any, TRoot=any> =
  (root: TRoot, args: TArgs, context: ServiceContext) => Promise<any>

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
  orderForm: (root, args, {dataSources: {checkout}}) => {
    return checkout.orderForm()
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
      session.getSegmentData()
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

  updateOrderFormShipping: (root, {orderFormId, address}, {dataSources: {checkout}}) => {
    return checkout.updateOrderFormShipping(orderFormId, {address})
  },

  updateOrderFormAssemblyOptions: (root, {orderFormId, itemIndex, assemblyOptionId, assemblyData}, {dataSources: {checkout}}) => {
    return checkout.updateOrderFormAssemblyOptions(orderFormId, itemIndex, assemblyOptionId, assemblyData)
    console.log(checkout.updateOrderFormAssemblyOptions(orderFormId, itemIndex, assemblyOptionId, assemblyData))
    return null
  }
}
