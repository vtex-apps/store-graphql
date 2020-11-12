import { stringify } from 'querystring'

import { ResolverError, UserInputError } from '@vtex/api'
import http, { Method } from 'axios'
import { parse, serialize } from 'cookie'

import { withAuthToken } from '../headers'
import paths from '../paths'

const E_PASS = 'Password does not follow specified format'
const E_TOKEN = 'VtexSessionToken cookie is null'

interface ParamsMakeRequest {
  ctx: any
  url: any
  method?: Method
  body?: any
  vtexIdVersion?: string
  authCookie?: string | null
}

export async function makeRequest({
  ctx,
  url,
  method = 'POST',
  body,
  vtexIdVersion = 'store-graphql',
  authCookie = null,
}: ParamsMakeRequest) {
  const cookieHeader = authCookie ? `VtexIdClientAutCookie=${authCookie}` : ''
  const composedHeaders = {
    'X-Vtex-Use-Https': 'true',
    'vtex-ui-id-version': vtexIdVersion,
    accept: 'application/vnd.vtex.ds.v10+json',
    ...(cookieHeader && { Cookie: cookieHeader }),
    ...(body && { 'content-type': 'application/x-www-form-urlencoded' }),
  }

  return http.request({
    ...(body && { data: stringify(body) }),
    headers: withAuthToken(composedHeaders)(ctx),
    method,
    url,
  })
}

const makeSecureRequest = async (
  ctx: any,
  url: any,
  body: any,
  method: Method = 'POST',
  vtexIdVersion = 'store-graphql'
) =>
  http.request({
    data: stringify(body),
    headers: withAuthToken({
      'X-Vtex-Use-Https': 'true',
      accept: 'application/vnd.vtex.ds.v10+json',
      'content-type': 'application/x-www-form-urlencoded',
      'vtex-ui-id-version': vtexIdVersion,
    })(ctx),
    method,
    url,
  })

const getSessionToken = async (ioContext: any, redirectUrl?: any) => {
  const { data, status } = await makeRequest({
    ctx: ioContext,
    url: paths.sessionToken(ioContext.account, ioContext.account, redirectUrl),
    method: 'GET',
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
      method: 'GET',
    })

    return {
      accessKeyAuthentication: showAccessKeyAuthentication,
      classicAuthentication: showClassicAuthentication,
      providers: oauthProviders,
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
    } = await makeSecureRequest(ioContext, paths.accessKeySignIn(), {
      accesskey: args.code,
      authenticationToken: VtexSessionToken,
      email: args.email,
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
    } = await makeSecureRequest(ioContext, paths.classicSignIn(), {
      authenticationToken: VtexSessionToken,
      login: args.email,
      password: args.password,
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

    const {
      headers,
      data: { authStatus },
    } = await makeRequest({
      ctx: ioContext,
      url: paths.recoveryPassword(
        VtexSessionToken,
        args.email,
        args.newPassword,
        args.code
      ),
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
    const escapedEmail = encodeURIComponent(args.email)
    const escapedPass = encodeURIComponent(args.currentPassword)
    const escapedNewPass = encodeURIComponent(args.newPassword)
    const passPath = paths.redefinePassword(
      VtexSessionToken,
      escapedEmail,
      escapedPass,
      escapedNewPass
    )

    const {
      headers,
      data: { authStatus },
    } = await makeRequest({
      ctx: ioContext,
      url: passPath,
      method: 'POST',
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
      url: paths.sendEmailVerification(args.email, VtexSessionToken),
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
