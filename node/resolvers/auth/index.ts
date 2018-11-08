import http from 'axios'
import { parse, serialize } from 'cookie'

import ResolverError from '../../errors/resolverError'
import { headers as authHeaders, withAuthToken } from '../headers'
import paths from '../paths'


const makeRequest = async (ctx, url, method='POST', vtexIdVersion='store-graphql') => http.request({
  headers: withAuthToken({
    ...authHeaders.profile,
    'vtex-ui-id-version': vtexIdVersion,
  })(ctx),
  method,
  url,
})

const getSessionToken = async (ioContext, redirectUrl?) => {
  const { data, status } = await makeRequest(ioContext, paths.sessionToken(ioContext.account, ioContext.account, redirectUrl), 'GET')
  if (!data.authenticationToken) {
    throw new ResolverError(`ERROR ${data}`, status)
  }
  return data.authenticationToken
}

const setVtexIdAuthCookie = (ioContext, response, headers, authStatus) => {
  if (authStatus === 'Success') {
    const authAccount = `VtexIdclientAutCookie_${ioContext.account}`
    const authCookie = parse(headers['set-cookie'].find(checkAuth => {
      return checkAuth.includes(authAccount)
    }))
    const VTEXID_EXPIRES = Math.round((new Date(authCookie.expires).getTime() - Date.now()) / 1000)
    response.set('Set-Cookie', serialize(authAccount, authCookie[authAccount], {
      httpOnly: true,
      maxAge: VTEXID_EXPIRES,
      path: '/',
      secure: true
    }))
  }
  return authStatus
}
/** Password must have at least eight characters with at least one number,
 * one lowercase and one uppercase letter
 */
const checkPasswordFormat = password => {
  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/
  return regex.test(password)
}

export const queries = {
  /**
   * Request to the VTEX ID API the list of available login
   * options to the user authentication.
   */
  loginOptions: async (_, args, { vtex: ioContext, response }) => {
    const { data: {
        oauthProviders,
        showClassicAuthentication,
        showAccessKeyAuthentication
      } } = await makeRequest(ioContext,
      paths.sessionToken(ioContext.account, ioContext.account), 'GET'
    )
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
  accessKeySignIn: async (_, args, { vtex: ioContext, request: { headers: { cookie } }, response }) => {
    const { VtexSessionToken } = parse(cookie)
    if (!VtexSessionToken) {
      throw new ResolverError('ERROR VtexSessionToken is null', 400)
    }
    const { headers, data: { authStatus } } = await makeRequest(ioContext, paths.accessKeySignIn(VtexSessionToken, args.email, args.code))
    return setVtexIdAuthCookie(ioContext, response, headers, authStatus)
  },

  /**
   * Get email and password in args and set VtexIdAuthCookie in response cookies.
   * @return authStatus that show if user is logged or something wrong happens.
   */
  classicSignIn: async (_, args, { vtex: ioContext, response }) => {
    if (!checkPasswordFormat(args.password)) {
      throw new ResolverError('Password does not follow specific format', 400)
    }
    const VtexSessionToken = await getSessionToken(ioContext)
    const { headers, data: { authStatus } } = await makeRequest(ioContext, paths.classicSignIn(VtexSessionToken, args.email, args.password))
    return setVtexIdAuthCookie(ioContext, response, headers, authStatus)
  },

  /** TODO: When VTEX ID have an endpoint that expires the VtexIdclientAutCookie, update this mutation.
   * 13-06-2018 - @brunojdo
   */
  logout: async (_, args, { vtex: ioContext, response }) => {
    response.set('Set-Cookie',
    serialize(`VtexIdclientAutCookie_${ioContext.account}`, '', { path: '/', maxAge: 0, })
    )
    return true
  },

  oAuth: async (_, args, { vtex: ioContext, response }) => {
    const {provider, redirectUrl} = args
    const VtexSessionToken = await getSessionToken(ioContext, redirectUrl)
    return paths.oAuth(VtexSessionToken, provider)
  },

  /** Set a new password for an user.
   * @return authStatus that show if password was created and user is logged or something wrong happens.
   */
  recoveryPassword: async (_, args, { vtex: ioContext, request: { headers: { cookie } }, response }) => {
    const { VtexSessionToken } = parse(cookie)
    if (!VtexSessionToken) {
      throw new ResolverError('ERROR VtexSessionToken is null', 400)
    }
    if (!checkPasswordFormat(args.newPassword)) {
      throw new ResolverError('Password does not follow specific format', 400)
    }
    const { headers, data: { authStatus } } = await makeRequest(ioContext, paths.recoveryPassword(VtexSessionToken, args.email, args.newPassword, args.code))
    return setVtexIdAuthCookie(ioContext, response, headers, authStatus)
  },

  /** Set a new password for an user.
   * @return authStatus that show if password was created and user is logged or something wrong happens.
   */
  redefinePassword: async (_, args, { vtex: ioContext, request: { headers: { cookie } }, response }) => {
    if (!checkPasswordFormat(args.newPassword) || !checkPasswordFormat(args.currentPassword)) {
      throw new ResolverError('Password does not follow specific format', 400)
    }

    const VtexSessionToken = await getSessionToken(ioContext)
    const escapedEmail = encodeURIComponent(args.email)
    const escapedPass = encodeURIComponent(args.currentPassword)
    const escapedNewPass = encodeURIComponent(args.newPassword)
    const passPath = paths.redefinePassword(VtexSessionToken, escapedEmail, escapedPass, escapedNewPass)

    const { headers, data: { authStatus } } = await makeRequest(ioContext, passPath, args.vtexIdVersion)

    if(authStatus === 'WrongCredentials') {
      throw new ResolverError('Wrong credentials.', 400)
    }
    else if(authStatus === 'BlockedUser') {
      throw new ResolverError('You were blocked by VTEX ID.', 400)
    }
    return setVtexIdAuthCookie(ioContext, response, headers, authStatus)
  },

  /**
   * Send access key to user email and set VtexSessionToken in response cookies
   * @return Boolean
   */
  sendEmailVerification: async (_, args, { vtex: ioContext, response }) => {
    // VtexSessionToken is valid for 10 minutes
    const SESSION_TOKEN_EXPIRES = 600
    const VtexSessionToken = await getSessionToken(ioContext)
    await makeRequest(ioContext, paths.sendEmailVerification(args.email, VtexSessionToken))
    response.set('Set-Cookie', serialize('VtexSessionToken', VtexSessionToken, {
      httpOnly: true,
      maxAge: SESSION_TOKEN_EXPIRES,
      path: '/',
      secure: true,
    }))
    return true
  },

}
