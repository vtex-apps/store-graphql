import '../axiosConfig'

import { map } from 'ramda'
import { mutations as authMutations, queries as authQueries } from '../resolvers/auth'
import { fieldResolvers as benefitsFieldResolvers, queries as benefitsQueries } from '../resolvers/benefits'
import { fieldResolvers as catalogFieldResolvers, queries as catalogQueries } from '../resolvers/catalog'
import { CatalogueDataSource } from '../resolvers/catalog/dataSource'
import { mutations as checkoutMutations, queries as checkoutQueries } from '../resolvers/checkout'
import { mutations as documentMutations, queries as documentQueries } from '../resolvers/document'
import { queries as logisticsQueries } from '../resolvers/logistics'
import { mutations as profileMutations, queries as profileQueries, rootResolvers as profileRootResolvers } from '../resolvers/profile'
import { mutations as sessionMutations, queries as sessionQueries } from '../resolvers/session'

// tslint:disable-next-line:no-var-requires
Promise = require('bluebird')
Promise.config({ longStackTraces: true })

const withDataSources = (fieldResolvers: any) => map((resolver: any) => (root, args, ctx, info) => {
  const catalogue = new CatalogueDataSource(ctx.vtex)
  catalogue.initialize({} as any)
  ctx.dataSources = {
    catalogue
  }
  return resolver(root, args, ctx, info)
}, fieldResolvers)

export const resolvers = map(withDataSources, {
  ...catalogFieldResolvers,
  ...benefitsFieldResolvers,
  ...profileRootResolvers,
  Mutation: {
    ...profileMutations,
    ...checkoutMutations,
    ...authMutations,
    ...documentMutations,
    ...sessionMutations
  },
  Query: {
    ...catalogQueries,
    ...benefitsQueries,
    ...profileQueries,
    ...checkoutQueries,
    ...documentQueries,
    ...authQueries,
    ...logisticsQueries,
    ...sessionQueries
  },
})
