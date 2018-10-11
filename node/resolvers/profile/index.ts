import { AuthenticationError } from 'apollo-server-errors'
import graphqlFields from 'graphql-fields'
import { compose, concat, equals, head, join, keys, path, pathEq, pluck, reduce, reject, split } from 'ramda'

import { DEFAULT_USER_FIELDS } from '../../dataSources/user'
import { uploadAttachment } from '../document/attachment'
import { resolvers as profileResolvers } from './profile'

interface ProfileArgs {
  customFields: string
}

interface AddressInput {
  receiverName?: string
  complement?: string
  neighborhood?: string
  country?: string
  state?: string
  number?: string
  street?: string
  geoCoordinate?: [number]
  postalCode?: string
  city?: string
  reference?: string
  addressName?: string
  addressType?: string
}

interface UpdateAddressArgs {
  id: string
  fields?: AddressInput
}

interface DeleteAddressArgs {
  id: string
}

interface CreateAddressArgs {
  fields?: AddressInput
}

interface ProfileInput {
  email: string
  firstName?: string,
  lastName?: string,
  document?: string,
  phone?: string
  birthDate?: string
  gender?: string
  homePhone?: string
  businessPhone?: string
  tradeName?: string
  corporateName?: string
  corporateDocument?: string
  stateRegistration?: string
  isCorporate?: boolean
}

interface ProfileCustomFieldInput {
  key: string
  value: string
}

interface UpdateProfileArgs {
  fields?: ProfileInput
  customFields: [ProfileCustomFieldInput]
}

const infoToFieldsSelection = compose<any, Record<string, any> | void, string[] | void, string[] | void, string[] | void>(
  reject(equals('cacheId')),
  reject(equals('__typename')),
  keys,
  graphqlFields
)

const arrayOrEmptyArray = <T> (x: T[] | void): T[] => Array.isArray(x) ? x : []

const safeHead = data => Array.isArray(data) && head(data)

const profileFromCtx = async (ctx: ServiceContext, customFields?: string[] | void) => {
  const { dataSources: {session, user} } = ctx as ServiceContext
  const { namespaces } = await session.sessions()
  const email = path<string>(['profile', 'email', 'value'], namespaces)
  const authenticated = pathEq(['profile', 'isAuthenticated', 'value'], 'true', namespaces)
  if (!authenticated) {
    throw new AuthenticationError('User is not authenticated')
  }
  return user.search({email}, customFields || DEFAULT_USER_FIELDS).then(safeHead)
}

const customFieldsFromGraphQLInput = (customFieldsInput) => compose(
  join(','),
  pluck('key')
)(customFieldsInput)

const addFieldsToObj = (acc, { key, value }) => {
  acc[key] = value
  return acc
}

export const queries = {
  profile: (root, args: ProfileArgs, ctx, info) => {
    const { customFields = '' } = args || {}
    ctx.customFields = customFields
    const gqlFields = infoToFieldsSelection(info)
    const customFieldsArray = customFields.split(',')
    const restFields = concat(arrayOrEmptyArray(gqlFields), arrayOrEmptyArray(customFieldsArray))
    return profileFromCtx(ctx, restFields)
  }
}

export const mutations = {
  createAddress: async (root, args: CreateAddressArgs, ctx: ServiceContext, info) => {
    const restFields = concat(DEFAULT_USER_FIELDS, arrayOrEmptyArray(infoToFieldsSelection(info)))
    const prof = await profileFromCtx(ctx, restFields)
    const { userId } = prof
    const { dataSources: {address} } = ctx
    await address.create({
      ...args.fields,
      userId
    })
    return prof
  },

  deleteAddress: async (root, args: DeleteAddressArgs, ctx: ServiceContext, info) => {
    const { id: addressId } = args
    const { dataSources: {address} } = ctx
    await address.remove(addressId)
    const restFields = infoToFieldsSelection(info)
    return profileFromCtx(ctx, restFields)
  },

  updateAddress: async (root, args: UpdateAddressArgs, ctx: ServiceContext, info) => {
    const { dataSources: {address} } = ctx
    const { id: addressId, fields } = args
    await address.update(addressId, fields)
    const restFields = infoToFieldsSelection(info)
    return profileFromCtx(ctx, restFields)
  },

  updateProfile: async (root, args: UpdateProfileArgs, ctx, info) => {
    const { customFields = [], fields = {} } = args
    const { dataSources: {user} } = ctx

    ctx.customFields = customFieldsFromGraphQLInput(customFields) || ''

    const customFieldsArray = split(',', ctx.customFields)
    const gqlFields = infoToFieldsSelection(info)
    const restFields = compose<string[], string[], string[]>(
      concat(arrayOrEmptyArray(gqlFields)),
      concat(arrayOrEmptyArray(customFieldsArray)),
    )(DEFAULT_USER_FIELDS)

    const prof = await profileFromCtx(ctx, restFields)

    const newData = reduce(addFieldsToObj, fields, customFields)
    const newProfile = {
      ...prof,
      ...newData,
    }
    const { id: profileId } = prof

    await user.update(profileId, newProfile)

    return newProfile
  },

  updateProfilePicture: async (root, args, ctx: ServiceContext, info) => {
    const { vtex, dataSources: {user} } = ctx
    const { file = null, field = 'profilePicture' } = args || {}
    const { id: profileId } = await profileFromCtx(ctx, DEFAULT_USER_FIELDS)

    await user.update(profileId, {[field]: ''})
    await uploadAttachment({
      acronym: 'CL',
      documentId: profileId,
      field,
      file
    }, vtex)

    const restFields = arrayOrEmptyArray(infoToFieldsSelection(info))
    return profileFromCtx(ctx, DEFAULT_USER_FIELDS.concat(restFields))
  },

  uploadProfilePicture: async (root, args, ctx: ServiceContext, info) => {
    const { vtex } = ctx
    const { file = null, field = 'profilePicture' } = args || {}
    const { id } = await profileFromCtx(ctx, DEFAULT_USER_FIELDS)

    await uploadAttachment({
      acronym: 'CL',
      documentId: id,
      field,
      file
    }, vtex)

    const restFields = arrayOrEmptyArray(infoToFieldsSelection(info))
    return profileFromCtx(ctx, DEFAULT_USER_FIELDS.concat(restFields))
  },
}

export const fieldResolvers = {
  ...profileResolvers,
}
