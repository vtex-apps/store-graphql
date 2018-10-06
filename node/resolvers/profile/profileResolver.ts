import http from 'axios'
import { parse as parseCookie } from 'cookie'
import { compose, head, join, mapObjIndexed, merge, pick, pickBy, pipe, pluck, prop, split, values } from 'ramda'
import ResolverError from '../../errors/resolverError'
import { headers, withAuthToken } from '../headers'
import paths from '../paths'

const configRequest = async (ctx, url) => ({
  headers: withAuthToken(headers.profile)(ctx),
  method: 'GET',
  url,
})

export const pickCustomFieldsFromData = (customFields: string, data) => customFields && compose(
  values,
  mapObjIndexed((value, key) => ({key, value})),
  pick(split(',', customFields))
)(data)

export const customFieldsFromGraphQLInput = (customFieldsInput) => compose(
  join(','),
  pluck('key')
)(customFieldsInput)

const profile = (ctx, {customFields}) => async (data) => {
  if (data === null) {
    return data
  }

  const { user } = data
  const config = {
    headers: {
      'Proxy-Authorization': ctx.authToken,
      vtexidclientautcookie: ctx.authToken,
    },
  }

  const profileURL = paths.profile(ctx.account).filterUser(user, customFields)
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

    return merge({ payments, address, cacheId: user }, profileData)
  }
  return {
    cacheId: user,
    email: user
  }
}

export default async (_, args, { vtex: ioContext, request: { headers: { cookie } } }) => {
  const { account } = ioContext
  const parsedCookies = parseCookie(cookie || '')

  const startsWithVtexId = (val, key) => key.startsWith(`VtexIdclientAutCookie_${account}`)
  const token = head(values(pickBy(startsWithVtexId, parsedCookies)))
  if (!token) {
    throw new ResolverError('User is not authenticated.', 401)
  }
  const addressRequest = await configRequest(ioContext, paths.identity(account, { token }))
  return await http.request(addressRequest).then(prop('data')).then(profile(ioContext, args))
}
