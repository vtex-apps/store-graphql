import http from 'axios'
import {parse as parseCookie} from 'cookie'
import {head, values, pickBy, pipe, prop, find } from 'ramda'
import { headers, withAuthAsVTEXID } from '../headers'
import httpResolver from '../httpResolver'
import paths from '../paths'
import profileResolver from './profileResolver'
import ResolverError from '../../errors/resolverError'

const makeRequest = async (url, token, data?, method='GET') => http.request({
  url, data, method, headers: { 
    'Proxy-Authorization': token,
    'VtexIdclientAutCookie': token
  }
})

const getClientData = async (account, authToken, cookie) => {
  const { data: { user } } = await makeRequest(
    paths.identity(account, { 
      token: getClientToken(cookie, account) 
    }), authToken
  )
  return await makeRequest(
    paths.profile(account).filterUser(user), authToken
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
  const { vtex: { account, authToken }, request: { headers: { cookie } } } = config
  const { userId, id } = await getClientData(account, authToken, cookie)

  if (args.id && !(await isUserAddress(account, id, args.id, authToken))) {  
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

  deleteAddress: async(_, { id: addressId }, { vtex: { account, authToken }, request: { headers: { cookie } } }) => {
    const { userId, id: clientId } = await getClientData(account, authToken, cookie)
  
    if (!(await isUserAddress(account, clientId, addressId, authToken))) {  
      throw new ResolverError('Address not found.', 400)
    }

    return await makeRequest(
      paths.profile(account).address(addressId), authToken, null, 'DELETE'
    )
  },

  updateAddress: async (_, args, config) => addressPatch(_, args, config),

  updateProfile: async (_, args, { vtex: { account, authToken }, request: { headers: { cookie } } }) => {
    const { id: profileId } = await getClientData(account, authToken, cookie)
    
    return await makeRequest(
      paths.profile(account).profile(profileId), authToken, args.fields, 'PATCH'
    ).then(() => getClientData(account, authToken, cookie))
  },
}

export const queries = {
  profile: profileResolver,
}