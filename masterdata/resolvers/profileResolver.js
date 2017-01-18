import paths from './paths'
import http from 'axios'
import { parse } from 'cookie'
import { pipe, path, pickBy, head, merge, values, prop } from 'ramda'
import fetchVtexToken from './vtexToken'

export const profileCustomHeaders = (appToken) => ({
  'x-vtex-api-appKey': 'vtexappkey-appvtex',
  'x-vtex-api-appToken': appToken,
  'Content-Type': 'application/json',
  'Accept': 'application/vnd.vtex.ds.v10+json',
})

const configRequest = (url, appToken) => ({
  url,
  method: 'GET',
  headers: profileCustomHeaders(appToken),
})

const profile = (appToken, account) => async (data) => {
  if (data === null) {
    return data
  }

  const {user} = data
  const profileRequest = configRequest(paths(account).profile.filterUser(user), appToken)
  const profile = await http.request(profileRequest).then(pipe(prop('data'), head))

  const addressRequest = profile && configRequest(paths(account).profile.filterAddress(profile.id), appToken)
  const address = addressRequest && await http.request(addressRequest).then(prop('data'))

  return merge({address}, profile)
}

export async function profileResolver (root, args, ctx) {
  const cookie = path(['req', 'headers', 'cookie'], ctx)
  const parsedCookies = parse(cookie)

  var startsWithVtexId = (val, key) => key.startsWith('VtexIdclientAutCookie')
  const token = head(values(pickBy(startsWithVtexId, parsedCookies)))
  if (!token) {
    throw new Error('User is not authenticated.')
  }
  const config = {
    url: paths(ctx.account).identity(token),
    method: 'GET',
  }

  const vtexToken = await fetchVtexToken()
  return http.request(config).then(prop('data')).then(profile(vtexToken, ctx.account))
}
