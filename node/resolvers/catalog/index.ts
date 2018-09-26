import { ApolloError } from 'apollo-server-errors'
import { ColossusContext } from 'colossus'
import { compose, equals, find, head, last, map, prop, split, test } from 'ramda'
import * as slugify from 'slugify'
import ResolverError from '../../errors/resolverError'

import {resolvers as brandResolvers} from './brand'
import {resolvers as categoryResolvers} from './category'
import {resolvers as facetsResolvers} from './facets'
import {resolvers as offerResolvers} from './offer'
import {resolvers as productResolvers} from './product'
import {resolvers as recommendationResolvers} from './recommendation'
import {resolvers as skuResolvers} from './sku'

/**
 * It will extract the slug from the HREF in the item
 * passed as parameter.
 *
 * That is needed once the API provide only the old link
 * (from CMS portal) to access the product page, nothing
 * more.
 *
 * HREF provided:
 * https://portal.vtexcommercestable.com.br/:slug/p
 *
 * @param item The item to extract the information
 */
const extractSlug = item => {
  const href = split('/', item.href)
  return item.criteria ? `${href[3]}/${href[4]}` : href[3]
}

const lastSegment = compose<string, string[], string>(last, split('/'))

function findInTree(tree, values, index = 0) {
  for (const node of tree) {
    const slug = lastSegment(node.url)
    if (slug.toUpperCase() === values[index].toUpperCase()) {
      if (index === values.length - 1) {
        return node
      }
      return findInTree(node.children, values, index + 1)
    }
  }
  return {}
}

export const fieldResolvers = {
  ...brandResolvers,
  ...categoryResolvers,
  ...facetsResolvers,
  ...offerResolvers,
  ...productResolvers,
  ...recommendationResolvers,
  ...skuResolvers,
}

export const queries = {
  autocomplete: async (_, args, {dataSources: {portal}}) => {
    const {itemsReturned} = await portal.autocomplete(args)
    return {
      cacheId: args.searchTerm,
      itemsReturned: map(
        item => ({
          ...item,
          slug: extractSlug(item),
        }),
        itemsReturned
      ),
    }
  },

  facets: (_, {facets}, {dataSources: {catalog}}) => catalog.facets(facets),

  product: async (_, {slug}, {dataSources: {catalog}}) => {
    const products = await catalog.product(slug)

    if (products.length > 0) {
      return head(products)
    }

    throw new ResolverError(
      `No product was found with the correspondent slug '${slug}'`,
      404
    )
  },

  products: async (_, args, {dataSources: {catalog}}) => {
    const queryTerm = args.query
    if (queryTerm == null || test(/[\?\&\[\]\=\,]/, queryTerm)) {
      throw new ResolverError(
        `The query term: '${queryTerm}' contains invalid characters.`,
        500
      )
    }
    return catalog.products(args)
  },

  brand: async (_, args, {dataSources: {catalog}}) => {
    const brands = await catalog.brands()
    const brand = find(compose(equals(args.id), prop('id')), brands)
    if (!brand) {
      throw new ResolverError(`Brand with id ${args.id} not found`, 404)
    }
    return brand
  },

  brands: async (_, __, {dataSources: {catalog}}) => catalog.brands(),

  category: async (_, {id}, {dataSources: {catalog}}) => catalog.category(id),

  categories: async (_, {treeLevel}, {dataSources: {catalog}}) => catalog.categories(treeLevel),

  search: async (_, args, ctx: ColossusContext) => {
    const { map: mapParams, query, rest } = args

    if (query == null || mapParams == null) {
      throw new ApolloError('Search query/map cannot be null', 'ERR_EMPTY_QUERY')
    }

    const queryWithRest = query + (rest && '/' + rest.replace(/,/g, '/'))

    const facetValues = queryWithRest + '?map=' + mapParams

    const productsPromise = queries.products(_, { ...args, query: queryWithRest }, ctx)
    const categoriesPromise = queries.categories(_, { treeLevel: query.split('/').length }, ctx)
    const facetsPromise = queries.facets(_, { facets: facetValues }, ctx)

    const [products, facets, categories] = await Promise.all([
      productsPromise,
      facetsPromise,
      categoriesPromise,
    ])
    const { Title: titleTag, MetaTagDescription: metaTagDescription } = findInTree(
      categories,
      query.split('/')
    )
    const recordsFiltered = facets.Departments.reduce(
      (total, dept) => total + dept.Quantity,
      0
    )

    return {
      facets,
      metaTagDescription,
      products,
      recordsFiltered,
      titleTag,
    }
  },

  searchContextFromParams: async (
    _,
    args,
    {dataSources: {catalog}}
  ) => {
    const response = {
      brand: null,
      category: null,
      contextKey: 'search',
    }

    if (args.brand) {
      const brands = await catalog.brands()
      const found = brands.find(
        brand =>
          brand.isActive && slugify(brand.name, { lower: true }) === args.brand
      )
      response.brand = found && found.id
    }

    if (args.department) {
      const departments = await catalog.categories(2)
      let found: Category

      found = departments.find(department =>
        department.url.endsWith(`/${args.department.toLowerCase()}`)
      )
      if (args.category && found) {
        found = found.children.find(category =>
          category.url.endsWith(`/${args.category.toLowerCase()}`)
        )
      }

      if (args.subcategory && found) {
        found = found.children.find(subcategory =>
          subcategory.url.endsWith(`/${args.subcategory.toLowerCase()}`)
        )
      }

      response.category = found && found.id
    }

    return response
  },
}

interface Brand {
  id: string
  name: string
  isActive: boolean
}

interface Category {
  id: string
  name: string
  url: string
  children: Category[]
}
