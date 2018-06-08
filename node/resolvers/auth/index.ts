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

export const mutations = {
  sendEmailVerification: async (_, args, { vtex: ioContext, response }) => {
    const { data, status } = await makeRequest(ioContext, paths.getTemporaryToken(ioContext.account, ioContext.account))
    if (!data.authenticationToken) {
      throw new ResolverError(`ERROR ${data}`, status)
    }
    await makeRequest(ioContext, paths.sendEmailVerification(args.email, data.authenticationToken))
    response.set('Set-Cookie', serialize('VtexTemporarySession', data.authenticationToken, { httpOnly: true, secure: true, path: '/' }))
    return true
  },

  accessKeySignIn: async (_, args, { vtex: ioContext, request: { headers: { cookie } }, response }) => {
    const { VtexTemporarySession } = (parse(cookie))
    if (!VtexTemporarySession) {
      throw new ResolverError(`ERROR VtexTemporarySession is null`, 400)
    }
    const { fields: { email, code } } = args
    const authAccount = `VtexIdclientAutCookie_${ioContext.account}`
    const { headers } = await makeRequest(ioContext, paths.accessKeySignIn(email, VtexTemporarySession, code))
    const authCookie = parse(headers['set-cookie'].find(checkAuth => {
      return checkAuth.includes(authAccount)
    }))
    response.set('Set-Cookie',
      serialize(authAccount, authCookie[authAccount],
        {
          httpOnly: true,
          path: '/',
          secure: true
        }))
    return true
  }
}