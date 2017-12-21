import http from 'axios'
import {parse as parseCookie} from 'cookie'
import {readJson} from 'fs-promise'
import {join} from 'path'
import {head, merge, path, pickBy, pipe, prop, values} from 'ramda'
import ResolverError from '../../errors/resolverError'
import {headers, withAuthToken} from '../headers'
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

  const {user} = data
  const profileRequest = await configRequest(ctx, paths.profile(ctx.account).filterUser(user))
  const profileData = await http.request(profileRequest).then<any>(pipe(prop('data'), head))
  const addressRequest = profileData && await configRequest(ctx, paths.profile(ctx.account).filterAddress(profileData.id))
  const address = addressRequest && await http.request(addressRequest).then(prop('data'))

  return merge({address}, profileData)
}

export default async (body, ioContext) => {
  const {account, workspace} = ioContext
  const parsedCookies = parseCookie(body.cookie || '')

  const startsWithVtexId = (val, key) => key.startsWith('VtexIdclientAutCookie')
  const token = head(values(pickBy(startsWithVtexId, parsedCookies)))
  if (!token) {
    throw new ResolverError('User is not authenticated.', 401)
  }
  const addressRequest = await configRequest(ioContext, paths.identity(account, {token}))
  const data = await http.request(addressRequest).then(prop('data')).then(profile(ioContext))
  return {data}
}
