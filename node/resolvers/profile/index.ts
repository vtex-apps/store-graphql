import http from 'axios'
import { parse as parseCookie } from 'cookie'
import { find, head, pickBy, pipe, prop, reduce, values } from 'ramda'
import ResolverError from '../../errors/resolverError'
import { uploadAttachment } from '../document/attachment'
import { headers, withAuthAsVTEXID } from '../headers'
import httpResolver from '../httpResolver'
import paths from '../paths'
import profileResolver, { customFieldsFromGraphQLInput, pickCustomFieldsFromData } from './profileResolver'

const makeRequest = async (url, token, data?, method = 'GET') => http.request({
  url, data, method, headers: {
    'Proxy-Authorization': token,
    'VtexIdclientAutCookie': token
  }
})

const getClientData = async (account, authToken, cookie, customFields?: string) => {
  const { data: { user } } = await makeRequest(
    paths.identity(account, {
      token: getClientToken(cookie, account)
    }), authToken
  )
  const profileData = await makeRequest(
    paths.profile(account).filterUser(user, customFields), authToken
  ).then(pipe(prop('data'), head))

  return profileData ? profileData : { id: '', email: user }
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

const addFieldsToObj = (acc, { key, value }) => {
  acc[key] = value
  return acc
}

const returnOldOnNotChanged = (oldData) => (error) => {
  if (error.statusCode === 304) {
    return oldData
  } else {
    throw error
  }
}

export const mutations = {
  createAddress: async (_, args, config) => addressPatch(_, args, config),

  deleteAddress: async (_, args, config) => {
    const { id: addressId } = args
    const { vtex: { account, authToken }, request: { headers: { cookie } } } = config
    const { userId, id: clientId } = await getClientData(account, authToken, cookie)

    if (!(await isUserAddress(account, clientId, addressId, authToken))) {
      throw new ResolverError('Address not found.', 400)
    }

    await makeRequest(
      paths.profile(account).address(addressId), authToken, null, 'DELETE'
    )

    return await profileResolver(_, args, config)
  },

  updateAddress: async (_, args, config) => addressPatch(_, args, config),

  updateProfile: async (_, args, { vtex: { account, authToken }, request: { headers: { cookie } } }) => {
    const customFieldsStr = customFieldsFromGraphQLInput(args.customFields || [])
    const oldData = await getClientData(account, authToken, cookie, customFieldsStr)
    const newData = reduce(addFieldsToObj, args.fields || {}, args.customFields || [])

    return await makeRequest(
      paths.profile(account).profile(oldData.id), authToken, newData, 'PATCH'
    ).then(() => getClientData(account, authToken, cookie, customFieldsStr)).then((obj) => ({ ...obj, cacheId: obj.email }))
      .then(obj => {
        obj.customFields = pickCustomFieldsFromData(customFieldsStr, obj)
        return obj
      }).catch(returnOldOnNotChanged(oldData))
  },

  updateProfilePicture: async (root, args, ctx, info) => {
    const file = args.file
    const field = args.field || 'profilePicture'
    const { vtex: { account, authToken }, request: { headers: { cookie } } } = ctx
    const { id } = await getClientData(account, authToken, cookie)

    // Should delete the field before uploading new profilePicture
    await makeRequest(paths.profile(account).profile(id), authToken, { [field]: '' }, 'PATCH')
    await uploadAttachment({ acronym: 'CL', documentId: id, field, file }, ctx.vtex)

    return await profileResolver(root, args, ctx)
  },

  uploadProfilePicture: async (root, args, ctx, info) => {
    const file = args.file
    const field = args.field || 'profilePicture'
    const { vtex: { account, authToken }, request: { headers: { cookie } } } = ctx
    const { id } = await getClientData(account, authToken, cookie)

    await uploadAttachment({ acronym: 'CL', documentId: id, field, file }, ctx.vtex)

    return await profileResolver(root, args, ctx)
  }
}

export const queries = {
  profile: profileResolver,
}

export const rootResolvers = {
  ProfileCustomField: {
    cacheId: (root) => root.key
  }
}
