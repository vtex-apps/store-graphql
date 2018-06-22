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
  const { data, status } = await makeRequest(ioContext, paths.getTemporaryToken(ioContext.account, ioContext.account))
  if (!data.authenticationToken) {
    throw new ResolverError(`ERROR ${data}`, status)
  }
  return data.authenticationToken
}

const setVtexIdAuthCookie = (headers, ioContext, response) => {
  const authAccount = `VtexIdclientAutCookie_${ioContext.account}`
  const authCookie = parse(headers['set-cookie'].find(checkAuth => {
    return checkAuth.includes(authAccount)
  }))
  response.set('Set-Cookie', serialize(authAccount, authCookie[authAccount], {
    httpOnly: true,
    path: '/',
    maxAge: new Date(authCookie['expires']).getTime(),
    secure: true
  }))
}

export const mutations = {
  sendEmailVerification: async (_, args, { vtex: ioContext, response }) => {
    const VtexSessionToken = await getSessionToken(ioContext)
    await makeRequest(ioContext, paths.sendEmailVerification(args.email, VtexSessionToken))
    response.set('Set-Cookie', serialize('VtexSessionToken', VtexSessionToken, { httpOnly: true, secure: true, path: '/' }))
    return true
  },

  accessKeySignIn: async (_, args, { vtex: ioContext, request: { headers: { cookie } }, response }) => {
    const { VtexSessionToken } = (parse(cookie))
    if (!VtexSessionToken) {
      throw new ResolverError(`ERROR VtexSessionToken is null`, 400)
    }
    const { headers } = await makeRequest(ioContext, paths.accessKeySignIn(VtexSessionToken, args.email, args.code))
    setVtexIdAuthCookie(headers, ioContext, response);
    return true
  },

  classicSignIn: async (_, args, { vtex: ioContext, request: { headers: { cookie } }, response }) => {
    const VtexSessionToken = await getSessionToken(ioContext)
    const { headers } = await makeRequest(ioContext, paths.classicSignIn(VtexSessionToken, args.email, args.password))
    setVtexIdAuthCookie(headers, ioContext, response);
    return true
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
