import { ApolloError } from 'apollo-server-errors'
import { compose, equals, find, head, last, map, path, prop, split, test } from 'ramda'

import { Brand } from '../../../typedql/catalog/brand'
import { Category } from '../../../typedql/catalog/category'
import { SearchContext } from '../../../typedql/catalog/searchContext'
import { Query } from '../../../typedql/schema'
import ResolverError from '../../errors/resolverError'
import { resolvers as brandResolvers } from './brand'
import { resolvers as categoryResolvers } from './category'
import { resolvers as facetsResolvers } from './facets'
import { resolvers as itemMetadataUnitResolvers } from './itemMetadataUnit'
import { resolvers as offerResolvers } from './offer'
import { resolvers as productResolvers } from './product'
import { resolvers as recommendationResolvers } from './recommendation'
import { resolvers as searchResolvers } from './search'
import { resolvers as skuResolvers } from './sku'
import { Slugify } from './slug'

const defaultSearchArgs = {
  category: '',
  collection: '',
  from: 0,
  map: '',
  orderBy: 'OrderByPriceDESC',
  priceRange: '',
  query: '',
  rest: '',
  salesChannel: '',
  specificationFilters: null,
  to: 9
}

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
  ...itemMetadataUnitResolvers,
  ...offerResolvers,
  ...productResolvers,
  ...recommendationResolvers,
  ...searchResolvers,
  ...skuResolvers,
}

type AutocompleteArgs = Parameters<Query['autocomplete']>
interface AutocompleteArgsObj {
  maxRows: AutocompleteArgs[0]
  searchTerm: AutocompleteArgs[1]
}

type ProductArgs = Parameters<Query['product']>
interface ProductArgsObj {
    slug: ProductArgs[0]
}

type FacetsArgs = Parameters<Query['facets']>
interface FacetsArgsObj {
  facets: FacetsArgs[0]
}

type ProductsArgs = Parameters<Query['products']>
interface ProductsArgsObj {
  query: ProductsArgs[0]
  map: ProductsArgs[1]
  category: ProductsArgs[2]
  specificationFIlters: ProductsArgs[3]
  priceRange: ProductsArgs[4]
  collection: ProductsArgs[5]
  salesChannel: ProductsArgs[6]
  orderBy: ProductsArgs[7]
  from: ProductsArgs[8]
  to: ProductsArgs[9]
}

type BrandArgs = Parameters<Query['brand']>

interface BrandArgsObj {
  id: BrandArgs[0]
}


type CategoryArgs = Parameters<Query['category']>
interface CategoryArgsObj {
  id: CategoryArgs[0]
}

type CategoriesArgs = Parameters<Query['categories']>
interface CategoriesArgsObj {
  treeLevel: CategoriesArgs[0]
}

type SearchArgs = Parameters<Query['search']>
interface SearchArgsObj {
  query: SearchArgs[0]
  map: SearchArgs[1]
  rest: SearchArgs[2]
  category: SearchArgs[3]
  specificationFilters: SearchArgs[4]
  priceRange: SearchArgs[5]
  collection: SearchArgs[6]
  salesChannel: SearchArgs[7]
  orderBy: SearchArgs[8]
  from: SearchArgs[9]
  to: SearchArgs[10]
}

type SearchCtxFromParamsArgs = Parameters<Query['searchContextFromParams']>
interface SearchCtxFromParamsArgsObj {
  brand: SearchCtxFromParamsArgs[0]
  department: SearchCtxFromParamsArgs[1]
  category: SearchCtxFromParamsArgs[2]
  subcategory: SearchCtxFromParamsArgs[3]
}

