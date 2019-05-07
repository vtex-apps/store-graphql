import { addIndex, map, reject, keys } from 'ramda'
import { SegmentData } from '../../dataSources/session'
import { parse } from 'cookie'


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

import { CHECKOUT_COOKIE } from '../../utils'

const SetCookieWhitelist = [
  CHECKOUT_COOKIE,
  '.ASPXAUTH',
]

const isWhitelistedSetCookie = (cookie: string) => {
  const [key] = cookie.split('=')
  return SetCookieWhitelist.includes(key)
}

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
const convertIntToFloat = (int: any) => int * 0.01

const shouldUpdateMarketingData = (orderFormMarketingTags: any, segmentData: SegmentData) => {
  const {utmSource=null, utmCampaign=null, utmiCampaign=null} = orderFormMarketingTags || {}
  const {utm_source, utm_campaign, utmi_campaign} = segmentData

  return (utm_source || utm_campaign || utmi_campaign)
    && (utmSource !== utm_source
    || utmCampaign !== utm_campaign
    || utmiCampaign !== utmi_campaign)
}

type Resolver<TArgs=any, TRoot=any> =
  (root: TRoot, args: TArgs, context: Context) => Promise<any>

const mapIndexed = addIndex<any, any, any, any>(map)

export const fieldResolvers = {
  OrderForm: {
    cacheId: (orderForm: any) => {
      return orderForm.orderFormId
    },
    items: (orderForm: any) => {
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
    pickupPointCheckedIn: (orderForm: any, _: any, ctx: any) => {
      const { isCheckedIn, checkedInPickupPointId } = orderForm
      if (!isCheckedIn || !checkedInPickupPointId) {
        return null
      }
      return logisticsQueries.pickupPoint({}, { id: checkedInPickupPointId }, ctx)
    },
    value: (orderForm: any) => {
      return convertIntToFloat(orderForm.value)
    },
  },
  ...assemblyOptionsItemResolvers,
  ...orderFormItemResolvers,
}

const replaceDomain = (cookie: any, host: string) => cookie.replace(/domain=.+?(;|$)/, `domain=${host};`)

export const queries: Record<string, Resolver> = {
  orderForm: async (root, args, ctx) => {
    const {clients: {checkout}} = ctx

    const sessionData = await sessionQueries.getSession(root, args, ctx) as SessionFields
    await syncCheckoutAndSessionPreCheckout(sessionData, ctx)
    const { headers, data: orderForm } = await checkout.orderForm(true)
    const syncedOrderForm = await syncCheckoutAndSessionPostChanges(sessionData, orderForm, ctx)

    const rawHeaders = headers as Record<string, any>
    const responseSetCookies: string[] | null = rawHeaders && rawHeaders['set-cookie']

    const host = ctx.get('x-forwarded-host')

    if (responseSetCookies) {
      const forwardedSetCookies = responseSetCookies.filter(isWhitelistedSetCookie)
      if (forwardedSetCookies.length > 0) {
        const cleanCookies = responseSetCookies.map(cookie => replaceDomain(cookie, host))
        cleanCookies.map(cookie => {
          const parsed = parse(cookie)
          const cookieName = keys(parsed)[0]
          const cookieValue = parsed[cookieName]

          const extraOptions = {
            path: parsed.path,
            domain: parsed.domain,
            expires: parsed.expires ? new Date(parsed.expires) : undefined,
          }

          ctx.cookies.set(cookieName, cookieValue, extraOptions)
        })
      }
    }
    return syncedOrderForm
  },

  orders: (_, __, {clients: {checkout}}) => {
    return checkout.orders()
  },

  shipping: (_, args: any, {clients: {checkout}}) => {
    return checkout.shipping(args)
  },
}

export const mutations: Record<string, Resolver> = {
  addItem: async (_, {orderFormId, items}, {clients: {segment, checkout}}) => {
    const [{marketingData}, segmentData] = await Promise.all([
      checkout.orderForm() as any,
      segment.getSegment().catch((err) => {
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

    const cleanItems = items.map(({ options, ...rest }: any) => rest)
    const addItem = await checkout.addItem(orderFormId, cleanItems)
    const withOptions = items.filter(({ options }: any) => !!options && options.length > 0)
    await addOptionsForItems(withOptions, checkout, addItem)

    return withOptions.length === 0 ? addItem : (await checkout.orderForm())
  },

  addOrderFormPaymentToken: paymentTokenResolver,

  cancelOrder: async (_, {orderFormId, reason}, {clients: {checkout}}) => {
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
    data: ({ payments }: any) => payments,
    enableCookies: true,
    headers: withAuthToken(headers.json),
    method: 'POST',
    url: paths.gatewayTokenizePayment,
  }),

  setOrderFormCustomData: (_, {orderFormId, appId, field, value}, {clients: {checkout}}) => {
    return checkout.setOrderFormCustomData(orderFormId, appId, field, value)
  },

  updateItems: (_, {orderFormId, items}, {clients: {checkout}}) => {
    return checkout.updateItems(orderFormId, items)
  },

  updateOrderFormIgnoreProfile: (_, {orderFormId, ignoreProfileData}, {clients: {checkout}}) => {
    return checkout.updateOrderFormIgnoreProfile(orderFormId, ignoreProfileData)
  },

  updateOrderFormPayment: (_, {orderFormId, payments}, {clients: {checkout}}) => {
    return checkout.updateOrderFormPayment(orderFormId, payments)
  },

  updateOrderFormProfile: (_, {orderFormId, fields}, {clients: {checkout}}) => {
    return checkout.updateOrderFormProfile(orderFormId, fields)
  },

  updateOrderFormShipping: async (root, {orderFormId, address}, ctx) => {
    const {clients: {checkout}} = ctx
    const [sessionData, orderForm] = await Promise.all([
      sessionQueries.getSession(root, {}, ctx) as SessionFields,
      checkout.updateOrderFormShipping(orderFormId, { clearAddressIfPostalCodeNotFound: false, selectedAddresses: [address] }),
    ])

    const syncedOrderForm = await syncCheckoutAndSessionPostChanges(sessionData, orderForm, ctx)
    return syncedOrderForm
  },

  addAssemblyOptions: (_, { orderFormId, itemId, assemblyOptionsId, options }, { clients: { checkout }}) => {
    const body = {
      composition: {
        items: options,
      },
      noSplitItem: true,
    }
    return checkout.addAssemblyOptions(orderFormId, itemId, assemblyOptionsId, body)
  },

  updateOrderFormCheckin: (_, { orderFormId, checkin }: any, {clients: { checkout }}) => {
    return checkout.updateOrderFormCheckin(orderFormId, checkin)
  },
}
