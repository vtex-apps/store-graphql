import { prop } from 'ramda'

export const fieldResolvers = {
  CheckoutSLA: {
    cacheId: prop('id'),
  },
}
