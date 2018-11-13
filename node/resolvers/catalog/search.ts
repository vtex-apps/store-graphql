import { length } from 'ramda'

import { queries } from './index'

const getQueryAndFacets = ({ map = '', query: queryParam = '', rest = '' }) => {
  let query = queryParam

  if (rest) {
    query += `/${rest.replace(/,/g, '/')}`
  }

  return {
    facets: `${query}?map=${map}`,
    query,
  }
}

export const resolvers = {
  Search: {
    facets: (root, _, ctx) => {
      const { dataSources: { catalog } } = ctx
      const args = root.queryArgs || {}

      const { facets } = getQueryAndFacets(args)

      return queries.facets(_, { ...args, facets }, ctx)
    },
    products: (root, _, ctx) => {
      const { dataSources: { catalog } } = ctx
      const args = root.queryArgs || {}

      const { query } = getQueryAndFacets(args)

      return queries.products(_, { ...args, query }, ctx)
    },
    recordsFiltered: async (root, _, ctx) => {
      if (!length(root.queryArgs.map)) {
        return 0
      }

      try {
        const facets = await resolvers.Search.facets(root, _, ctx)

        const recordsFiltered = facets.Departments.reduce(
          (total, dept) => total + dept.Quantity,
          0
        )

        return recordsFiltered
      } catch (e) {
        return 0
      }
    },
  },
}
