import paths from './paths'
import http from 'axios'
import {parse as parseCookie} from 'cookie'
import {readJson} from 'fs-promise'
import {join} from 'path'
import {pipe, path, pickBy, head, merge, values, prop} from 'ramda'
import {ResolverError} from 'vtex-graphql-builder'
import fetchVtexToken from './credentials'

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

export const handleProfileEndpoint = async (body, ctx, req) => {
  const {account, workspace} = ctx
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
  return {data: await http.request(config).then(prop('data')).then(profile(req, ctx))}
}
