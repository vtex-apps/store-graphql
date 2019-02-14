import { compose, join, mapObjIndexed, pick, pluck, reduce, split, values } from 'ramda'

import ResolverError from '../../errors/resolverError'
import { uploadAttachment } from '../document/attachment'

export const pickCustomFieldsFromData = (customFields: string, data) => customFields && compose(
  values,
  mapObjIndexed((value, key) => ({key, value})),
  pick(split(',', customFields))
)(data)

export const getProfile = (context: Context, args) => {
  const { customFields } = args
  const { dataSources: { profile }, vtex: { currentProfile }  } = context

  return profile.getProfileInfo(currentProfile.email, customFields).then((profileData) => profileData ? profileData : { id: '', email: currentProfile.email })
}

export const updateProfile = async (context: Context, profile) => {
  const { dataSources, vtex: { currentProfile } } = context

  const customFieldsStr = customFieldsFromGraphQLInput(profile.customFields || [])
  const oldData = await dataSources.profile.getProfileInfo(currentProfile.email, { customFields: customFieldsStr })
  const newData = {
    ...reduce(addFieldsToObj, profile || {}, profile.customFields || []),
    id: oldData.id,
  }

  return dataSources.profile.updateProfileInfo(newData).then(
    () => getProfile(context, { customFields: customFieldsStr }))
  .catch(returnOldOnNotChanged(oldData))
}

export const updateProfilePicture = async (context: Context, args, shouldDelete: boolean) => {
  const { dataSources: { profile }, vtex: { currentProfile } } = context

  const file = args.file
  const field = args.field || 'profilePicture'

  const { id } = await profile.getProfileInfo(currentProfile.email)

  // Should delete the field before uploading new profilePicture
  if (shouldDelete) {
    await profile.updateProfileInfo({ id, [field]: '' })
  }

  await uploadAttachment({ acronym: 'CL', documentId: id, field, file }, context)

  return getProfile(context, args)
}

export const getPayments = async (context: Context, profileId: string) => {
  const { dataSources: { payments }, vtex: { currentProfile } } = context

  const paymentsRawData = await payments.getUserPayments(currentProfile.userId)

  if (!paymentsRawData) {
    return null
  }

  const addresses = await getAddresses(context, profileId)
  const availableAccounts = JSON.parse(paymentsRawData.paymentData).availableAccounts

  return availableAccounts.map((account) => {
    const {bin, availableAddresses, accountId, ...cleanAccount} = account
    const accountAddress = addresses.find(
      (addr: UserAddress) => addr.addressName === availableAddresses[0]
    )
    return {...cleanAccount, id: accountId, address: accountAddress}
  })
}

// CRUD Address

export const getAddresses = async (context: Context, profileId: string) => {
  const { dataSources: { profile }, vtex: { currentProfile } } = context

  const addresses = await fixAddresses(context,currentProfile, profileId)
  const fixedAddresses = await profile.getUserAddresses(currentProfile.userId)

  return addresses.concat(fixedAddresses)
}

export const createAddress = (context: Context, address) => {
  const { dataSources: { profile }, vtex: { currentProfile } } = context

  return profile.updateAddress({
    ...address,
    id: '',
    userId: currentProfile.userId,
  })
}

export const deleteAddress = async (context: Context, addressId: string) => {
  const { dataSources: { profile } } = context

  await validateAddress(context, addressId)

  return profile.deleteAddress(addressId)
}

export const updateAddress = async (context: Context, address) => {
  const { dataSources: { profile }, vtex: { currentProfile } } = context

  await validateAddress(context, address.id)

  return profile.updateAddress({
    ...address,
    userId: currentProfile.userId,
  })
}

// Aux

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

const customFieldsFromGraphQLInput = (customFieldsInput) => compose(
  join(','),
  pluck('key')
)(customFieldsInput)

const validateAddress = async (context: Context, addressId: string) => {
  const { dataSources: { profile }, vtex: { currentProfile } } = context

  const address = await profile.getAddress(addressId)

  if (!address) {
    throw new ResolverError(`Address not found`, 404)
  }

  if (address.userId !== currentProfile.userId) {
    throw new ResolverError(`This address doesn't belong to the current user`, 403)
  }

  return address
}

// This fix is necessary because some addresses were saved with the profile.id as userId instead of the actual profile.userId
// TO DO: Remove this on the Future
const fixAddresses = async (context: Context, currentProfile: CurrentProfile, profileId: string) => {
  const { dataSources: { profile } } = context

  const addressesToFix = await profile.getUserAddresses(profileId)

  return Promise.all(addressesToFix.map(async (address) => {
    await profile.updateAddress({ userId: currentProfile.userId, id: address.id })

    return {
      ...address,
      userId: currentProfile.userId,
    }
  }))
}
