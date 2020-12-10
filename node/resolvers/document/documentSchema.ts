import { prop, toPairs, map } from 'ramda'

export const resolvers = {
  DocumentSchema: {
    properties: ({ properties }: any) =>
      map(
        ([name, rest]: any) => ({
          name,
          type: rest.type,
          optional: rest.optional || false,
        }),
        toPairs(properties)
      ),
    indexed: prop('v-indexed'),
    cache: prop('v-cache'),
    security: prop('v-security'),
  },
}
