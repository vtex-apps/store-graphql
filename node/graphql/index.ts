import '../axiosConfig'
import catalogQueries from '../resolvers/catalog'
import {mutations as checkoutMutations, queries as checkoutQueries} from '../resolvers/checkout'
import {mutations as profileMutations, queries as profileQueries} from '../resolvers/profile'
import {mutations as authMutations} from '../resolvers/auth'

// tslint:disable-next-line:no-var-requires
Promise = require('bluebird')
Promise.config({longStackTraces: true})

export const resolvers = {
  Query: {
    ...catalogQueries,
    ...profileQueries,
    ...checkoutQueries,
  },
  Mutation: {
    ...profileMutations,
    ...checkoutMutations,
    ...authMutations,
  },
}
