import '../axiosConfig'
import catalogQueries from '../resolvers/catalog'
import {mutations as checkoutMutations, queries as checkoutQueries} from '../resolvers/checkout'
import {mutations as profileMutations, queries as profileQueries} from '../resolvers/profile'
import {mutations as authMutations} from '../resolvers/auth'
import {mutations as masterDataMutations, queries as masterDataQueries} from '../resolvers/masterdata'

// tslint:disable-next-line:no-var-requires
Promise = require('bluebird')
Promise.config({longStackTraces: true})

export const resolvers = {
  Query: {
    ...catalogQueries,
    ...profileQueries,
    ...checkoutQueries,
    ...masterDataQueries,
  },
  Mutation: {
    ...profileMutations,
    ...checkoutMutations,
    ...authMutations,
    ...masterDataMutations,
  },
}
