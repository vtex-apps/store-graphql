import { path } from 'ramda'

export const fieldResolvers = {
  SessionPickup: {
    cacheId: path(['address', 'addressId']),
  },
}
