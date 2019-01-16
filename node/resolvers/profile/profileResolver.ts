import http from 'axios'
import { compose, head, join, mapObjIndexed, pick, pipe, pluck, prop, split, values } from 'ramda'

import paths from '../paths'

export const pickCustomFieldsFromData = (customFields: string, data) => customFields && compose(
  values,
  mapObjIndexed((value, key) => ({key, value})),
  pick(split(',', customFields))
)(data)

export const customFieldsFromGraphQLInput = (customFieldsInput) => compose(
  join(','),
  pluck('key')
)(customFieldsInput)

const getProfileHeadersConfig = (context) => {
  return {
    headers: {
      'Proxy-Authorization': context.authToken,
      vtexidclientautcookie: context.authToken,
    },
  }
}

// This fix is necessary because some addresses were saved with the profile.id as userId instead of the actual profile.userId
// TO DO: Remove this on the Future
const fixAddresses = async (context, currentProfile: CurrentProfile, profileId: String) => {
  const config = getProfileHeadersConfig(context)
  const addressURL = paths.profile(context.account).filterAddress(profileId)

  const addressesToFix = await http.get(addressURL, config).then(prop('data'))

  addressesToFix.map(async (address) => {
    await http.patch(paths.profile(context.account).address(address.id),{ userId: currentProfile.userId }, config)
  })
}

export const getProfileData = async (context, { customFields }, currentProfile: CurrentProfile) => {
  const config = getProfileHeadersConfig(context)

  const profileURL = paths.profile(context.account).filterUser(currentProfile.email, customFields)
  const profileData = await http.get(profileURL, config).then<any>(pipe(prop('data'), head))

  if(profileData && profileData.userId) {
    profileData.address = await getAddresses(context, currentProfile, profileData.id)
  }

  return profileData
}

export const getAddresses = async (context, currentProfile: CurrentProfile, profileId) => {
  const config = getProfileHeadersConfig(context)

  await fixAddresses(context,currentProfile, profileId)

  const addressURL = paths.profile(context.account).filterAddress(currentProfile.userId)

  return await http.get(addressURL, config).then(prop('data'))
}

export const getPayments = async (context, userId: String, addresses) => {
  const config = getProfileHeadersConfig(context)

  const paymentsURL = paths.profile(context.account).payments(userId)
  const { data: paymentsRawData } = await http.get(paymentsURL, config)

  let payments = null
  if(paymentsRawData) {
    const availableAccounts = JSON.parse(paymentsRawData.paymentData).availableAccounts
    payments = availableAccounts.map((account) => {
      const {bin, availableAddresses, accountId, ...cleanAccount} = account
      const accountAddress = addresses.find(
        (addr) => addr.addressName === availableAddresses[0]
      )
      return {...cleanAccount, id: accountId, address: accountAddress}
    })
  }

  return payments
}