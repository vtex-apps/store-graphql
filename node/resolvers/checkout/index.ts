import { UserInputError } from '@vtex/api'
import { compose, reject, path } from 'ramda'

import { headers, withAuthToken } from '../headers'
import httpResolver from '../httpResolver'
import { queries as logisticsQueries } from '../logistics/index'
import paths from '../paths'
import { fieldResolvers as slasResolvers } from './checkoutSLA'
import { resolvers as assemblyOptionsItemResolvers } from './assemblyOptionItem'
import {
  addOptionsForItems,
  buildAssemblyOptionsMap,
  isParentItem,
} from './attachmentsHelper'
import { resolvers as orderFormItemResolvers } from './orderFormItem'
import paymentTokenResolver from './paymentTokenResolver'
import { fieldResolvers as shippingFieldResolvers } from './shipping'
import {
  ASPXAUTH_COOKIE,
  CHECKOUT_COOKIE,
  OWNERSHIP_COOKIE,
  parseCookie,
} from '../../utils'
import {
  getSimulationPayloadsByItem,
  orderFormItemToSeller,
} from '../../utils/simulation'
import { LogisticPickupPoint } from '../logistics/types'
import logisticPickupResolvers from '../logistics/fieldResolvers'
import { isSellerFlaggedForChangingOnSimulationBasedOnRegion } from '../../utils/flags/flagRegionalization'

const ALL_SET_COOKIES = [CHECKOUT_COOKIE, ASPXAUTH_COOKIE, OWNERSHIP_COOKIE]

