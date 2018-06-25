import http from 'axios'
import { serialize, parse } from 'cookie'
import paths from '../paths'
import { withAuthToken, headers } from '../headers'
import ResolverError from '../../errors/resolverError'


const makeRequest = async (ctx, url) => {
  const configRequest = async (ctx, url) => ({
    headers: withAuthToken(headers.profile)(ctx),
    enableCookies: true,
    method: 'GET',
    url,
  })
  return await http.request(await configRequest(ctx, url))
}

const getSessionToken = async ioContext => {
  const { data, status } = await makeRequest(ioContext, paths.sessionToken(ioContext.account, ioContext.account))
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
    const VTEXID_EXPIRES = Math.round((new Date(authCookie['expires']).getTime() - Date.now()) / 1000)
    response.set('Set-Cookie', serialize(authAccount, authCookie[authAccount], {
      httpOnly: true,
      path: '/',
      maxAge: VTEXID_EXPIRES,
      secure: true
    }))
  }
  return authStatus
}

export const mutations = {
  sendEmailVerification: async (_, args, { vtex: ioContext, response }) => {
    // VtexSessionToken is valid for 10 minutes
    const SESSION_TOKEN_EXPIRES = 600
    const VtexSessionToken = await getSessionToken(ioContext)
    await makeRequest(ioContext, paths.sendEmailVerification(args.email, VtexSessionToken))
    response.set('Set-Cookie', serialize('VtexSessionToken', VtexSessionToken, {
      httpOnly: true,
      path: '/',
      secure: true,
      maxAge: SESSION_TOKEN_EXPIRES
    }))
    return true
  },

  accessKeySignIn: async (_, args, { vtex: ioContext, request: { headers: { cookie } }, response }) => {
    const { VtexSessionToken } = parse(cookie)
    if (!VtexSessionToken) {
      throw new ResolverError(`ERROR VtexSessionToken is null`, 400)
    }
    const { headers, data: { authStatus } } = await makeRequest(ioContext, paths.accessKeySignIn(VtexSessionToken, args.email, args.code))
    return setVtexIdAuthCookie(ioContext, response, headers, authStatus);
  },

  classicSignIn: async (_, args, { vtex: ioContext, response }) => {
    const VtexSessionToken = await getSessionToken(ioContext)
    const { headers, data: { authStatus } } = await makeRequest(ioContext, paths.classicSignIn(VtexSessionToken, args.email, args.password))
    return setVtexIdAuthCookie(ioContext, response, headers, authStatus);
  },

  /** TODO: When VTEX ID have an endpoint that expires the VtexIdclientAutCookie, update this mutation. 
   * 13-06-2018 - @brunojdo */
  logout: async (_, { vtex: ioContext, request: { headers: { cookie } }, response }) => {
    const authAccount = `VtexIdclientAutCookie_${ioContext.account}`
    response.set('Set-Cookie',
      serialize(authAccount, '', { path: '/', maxAge: 0, })
    )
    return true
  }
}
