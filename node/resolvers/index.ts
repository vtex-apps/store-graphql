import { mutations as authMutations, queries as authQueries } from './auth'
import { fieldResolvers as benefitsFieldResolvers, queries as benefitsQueries } from './benefits'
import { fieldResolvers as catalogFieldResolvers, queries as catalogQueries } from './catalog'
import { fieldResolvers as checkoutFieldResolvers, mutations as checkoutMutations, queries as checkoutQueries } from './checkout'
import { mutations as documentMutations, queries as documentQueries } from './document'
import { queries as logisticsQueries } from './logistics'
import { mutations as profileMutations, queries as profileQueries, rootResolvers as profileRootResolvers } from './profile'
import { mutations as sessionMutations, queries as sessionQueries } from './session'
<<<<<<< HEAD
<<<<<<< HEAD
import { fieldResolvers as subscriptionsFieldResolvers, mutations as subscriptionsMutations, queries as subscriptionsQueries } from './subscriptions'
import { queries as wishListQueries } from './wishList'
=======
import { queries as wishListQueries, mutation as wishListMutations } from './wishList'
>>>>>>> Add createwishList resolve
=======
import { queries as listQueries, mutation as listMutations } from './list'
>>>>>>> Change name from wishList to list

// tslint:disable-next-line:no-var-requires
Promise = require('bluebird')

export const resolvers = {
  ...catalogFieldResolvers,
  ...benefitsFieldResolvers,
  ...profileRootResolvers,
  ...checkoutFieldResolvers,
  ...subscriptionsFieldResolvers,
  Mutation: {
    ...profileMutations,
    ...checkoutMutations,
    ...authMutations,
    ...documentMutations,
    ...sessionMutations,
<<<<<<< HEAD
<<<<<<< HEAD
    ...subscriptionsMutations
=======
    ...wishListMutations
>>>>>>> Add createwishList resolve
=======
    ...listMutations
>>>>>>> Change name from wishList to list
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
<<<<<<< HEAD
    ...subscriptionsQueries,
    ...wishListQueries,
=======
    ...listQueries
>>>>>>> Change name from wishList to list
  },
}