export const queries = {
  autocomplete: async (
    _,
    args: AutocompleteArgsObj,
    { dataSources: { portal } }: Context
  ): Promise<ReturnType<Query['autocomplete']>> => {
    const {
      maxRows,
      searchTerm,
    } = args
    const { itemsReturned } = await portal.autocomplete(maxRows, searchTerm)
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

  facets: (_, { facets = ''}: FacetsArgsObj, ctx: Context): Promise<ReturnType<Query['facets']>> => {
    const { dataSources: { catalog } } = ctx
    return catalog.facets(facets)
  },

  product: async (_, { slug }: ProductArgsObj, ctx: Context): Promise<ReturnType<Query['product']>> => {
    const { dataSources: { catalog } } = ctx
    const products = await catalog.product(slug)
    if (products.length > 0) {
      return head(products)
    }

    throw new ResolverError(
      `No product was found with the correspondent slug '${slug}'`,
      404
    )
  },

  products: async (_, pArgs: ProductsArgsObj, ctx: Context): Promise<ReturnType<Query['products']>> => {
    const { dataSources: { catalog } } = ctx
    const args = {...defaultSearchArgs, ...pArgs}
    const {query} = args
    if (query == null || test(/[\?\&\[\]\=\,]/, query)) {
      throw new ResolverError(
        `The query term: '${query}' contains invalid characters.`,
        500
      )
    }
    return catalog.products(args)
  },

  brand: async (_, args: BrandArgsObj, { dataSources: { catalog } }: Context): Promise<ReturnType<Query['brand']>> => {
    const brands = await catalog.brands()
    const brand = find<Brand>(compose(equals(args.id), prop('id')), brands)
    if (!brand) {
      throw new ResolverError(`Brand with id ${args.id} not found`, 404)
    }
    return brand
  },

  brands: async (_, __, { dataSources: { catalog } }: Context): Promise<ReturnType<Query['brands']>> => {
    return catalog.brands()
  },

  category: async (_, { id }: CategoryArgsObj, { dataSources: { catalog } }): Promise<ReturnType<Query['category']>> => {
    return catalog.category(id)
  },

  categories: async (_, { treeLevel = 3 }: CategoriesArgsObj, { dataSources: { catalog } }):
  Promise<ReturnType<Query['categories']>> => {
    return catalog.categories(treeLevel)
  },

  search: async (_, pArgs: SearchArgsObj, ctx: Context): Promise<ReturnType<Query['search']>> => {
    const args = {...defaultSearchArgs, ...pArgs}
    const { map: mapParams, query, rest } = args

    if (query == null || mapParams == null) {
      throw new ApolloError('Search query/map cannot be null', 'ERR_EMPTY_QUERY')
    }

    const categoryMetaData = async () => {
      const category = findInTree(
        await queries.categories(_, { treeLevel: query.split('/').length }, ctx),
        query.split('/')
      )
      return {
        metaTagDescription: path(['MetaTagDescription'], category),
        titleTag: path(['Title'], category),
      }
    }

    const brandMetaData = async () => {
      const brands = await queries.brands(_, { ...args }, ctx)
      const brand = find(
        compose(equals(query.split('/').pop()), Slugify, prop('name')), brands
      )
      return {
        metaTagDescription: path(['metaTagDescription'], brand),
        titleTag: path(['title'], brand),
      }
    }

    const searchMetaData = async () => {
      const lastMap = mapParams.split(',').pop()
      const meta = lastMap === 'c' ? await categoryMetaData()
        : lastMap === 'b' && await brandMetaData()
      return meta
    }

    const { titleTag, metaTagDescription } = await searchMetaData()

    return {
      metaTagDescription,
      queryArgs: args,
      titleTag,
    }
  },

  searchContextFromParams: async (
    _,
    args: SearchCtxFromParamsArgsObj,
    { dataSources: { catalog } }
  ): Promise<ReturnType<Query['searchContextFromParams']>> => {
    const response = {} as SearchContext

    if (args.brand) {
      const brands = await catalog.brands()
      const found = brands.find(
        brand =>
          brand.isActive && Slugify(brand.name) === args.brand
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
          category.href.endsWith(`/${args.category.toLowerCase()}`)
        )
      }

      if (args.subcategory && found) {
        found = found.children.find(subcategory =>
          subcategory.href.endsWith(`/${args.subcategory.toLowerCase()}`)
        )
      }

      response.category = found && String(found.id)
    }

    return response
  },
}
