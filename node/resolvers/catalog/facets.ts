import { GraphQLResolveInfo } from 'graphql'
import { map, toPairs } from 'ramda'

import { toIOMessage } from '../../utils/ioMessage'

const objToNameValue = (keyName: string, valueName: string, record: Record<string, any>) => map(
  ([key, value]) => ({ [keyName]: key, [valueName]: value }),
  toPairs(record)
)

export const resolvers = {
  Facet: {
    Name: ({Name, Link}: any, _: any, ctx: Context, info: GraphQLResolveInfo) => toIOMessage(ctx, Name, `${info.parentType}-${info.fieldName}-${Link}`),
  },
  Facets: {
    SpecificationFilters: ({SpecificationFilters = {}}) => objToNameValue('name', 'facets', SpecificationFilters),
  },
}
