import paths from './paths'
import http from 'axios'
import {json as parseJson} from 'co-body'
import {parse as parseCookie} from 'cookie'
import {readJson} from 'fs-promise'
import {join} from 'path'
import {pipe, path, pickBy, head, merge, values, prop} from 'ramda'

const vtexToken = require('./token.json').token

export const profileCustomHeaders = (accept = 'application/vnd.vtex.ds.v10+json') => ({
  'x-vtex-api-appKey': 'vtexappkey-appvtex',
  'x-vtex-api-appToken': vtexToken,
  'Content-Type': 'application/json',
  'Accept': accept,
})

const configRequest = url => ({
  url,
  method: 'GET',
  headers: profileCustomHeaders(),
})

const profile = (account) => async (data) => {
  if (data === null) {
    return data
  }

  const {user} = data
  const profileRequest = configRequest(paths.profile(account).filterUser(user))
  const profile = await http.request(profileRequest).then(pipe(prop('data'), head))

  const addressRequest = profile && configRequest(paths.profile(account).filterAddress(profile.id))
  const address = addressRequest && await http.request(addressRequest).then(prop('data'))

  return merge({address}, profile)
}

export const handleProfileEndpoint = {
  post: async (req, res, ctx) => {
    const body = await parseJson(req)
    const parsedCookies = parseCookie(body.cookie)

    var startsWithVtexId = (val, key) => key.startsWith('VtexIdclientAutCookie')
    const token = head(values(pickBy(startsWithVtexId, parsedCookies)))
    if (!token) {
      throw new Error('User is not authenticated.')
    }
    const config = {
      url: paths.identity(ctx.account, {token}),
      method: 'GET',
    }
    const data = await http.request(config).then(prop('data')).then(profile(ctx.account))

    res.set('Content-Type', 'application/json')
    res.status = 200
    res.body = {data}
  },
}
