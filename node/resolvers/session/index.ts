import { serialize, parse } from 'cookie'
import { identity } from 'ramda'
import { sessionFields } from './sessionResolver'
const VTEX_SESSION = 'vtex_session'

const IMPERSONATED_EMAIL = 'vtex-impersonated-customer-email'
// maxAge of 1-day defined in vtex-impersonated-customer-email cookie
const VTEXID_EXPIRES = 86400

const getSessionToken = ({
  request: {
    headers: { cookie },
  },
}: Context) => parse(cookie)[VTEX_SESSION]

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
    // TODO: See if there is a way to get session token in a better way
    const { sessionData } = await session.getSession(getSessionToken(ctx), [
      '*',
    ])
    return sessionFields(sessionData)
  },
}

interface ImpersonateArg {
  email: string
}

export const mutations = {
  impersonate: async (_: any, { email }: ImpersonateArg, ctx: Context) => {
    const {
      clients: { session },
    } = ctx

    await session.updateSession(
      IMPERSONATED_EMAIL,
      email,
      [],
      getSessionToken(ctx)
    )
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
      clients: { session },
    } = ctx
    await session.updateSession(
      IMPERSONATED_EMAIL,
      '',
      [],
      getSessionToken(ctx)
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
