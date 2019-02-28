import { mutations as authMutations, queries as authQueries } from './auth'
import { fieldResolvers as benefitsFieldResolvers, queries as benefitsQueries } from './benefits'
import { fieldResolvers as catalogFieldResolvers, queries as catalogQueries } from './catalog'
import {
  fieldResolvers as checkoutFieldResolvers,
  mutations as checkoutMutations,
  queries as checkoutQueries,
} from './checkout'
import { mutations as documentMutations, queries as documentQueries } from './document'
import { mutation as listMutations, queries as listQueries } from './list'
import { fieldResolvers as logisticsResolvers, queries as logisticsQueries } from './logistics'
import { queries as omsQueries } from './oms'
import {
  fieldResolvers as profileFieldResolvers,
  mutations as profileMutations,
  queries as profileQueries,
} from './profile'
import { mutations as sessionMutations, queries as sessionQueries } from './session'
import {
  fieldResolvers as subscriptionsFieldResolvers,
  mutations as subscriptionsMutations,
  queries as subscriptionsQueries,
} from './subscriptions'


// tslint:disable-next-line:no-var-requires
Promise = require('bluebird')

export const resolvers = {
  ...catalogFieldResolvers,
  ...benefitsFieldResolvers,
  ...profileFieldResolvers,
  ...checkoutFieldResolvers,
  ...subscriptionsFieldResolvers,
  ...logisticsResolvers,
  Mutation: {
    ...profileMutations,
    ...checkoutMutations,
    ...authMutations,
    ...documentMutations,
    ...sessionMutations,
    ...subscriptionsMutations,
    ...listMutations,
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
    ...listQueries,
    ...omsQueries,
  },
}
