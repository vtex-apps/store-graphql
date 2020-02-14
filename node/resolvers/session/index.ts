import { serialize } from 'cookie'
import { identity } from 'ramda'
import { sessionFields } from './sessionResolver'
import { fieldResolvers as sessionPickupResolvers } from './sessionPickup'

const VTEX_SESSION = 'vtex_session'
const vtexIdAccount = (account: string) => `VtexIdclientAutCookie_${account}`
const VTEX_ID = 'VtexIdclientAutCookie'

const IMPERSONATED_EMAIL = 'vtex-impersonated-customer-email'
// maxAge of 1-day defined in vtex-impersonated-customer-email cookie
const VTEXID_EXPIRES = 86400

interface SavePickupArgs {
  name: string
  address: CheckoutAddress
}

const convertCheckoutAddressToProfile = (
  checkoutAddress: CheckoutAddress | null
) => {
  if (!checkoutAddress) {
    return checkoutAddress
  }
  const { geoCoordinates, ...rest } = checkoutAddress
  return { ...rest, geoCoordinate: geoCoordinates }
}

const vtexIdCookies = (ctx: Context) => {
  const { cookies, vtex: { account }} = ctx
  const vtexIdAccountCookieValue = cookies.get(vtexIdAccount(account))
  const vtexIdValue = cookies.get(VTEX_ID)

  return {
    account: vtexIdAccountCookieValue ? `${vtexIdAccount(account)}=${vtexIdAccountCookieValue}` : null,
    id: vtexIdValue ? `${VTEX_ID}=${vtexIdValue}` : null,
  }
}


// Disclaimer: These queries and mutations assume that vtex_session was passed in cookies.
export const queries = {
  /**
   * Get user session
   * @return Session
   */
  getSession: async (_: any, __: any, ctx: Context) => {
    const {
      clients: { customSession },
      cookies,
    } = ctx
    const { sessionData } = await customSession.getSession(
      cookies.get(VTEX_SESSION)!,
      ['*']
    )
    return sessionFields(sessionData)
  },
}

interface ImpersonateArg {
  email: string
}

export const mutations = {
  impersonate: async (_: any, { email }: ImpersonateArg, ctx: Context) => {
    const {
      clients: { customSession, checkout },
      cookies,
    } = ctx

    await customSession.updateSession(
      IMPERSONATED_EMAIL,
      email,
      [],
      cookies.get(VTEX_SESSION)!,
      vtexIdCookies(ctx)
    )

    const orderForm = await checkout.orderForm()
    const clientProfileData =
      orderForm && orderForm.clientProfileData
        ? orderForm.clientProfileData
        : {}

    if (clientProfileData.email !== email && orderForm.orderFormId) {
      await checkout.updateOrderFormProfile(orderForm.orderFormId, {
        ...clientProfileData,
        email,
      })
    }

    ctx.response.set(
      'Set-Cookie',
      serialize(IMPERSONATED_EMAIL, email, {
        encode: identity,
        maxAge: VTEXID_EXPIRES,
        path: '/',
      })
    )

    return queries.getSession({}, {}, ctx)
  },

  depersonify: async (_: any, __: any, ctx: Context) => {
    const {
      clients: { customSession, checkout },
      cookies,
    } = ctx

    await customSession.updateSession(
      IMPERSONATED_EMAIL,
      '',
      [],
      cookies.get(VTEX_SESSION)!,
      vtexIdCookies(ctx)
    )

    try {
      await checkout.changeToAnonymousUser()
    } catch (e) {
      // This Checkout API triggers a redirect (302).
      // That's fine.
    }

    ctx.response.set(
      'Set-Cookie',
      serialize(IMPERSONATED_EMAIL, '', {
        maxAge: 0,
        path: '/',
      })
    )

    return true
  },

  savePickupInSession: async (_: any, args: SavePickupArgs, ctx: Context) => {
    const { address, name } = args
    const {
      clients: { customSession },
      cookies,
    } = ctx

    await customSession.updateSession(
      'favoritePickup',
      { address: convertCheckoutAddressToProfile(address), name },
      [],
      cookies.get(VTEX_SESSION)!,
      vtexIdCookies(ctx)
    )

    return queries.getSession({}, {}, ctx)
  },
}

export const fieldResolvers = {
  ...sessionPickupResolvers,
}
