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
    response.set('Set-Cookie', serialize('temporarySession', data.authenticationToken, { path: '/', }))
    return data.authenticationToken ? true : false
  },

  accessKeySignIn: async (_, args, { vtex: ioContext, request: { headers: { cookie } }, response }) => {
    const { fields: { email, temporarySession, code } } = args
    const { data, status } = await makeRequest(ioContext, paths.accessKeySignIn(email, temporarySession, code))
    if (!data.authCookie) {
      throw new ResolverError(`ERROR ${data.authStatus}`, status)
    }
    response.set('Set-Cookie', serialize(data.authCookie.Name, data.authCookie.Value, { httpOnly: true }))
    return data.authCookie ? true : false
  }
}