import { reduce, sort, zip } from 'ramda'

import { queries } from '.'

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
    }

    if (a !== b && a === 'c') {
      return -1
    }

    if (a === b && a === 'c') {
      return 0
    }

    return 1
  }, zipped)

  return reduce(
    (acc, [m, q]: any) => ({
      map: acc.map.concat(m),
      query: acc.query.concat(q),
    }),
    { map: [], query: [] },
    sorted
  )
}

const getQueryAndFacets = ({
  map: unsortedMap = '',
  query: queryParam = '',
  rest = '',
}) => {
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
    facets: async (root: any, _: any, ctx: Context) => {
      const args = root.queryArgs || {}

      const { facets } = getQueryAndFacets(args)

      const response = await queries.facets(root, { ...args, facets }, ctx)

      response.queryArgs = args

      return response
    },
    products: (root: any, _: any, ctx: Context) => {
      const args = root.queryArgs || {}

      const { map, query } = getQueryAndFacets(args)

      return queries.products(root, { ...args, query, map }, ctx)
    },
    recordsFiltered: async (root: any, _: any, ctx: Context) => {
      const {
        clients: { catalog },
      } = ctx

      try {
        return catalog.productsQuantity({
          ...root.queryArgs,
          ...getQueryAndFacets(root.queryArgs),
        })
      } catch (e) {
        return 0
      }
    },
  },
}
