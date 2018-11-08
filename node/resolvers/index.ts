import '../axiosConfig'

import { mutations as authMutations, queries as authQueries } from './auth'
import { fieldResolvers as benefitsFieldResolvers, queries as benefitsQueries } from './benefits'
import { queries as calculatedAttachmentsQueries } from './calculatedAttachments'
import { fieldResolvers as catalogFieldResolvers, queries as catalogQueries } from './catalog'
import { fieldResolvers as checkoutFieldResolvers, mutations as checkoutMutations, queries as checkoutQueries } from './checkout'
import { mutations as documentMutations, queries as documentQueries } from './document'
import { queries as logisticsQueries } from './logistics'
import { mutations as profileMutations, queries as profileQueries, rootResolvers as profileRootResolvers } from './profile'
import { mutations as sessionMutations, queries as sessionQueries } from './session'

// tslint:disable-next-line:no-var-requires
Promise = require('bluebird')
Promise.config({ longStackTraces: true })

export const resolvers = {
  ...benefitsFieldResolvers,
  ...catalogFieldResolvers,
  ...checkoutFieldResolvers,
  ...profileRootResolvers,
  Mutation: {
    ...authMutations,
    ...checkoutMutations,
    ...documentMutations,
    ...profileMutations,
    ...sessionMutations
  },
  Query: {
    ...authQueries,
    ...benefitsQueries,
    ...catalogQueries,
    ...calculatedAttachmentsQueries,
    ...checkoutQueries,
    ...documentQueries,
    ...logisticsQueries,
    ...profileQueries,
    ...sessionQueries
  },
}
