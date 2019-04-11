import { makeRequest } from './../auth/index'

import { compose, mapObjIndexed, pick, split, values } from 'ramda'

import { generateRandomName } from '../../utils'
import { uploadAttachment } from '../document/attachment'
import paths from '../paths'

import { parse } from 'cookie'

export function getProfile(context: Context, customFields?: string) {
  const {
    dataSources: { profile },
    vtex: { currentProfile },
  } = context

  const extraFields = customFields
    ? `${customFields},profilePicture,id`
    : `profilePicture,id`

  return profile
    .getProfileInfo(currentProfile.email, extraFields)
    .then(profileData => {
      if (profileData) {
        return {
          ...profileData,
          customFields,
        }
      }

      return { email: currentProfile.email }
    })
}

export function getPasswordLastUpdate(context: Context) {
  const { request: { headers: { cookie } }, vtex: { account } } = context
  const url = paths.getUser(account)
  const parsedCookies = parse(cookie)
  const userCookie: string = parsedCookies[`VtexIdclientAutCookie_${account}`]
  return makeRequest(context.vtex, url, 'GET', undefined, userCookie).then((response: any) => {
    return response.data.passwordLastUpdate
  })
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

  return availableAccounts.map((account: any) => {
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
  customFields: CustomField[] | undefined
) {
  const {
    dataSources,
    vtex: { currentProfile },
  } = context

  const extraFields = customFields && mapCustomFieldsToObjNStr(customFields)

  const newData = {
    ...profile,
    ...extraFields && extraFields.customFieldsObj,
  }

  return dataSources.profile
    .updateProfileInfo(
      currentProfile.email,
      newData,
      extraFields && extraFields.customFieldsStr
    )
    .then(() => getProfile(context, extraFields && extraFields.customFieldsStr))
}

export async function updateProfilePicture(context: Context, file: string) {
  const {
    dataSources: { profile },
    vtex: { currentProfile },
  } = context

  const field = 'profilePicture'

  const { id } = await profile.getProfileInfo(currentProfile.email, 'id')

  await profile.updateProfileInfo(
    currentProfile.email,
    { profilePicture: '' },
    'profilePicture'
  )

  await uploadAttachment(
    { acronym: 'CL', documentId: id, field, file },
    context
  )

  return getProfile(context)
}

// CRUD Address

export function createAddress(context: Context, address: Address) {
  const {
    dataSources: { profile },
    vtex: { currentProfile },
  } = context

  const addressesData = {} as any
  const addressName = generateRandomName()
  addressesData[addressName] = JSON.stringify({
    ...address,
    addressName,
    userId: currentProfile.userId,
  })

  return profile
    .updateAddress(currentProfile.email, addressesData)
    .then(() => getProfile(context))
}

export function deleteAddress(context: Context, addressName: string) {
  const {
    dataSources: { profile },
    vtex: { currentProfile },
  } = context

  return profile
    .deleteAddress(currentProfile.email, addressName)
    .then(() => getProfile(context))
}

export function updateAddress(
  context: Context,
  { id, fields }: UpdateAddressArgs
) {
  const {
    dataSources: { profile },
    vtex: { currentProfile },
  } = context

  const addressesData = {} as any
  addressesData[id] = {
    ...fields,
    userId: currentProfile.userId,
  }

  return profile
    .updateAddress(currentProfile.email, addressesData)
    .then(() => getProfile(context))
}

export function pickCustomFieldsFromData(customFields: string, data: any) {
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

function mapCustomFieldsToObjNStr(customFields: CustomField[] = []) {
  let customFieldsStr = ''
  const customFieldsObj = customFields.reduce((acc: any, currentValue, i) => {
    customFieldsStr +=
      i < customFields.length - 1 ? `${currentValue.key},` : currentValue.key

    acc[currentValue.key] = currentValue.value

    return acc
  }, {})

  return {
    customFieldsObj,
    customFieldsStr,
  }
}

function mapAddressesObjToList(addressesObj: any) {
  return Object.values<string>(addressesObj).map(stringifiedObj =>
    JSON.parse(stringifiedObj)
  )
}

interface UpdateAddressArgs {
  id: string
  fields: Address
}

interface CustomField {
  key: string
  value: string
}
