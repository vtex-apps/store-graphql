import http from 'axios'
import { parse as parseCookie } from 'cookie'
import {head, values, pickBy, pipe, prop, find } from 'ramda'
import { headers, withAuthAsVTEXID } from '../headers'
import httpResolver from '../httpResolver'
import paths from '../paths'
import profileResolver from './profileResolver'
import ResolverError from '../../errors/resolverError'

const makeRequest = async (url, token, data?, method='GET') => http.request({
  url, data, method, headers: { Authorization: token }
})

const getClientData = async (account, token) => {
  const { data: { user } } = await makeRequest(
    paths.identity(account, { token }), token
  )
  return await makeRequest(
    paths.profile(account).filterUser(user), token
  ).then(pipe(prop('data'), head))
}

const getClientToken = (cookie, account) => {
  const parsedCookies = parseCookie(cookie || '')
  const startsWithVtexId = (val, key) => key.startsWith(`VtexIdclientAutCookie_${account}`)
  const token = head(values(pickBy(startsWithVtexId, parsedCookies)))
  if (!token) {
    throw new ResolverError('User is not authenticated.', 401)
  }
  return token
}

const getUserAdress = async (account, userId, token) => await makeRequest(
  paths.profile(account).filterAddress(userId), token
).then(prop('data'))


const isUserAddress = async (account, clientId, addressId, token) => find(
  address => address.id === addressId,
  await getUserAdress(account, clientId, token)
)

const addressPatch = async (_, args, config) => {
  const { vtex: { account }, request: { headers: { cookie } } } = config
  const token = getClientToken(cookie, account)
  const { userId, id } = await getClientData(account, token)

  if (args.id && !(await isUserAddress(account, id, args.id, token))) {  
    throw new ResolverError('Address not found.', 400)
  }

  const { DocumentId } = await httpResolver({
    data: { ...args.fields, userId },
    headers: withAuthAsVTEXID(headers.profile),
    method: 'PATCH',
    url: account => paths.profile(account).address(args.id || ''),
  })(_, args, config)
  
  return await profileResolver(_, args, config)
}

export const mutations = {
  createAddress: async (_, args, config) => addressPatch(_, args, config),

  deleteAddress: async(_, { id: addressId }, config) => {
    const { vtex: { account }, request: { headers: { cookie } } } = config
    const token = getClientToken(cookie, account)
    const { userId, id: clientId } = await getClientData(account, token)
  
    if (!(await isUserAddress(account, clientId, addressId, token)) {  
      throw new ResolverError('Address not found.', 400)
    }

    return await makeRequest(
      paths.profile(account).address(addressId), token, null, 'DELETE'
    )
  },

  updateAddress: async (_, args, config) => addressPatch(_, args, config),

  updateProfile: async (_, args, { vtex: {account}, request: { headers: { cookie } } }) => {
    const clientToken = getClientToken(cookie, account)

    const { id: profileId } = await getClientData(account, clientToken)
    
    return await makeRequest(
      paths.profile(account).profile(profileId),clientToken, args.fields, 'PATCH'
    ).then(() => getClientData(account, clientToken))
  },
}

export const queries = {
  profile: profileResolver,
}