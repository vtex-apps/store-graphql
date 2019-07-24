import { addIndex, compose, forEach, map, reject, path } from 'ramda'

import { headers, withAuthToken } from '../headers'
import httpResolver from '../httpResolver'
import { queries as logisticsQueries } from '../logistics/index'
import paths from '../paths'
import { queries as sessionQueries } from '../session'
import { SessionFields } from '../session/sessionResolver'

import { resolvers as assemblyOptionsItemResolvers } from './assemblyOptionItem'
import {
  addOptionsForItems,
  buildAssemblyOptionsMap,
  isParentItem,
} from './attachmentsHelper'
import { resolvers as orderFormItemResolvers } from './orderFormItem'
import paymentTokenResolver from './paymentTokenResolver'

import { CHECKOUT_COOKIE, parseCookie } from '../../utils'
import { UserInputError } from '@vtex/api'

const SetCookieWhitelist = [CHECKOUT_COOKIE, '.ASPXAUTH']

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
const convertIntToFloat = (int: number) => int * 0.01

const getSessionMarketingParams = (sesionData: SessionFields) => ({
  utm_source: path(['utmParams', 'source'], sesionData),
  utm_campaign: path(['utmParams', 'campaign'], sesionData),
  utm_medium: path(['utmParams', 'medium'], sesionData),
  utmi_campaign: path(['utmiParams', 'campaign'], sesionData),
  utmi_part: path(['utmiParams', 'part'], sesionData),
  utmi_page: path(['utmiParams', 'page'], sesionData),
})

interface AddItemArgs {
  orderFormId?: string
  items?: OrderFormItemInput[]
}

const shouldUpdateMarketingData = (
  orderFormMarketingTags: OrderFormMarketingData | null,
  sessionData: SessionFields
) => {
  const {
    utmCampaign = null,
    utmMedium = null,
    utmSource = null,
    utmiCampaign = null,
    utmiPart = null,
    utmipage = null,
  } = orderFormMarketingTags || {}
  const params = getSessionMarketingParams(sessionData)

  return (
    (params.utm_source ||
      params.utm_campaign ||
      params.utm_medium ||
      params.utmi_campaign ||
      params.utmi_part ||
      params.utmi_page) &&
    (utmCampaign !== params.utm_campaign ||
      utmMedium !== params.utm_medium ||
      utmSource !== params.utm_source ||
      utmiCampaign !== params.utmi_campaign ||
      utmiPart !== params.utmi_part ||
      utmipage !== params.utmi_page)
  )
}

type Resolver<TArgs = any, TRoot = any> = (
  root: TRoot,
  args: TArgs,
  context: Context
) => Promise<any>

const mapIndexed = addIndex<any, any, any, any>(map)

export const fieldResolvers = {
  OrderForm: {
    cacheId: (orderForm: OrderForm) => {
      return orderForm.orderFormId
    },
    items: (orderForm: OrderForm) => {
      const childs = reject(isParentItem, orderForm.items)
      const assemblyOptionsMap = buildAssemblyOptionsMap(orderForm)
      return mapIndexed(
        (item: OrderFormItem, index: number) => ({
          ...item,
          assemblyOptionsData: {
            assemblyOptionsMap,
            childs,
            index,
            orderForm,
          },
        }),
        orderForm.items
      )
    },
    pickupPointCheckedIn: (orderForm: OrderForm, _: any, ctx: Context) => {
      const { isCheckedIn, checkedInPickupPointId } = orderForm
      if (!isCheckedIn || !checkedInPickupPointId) {
        return null
      }
      return logisticsQueries.pickupPoint(
        {},
        { id: checkedInPickupPointId },
        ctx
      )
    },
    value: (orderForm: OrderForm) => {
      return convertIntToFloat(orderForm.value)
    },
  },
  ...assemblyOptionsItemResolvers,
  ...orderFormItemResolvers,
}

const replaceDomain = (host: string) => (cookie: string) =>
  cookie.replace(/domain=.+?(;|$)/, `domain=${host};`)

export const queries: Record<string, Resolver> = {
  orderForm: async (_, __, ctx) => {
    const {
      clients: { checkout },
    } = ctx

    const { headers, data: orderForm } = await checkout.orderFormRaw()

    const rawHeaders = headers as Record<string, any>
    const responseSetCookies: string[] =
      (rawHeaders && rawHeaders['set-cookie']) || []

    const host = ctx.get('x-forwarded-host')
    const forwardedSetCookies = responseSetCookies.filter(
      isWhitelistedSetCookie
    )
    const parseAndClean = compose(
      parseCookie,
      replaceDomain(host)
    )
    const cleanCookies = map(parseAndClean, forwardedSetCookies)
    forEach(
      ({ name, value, options }) => ctx.cookies.set(name, value, options),
      cleanCookies
    )

    return orderForm
  },

  orders: (_, __, { clients: { checkout } }) => {
    return checkout.orders()
  },

  shipping: (_, args: any, { clients: { checkout } }) => {
    return checkout.simulation(args)
  },
}

