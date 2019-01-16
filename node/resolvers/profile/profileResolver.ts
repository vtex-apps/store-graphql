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

  const fixed = addressesToFix.map(async (address) => {
    http.patch(paths.profile(context.account).address(address.id),{ userId: currentProfile.userId }, config)
    address.userId = currentProfile.userId

    return address
  })

  return await Promise.all(fixed)
}

export const getProfileData = async (context, currentProfile: CurrentProfile, args) => {
  const config = getProfileHeadersConfig(context)
  const { customFields } = args

  const profileURL = paths.profile(context.account).filterUser(currentProfile.email, customFields)
  const profileData = await http.get(profileURL, config).then<any>(pipe(prop('data'), head))

  if(profileData && profileData.userId === currentProfile.userId) {
    profileData.address = await getAddresses(context, currentProfile, profileData.id)
  }
  
  return profileData
}

export const getAddresses = async (context, currentProfile: CurrentProfile, profileId) => {
  const config = getProfileHeadersConfig(context)
  const addressURL = paths.profile(context.account).filterAddress(currentProfile.userId)

  const addresses = await fixAddresses(context,currentProfile, profileId)
  const fixedAddresses = await http.get(addressURL, config).then(prop('data'))

  return addresses.concat(fixedAddresses)
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