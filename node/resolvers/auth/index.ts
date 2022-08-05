import { stringify } from 'querystring'

import { ResolverError, UserInputError } from '@vtex/api'
import http, { Method } from 'axios'
import { parse, serialize } from 'cookie'

import { withAuthToken } from '../headers'
import paths from '../paths'
import { GetLoginSessionsResponse } from './types'
import mapLoginSessionsFromAPI from './mapLoginSessionsFromAPI'

const E_PASS = 'Password does not follow specified format'
const E_TOKEN = 'VtexSessionToken cookie is null'

interface ParamsMakeRequest {
  ctx: any
  url: any
  method?: Method
  body?: any
  vtexIdVersion?: string
  authCookieAdmin?: string | null
  authCookieStore?: string | null
}

export async function makeRequest<T = any>({
  ctx,
  url,
  method = 'GET',
  body,
  vtexIdVersion = 'store-graphql',
  authCookieAdmin = null,
  authCookieStore = null,
}: ParamsMakeRequest) {
  const adminAuthHeader = authCookieAdmin
    ? `VtexIdClientAutCookie=${authCookieAdmin};`
    : ''

  const storeAuthHeader = authCookieStore
    ? `VtexIdClientAutCookie_${ctx.account}=${authCookieStore};`
    : ''

  const cookieHeader = `${adminAuthHeader}${storeAuthHeader}`

  const composedHeaders = {
    'X-Vtex-Use-Https': 'true',
    'vtex-ui-id-version': vtexIdVersion,
    ...(cookieHeader && { Cookie: cookieHeader }),
    ...(body && { 'content-type': 'application/x-www-form-urlencoded' }),
  }

  return http.request<T>({
    ...(body && { data: stringify(body) }),
    headers: withAuthToken(composedHeaders)(ctx),
    method,
    url,
  })
}

const getSessionToken = async (ioContext: any, redirectUrl?: any) => {
  const { data, status } = await makeRequest({
    ctx: ioContext,
    url: paths.sessionToken(ioContext.account, ioContext.account, redirectUrl),
  })

  if (!data.authenticationToken) {
    throw new ResolverError(
      `Failed to get session token from VTEX ID. status=${status}`
    )
  }

  return data.authenticationToken
}

const setVtexIdAuthCookie = (
  ioContext: any,
  response: any,
  headers: any,
  authStatus: any
) => {
  if (authStatus === 'Success') {
    const authAccount = `VtexIdclientAutCookie_${ioContext.account}`
    const authCookie = parse(
      headers['set-cookie'].find((checkAuth: any) => {
        return checkAuth.includes(authAccount)
      })
    )

    const VTEXID_EXPIRES = Math.round(
      (new Date(authCookie.expires).getTime() - Date.now()) / 1000
    )

    response.set(
      'Set-Cookie',
      serialize(authAccount, authCookie[authAccount], {
        httpOnly: true,
        maxAge: VTEXID_EXPIRES,
        path: '/',
        secure: true,
      })
    )
  }

  return authStatus
}

/** Password must have at least eight characters with at least one number,
 * one lowercase and one uppercase letter
 */
const checkPasswordFormat = (password: any) => {
  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/

  return regex.test(password)
}

export const queries = {
  /**
   * Request to the VTEX ID API the list of available login
   * options to the user authentication.
   */
  loginOptions: async (_: any, __: any, { vtex: ioContext }: any) => {
    const {
      data: {
        oauthProviders,
        showClassicAuthentication,
        showAccessKeyAuthentication,
      },
    } = await makeRequest({
      ctx: ioContext,
      url: paths.sessionToken(ioContext.account, ioContext.account),
    })

    return {
      accessKeyAuthentication: showAccessKeyAuthentication,
      classicAuthentication: showClassicAuthentication,
      providers: oauthProviders,
    }
  },

  /**
   * Get all currently active Login Sessions from user (identified by the cookie)
   * @return Object with Login Sessions list and currentSessionId
   */
  loginSessionsInfo: async (
    _: any,
    __: any,
    {
      request: {
        headers: { 'vtex-ui-id-version': uiVersion },
      },
      vtex: ioContext,
    }: any
  ) => {
    const { storeUserAuthToken, account } = ioContext

    if (!storeUserAuthToken) {
      return null
    }

    const {
      data: { currentSessionId, sessions },
    } = await makeRequest<GetLoginSessionsResponse>({
      ctx: ioContext,
      url: paths.loginSessions(account, account),
      authCookieStore: storeUserAuthToken,
      vtexIdVersion: uiVersion,
    })

    return {
      currentLoginSessionId: currentSessionId,
      loginSessions: mapLoginSessionsFromAPI(sessions),
    }
  },
}

