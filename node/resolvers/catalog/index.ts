import axios from 'axios'
import { ColossusContext } from 'colossus'
import { compose, equals, find, head, map, prop, split, test } from 'ramda'
import * as slugify from 'slugify'

import ResolverError from '../../errors/resolverError'

import { withAuthToken } from '../headers'
import paths from '../paths'

import {resolvers as brandResolvers} from './brand'
import {resolvers as categoryResolvers} from './category'
import {resolvers as facetsResolvers} from './facets'
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

function findInTree(tree, values, index = 0) {
  for (const node of tree) {
    if (node.slug.toUpperCase() === values[index].toUpperCase()) {
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
  ...productResolvers,
  ...recommendationResolvers,
  ...skuResolvers,
}

export const queries = {
  autocomplete: async (_, args, { vtex: ioContext }: ColossusContext) => {
    const url = paths.autocomplete(ioContext.account, args)
    const { data: {itemsReturned} } = await axios.get(url, {
      headers: withAuthToken()(ioContext),
    })
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

  facets: async (_, args, { vtex: ioContext }: ColossusContext) => axios.get(
    paths.facets(ioContext.account, args),
    {headers: withAuthToken()(ioContext),}
  ).then(prop('data')),

  product: async (_, args, ctx, info) => {
    const { vtex: ioContext, vtex: {account} }: ColossusContext = ctx
    const url = paths.product(account, args)
    const { data: product } = await axios.get(url, {
      headers: withAuthToken()(ioContext),
    })

    if (product.length > 0) {
      return head(product)
    }

    throw new ResolverError(
      `No product was found with the correspondent slug '${args.slug}'`,
      404
    )
  },

  products: async (_, args, { vtex: ioContext }: ColossusContext) => {
    const queryTerm = args.query
    if (test(/[\?\&\[\]\=\,]/, queryTerm)) {
      throw new ResolverError(
        `The query term: '${queryTerm}' contains invalid characters.`,
        500
      )
    }
    return axios.get(
      paths.products(ioContext.account, args),
      {headers: withAuthToken()(ioContext),}
    ).then(prop('data'))
  },

  brand: async (_, args, ctx: ColossusContext) => {
    const {vtex: ioContext, request: {headers: {cookie}}} = ctx
    const url = paths.brand(ioContext.account)
    const { data: brands } = await axios.get(url, {
      headers: withAuthToken()(ioContext, cookie),
    })
    const brand = find(compose(equals(args.id), prop('id')), brands)
    if (!brand) {
      throw new ResolverError(`Brand with id ${args.id} not found`, 404)
    }
    return brand
  },

  brands: async (_, __, ctx: ColossusContext) => axios.get(
    paths.brand(ctx.vtex.account),
    {headers: withAuthToken()(ctx.vtex, ctx.get('cookie')),}
  ).then(prop('data')),

  category: async (_, args, ctx: ColossusContext) => axios.get(
    paths.category(ctx.vtex.account, args.id),
    {headers: withAuthToken()(ctx.vtex, ctx.get('cookie')),}
  ).then(prop('data')),

  categories: async (_, args, ctx: ColossusContext) => axios.get(
    paths.categories(ctx.vtex.account, args.treeLevel),
    {headers: withAuthToken()(ctx.vtex),}
  ).then(prop('data')),

  search: async (_, args, ctx: ColossusContext, info) => {
    const { map: mapParams, query, rest } = args

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
    const { titleTag, metaTagDescription } = findInTree(
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
    { vtex: ioContext }: ColossusContext
  ) => {
    const response = {
      brand: null,
      category: null,
      contextKey: 'search',
    }

    if (args.brand) {
      const urlBrand = paths.brand(ioContext.account)
      const { data: brands }: { data: Brand[] } = await axios.get(urlBrand, {
        headers: withAuthToken()(ioContext),
      })

      const found = brands.find(
        brand =>
          brand.isActive && slugify(brand.name, { lower: true }) === args.brand
      )
      response.brand = found && found.id
    }

    if (args.department) {
      const urlCategories = paths.categories(ioContext.account, 2)
      const { data: departments }: { data: Category[] } = await axios.get(
        urlCategories,
        {
          headers: withAuthToken()(ioContext),
        }
      )

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
