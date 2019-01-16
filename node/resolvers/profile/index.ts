import http from 'axios'
import { parse as parseCookie } from 'cookie'
import { find, head, pickBy, pipe, prop, reduce, values } from 'ramda'
import ResolverError from '../../errors/resolverError'
import { uploadAttachment } from '../document/attachment'
import { headers, withAuthAsVTEXID } from '../headers'
import httpResolver from '../httpResolver'
import paths from '../paths'
import { customFieldsFromGraphQLInput, pickCustomFieldsFromData, getProfileData } from './profileResolver'
import fieldR from './fieldResolvers'

const makeRequest = async (url, token, data?, method = 'GET') => http.request({
  data,
  headers: {
    'Proxy-Authorization': token,
    'VtexIdclientAutCookie': token
  },
  method,
  url,
})

const getUserAdress = async (account, userId, token): Promise<UserAddress[]> => await makeRequest(
  paths.profile(account).filterAddress(userId), token
).then(prop('data'))

const isUserAddress = async (account, profileId, addressId, token) => find(
  address => address.id === addressId,
  await getUserAdress(account, profileId, token)
)

const addressPatch = async (_, args, config) => {
  const { vtex: { account, authToken }, currentProfile } = config
  
  if (args.id && !(await isUserAddress(account, currentProfile.userId, args.id, authToken))) {
    throw new ResolverError('Address not found.', 400)
  }
  
  const address = { ...args.fields, userId: currentProfile.userId }

  await httpResolver({
    data: address,
    headers: withAuthAsVTEXID(headers.profile),
    method: 'PATCH',
    url: acc => paths.profile(acc).address(args.id || ''),
  })(_, args, config)

  return address
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
  createAddress: async (_, args, config) => { 
    await addressPatch(_, args, config)

    return getProfileData(config.vtex, config.currentProfile, args)
  },

  deleteAddress: async (_, args, config) => {
    const { id: addressId } = args
    const { vtex: { account, authToken }, currentProfile } = config
    const { id: clientId } = await getProfileData(config.vtex, currentProfile, args)

    if (!(await isUserAddress(account, clientId, addressId, authToken))) {
      throw new ResolverError('Address not found.', 400)
    }

    await makeRequest(
      paths.profile(account).address(addressId), authToken, null, 'DELETE'
    )

    return getProfileData(config.vtex, config.currentProfile, args)
  },

  updateAddress: (_, args, config) => addressPatch(_, args, config),

  updateProfile: async (_, args, config) => {
    const customFieldsStr = customFieldsFromGraphQLInput(args.customFields || [])
    const oldData = await getProfileData(config.vtex, config.currentProfile, { customFields: customFieldsStr })
    const newData = reduce(addFieldsToObj, args.fields || {}, args.customFields || [])

    return makeRequest(
      paths.profile(config.vtex.account).profile(oldData.id), config.vtex.authToken, newData, 'PATCH'
    ).then(() => getProfileData(config.vtex, config.currentProfile, { customFields: customFieldsStr }))
    .catch(returnOldOnNotChanged(oldData))
  },

  updateProfilePicture: async (root, args, ctx) => {
    const file = args.file
    const field = args.field || 'profilePicture'
    const { vtex: { account, authToken }, request: { headers: { cookie } } } = ctx
    const { id } = await getProfileData(ctx.vtex, ctx.currentProfile, args)

    // Should delete the field before uploading new profilePicture
    await makeRequest(paths.profile(account).profile(id), authToken, { [field]: '' }, 'PATCH')
    await uploadAttachment({ acronym: 'CL', documentId: id, field, file }, ctx)

    return getProfileData(ctx.vtex, ctx.currentProfile, args)
  },

  uploadProfilePicture: async (root, args, ctx) => {
    const file = args.file
    const field = args.field || 'profilePicture'
    const { id } = await getProfileData(ctx.vtex, ctx.currentProfile, args)

    await uploadAttachment({ acronym: 'CL', documentId: id, field, file }, ctx)

    return getProfileData(ctx.vtex, ctx.currentProfile, args)
  }
}

export const queries = {
  profile: (_, args, { vtex: ioContext, currentProfile }) => getProfileData(ioContext, currentProfile, args),
}

export const fieldResolvers = fieldR