export const mutations = {
  /**
   * Get email and access code in args and set VtexIdAuthCookie in response cookies.
   * @return authStatus that show if user is logged or something wrong happens.
   */
  accessKeySignIn: async (
    _: any,
    args: any,
    {
      vtex: ioContext,
      request: {
        headers: { cookie },
      },
      response,
    }: any
  ) => {
    const { VtexSessionToken } = parse(cookie)

    if (!VtexSessionToken) {
      throw new UserInputError(E_TOKEN)
    }

    const {
      headers,
      data: { authStatus },
    } = await makeRequest({
      ctx: ioContext,
      method: 'POST',
      url: paths.accessKeySignIn(),
      body: {
        accesskey: args.code,
        authenticationToken: VtexSessionToken,
        email: args.email,
      },
    })

    return setVtexIdAuthCookie(ioContext, response, headers, authStatus)
  },

  /**
   * Get email and password in args and set VtexIdAuthCookie in response cookies.
   * @return authStatus that show if user is logged or something wrong happens.
   */
  classicSignIn: async (
    _: any,
    args: any,
    { vtex: ioContext, response }: any
  ) => {
    if (!checkPasswordFormat(args.password)) {
      throw new UserInputError(E_PASS)
    }

    const VtexSessionToken = await getSessionToken(ioContext)
    const {
      headers,
      data: { authStatus },
    } = await makeRequest({
      ctx: ioContext,
      method: 'POST',
      url: paths.classicSignIn(),
      body: {
        authenticationToken: VtexSessionToken,
        login: args.email,
        password: args.password,
      },
    })

    return setVtexIdAuthCookie(ioContext, response, headers, authStatus)
  },

  /** TODO: When VTEX ID have an endpoint that expires the VtexIdclientAutCookie, update this mutation.
   * 13-06-2018 - @brunojdo
   */
  logout: async (_: any, __: any, { vtex: ioContext, response }: any) => {
    response.set(
      'Set-Cookie',
      serialize(`VtexIdclientAutCookie_${ioContext.account}`, '', {
        path: '/',
        maxAge: 0,
      })
    )

    return true
  },

  /**
   * Log out from specified login sessions of user (identified by the cookie)
   * @return login session ID
   */
  logOutFromSession: async (
    _: any,
    {
      sessionId,
    }: {
      sessionId: string
    },
    {
      request: {
        headers: { 'vtex-ui-id-version': uiVersion },
      },
      vtex: ioContext,
    }: any
  ) => {
    const { storeUserAuthToken, account } = ioContext

    if (!storeUserAuthToken) {
      return null
    }

    await makeRequest({
      url: paths.logOutFromSession({ account, scope: account, sessionId }),
      ctx: ioContext,
      vtexIdVersion: uiVersion,
      method: 'POST',
      authCookieStore: storeUserAuthToken,
    })

    return sessionId
  },

  oAuth: async (_: any, args: any, { vtex: ioContext }: any) => {
    const { provider, redirectUrl } = args
    const VtexSessionToken = await getSessionToken(ioContext, redirectUrl)

    return paths.oAuth(VtexSessionToken, provider)
  },

  /** Set a new password for an user.
   * @return authStatus that show if password was created and user is logged or something wrong happens.
   */
  recoveryPassword: async (
    _: any,
    args: any,
    {
      vtex: ioContext,
      request: {
        headers: { cookie },
      },
      response,
    }: any
  ) => {
    const { VtexSessionToken } = parse(cookie)

    if (!VtexSessionToken) {
      throw new UserInputError(E_TOKEN)
    }

    if (!checkPasswordFormat(args.newPassword)) {
      throw new UserInputError(E_PASS)
    }

    const body = {
      authenticationToken: VtexSessionToken,
      login: args.email,
      newPassword: args.newPassword,
      accessKey: args.code,
    }

    const {
      headers,
      data: { authStatus },
    } = await makeRequest({
      ctx: ioContext,
      method: 'POST',
      url: paths.setPassword(),
      body,
    })

    return setVtexIdAuthCookie(ioContext, response, headers, authStatus)
  },

  /** Set a new password for an user.
   * @return authStatus that show if password was created and user is logged or something wrong happens.
   */
  redefinePassword: async (
    _: any,
    args: any,
    { vtex: ioContext, response }: any
  ) => {
    if (
      !checkPasswordFormat(args.newPassword) ||
      !checkPasswordFormat(args.currentPassword)
    ) {
      throw new UserInputError(E_PASS)
    }

    const VtexSessionToken = await getSessionToken(ioContext)
    const body = {
      authenticationToken: VtexSessionToken,
      login: args.email,
      newPassword: args.currentPassword,
      currentPassword: args.newPassword,
    }

    const {
      headers,
      data: { authStatus },
    } = await makeRequest({
      ctx: ioContext,
      method: 'POST',
      url: paths.setPassword(),
      body,
      vtexIdVersion: args.vtexIdVersion,
    })

    if (authStatus === 'WrongCredentials') {
      throw new UserInputError('Wrong credentials.')
    } else if (authStatus === 'BlockedUser') {
      throw new UserInputError('You were blocked by VTEX ID.')
    }

    return setVtexIdAuthCookie(ioContext, response, headers, authStatus)
  },

  /**
   * Send access key to user email and set VtexSessionToken in response cookies
   * @return Boolean
   */
  sendEmailVerification: async (
    _: any,
    args: any,
    { vtex: ioContext, response }: any
  ) => {
    // VtexSessionToken is valid for 10 minutes
    const SESSION_TOKEN_EXPIRES = 600
    const VtexSessionToken = await getSessionToken(ioContext)

    await makeRequest({
      ctx: ioContext,
      method: 'POST',
      url: paths.sendEmailVerification(),
      body: {
        authenticationToken: VtexSessionToken,
        email: args.email,
      },
    })
    response.set(
      'Set-Cookie',
      serialize('VtexSessionToken', VtexSessionToken, {
        httpOnly: true,
        maxAge: SESSION_TOKEN_EXPIRES,
        path: '/',
        secure: true,
      })
    )

    return true
  },
}
