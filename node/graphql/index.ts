import '../axiosConfig'
import { queries as catalogQueries, rootResolvers as catalogRootResolvers } from '../resolvers/catalog'
import { queries as benefitsQueries } from '../resolvers/benefits'
import { mutations as checkoutMutations, queries as checkoutQueries } from '../resolvers/checkout'
import { mutations as profileMutations, queries as profileQueries } from '../resolvers/profile'
import { mutations as authMutations } from '../resolvers/auth'
import { mutations as documentMutations, queries as documentQueries } from '../resolvers/document'

// tslint:disable-next-line:no-var-requires
Promise = require('bluebird')
Promise.config({ longStackTraces: true })

export const resolvers = {
  ...catalogRootResolvers,
  Query: {
    ...catalogQueries,
    ...benefitsQueries,
    ...profileQueries,
    ...checkoutQueries,
    ...documentQueries,
  },
  Mutation: {
    ...profileMutations,
    ...checkoutMutations,
    ...authMutations,
    ...documentMutations,
  },
}
