import { addIndex, map, reject } from 'ramda'
import { SimulationData, UpdateCheckinArgs } from '../../dataSources/checkout'
import { SegmentData } from '../../dataSources/session'


import { headers, withAuthToken } from '../headers'
import httpResolver from '../httpResolver'
import { queries as logisticsQueries } from '../logistics/index'
import paths from '../paths'
import { queries as sessionQueries } from '../session'
import { SessionFields } from '../session/sessionResolver'

import { resolvers as assemblyOptionsItemResolvers } from './assemblyOptionItem'
import { addOptionsForItems, buildAssemblyOptionsMap, isParentItem } from './attachmentsHelper'
import { resolvers as orderFormItemResolvers } from './orderFormItem'
import paymentTokenResolver from './paymentTokenResolver'
import { syncCheckoutAndSessionPostChanges, syncCheckoutAndSessionPreCheckout } from './sessionManager'

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
  (root: TRoot, args: TArgs, context: Context) => Promise<any>

const mapIndexed = addIndex(map)

export const fieldResolvers = {
  OrderForm: {
    cacheId: (orderForm) => {
      return orderForm.orderFormId
    },
    items: (orderForm) => {
      const childs = reject(isParentItem, orderForm.items)
      const assemblyOptionsMap = buildAssemblyOptionsMap(orderForm)
      return mapIndexed((item: OrderFormItem, index: number) => ({ 
        ...item,
        assemblyOptionsData: { 
          assemblyOptionsMap,
          childs,
          index,
          orderForm,
        }
      }), orderForm.items)
    },
    pickupPointCheckedIn: (orderForm, _, ctx) => {
      const { isCheckedIn, checkedInPickupPointId } = orderForm
      if (!isCheckedIn || !checkedInPickupPointId) {
        return null
      }
      return logisticsQueries.pickupPoint({}, { id: checkedInPickupPointId }, ctx)
    },
    value: (orderForm) => {
      return convertIntToFloat(orderForm.value)
    },
  },
  ...assemblyOptionsItemResolvers,
  ...orderFormItemResolvers,
}

export const queries: Record<string, Resolver> = {
  orderForm: async (root, args, ctx) => {
    const {dataSources: {checkout}} = ctx

    const sessionData = await sessionQueries.getSession(root, args, ctx) as SessionFields
    await syncCheckoutAndSessionPreCheckout(sessionData, ctx)

    const orderForm = await checkout.orderForm()

    const syncedOrderForm = await syncCheckoutAndSessionPostChanges(sessionData, orderForm, ctx)
    return syncedOrderForm
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

    const cleanItems = items.map(({ options, ...rest }) => rest)
  
    const addItem = await checkout.addItem(orderFormId, cleanItems)

    await addOptionsForItems(items, checkout, addItem)
    return addItem
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

    const syncedOrderForm = await syncCheckoutAndSessionPostChanges(sessionData, orderForm, ctx)
    return syncedOrderForm
  },

  addAssemblyOptions: (root, { orderFormId, itemId, assemblyOptionsId, options }, { dataSources: { checkout }}) => {
    const body = {
      composition: {
        items: options,
      },
      noSplitItem: true,
    }
    return checkout.addAssemblyOptions(orderFormId, itemId, assemblyOptionsId, body)
  },
  
  updateOrderFormCheckin: (root, { orderFormId, checkin }: UpdateCheckinArgs, {dataSources: { checkout }}) => {
    return checkout.updateOrderFormCheckin(orderFormId, checkin)
  },
}
