import axios from 'axios'
import { ColossusContext } from 'colossus'
import graphqlFields from 'graphql-fields'
import { compose, equals, find, head, map, prop, split, test } from 'ramda'
import * as slugify from 'slugify'

import ResolverError from '../../errors/resolverError'
import { withAuthToken } from '../headers'
import { queries as benefitsQueries } from '../benefits'
import paths from '../paths'
import { resolveBrandFields, resolveCategoryFields, resolveFacetFields, resolveProductFields } from './fieldsResolver'

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

export const rootResolvers = {
  SKU: {
    kitItems: (root, _, { vtex: ioContext }: ColossusContext) => {
      return !root.kitItems
        ? []
        : Promise.all(
          root.kitItems.map(async kitItem => {
            const url = paths.productBySku(ioContext.account, {
              id: kitItem.itemId,
            })
            const { data: products } = await axios.get(url, {
              headers: withAuthToken()(ioContext),
            })
            const { items: skus, ...product } = head(products) || {}
            const sku = find(({ itemId }) => itemId === kitItem.itemId, skus || [])
            return { ...kitItem, product, sku }
          }),
        )
    },
  },
}

export const queries = {
  autocomplete: async (_, args, { vtex: ioContext }: ColossusContext) => {
    const url = paths.autocomplete(ioContext.account, args)
    const { data } = await axios.get(url, {
      headers: withAuthToken()(ioContext),
    })
    return {
      cacheId: args.searchTerm,
      itemsReturned: map(
        item => ({
          ...item,
          slug: extractSlug(item),
        }),
        data.itemsReturned,
      ),
    }
  },

  facets: async (_, data, { vtex: ioContext }: ColossusContext) => {
    const url = paths.facets(ioContext.account, data)
    const { data: facets } = await axios.get(url, {
      headers: withAuthToken()(ioContext),
    })
    const resolvedFacets = resolveFacetFields(facets)

    return resolvedFacets
  },

  product: async (_, data, config, info) => {
    const { vtex: ioContext }: ColossusContext = config
    const url = paths.product(ioContext.account, data)
    const { data: product } = await axios.get(url, {
      headers: withAuthToken()(ioContext),
    })
    const resolvedProduct = await resolveProductFields(
      ioContext,
      head(product),
      graphqlFields(info),
    )
    const resolvedBenefits = await benefitsQueries.benefits(_, { id: resolvedProduct.productId }, config)

    return { ...resolvedProduct, benefits: resolvedBenefits }
  },

  products: async (_, data, { vtex: ioContext }: ColossusContext, info) => {
    const queryTerm = data.query
    if (test(/[\?\&\[\]\=\,]/, queryTerm)) {
      throw new ResolverError(
        `The query term: '${queryTerm}' contains invalid characters.`,
        500,
      )
    }
    const url = paths.products(ioContext.account, data)
    const { data: products } = await axios.get(url, {
      headers: withAuthToken()(ioContext),
    })
    const fields = graphqlFields(info)
    const resolvedProducts = await Promise.map(products, product =>
      resolveProductFields(ioContext, product, fields),
    )

    return resolvedProducts
  },

  brand: async (
    _,
    data,
    {
      vtex: ioContext,
      request: {
        headers: { cookie },
      },
    }: ColossusContext
  ) => {
    const url = paths.brand(ioContext.account)
    const { data: brands } = await axios.get(url, {
      headers: withAuthToken()(ioContext, cookie),
    })

    const brand = find(
      compose(
        equals(data.id),
        prop('id'),
      ),
      brands,
    )
    if (!brand) {
      throw new ResolverError(`Brand with id ${data.id} not found`, 404)
    }
    return resolveBrandFields(brand)
  },

  brands: async (
    _,
    data,
    {
      vtex: ioContext,
      request: {
        headers: { cookie },
      },
    }: ColossusContext
  ) => {
    const url = paths.brand(ioContext.account)
    const { data: brands } = await axios.get(url, {
      headers: withAuthToken()(ioContext, cookie),
    })
    return map(resolveBrandFields, brands)
  },

  category: async (
    _,
    data,
    {
      vtex: ioContext,
      request: {
        headers: { cookie },
      },
    }: ColossusContext
  ) => {
    const url = paths.category(ioContext.account, data)
    const { data: category } = await axios.get(url, {
      headers: withAuthToken()(ioContext, cookie),
    })
    return resolveCategoryFields(category)
  },

  categories: async (_, data, { vtex: ioContext }: ColossusContext) => {
    const url = paths.categories(ioContext.account, data)
    const { data: categories } = await axios.get(url, {
      headers: withAuthToken()(ioContext),
    })
    return map(resolveCategoryFields, categories)
  },

  search: async (_, data, { vtex: ioContext }: ColossusContext, info) => {
    const { map, query, rest } = data
    const facetsMap = map.split(',').slice(0, query.split('/').length).join(',')
    const queryWithRest = query + (rest && '/' + rest.replace(/,/g, '/'))
    const facetsValue = query + '?map=' + facetsMap
    const facetsValueWithRest = queryWithRest + '?map=' + map
    const productsPromise = queries.products(_, { ...data, query: queryWithRest }, { vtex: ioContext }, info)
    const facetsPromise = queries.facets(_, { facets: facetsValue }, { vtex: ioContext })
    const facetsWithRestPromise = queries.facets(_, { facets: facetsValueWithRest }, { vtex: ioContext })
    const [products, facets, facetsWithRest] = await Promise.all([
      productsPromise, facetsPromise, facetsWithRestPromise
    ])
    const recordsFiltered = facetsWithRest.Departments.reduce((total, dept) => total + dept.Quantity, 0)
    return { facets, products, recordsFiltered }
  },

  searchContextFromParams: async (_, args, { vtex: ioContext }: ColossusContext) => {
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

      const found = brands.find(brand => brand.isActive && slugify(brand.name, { lower: true }) === args.brand)
      response.brand = found && found.id
    }

    if (args.department) {
      const urlCategories = paths.categories(ioContext.account, { treeLevel: 2 })
      const { data: departments }: { data: Category[] } = await axios.get(urlCategories, {
        headers: withAuthToken()(ioContext),
      })

      let found: Category

      found = departments.find(department => department.url.endsWith(`/${args.department.toLowerCase()}`))
      if (args.category && found) {
        found = found.children.find(category => category.url.endsWith(`/${args.category.toLowerCase()}`))
      }

      if (args.subcategory && found) {
        found = found.children.find(subcategory => subcategory.url.endsWith(`/${args.subcategory.toLowerCase()}`))
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