const filterAllowedCookies = (setCookies: string[], allowList: string[]) => {
  return setCookies.filter((setCookie) => {
    const [key] = setCookie.split('=')

    return allowList.includes(key)
  })
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

interface AddItemArgs {
  orderFormId?: string
  items?: OrderFormItemInput[]
  utmParams?: UTMParams
  utmiParams?: UTMIParams
}

interface SkuPickupSLAListArgs {
  itemId: string
  seller: string
  lat: string
  long: string
  country: string
}

interface SkuPickupSLAArgs extends SkuPickupSLAListArgs {
  pickupId: string
}

interface SLAFromLogistics {
  id: string
  shippingEstimate: null
  pickupStoreInfo: {
    friendlyName: string
    address: CheckoutAddress
  }
}

const checkouSlaFromLogisticPickup = (
  logisticPickup: LogisticPickupPoint
): SLAFromLogistics => {
  return {
    id: logisticPickup.id,
    shippingEstimate: null,
    pickupStoreInfo: {
      friendlyName: logisticPickup.name,
      address: {
        ...logisticPickupResolvers.PickupPoint.address(logisticPickup),
        geoCoordinates: [
          logisticPickup.address.location.longitude,
          logisticPickup.address.location.latitude,
        ],
      },
    },
  }
}

type AllSLAs = SLAItem | SLAFromLogistics

const shouldUpdateMarketingData = (
  orderFormMarketingTags: OrderFormMarketingData | null,
  utmParams?: UTMParams,
  utmiParams?: UTMIParams
) => {
  const {
    utmCampaign = null,
    utmMedium = null,
    utmSource = null,
    utmiCampaign = null,
    utmiPart = null,
    utmipage = null,
  } = orderFormMarketingTags ?? {}

  if (
    !utmParams?.source &&
    !utmParams?.medium &&
    !utmParams?.campaign &&
    !utmiParams?.campaign &&
    !utmiParams?.page &&
    !utmiParams?.part
  ) {
    // Avoid updating at any costs if all fields are invalid
    return false
  }

  return (
    (utmParams?.source ?? null) !== utmSource ||
    (utmParams?.medium ?? null) !== utmMedium ||
    (utmParams?.campaign ?? null) !== utmCampaign ||
    (utmiParams?.part ?? null) !== utmiPart ||
    (utmiParams?.page ?? null) !== utmipage ||
    (utmiParams?.campaign ?? null) !== utmiCampaign
  )
}

type Resolver<TArgs = any, TRoot = any> = (
  root: TRoot,
  args: TArgs,
  context: Context
) => Promise<any>

export const fieldResolvers = {
  OrderForm: {
    cacheId: (orderForm: OrderForm) => {
      return orderForm.orderFormId
    },
    items: (orderForm: OrderForm) => {
      const childs = reject(isParentItem, orderForm.items)
      const assemblyOptionsMap = buildAssemblyOptionsMap(orderForm)

      return orderForm.items.map((item, index) => ({
        ...item,
        assemblyOptionsData: {
          assemblyOptionsMap,
          childs,
          index,
          orderForm,
        },
      }))
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
  ...shippingFieldResolvers,
  ...slasResolvers,
}

const replaceDomain = (host: string) => (cookie: string) =>
  cookie.replace(/domain=.+?(;|$)/, `domain=${host};`)

export async function syncWithStoreLocale(
  orderForm: OrderForm,
  cultureInfo: string,
  checkout: Context['clients']['checkout']
) {
  const clientPreferencesData = orderForm.clientPreferencesData || {
    locale: cultureInfo,
  }

  const shouldUpdateClientPreferencesData =
    cultureInfo &&
    clientPreferencesData.locale &&
    cultureInfo !== clientPreferencesData.locale

  if (shouldUpdateClientPreferencesData) {
    const newClientPreferencesData = {
      ...clientPreferencesData,
    }

    newClientPreferencesData.locale = cultureInfo

    try {
      return await checkout.updateOrderFormClientPreferencesData(
        orderForm.orderFormId,
        newClientPreferencesData
      )
    } catch (e) {
      console.error(e)

      return orderForm
    }
  }

  return orderForm
}

export async function setCheckoutCookies(
  rawHeaders: Record<string, any>,
  ctx: Context,
  allowList: string[] = ALL_SET_COOKIES
) {
  const responseSetCookies: string[] = rawHeaders?.['set-cookie'] || []

  const host = ctx.get('x-forwarded-host')
  const forwardedSetCookies = filterAllowedCookies(
    responseSetCookies,
    allowList
  )

  const parseAndClean = compose(parseCookie, replaceDomain(host))

  const cleanCookies = forwardedSetCookies.map(parseAndClean)

  cleanCookies.forEach(({ name, value, options }) => {
    if (options.secure && !ctx.cookies.secure) {
      ctx.cookies.secure = true
    }

    ctx.cookies.set(name, value, options)
  })
}

export const queries: Record<string, Resolver> = {
  orderForm: async (_, __, ctx) => {
    const {
      clients: { checkout },
      vtex: { segment, logger },
    } = ctx

    let { headers: responseHeaders, data } = await checkout.orderFormRaw()

    const hasBrokenCookie = data?.clientProfileData?.email?.startsWith(
      'vrn--vtexsphinx--aws-us-east-1'
    )

    if (hasBrokenCookie) {
      logger.info({
        message: 'Broken order form',
        orderFormId: data.orderFormId,
      })

      await checkout.changeToAnonymousUser(data.orderFormId)

      const obj = await checkout.orderFormRaw()

      data = obj.data
      responseHeaders = obj.headers
    }

    const orderForm = await syncWithStoreLocale(
      data,
      segment!.cultureInfo,
      checkout
    )

    setCheckoutCookies(responseHeaders, ctx)

    return orderForm
  },

  searchOrderForm: async (_, { orderFormId }, ctx) => {
    const {
      clients: { checkout },
    } = ctx

    const orderForm = await checkout.orderForm(orderFormId)

    return orderForm
  },

  orders: (_, __, { clients: { checkout } }) => {
    return checkout.orders()
  },

  shipping: (_, args: any, { clients: { checkout } }) => {
    return checkout.simulation(args)
  },

  skuPickupSLAs: async (
    _: any,
    { itemId, seller, lat, long, country }: SkuPickupSLAListArgs,
    { clients: { checkout, logistics } }: Context
  ) => {
    const simulationPayload = {
      items: [
        {
          id: itemId,
          seller,
          quantity: 1,
        },
      ],
      country,
      shippingData: {
        selectedAddresses: [
          {
            geoCoordinates: [long, lat],
            country,
          },
        ],
      },
    }

    const [simulation, allPickupsOutput] = await Promise.all([
      checkout.simulation(simulationPayload),
      logistics.nearPickupPoints(lat, long),
    ])

    const slas = simulation?.logisticsInfo?.[0]?.slas ?? []
    const slasPickup = slas.filter(
      (sla) => sla.deliveryChannel === 'pickup-in-point'
    ) as AllSLAs[]

    const slaIdsSet = slasPickup.reduce((acc, { pickupStoreInfo }) => {
      if (pickupStoreInfo.address?.addressId) {
        acc.add(pickupStoreInfo.address.addressId)
      }

      return acc
    }, new Set<string>())

    allPickupsOutput.items.forEach((logisticItem) => {
      if (logisticItem.isActive && !slaIdsSet.has(logisticItem.id)) {
        const checkouSla = checkouSlaFromLogisticPickup(logisticItem)

        slasPickup.push(checkouSla)
      }
    })

    return slasPickup
  },

  skuPickupSLA: async (
    _: any,
    { itemId, seller, lat, long, country, pickupId }: SkuPickupSLAArgs,
    ctx: Context
  ) => {
    const slas = (await queries.skuPickupSLAs(
      {},
      { itemId, seller, lat, long, country },
      ctx
    )) as SLA[]

    return slas.find(
      (s) => path(['pickupStoreInfo', 'address', 'addressId'], s) === pickupId
    )
  },

  itemsWithSimulation: async (
    _,
    {
      items,
      regionId,
      salesChannel,
    }: {
      items: ItemWithSimulationInput[]
      regionId?: string
      salesChannel?: string
    },
    ctx: Context
  ) => {
    const {
      clients: { pvtCheckout },
      vtex: { segment, logger },
    } = ctx

    const changeSeller = isSellerFlaggedForChangingOnSimulationBasedOnRegion(
      ctx.vtex.account
    )

    return items.map((item) => {
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve) => {
        const simulationPayloads = getSimulationPayloadsByItem(
          item,
          segment,
          regionId,
          changeSeller
        )

        const simulationPromises = simulationPayloads.map((payload) =>
          pvtCheckout.simulation(payload, salesChannel)
        )

        const simulations = await Promise.all(
          simulationPromises.map((p) => p.catch((e: any) => e))
        )

        const sellers = simulations.map((simulation, idx) => {
          if (simulation instanceof Error) {
            logger.error(simulation)

            return {
              error: simulation.message,
              sellerId: item.sellers[idx].sellerId,
              commertialOffer: {
                spotPrice: null,
                AvailableQuantity: 0,
                Price: null,
                ListPrice: null,
                PriceValidUntil: null,
                discountHighlights: [],
                teasers: [],
                Installments: [],
              },
            }
          }

          const [simulationItem] = simulation.items

          return orderFormItemToSeller({
            ...simulationItem,
            paymentData: simulation.paymentData,
            ratesAndBenefitsData: simulation.ratesAndBenefitsData,
            logisticsInfo: simulation.logisticsInfo ?? [],
          })
        })

        resolve({
          itemId: item.itemId,
          sellers,
        })
      })
    })
  },
}

interface UTMParams {
  campaign?: string
  medium?: string
  source?: string
}

interface UTMIParams {
  campaign?: string
  part?: string
  page?: string
}

export const mutations: Record<string, Resolver> = {
  addItem: async (
    _,
    {
      orderFormId: paramsOrderFormId,
      items,
      utmParams,
      utmiParams,
    }: AddItemArgs,
    ctx: Context
  ) => {
    const {
      clients: { checkout },
      vtex,
    } = ctx

    const { orderFormId } = vtex

    if (orderFormId == null) {
      throw new Error('No orderformid in cookies')
    }

    if (items == null) {
      throw new UserInputError('No items to add provided')
    }

    if (orderFormId !== paramsOrderFormId) {
      ctx.vtex.logger.warn(
        `Different orderFormId found: provided=${paramsOrderFormId} and in cookies=${orderFormId}`
      )
    }

    const { marketingData, items: previousItems } = await checkout.orderForm()

    if (shouldUpdateMarketingData(marketingData, utmParams, utmiParams)) {
      const newMarketingData = {
        ...(marketingData ?? {}),
      }

      newMarketingData.utmCampaign = utmParams?.campaign
      newMarketingData.utmMedium = utmParams?.medium
      newMarketingData.utmSource = utmParams?.source
      newMarketingData.utmiCampaign = utmiParams?.campaign
      newMarketingData.utmiPart = utmiParams?.part
      newMarketingData.utmipage = utmiParams?.page

      if (newMarketingData.marketingTags == null) {
        delete newMarketingData.marketingTags
      } else if (Array.isArray(newMarketingData.marketingTags)) {
        newMarketingData.marketingTags = newMarketingData.marketingTags.filter(
          Boolean
        )
      }

      const atLeastOneValidField = Object.values(newMarketingData).some(
        (value) => {
          if (value == null || value === '') {
            return false
          }

          if (Array.isArray(value) && value.length === 0) {
            return false
          }

          return true
        }
      )

      // If all fields of newMarketingData are invalid, it causes checkout to answer with an error 400
      if (atLeastOneValidField) {
        try {
          await checkout.updateOrderFormMarketingData(
            orderFormId,
            newMarketingData
          )
        } catch (e) {
          ctx.vtex.logger.error({
            message: 'Error when updating orderformmarketing data',
            id: orderFormId,
            chkArgs: JSON.stringify(newMarketingData),
            graphqlArgs: JSON.stringify({ utmParams, utmiParams }),
          })
        }
      }
    }

    const cleanItems = items.map(({ options, ...rest }) => rest)
    const withOptions = items.filter(
      ({ options }) => !!options && options.length > 0
    )

    const addItem = await checkout.addItem(orderFormId, cleanItems)

    await addOptionsForItems(withOptions, checkout, addItem, previousItems)

    return withOptions.length === 0 ? addItem : checkout.orderForm()
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
    { appId, field, value },
    { clients: { checkout }, vtex: { orderFormId } }
  ) => {
    if (orderFormId == null) {
      throw new Error('No orderformid in cookies')
    }

    return checkout.setOrderFormCustomData(orderFormId, appId, field, value)
  },

  updateItems: (
    _,
    { orderFormId: paramsOrderFormId, items },
    { clients: { checkout }, vtex }
  ) => {
    const { orderFormId } = vtex

    if (orderFormId == null) {
      throw new Error('No orderformid in cookies')
    }

    if (orderFormId !== paramsOrderFormId) {
      vtex.logger.warn(
        `Different orderFormId found: provided=${paramsOrderFormId} and in cookies=${vtex.orderFormId}`
      )
    }

    return checkout.updateItems(orderFormId, items)
  },

  updateOrderFormIgnoreProfile: (
    _,
    { ignoreProfileData },
    { clients: { checkout }, vtex: { orderFormId } }
  ) => {
    if (orderFormId == null) {
      throw new Error('No orderformid in cookies')
    }

    return checkout.updateOrderFormIgnoreProfile(orderFormId, ignoreProfileData)
  },

  updateOrderFormPayment: (
    _,
    { payments },
    { clients: { checkout }, vtex: { orderFormId } }
  ) => {
    if (orderFormId == null) {
      throw new Error('No orderformid in cookies')
    }

    return checkout.updateOrderFormPayment(orderFormId, payments)
  },

  updateOrderFormProfile: (_, { fields }, ctx) => {
    const {
      clients: { checkout },
      vtex: { orderFormId },
    } = ctx

    if (orderFormId == null) {
      throw new Error('No orderformid in cookies')
    }

    return checkout.updateOrderFormProfile(orderFormId, fields, ctx)
  },

  updateOrderFormShipping: async (_, { address }, ctx) => {
    const {
      clients: { checkout },
      vtex: { orderFormId },
    } = ctx

    if (orderFormId == null) {
      throw new Error('No orderformid in cookies')
    }

    return checkout.updateOrderFormShipping(orderFormId, {
      clearAddressIfPostalCodeNotFound: false,
      selectedAddresses: [address],
    })
  },

  addAssemblyOptions: (
    _,
    { itemId, assemblyOptionsId, options },
    { clients: { checkout }, vtex: { orderFormId } }
  ) => {
    if (orderFormId == null) {
      throw new Error('No orderformid in cookies')
    }

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
    { checkin }: any,
    { clients: { checkout }, vtex: { orderFormId } }
  ) => {
    if (orderFormId == null) {
      throw new Error('No orderformid in cookies')
    }

    return checkout.updateOrderFormCheckin(orderFormId, checkin)
  },

  newOrderForm: async (_, { orderFormId }, ctx) => {
    const {
      clients: { checkout },
    } = ctx

    const { data, headers: responseHeaders } = await checkout.newOrderForm(
      orderFormId
    )

    await setCheckoutCookies(responseHeaders, ctx)

    return data
  },
}
