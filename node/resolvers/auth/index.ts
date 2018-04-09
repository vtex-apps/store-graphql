import http from 'axios'
import { serialize } from 'cookie'
import paths from '../paths'
import { withAuthToken, headers } from '../headers'

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
  sendEmailVerification: async (_, args, { vtex: ioContext }) => {
    const { data: { authenticationToken } } = await makeRequest(ioContext, paths.getTemporaryToken())
    await makeRequest(ioContext, paths.sendEmailVerification(args.email, authenticationToken))
    return { authToken: authenticationToken }
  },

  signIn: async (_, args, { vtex: ioContext, request: { headers: { cookie } }, response }) => {
    const { fields: { email, authToken, code } } = args
    const { data: { authCookie } } = await makeRequest(ioContext, paths.signIn(email, authToken, code))
    response.set('Set-Cookie', serialize(authCookie.Name, authCookie.Value))
    return { name: authCookie.Name, value: authCookie.Value }
  }
}