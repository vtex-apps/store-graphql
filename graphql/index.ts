import './axiosConfig'
import catalogQueries from './resolvers/catalog'
import Brand from './resolvers/catalog/Brand'
import Category from './resolvers/catalog/Category'
import Facets from './resolvers/catalog/Facets'
import Product from './resolvers/catalog/Product'
import {mutations as checkoutMutations, queries as checkoutQueries} from './resolvers/checkout'
import {mutations as profileMutations, queries as profileQueries} from './resolvers/profile'

// tslint:disable-next-line:no-var-requires
Promise = require('bluebird')
Promise.config({longStackTraces: true})

export const resolvers = {
  Mutation: {
    ...profileMutations,
    ...checkoutMutations,
  },
  Query: {
    ...catalogQueries,
    ...profileQueries,
    ...checkoutQueries,
  },
  ...Brand,
  ...Category,
  ...Facets,
  ...Product,
}
