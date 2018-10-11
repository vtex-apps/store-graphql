import { compose, mapObjIndexed, pick, prop, split, values } from 'ramda'

export const resolvers = {
  Profile: {
    address: ({id}, args, {dataSources: {address: addressDataSource}}: ServiceContext, info) => id &&
      addressDataSource.serach({userId: id}),

    cacheId: prop('email'),

    customFields: (root, args, ctx, info) => ctx.customFields && compose(
      values,
      mapObjIndexed((value, key) => ({key, value})),
      pick(split(',', ctx.customFields))
    )(root),

    payments: async (root, args, ctx: ServiceContext, info) => {
      const {dataSources: {address: addressDataSource, profileSystem}} = ctx
      const {userId, id} = root
      const rawPayments = userId && await profileSystem.payments(userId)
      const addrs = id && await addressDataSource.serach({userId: id})
      if (rawPayments && addrs) {
        const availableAccounts = JSON.parse(rawPayments.paymentData).availableAccounts
        return availableAccounts.map((account) => {
            const {bin, availableAddresses, accountId, ...cleanAccount} = account
            const accountAddress = addrs.find(
              (addr) => addr.addressName === availableAddresses[0]
            )
            return {...cleanAccount, id: accountId, address: accountAddress}
          })
      }
    },

    profilePicture: ({profilePicture: picture, id}, args, {vtex: {account}}: ServiceContext, info) => id && picture &&
      `//api.vtex.com/${account}/dataentities/CL/documents/${id}/profilePicture/attachments/${picture}`
  },
  ProfileCustomField: {
    cacheId: prop('key')
  }
}
