import http from 'axios'
import { parse as parseCookie } from 'cookie'
import { head, merge, path, pickBy, pipe, prop, values } from 'ramda'
import ResolverError from '../../errors/resolverError'
import { headers, withAuthToken } from '../headers'
import paths from '../paths'

const configRequest = async (ctx, url) => ({
  headers: withAuthToken(headers.profile)(ctx),
  method: 'GET',
  url,
})

const profile = (ctx) => async (data) => {
  if (data === null) {
    return data
  }

  const { user } = data
  const config = {
    headers: {
      'Proxy-Authorization': ctx.authToken,
      vtexidclientautcookie: ctx.authToken,
    },
  }

  const profileURL = paths.profile(ctx.account).filterUser(user)
  const profileData = await http.get(profileURL, config).then<any>(pipe(prop('data'), head))

  const addressURL = paths.profile(ctx.account).filterAddress(profileData.id)
  const address = profileData && await http.get(addressURL, config).then(prop('data'))

  return merge({ address }, profileData)
}

export default async (_, args, { vtex: ioContext, request: { headers: { cookie } } }) => {
  const { account } = ioContext
  const parsedCookies = parseCookie(cookie || '')

  const startsWithVtexId = (val, key) => key.startsWith(`VtexIdclientAutCookie_${account}`)
  const token = head(values(pickBy(startsWithVtexId, parsedCookies)))
  if (!token) {
    throw new ResolverError('User is not authenticated.', 401)
  }
  const addressRequest = await configRequest(ioContext, paths.identity(account, { token }))
  return await http.request(addressRequest).then(prop('data')).then(profile(ioContext))
}
