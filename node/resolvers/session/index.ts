import { serialize } from 'cookie'
import { identity } from 'ramda'
import { sessionFields } from './sessionResolver'
const VTEX_SESSION = 'vtex_session'

const IMPERSONATED_EMAIL = 'vtex-impersonated-customer-email'
// maxAge of 1-day defined in vtex-impersonated-customer-email cookie
const VTEXID_EXPIRES = 86400

// Disclaimer: These queries and mutations assume that vtex_session was passed in cookies.
export const queries = {
  /**
   * Get user session
   * @return Session
   */
  getSession: async (_: any, __: any, ctx: Context) => {
    const {
      clients: { session },
      cookies,
    } = ctx
    const { sessionData } = await session.getSession(
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
      clients: { session, checkout },
      cookies,
    } = ctx

    await session.updateSession(
      IMPERSONATED_EMAIL,
      email,
      [],
      cookies.get(VTEX_SESSION)!
    )

    const orderForm = await checkout.orderForm()
    const clientProfileData = orderForm && orderForm.clientProfileData
      ? orderForm.clientProfileData
      : {}

    if (clientProfileData.email !== email && orderForm.orderFormId) {
      await checkout.updateOrderFormProfile(
        orderForm.orderFormId,
        { ...clientProfileData, email }
      )
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
      clients: { session, checkout },
      cookies,
    } = ctx

    await session.updateSession(
      IMPERSONATED_EMAIL,
      '',
      [],
      cookies.get(VTEX_SESSION)!
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
}
