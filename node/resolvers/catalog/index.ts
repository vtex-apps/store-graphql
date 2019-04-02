import { ApolloError } from 'apollo-server-errors'
import { compose, equals, find, head, last, map, path, prop, split, test } from 'ramda'
import ResolverError from '../../errors/resolverError'

import { toIOMessage } from '../../utils/ioMessage'
import { resolvers as brandResolvers } from './brand'
import { resolvers as categoryResolvers } from './category'
import { resolvers as discountResolvers } from './discount'
import { resolvers as facetsResolvers } from './facets'
import { resolvers as itemMetadataResolvers } from './itemMetadata'
import { resolvers as itemMetadataUnitResolvers } from './itemMetadataUnit'
import { resolvers as offerResolvers } from './offer'
import { resolvers as productResolvers } from './product'
import { resolvers as recommendationResolvers } from './recommendation'
import { resolvers as searchResolvers } from './search'
import { resolvers as skuResolvers } from './sku'
import { Slugify } from './slug'

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
const extractSlug = (item: any) => {
  const href = split('/', item.href)
  return item.criteria ? `${href[3]}/${href[4]}` : href[3]
}

const lastSegment = compose<string, string[], string>(last, split('/'))

function findInTree(tree: any, values: any, index = 0): any {
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

async function getProductBySlug(slug: string, catalog: any){
  const products = await catalog.product(slug)
  if (products.length > 0) {
    return head(products)
  }
  throw new ResolverError(
    `No product was found with requested sku`,
    404
  )
}

export const fieldResolvers = {
  ...brandResolvers,
  ...categoryResolvers,
  ...facetsResolvers,
  ...itemMetadataResolvers,
  ...itemMetadataUnitResolvers,
  ...offerResolvers,
  ...discountResolvers,
  ...productResolvers,
  ...recommendationResolvers,
  ...searchResolvers,
  ...skuResolvers,
}

export const queries = {
  autocomplete: async (_: any, args: any, ctx: Context) => {
    const { dataSources: { portal, messages, session } } = ctx

    const from = await session.getSegmentData().then(prop('cultureInfo'))
    const to = await session.getSegmentData(true).then(prop('cultureInfo'))
    const translatedTerm = await messages.translate(from, to, args.searchTerm)
    const { itemsReturned }: { itemsReturned: Item[] } = await portal.autocomplete({ maxRows: args.maxRows, searchTerm: translatedTerm })
    return {
      cacheId: args.searchTerm,
      itemsReturned: map(
        item => ({
          ...item,
          name: toIOMessage(ctx, item.name),
          slug: extractSlug(item),
        }),
        itemsReturned
      ),
    }
  },

  facets: (_: any, { facets }: any, ctx: Context) => {
    const { dataSources: { catalog } } = ctx
    return catalog.facets(facets)
  },

  product: async (_: any, args: any, ctx: Context) => {
    const { dataSources: { catalog } } = ctx
    if (args.slug) {
      return getProductBySlug(args.slug, catalog)
    }
    const { field, value } = args.identifier
    let products = []

    switch (field){
      case 'id':
        products = await catalog.productById(value)
        break
      case 'slug':
        products = await catalog.product(value)
        break
      case 'ean':
        products = await catalog.productByEan(value)
        break
      case 'reference':
        products = await catalog.productByReference(value)
        break
      case 'sku':
        products = await catalog.productBySku([value])
        break
    }

    if (products.length > 0) {
      return head(products)
    }

    throw new ResolverError(
      `No product was found with requested ${field}`,
      404
    )
  },

  products: async (_: any, args: any, ctx: Context) => {
    const { dataSources: { catalog } } = ctx
    const queryTerm = args.query
    if (queryTerm == null || test(/[\?\&\[\]\=\,]/, queryTerm)) {
      throw new ResolverError(
        `The query term: '${queryTerm}' contains invalid characters.`,
        500
      )
    }
    return catalog.products(args)
  },

  brand: async (_: any, args: any, { dataSources: { catalog } }: Context) => {
    const brands = await catalog.brands()
    const brand = find(compose(equals(args.id), prop('id') as any), brands)
    if (!brand) {
      throw new ResolverError(`Brand with id ${args.id} not found`, 404)
    }
    return brand
  },

  brands: async (_: any, __: any, { dataSources: { catalog } }: Context) => catalog.brands(),

  category: async (_: any, { id }: any, { dataSources: { catalog } }: Context) => catalog.category(id),

  categories: async (_: any, { treeLevel }: any, { dataSources: { catalog } }: Context) => catalog.categories(treeLevel),

  search: async (_: any, args: any, ctx: Context) => {
    const { map: mapParams, query } = args

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
        compose(equals(query.split('/').pop(-1)), Slugify, prop('name') as any), brands
      )
      return {
        metaTagDescription: path(['metaTagDescription'], brand as any),
        titleTag: path(['title'], brand as any),
      }
    }

    const searchMetaData = async () => {
      const lastMap = mapParams.split(',').pop(-1)
      const meta = lastMap === 'c' ? await categoryMetaData()
        : lastMap === 'b' && await brandMetaData()
      return meta
    }

    const { titleTag, metaTagDescription }: any = await searchMetaData()

    return {
      metaTagDescription,
      queryArgs: args,
      titleTag,
    }
  },

  searchContextFromParams: async (
    _: any,
    args: any,
    { dataSources: { catalog } }: Context
  ) => {
    const response = {
      brand: null,
      category: null,
      contextKey: 'search',
    }

    if (args.brand) {
      const brands = await catalog.brands()
      const found = brands.find(
        (brand: any) =>
          brand.isActive && Slugify(brand.name) === args.brand
      )
      response.brand = found && found.id
    }

    if (args.department) {
      const departments = await catalog.categories(2)
      let found: Category

      found = departments.find((department: any) =>
        department.url.endsWith(`/${args.department.toLowerCase()}`)
      )
      if (args.category && found) {
        found = found.children.find(category =>
          category.url.endsWith(`/${args.category.toLowerCase()}`)
        ) as any
      }

      if (args.subcategory && found) {
        found = found.children.find(subcategory =>
          subcategory.url.endsWith(`/${args.subcategory.toLowerCase()}`)
        ) as any
      }

      response.category = found && found.id as any
    }

    return response
  },
}

interface Category {
  id: string
  name: string
  url: string
  children: Category[]
}
