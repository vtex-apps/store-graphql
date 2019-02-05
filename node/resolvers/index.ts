import { ApolloError } from 'apollo-server-errors'
import { ASTNode, GraphQLScalarType, Kind } from 'graphql'

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
import { queries as logisticsQueries } from './logistics'
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

const parseValue = (_: string) => {
  throw new ApolloError(
    'You cannot use IOMessage as input value',
    'INVALID_INPUT_MESSAGE'
  )
}

const serialize = (str: string) => ({
  content: str,
  from: 'en-US',
})

export const resolvers = {
  ...catalogFieldResolvers,
  ...benefitsFieldResolvers,
  ...profileFieldResolvers,
  ...checkoutFieldResolvers,
  ...subscriptionsFieldResolvers,
  IOMessage: new GraphQLScalarType({
    description: 'Internationalized String',
    name: 'IOMessage',
    parseLiteral(ast: ASTNode) {
      switch (ast.kind) {
        case Kind.STRING:
          return ast.value
        default:
          return null
      }
    },
    parseValue,
    serialize,
  }),
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
  },
}
