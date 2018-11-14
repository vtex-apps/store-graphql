import '../axiosConfig'

import { mutations as authMutations, queries as authQueries } from './auth'
import { fieldResolvers as benefitsFieldResolvers, queries as benefitsQueries } from './benefits'
import { fieldResolvers as catalogFieldResolvers, queries as catalogQueries } from './catalog'
import { fieldResolvers as checkoutFieldResolvers, mutations as checkoutMutations, queries as checkoutQueries } from './checkout'
import { mutations as documentMutations, queries as documentQueries } from './document'
import { queries as logisticsQueries } from './logistics'
import { mutations as profileMutations, queries as profileQueries, rootResolvers as profileRootResolvers } from './profile'
import { mutations as sessionMutations, queries as sessionQueries } from './session'
import { fieldResolvers as subscriptionsFieldResolvers, queries as subscriptionsQueries, mutations as subscriptionsMutations } from './subscriptions'

// tslint:disable-next-line:no-var-requires
Promise = require('bluebird')

export const resolvers = {
  ...subscriptionsFieldResolvers,
  ...catalogFieldResolvers,
  ...benefitsFieldResolvers,
  ...profileRootResolvers,
  ...checkoutFieldResolvers,
  Mutation: {
    ...profileMutations,
    ...checkoutMutations,
    ...authMutations,
    ...documentMutations,
    ...sessionMutations,
    ...subscriptionsMutations
  },
  Query: {
    ...catalogQueries,
    ...benefitsQueries,
    ...profileQueries,
    ...checkoutQueries,
    ...documentQueries,
    ...authQueries,
    ...logisticsQueries,
    ...sessionQueries,
    ...subscriptionsQueries,
  },
}
