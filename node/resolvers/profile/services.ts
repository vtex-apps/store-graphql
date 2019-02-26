import { compose, mapObjIndexed, pick, split, values } from 'ramda'

import { uploadAttachment } from '../document/attachment'

interface GetProfileArgs {
  customFields: string
}

export function getProfile(context: Context, args: GetProfileArgs) {
  const { customFields } = args
  const {
    dataSources: { profile },
    vtex: { currentProfile },
  } = context

  return profile
    .getProfileInfo(currentProfile.email, customFields)
    .then(profileData =>
      profileData ? profileData : { id: '', email: currentProfile.email }
    )
}

export function getAddresses(context: Context) {
  const {
    dataSources: { profile },
    vtex: { currentProfile },
  } = context

  return profile
    .getUserAddresses(currentProfile.email)
    .then(mapAddressesObjToList)
}

export async function getPayments(context: Context) {
  const {
    dataSources: { profile },
    vtex: { currentProfile },
  } = context

  const paymentsRawData = await profile.getUserPayments(currentProfile.email)

  if (!paymentsRawData) {
    return null
  }

  const addresses = await getAddresses(context)
  const availableAccounts = JSON.parse(paymentsRawData.paymentData)
    .availableAccounts

  return availableAccounts.map(account => {
    const { bin, availableAddresses, accountId, ...cleanAccount } = account
    const accountAddress = addresses.find(
      (addr: UserAddress) => addr.addressName === availableAddresses[0]
    )
    return { ...cleanAccount, id: accountId, address: accountAddress }
  })
}

export async function updateProfile(
  context: Context,
  profile: Profile,
  customFields
) {
  const {
    dataSources,
    vtex: { currentProfile },
  } = context

  const extraFields = mapCustomFieldsToObjNStr(customFields)

  const newData = {
    ...profile,
    ...extraFields.customFieldsObj,
  }

  return dataSources.profile
    .updateProfileInfo(
      currentProfile.email,
      newData,
      extraFields.customFieldsStr
    )
    .then(() =>
      getProfile(context, { customFields: extraFields.customFieldsStr })
    )
}

export const updateProfilePicture = async (
  context: Context,
  args,
  shouldDelete: boolean
) => {
  const {
    dataSources: { profile },
    vtex: { currentProfile },
  } = context

  const file = args.file
  const field = args.field || 'profilePicture'

  const { id } = await profile.getProfileInfo(currentProfile.email)

  // Should delete the field before uploading new profilePicture
  // if (shouldDelete) {
  //   await profile.updateProfileInfo({ id, [field]: '' })
  // }

  await uploadAttachment(
    { acronym: 'CL', documentId: id, field, file },
    context
  )

  return getProfile(context, args)
}

// CRUD Address

export function createAddress(context: Context, address: Address) {
  const {
    dataSources: { profile },
    vtex: { currentProfile },
  } = context

  // return profile.updateAddress({
  //   ...address,
  //   id: '',
  //   userId: currentProfile.userId,
  // })
}

export function deleteAddress(context: Context, addressId: string) {
  const {
    dataSources: { profile },
    vtex: { currentProfile },
  } = context

  const addressesData = {}
  addressesData[addressId] = null

  return profile.updateAddress(currentProfile.email, addressesData)
}

export const updateAddress = async (context: Context, address: Address) => {
  const {
    dataSources: { profile },
    vtex: { currentProfile },
  } = context

  // return profile.updateAddress({
  //   ...address,
  //   userId: currentProfile.userId,
  // })
}

export function pickCustomFieldsFromData(customFields: string, data) {
  return (
    customFields &&
    compose(
      values,
      mapObjIndexed((value, key) => ({ key, value })),
      pick(split(',', customFields))
    )(data)
  )
}

// Aux

function mapCustomFieldsToObjNStr(customFields = []) {
  let customFieldsStr = ''
  const customFieldsObj = customFields.reduce((acc, currentValue, i) => {
    if (i < customFields.length - 1) {
      customFieldsStr += `${currentValue.key},`
    } else {
      customFields += currentValue.key
    }

    acc[currentValue.key] = currentValue.value

    return acc
  }, {})

  return {
    customFieldsObj,
    customFieldsStr,
  }
}

function mapAddressesObjToList(addressesObj) {
  return Object.values<string>(addressesObj).map(stringifiedObj =>
    JSON.parse(stringifiedObj)
  )
}
