import { parse } from 'cookie'
import { compose, mapObjIndexed, pick, split, values } from 'ramda'
import { MutationSaveAddressArgs, AddressInput } from 'vtex.store-graphql'

import { generateRandomName } from '../../utils'
import { makeRequest } from '../auth'
import paths from '../paths'

export async function getProfile(context: Context, customFields?: string) {
  const {
    clients: { profile },
    vtex: { currentProfile },
  } = context

  const extraFields = customFields
    ? `${customFields},profilePicture,id`
    : `profilePicture,id`

  return profile
    .getProfileInfo(currentProfile, context, extraFields)
    .then((profileData) => {
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
  const {
    request: {
      headers: { cookie },
    },
    vtex: { account },
  } = context

  const url = paths.getUser(account)
  const parsedCookies = parse(cookie)
  const userCookie: string = parsedCookies[`VtexIdclientAutCookie_${account}`]

  if (!userCookie) return null

  return makeRequest({
    ctx: context.vtex,
    url,
    authCookieAdmin: userCookie,
  }).then((response: any) => response.data.passwordLastUpdate)
}

export function getAddresses(context: Context, currentUserProfile?: Profile) {
  const {
    clients: { profile },
    vtex: { currentProfile },
  } = context

  // Filter out temporarily addresses with addressType "pickup" because its also saved at Profile V2
  return profile
    .getUserAddresses(currentProfile, context, currentUserProfile)
    .then((addresses: any[]) => {
      const residentialAddresses = addresses.filter(
        (address: { addressType: string }) => address.addressType !== 'pickup'
      )
      return residentialAddresses
    })
}

export async function getPayments(context: Context) {
  const {
    clients: { profile, licenseManagerExtended },
    vtex: { currentProfile },
  } = context

  const { PIIEnabled } = await licenseManagerExtended.getCurrentAccount()
  const paymentsRawData = await profile.getUserPayments(currentProfile, context)
  const isPaymentDataEmpty = PIIEnabled
    ? !paymentsRawData[0]?.document?.paymentData
    : !paymentsRawData?.paymentData

  if (isPaymentDataEmpty) {
    return null
  }
  const addresses = await getAddresses(context)

  const paymentData = PIIEnabled
    ? paymentsRawData[0]?.document?.paymentData
    : JSON.parse(paymentsRawData.paymentData)

  const { availableAccounts } = paymentData

  return availableAccounts.map((account: any) => {
    const { bin, availableAddresses, accountId, ...cleanAccount } = account
    const accountAddress = addresses.find(
      (addr: Address) => addr.addressName === availableAddresses[0]
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
    clients,
    vtex: { currentProfile },
  } = context

  const extraFields = customFields && mapCustomFieldsToObjNStr(customFields)

  const newData = {
    ...profile,
    // Read the comments in Profile in fieldResolvers.ts files
    // to understand the following transformations
    businessDocument: profile.corporateDocument,
    isPJ: profile.isCorporate ? 'True' : 'False',
    fancyName: profile.tradeName,
    ...extraFields?.customFieldsObj,
  }

  return clients.profile
    .updateProfileInfo(
      currentProfile,
      newData,
      context,
      extraFields?.customFieldsStr
    )
    .then(() => getProfile(context, extraFields?.customFieldsStr))
}

export function updateProfilePicture(mutationsName: string, context: Context) {
  console.warn(
    `The ${mutationsName} mutation is deprecated and no longer supported.`
  )

  return getProfile(context)
}

// CRUD Address

export function createAddress(context: Context, address: AddressInput) {
  const {
    clients: { profile },
    vtex: { currentProfile },
  } = context

  const addressesData = mapNewAddressToProfile(address, currentProfile)

  return profile
    .updateAddress(currentProfile, addressesData, context)
    .then(() => getProfile(context))
}

export function deleteAddress(context: Context, addressName: string) {
  const {
    clients: { profile },
    vtex: { currentProfile },
  } = context

  return profile
    .deleteAddress(currentProfile, addressName, context)
    .then(() => getProfile(context))
}

export function updateAddress(
  context: Context,
  { id, fields: { geoCoordinates, ...addressFields } }: UpdateAddressArgs
) {
  const {
    clients: { profile },
    vtex: { currentProfile },
  } = context

  const addressesData = {} as any

  addressesData[id] = JSON.stringify({
    ...addressFields,
    geoCoordinate: geoCoordinates,
    userId: currentProfile.userId,
  })

  return profile
    .updateAddress(currentProfile, addressesData, context)
    .then(() => getProfile(context))
}

export function pickCustomFieldsFromData(customFields: string, data: any) {
  return (
    customFields &&
    compose(
      values,
      mapObjIndexed((value, key) => ({ key, value })),
      pick(split(',', customFields)) as any
    )(data)
  )
}

export async function saveAddress(
  context: Context,
  args: MutationSaveAddressArgs
): Promise<Address> {
  const {
    clients: { profile },
    vtex: { currentProfile },
  } = context

  const addressesData = mapNewAddressToProfile(args.address, currentProfile)
  const [newId] = Object.keys(addressesData)

  const result = await profile.updateAddress(
    currentProfile,
    addressesData,
    context
  )

  if (result?.document) {
    return result.document
  }

  if (result?.id) {
    return result.id
  }

  const currentAddresses = await profile.getUserAddresses(
    currentProfile,
    context
  )

  return currentAddresses.find(
    (address: Address) => address.addressName === newId
  ) as Address
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

function mapNewAddressToProfile(
  address: AddressInput,
  currentProfile: CurrentProfile,
  id: string = generateRandomName()
) {
  const { geoCoordinates, ...addr } = address

  return {
    [id]: JSON.stringify({
      ...addr,
      geoCoordinate: geoCoordinates,
      addressName: id,
      userId: currentProfile.userId,
    }),
  }
}

interface UpdateAddressArgs {
  id: string
  fields: Address
}

interface CustomField {
  key: string
  value: string
}
