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
    } = ctx
    const { sessionData } = await session.getSession(ctx.get(VTEX_SESSION), [
      '*',
    ])
    return sessionFields(sessionData)
  },
}

export const mutations = {
  /**
   * Impersonate a customer and set clientProfileData in OrderForm
   * @param args this mutation receives email and orderFormId
   * @return Session
   */
  impersonate: async (_: any, args: any, ctx: Context) => {
    const {
      clients: { session },
    } = ctx
    await session.updateSession(
      IMPERSONATED_EMAIL,
      args.email,
      [],
      ctx.get(VTEX_SESSION)
    )
    ctx.response.set(
      'Set-Cookie',
      serialize(IMPERSONATED_EMAIL, args.email, {
        encode: identity,
        maxAge: VTEXID_EXPIRES,
        path: '/',
      })
    )
    return queries.getSession({}, {}, ctx)
  },

  /**
   * Depersonify a customer and set clientProfileData to anonymous user.
   * @param args this mutation receives orderFormId
   */
  depersonify: async (_: any, __: any, ctx: Context) => {
    const {
      clients: { session },
    } = ctx
    await session.updateSession(
      IMPERSONATED_EMAIL,
      '',
      [],
      ctx.get(VTEX_SESSION)
    )
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
