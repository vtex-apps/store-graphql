import { mutations as authMutations, queries as authQueries } from './auth'
import {
  fieldResolvers as benefitsFieldResolvers,
  queries as benefitsQueries,
} from './benefits'
import {
  fieldResolvers as catalogFieldResolvers,
  queries as catalogQueries,
} from './catalog'
import {
  fieldResolvers as checkoutFieldResolvers,
  mutations as checkoutMutations,
  queries as checkoutQueries,
} from './checkout'
import {
  fieldResolvers as documentFieldResolvers,
  mutations as documentMutations,
  queries as documentQueries,
} from './document'
import { mutation as listMutations, queries as listQueries } from './list'
import {
  fieldResolvers as logisticsResolvers,
  queries as logisticsQueries,
} from './logistics'
import {
  queries as omsQueries,
  fieldResolvers as omsFieldResolvers,
} from './oms'
import {
  fieldResolvers as profileFieldResolvers,
  mutations as profileMutations,
  queries as profileQueries,
} from './profile'
import { resolvers as portalResolvers } from './portal'
import {
  mutations as sessionMutations,
  queries as sessionQueries,
  fieldResolvers as sessionResolvers,
} from './session'

export const resolvers = {
  ...catalogFieldResolvers,
  ...benefitsFieldResolvers,
  ...profileFieldResolvers,
  ...checkoutFieldResolvers,
  ...documentFieldResolvers,
  ...logisticsResolvers,
  ...omsFieldResolvers,
  ...sessionResolvers,
  Mutation: {
    ...profileMutations,
    ...checkoutMutations,
    ...authMutations,
    ...documentMutations,
    ...sessionMutations,
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
    ...listQueries,
    ...omsQueries,
    ...portalResolvers,
  },
}
