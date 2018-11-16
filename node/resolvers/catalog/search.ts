import { path, reduce, sort, zip } from 'ramda'

import { queries } from './index'

/**
 * This sorting exists because the catalog API returns inconsistent
 * results when the categories are mixed up in the query, so we sort
 * them to appear first, so we get consistency 👌
 */
const sortMapAndQuery = (map: string[], query: string[]) => {
  const zipped = zip(map, query)

  const sorted = sort(([a], [b]) => {
    if (a !== b && a === 'productClusterIds') {
      return -1
    } else if (a !== b && a === 'c') {
      return -1
    } else if (a === b && a === 'c') {
      return 0
    }
    return 1
  }, zipped)

  return reduce(
    (acc, [m, q]) => ({ map: acc.map.concat(m), query: acc.query.concat(q) }),
    { map: [], query: [] },
    sorted
  )
}

const getQueryAndFacets = ({ map: unsortedMap = '', query: queryParam = '', rest = '' }) => {
  let unsortedQuery = queryParam

  if (rest) {
    unsortedQuery += `/${rest.replace(/,/g, '/')}`
  }

  const { query: sortedQuery, map: sortedMap } = sortMapAndQuery(
    unsortedMap.split(','),
    unsortedQuery.split('/')
  )

  const map = sortedMap.join(',')
  const query = sortedQuery.join('/')

  return {
    facets: `${query}?map=${map}`,
    map,
    query,
  }
}

export const resolvers = {
  Search: {
    facets: (root, _, ctx) => {
      const args = root.queryArgs || {}

      const { facets } = getQueryAndFacets(args)

      return queries.facets(root, { ...args, facets }, ctx)
    },
    products: (root, _, ctx) => {
      const args = root.queryArgs || {}

      const { map, query } = getQueryAndFacets(args)

      return queries.products(root, { ...args, query, map }, ctx)
    },
    recordsFiltered: async (root, args, ctx) => {
      const { dataSources: { catalog } } = ctx

      try {
        return catalog.productsQuantity(Object.assign({}, root.queryArgs, getQueryAndFacets(root.queryArgs)))
      } catch (e) {
        return 0
      }
    },
  },
}
