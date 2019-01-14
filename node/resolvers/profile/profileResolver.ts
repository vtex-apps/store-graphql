import http from 'axios'
import { compose, head, join, mapObjIndexed, merge, pick, pipe, pluck, prop, split, values } from 'ramda'
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

export const getProfileData = async (ctx, { customFields }, userEmail) => {
  const config = {
    headers: {
      'Proxy-Authorization': ctx.authToken,
      vtexidclientautcookie: ctx.authToken,
    },
  }

  const profileURL = paths.profile(ctx.account).filterUser(userEmail, customFields)
  const profileData = await http.get(profileURL, config).then<any>(pipe(prop('data'), head))

  if (profileData && profileData.id) {
    profileData.customFields = pickCustomFieldsFromData(customFields, profileData)

    profileData.profilePicture = profileData.profilePicture
      && `//api.vtex.com/${ctx.account}/dataentities/CL/documents/${profileData.id}/profilePicture/attachments/${profileData.profilePicture}`

    const addressURL = paths.profile(ctx.account).filterAddress(profileData.id)
    const address = profileData && await http.get(addressURL, config).then(prop('data'))

    const paymentsURL = paths.profile(ctx.account).payments(profileData.userId)
    const { data: paymentsRawData } = await http.get(paymentsURL, config)
    let payments = null

    if(paymentsRawData) {
      const availableAccounts = JSON.parse(paymentsRawData.paymentData).availableAccounts
      payments = availableAccounts.map((account) => {
        const {bin, availableAddresses, accountId, ...cleanAccount} = account
        const accountAddress = address.find(
          (addr) => addr.addressName === availableAddresses[0]
        )
        return {...cleanAccount, id: accountId, address: accountAddress}
      })
    }

    const result = merge({ payments, address, cacheId: userEmail }, profileData)

    console.log('result >>>>> ', result)

    return result
  }

  return {
    cacheId: userEmail,
    email: userEmail
  }
}