export const mutations: Record<string, Resolver> = {
  addItem: async (root, { orderFormId, items }: AddItemArgs, ctx: Context) => {
    const {
      clients: { checkout },
    } = ctx
    if (orderFormId == null || items == null) {
      throw new UserInputError('No order form id or items to add provided')
    }
    const [
      { marketingData, items: previousItems },
      sessionData,
    ] = await Promise.all([
      checkout.orderForm(),
      sessionQueries.getSession(root, {}, ctx).catch(err => {
        // todo: log error using colossus
        console.error(err)
        return {} as SessionFields
      }) as SessionFields,
    ])

    if (shouldUpdateMarketingData(marketingData, sessionData)) {
      const newMarketingData = {
        ...(marketingData || {}),
      }

      if (sessionData && Object.keys(sessionData).length > 0) {
        newMarketingData.utmCampaign = path(
          ['utmParams', 'campaign'],
          sessionData
        )
        newMarketingData.utmMedium = path(['utmParams', 'medium'], sessionData)
        newMarketingData.utmSource = path(['utmParams', 'source'], sessionData)
        newMarketingData.utmiCampaign = path(
          ['utmiParams', 'campaign'],
          sessionData
        )
        newMarketingData.utmiPart = path(['utmiParams', 'part'], sessionData)
        newMarketingData.utmipage = path(['utmiParams', 'page'], sessionData)
      }

      if (newMarketingData.marketingTags == null) {
        delete newMarketingData.marketingTags
      }

      await checkout.updateOrderFormMarketingData(orderFormId, newMarketingData)
    }

    const cleanItems = items.map(({ options, ...rest }) => rest)
    const withOptions = items.filter(
      ({ options }) => !!options && options.length > 0
    )

    const addItem = await checkout.addItem(orderFormId, cleanItems)

    await addOptionsForItems(withOptions, checkout, addItem, previousItems)

    return withOptions.length === 0 ? addItem : await checkout.orderForm()
  },

  addOrderFormPaymentToken: paymentTokenResolver,

  cancelOrder: async (
    _,
    { orderFormId, reason },
    { clients: { checkout } }
  ) => {
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

  setOrderFormCustomData: (
    _,
    { orderFormId, appId, field, value },
    { clients: { checkout } }
  ) => {
    return checkout.setOrderFormCustomData(orderFormId, appId, field, value)
  },

  updateItems: (_, { orderFormId, items }, { clients: { checkout } }) => {
    return checkout.updateItems(orderFormId, items)
  },

  updateOrderFormIgnoreProfile: (
    _,
    { orderFormId, ignoreProfileData },
    { clients: { checkout } }
  ) => {
    return checkout.updateOrderFormIgnoreProfile(orderFormId, ignoreProfileData)
  },

  updateOrderFormPayment: (
    _,
    { orderFormId, payments },
    { clients: { checkout } }
  ) => {
    return checkout.updateOrderFormPayment(orderFormId, payments)
  },

  updateOrderFormProfile: (
    _,
    { orderFormId, fields },
    { clients: { checkout } }
  ) => {
    return checkout.updateOrderFormProfile(orderFormId, fields)
  },

  updateOrderFormShipping: async (_, { orderFormId, address }, ctx) => {
    const {
      clients: { checkout },
    } = ctx
    return checkout.updateOrderFormShipping(orderFormId, {
      clearAddressIfPostalCodeNotFound: false,
      selectedAddresses: [address],
    })
  },

  addAssemblyOptions: (
    _,
    { orderFormId, itemId, assemblyOptionsId, options },
    { clients: { checkout } }
  ) => {
    const body = {
      composition: {
        items: options,
      },
      noSplitItem: true,
    }
    return checkout.addAssemblyOptions(
      orderFormId,
      itemId,
      assemblyOptionsId,
      body
    )
  },

  updateOrderFormCheckin: (
    _,
    { orderFormId, checkin }: any,
    { clients: { checkout } }
  ) => {
    return checkout.updateOrderFormCheckin(orderFormId, checkin)
  },
}
