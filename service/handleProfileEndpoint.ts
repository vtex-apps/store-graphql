import paths from './paths'
import http from 'axios'
import {json as parseJson} from 'co-body'
import {parse as parseCookie} from 'cookie'
import {readJson} from 'fs-promise'
import {join} from 'path'
import {pipe, path, pickBy, head, merge, values, prop} from 'ramda'
import ResolverError from './ResolverError'

let vtexToken

async function fetchVtexToken({account, workspace}, vtexId) {
  if (!vtexToken) {
    const response = await http.request({
      url: `http://router.aws-us-east-1.vtex.io/${account}/${workspace}/tokens/legacy`,
      method: 'GET',
      headers: {Authorization: vtexId},
    })
    vtexToken = response.data
  }
  return vtexToken
}

export const profileCustomHeaders = (accept = 'application/vnd.vtex.ds.v10+json') => async (req, ctx) => {
  const {appToken, appKey} = await fetchVtexToken(ctx, req.headers['x-vtex-id'])
  return {
    'x-vtex-api-appKey': appKey,
    'x-vtex-api-appToken': appToken,
    'Content-Type': 'application/json',
    Accept: accept,
  }
}

const configRequest = async (req, ctx, url) => ({
  url,
  method: 'GET',
  headers: await profileCustomHeaders()(req, ctx),
})

const profile = (req, ctx) => async (data) => {
  if (data === null) {
    return data
  }

  const {user} = data
  const profileRequest = await configRequest(req, ctx, paths.profile(ctx.account).filterUser(user))
  const profileData = await http.request(profileRequest).then(pipe(prop('data'), head))

  const addressRequest = profileData && await configRequest(req, ctx, paths.profile(ctx.account).filterAddress(profileData.id))
  const address = addressRequest && await http.request(addressRequest).then(prop('data'))

  return merge({address}, profileData)
}

export const handleProfileEndpoint = {
  post: async (req, res, ctx) => {
    const {account, workspace} = ctx
    const body = await parseJson(req)
    const parsedCookies = parseCookie(body.cookie || '')

    const startsWithVtexId = (val, key) => key.startsWith('VtexIdclientAutCookie')
    const token = head(values(pickBy(startsWithVtexId, parsedCookies)))
    if (!token) {
      throw new ResolverError('User is not authenticated.', 401)
    }

    const config = {
      url: paths.identity(account, {token}),
      method: 'GET',
    }
    const data = await http.request(config).then(prop('data')).then(profile(req, ctx))

    res.set('Content-Type', 'application/json')
    res.status = 200
    res.body = {data}
  },
}
